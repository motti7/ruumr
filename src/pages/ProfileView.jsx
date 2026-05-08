import React, { useEffect, useRef, useState } from "react";
import { Profile, Swipe, Match } from "@/entities/all";
import { User } from "@/entities/User";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  ArrowRight,
  ArrowUpRight,
  Cat,
  CheckCircle2,
  Dog,
  Facebook,
  Heart,
  Home,
  Instagram,
  Link as LinkIcon,
  Linkedin,
  MapPin,
  MessageCircle,
  PawPrint,
  Sparkles,
  Star,
  Twitter,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import SmartImage from "@/components/shared/SmartImage";
import MatchAnimation from "../components/discover/MatchAnimation";
import ReviewsSection from "../components/reviews/ReviewsSection";
import WriteReviewModal from "../components/reviews/WriteReviewModal";
import HouseholdPreferencesGrid from "@/components/profile/HouseholdPreferencesGrid";
import { getInterestDisplayOption, normalizeInterestValues } from "@/lib/interests";
import { base44 } from "@/api/base44Client";
import { enableSimulatorBackend, getSimulatorBackendState } from "@/lib/simulatorBackend";
import { isRuumrSimulatorMode } from "@/lib/simulatorMode";

const DAY_MS = 24 * 60 * 60 * 1000;

const sortByDateDesc = (records = [], field = "created_date") =>
  [...records].sort((left, right) => {
    const leftTime = Date.parse(left?.[field] || left?.created_date || "");
    const rightTime = Date.parse(right?.[field] || right?.created_date || "");

    if (Number.isFinite(leftTime) && Number.isFinite(rightTime)) {
      return rightTime - leftTime;
    }

    const leftValue = String(left?.[field] ?? left?.created_date ?? "").trim();
    const rightValue = String(right?.[field] ?? right?.created_date ?? "").trim();
    return rightValue.localeCompare(leftValue);
  });

const getCollection = (state, name) => {
  if (!state?.collections?.[name]) return [];
  return Array.isArray(state.collections[name]) ? state.collections[name] : [];
};

const isVideoUrl = (url) => typeof url === "string" && /\.(mp4|mov|webm|ogg)$/i.test(url);

const ensureProtocol = (url) => {
  if (!url) return "";
  if (!/^https?:\/\//i.test(url)) {
    return `https://${url}`;
  }
  return url;
};

const formatBudget = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return `₪${amount.toLocaleString()}`;
};

const formatSearchLocation = (profile) => {
  const cities = Array.isArray(profile?.search_cities) ? profile.search_cities.filter(Boolean) : [];

  if (profile?.current_status === "has_apartment") {
    return profile?.location || cities[0] || "מיקום לא צוין";
  }

  if (cities.length === 0) {
    return profile?.location || "מיקום לא צוין";
  }

  if (cities.length === 1) {
    return cities[0];
  }

  return `${cities[0]} · ועוד ${cities.length - 1}`;
};

const formatRelativeDate = (value) => {
  if (!value) return "עכשיו";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "עכשיו";

  const diffDays = Math.floor((Date.now() - date.getTime()) / DAY_MS);
  if (diffDays <= 0) return "היום";
  if (diffDays === 1) return "אתמול";
  if (diffDays < 7) return `לפני ${diffDays} ימים`;

  return new Intl.DateTimeFormat("he-IL", {
    day: "numeric",
    month: "short",
  }).format(date);
};

const getSocialIcon = (link) => {
  if (!link) return <LinkIcon className="h-5 w-5" />;

  const lower = link.toLowerCase();
  if (lower.includes("facebook")) return <Facebook className="h-5 w-5" />;
  if (lower.includes("instagram")) return <Instagram className="h-5 w-5" />;
  if (lower.includes("twitter") || lower.includes("x.com")) return <Twitter className="h-5 w-5" />;
  if (lower.includes("linkedin")) return <Linkedin className="h-5 w-5" />;
  return <LinkIcon className="h-5 w-5" />;
};

const buildMedia = (profile) => {
  const regularPhotos = profile?.photos?.filter(Boolean) || [];
  const apartmentPhotos = profile?.current_status === "has_apartment" ? profile?.apartment_photos?.filter(Boolean) || [] : [];

  const media = regularPhotos.map((url) => (isVideoUrl(url) ? { type: "video", url } : { type: "image", url }));
  if (profile?.video_url) {
    media.splice(1, 0, { type: "video", url: profile.video_url });
  }

  apartmentPhotos.forEach((url) => {
    media.push({ type: "image", url, kind: "apartment" });
  });

  return media.length > 0
    ? media
    : [{ type: "image", url: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png" }];
};

const buildProfileSnapshotFromSimulatorState = (state, targetUserId, currentUserId, fromLikes) => {
  const profiles = getCollection(state, "Profile");
  const profile = profiles.find((item) => String(item.user_id) === String(targetUserId)) || null;
  if (!profile) return null;

  const currentProfile = profiles.find((item) => String(item.user_id) === String(currentUserId)) || null;
  const conversationMatch =
    getCollection(state, "Match").find(
      (match) =>
        (String(match.user1_id) === String(currentUserId) && String(match.user2_id) === String(targetUserId)) ||
        (String(match.user2_id) === String(currentUserId) && String(match.user1_id) === String(targetUserId))
    ) || null;
  const existingSwipe = getCollection(state, "Swipe").find(
    (swipe) => String(swipe.swiper_id) === String(currentUserId) && String(swipe.swiped_id) === String(targetUserId)
  );

  return {
    currentUser: state.currentUser || null,
    currentProfile,
    profile,
    conversationMatch,
    isExMatch: Boolean(conversationMatch),
    showActions: Boolean(fromLikes) && !existingSwipe,
  };
};

const AudioPreview = ({ src, image, title, artist }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;

    const handleEnded = () => setIsPlaying(false);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener("ended", handleEnded);
    };
  }, [src]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (audio.paused) {
        await audio.play();
        setIsPlaying(true);
      } else {
        audio.pause();
        setIsPlaying(false);
      }
    } catch {
      // Browser autoplay policies can block playback. The control still renders cleanly.
    }
  };

  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-950 p-3 text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
      <audio ref={audioRef} src={src} loop />
      <div className="flex items-center gap-3">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl">
          <SmartImage src={image} alt={title || artist || "Song"} className="h-full w-full" priority={false} />
          <div className="absolute inset-0 bg-black/20" />
        </div>
        <div className="min-w-0 flex-1 text-right">
          <p className="truncate text-sm font-bold">{title || "Track preview"}</p>
          <p className="truncate text-xs text-white/65">{artist || "Artist"}</p>
        </div>
        <button
          type="button"
          onClick={togglePlay}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          aria-label={isPlaying ? "Pause preview" : "Play preview"}
        >
          {isPlaying ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
};

function LoadingState() {
  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="rounded-[2rem] border border-white/70 bg-white/78 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-2xl">
        <Skeleton className="h-3 w-24 rounded-full" />
        <Skeleton className="mt-3 h-10 w-48 rounded-2xl" />
        <Skeleton className="mt-3 h-4 w-[86%] rounded-full" />
        <div className="mt-5 flex gap-2">
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-full" />
          <Skeleton className="h-8 w-28 rounded-full" />
        </div>
      </div>
      <Skeleton className="aspect-[4/5] rounded-[32px]" />
      <Skeleton className="h-44 rounded-[28px]" />
      <Skeleton className="h-48 rounded-[28px]" />
    </div>
  );
}

function ErrorState({ onBack }) {
  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-4" dir="rtl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top_left,_rgba(255,111,63,0.16),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(255,255,255,0.92),_transparent_26%),linear-gradient(180deg,_rgba(255,255,255,0.62)_0%,_rgba(255,255,255,0.04)_100%)]" />
      <div className="relative w-full max-w-sm rounded-[2rem] border border-rose-200 bg-rose-50/90 p-6 text-right shadow-[0_24px_80px_rgba(244,63,94,0.08)] backdrop-blur-2xl">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-rose-500 shadow-sm">
            <X className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-black text-rose-950">לא הצלחנו לטעון את הפרופיל</h2>
            <p className="mt-2 text-sm leading-6 text-rose-800/90">
              יכול להיות שאין עדיין פרופיל כזה, או שהחיבור לא התייצב. אפשר לחזור לרשימות ולנסות שוב.
            </p>
            <button
              onClick={onBack}
              className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-rose-200/60"
            >
              <ArrowRight className="h-4 w-4" />
              חזרה ל-Matches
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Chip({ children, tone = "slate" }) {
  const toneClasses = {
    slate: "bg-slate-100 text-slate-600 ring-slate-200",
    orange: "bg-orange-50 text-[--theme-orange] ring-orange-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    white: "bg-white text-slate-500 ring-slate-200",
  };

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ${toneClasses[tone] || toneClasses.slate}`}>
      {children}
    </span>
  );
}

export default function ProfileViewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [conversationMatch, setConversationMatch] = useState(null);
  const [actionFeedback, setActionFeedback] = useState(null);
  const [showActions, setShowActions] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isExMatch, setIsExMatch] = useState(false);
  const [matchData, setMatchData] = useState(null);
  const plusMeta = profile?.ruumrPlus || profile?.ruumr_plus || null;
  const interestOptions = normalizeInterestValues(profile?.interests ?? []).map((interest) => getInterestDisplayOption(interest));
  const media = buildMedia(profile);
  const matchScore = Number(plusMeta?.score);
  const matchScoreLabel = Number.isFinite(matchScore) && matchScore > 0 ? `${Math.round(matchScore * 100)}% fit` : null;
  const isVerified = profile?.is_verified !== false;
  const currentStatusLabel = profile?.current_status === "has_apartment" ? "יש דירה" : "מחפש/ת דירה";
  const apartmentStartIndex = media.findIndex((item) => item.kind === "apartment");
  const petTypeLabel =
    profile?.pet_type === "dog"
      ? "כלב"
      : profile?.pet_type === "cat"
        ? "חתול"
        : profile?.pet_type === "other"
          ? profile?.pet_other_description || "אחר"
          : null;
  const petTypeIcon =
    profile?.pet_type === "dog" ? (
      <Dog className="ml-1 h-3.5 w-3.5" />
    ) : profile?.pet_type === "cat" ? (
      <Cat className="ml-1 h-3.5 w-3.5" />
    ) : profile?.pet_type === "other" ? (
      <PawPrint className="ml-1 h-3.5 w-3.5" />
    ) : null;

  useEffect(() => {
    void loadProfile();
  }, [location.search]);

  useEffect(() => {
    setCurrentPhotoIndex(0);
  }, [profile?.id]);

  useEffect(() => {
    if (!media || media.length === 0) return;

    if (currentPhotoIndex < media.length - 1 && media[currentPhotoIndex + 1]?.type === "image") {
      const img = new Image();
      img.src = media[currentPhotoIndex + 1].url;
    }

    if (currentPhotoIndex > 0 && media[currentPhotoIndex - 1]?.type === "image") {
      const img = new Image();
      img.src = media[currentPhotoIndex - 1].url;
    }
  }, [currentPhotoIndex, media]);

  const loadProfile = async () => {
    setIsLoading(true);

    try {
      const urlParams = new URLSearchParams(location.search);
      const userId = urlParams.get("userId");
      const fromLikes = urlParams.get("fromLikes") === "true";

      if (!userId) {
        navigate(createPageUrl("Matches"));
        return;
      }

      if (isRuumrSimulatorMode()) {
        enableSimulatorBackend(base44);
      }

      try {
        const user = await User.me();
        const [targetProfiles, myProfiles, matchOne, matchTwo, swipeRecords] = await Promise.all([
          Profile.filter({ user_id: userId }),
          Profile.filter({ user_id: user.id }),
          Match.filter({ user1_id: user.id, user2_id: userId }),
          Match.filter({ user2_id: user.id, user1_id: userId }),
          fromLikes ? Swipe.filter({ swiper_id: user.id, swiped_id: userId }) : Promise.resolve([]),
        ]);

        const targetProfile = targetProfiles[0] || null;
        if (!targetProfile) {
          throw new Error("Profile not found");
        }

        const existingMatch = matchOne[0] || matchTwo[0] || null;

        setCurrentUser(user);
        setUserProfile(myProfiles[0] || null);
        setProfile(targetProfile);
        setConversationMatch(existingMatch);
        setIsExMatch(Boolean(existingMatch));
        setShowActions(fromLikes && swipeRecords.length === 0);
        return;
      } catch (apiError) {
        const simulatorState = getSimulatorBackendState();
        if (simulatorState?.currentUser) {
          const snapshot = buildProfileSnapshotFromSimulatorState(
            simulatorState,
            userId,
            simulatorState.currentUser.id,
            fromLikes
          );

          if (snapshot) {
            setCurrentUser(snapshot.currentUser);
            setUserProfile(snapshot.currentProfile);
            setProfile(snapshot.profile);
            setConversationMatch(snapshot.conversationMatch);
            setIsExMatch(snapshot.isExMatch);
            setShowActions(snapshot.showActions);
            return;
          }
        }

        throw apiError;
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      setProfile(null);
      setUserProfile(null);
      setConversationMatch(null);
      setIsExMatch(false);
      setShowActions(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwipe = async (action) => {
    if (!currentUser || !userProfile || !profile) return;

    setActionFeedback(action);
    setTimeout(() => setActionFeedback(null), 650);

    try {
      const swipeData = {
        swiper_id: userProfile.user_id,
        swiper_name: userProfile.name,
        swiped_id: profile.user_id,
        swiped_name: profile.name,
        action,
      };

      await Swipe.create(swipeData);

      let didMatch = false;
      if (action === "like") {
        const reverseSwipes = await Swipe.filter({
          swiper_id: profile.user_id,
          swiped_id: userProfile.user_id,
          action: "like",
        });

        if (reverseSwipes && reverseSwipes.length > 0) {
          didMatch = true;

          const existingMatches = await Match.filter({
            $or: [
              { user1_id: userProfile.user_id, user2_id: profile.user_id },
              { user1_id: profile.user_id, user2_id: userProfile.user_id },
            ],
          });

          let nextMatch = existingMatches[0] || null;
          if (!nextMatch) {
            nextMatch = await Match.create({
              user1_id: userProfile.user_id,
              user2_id: profile.user_id,
              user1_name: userProfile.name,
              user2_name: profile.name,
              status: "active",
            });
          }

          setConversationMatch(nextMatch);
          setIsExMatch(true);
          setMatchData({ profile1: userProfile, profile2: profile });
        }
      }

      setTimeout(() => {
        navigate(createPageUrl("LikesYou"));
      }, didMatch ? 4000 : 1000);
    } catch (error) {
      console.error("Swipe save failed:", error);
      alert("שגיאה בשמירת הסווייפ. אנא נסה שוב.");
    }
  };

  const openChat = () => {
    if (!conversationMatch?.id) return;
    navigate(createPageUrl("Chat") + `?matchId=${conversationMatch.id}`);
  };

  const regularPhotos = profile?.photos?.filter((item) => item) || [];
  const apartmentPhotos =
    profile?.current_status === "has_apartment" && profile?.apartment_photos?.filter((item) => item)
      ? profile.apartment_photos.filter((item) => item)
      : [];

  if (isLoading) {
    return (
      <div className="relative min-h-[100dvh] overflow-hidden px-4 pt-4 pb-28" dir="rtl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top_left,_rgba(255,111,63,0.14),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(255,255,255,0.9),_transparent_26%),linear-gradient(180deg,_rgba(255,255,255,0.64)_0%,_rgba(255,255,255,0.05)_100%)]" />
        <LoadingState />
      </div>
    );
  }

  if (!profile) {
    return <ErrorState onBack={() => navigate(createPageUrl("Matches"))} />;
  }

  return (
    <div className="relative min-h-[100dvh] overflow-hidden px-4 pt-4 pb-32" dir="rtl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top_left,_rgba(255,111,63,0.14),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(255,255,255,0.9),_transparent_26%),linear-gradient(180deg,_rgba(255,255,255,0.64)_0%,_rgba(255,255,255,0.05)_100%)]" />

      <AnimatePresence>
        {matchData && <MatchAnimation {...matchData} onDismiss={() => setMatchData(null)} />}
      </AnimatePresence>

      <AnimatePresence>
        {actionFeedback && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed left-1/2 top-1/2 z-[150] -translate-x-1/2 -translate-y-1/2"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5 }}
              className={`flex h-32 w-32 items-center justify-center rounded-full shadow-2xl ${
                actionFeedback === "like" ? "bg-[--theme-orange]" : "bg-slate-950"
              }`}
            >
              {actionFeedback === "like" ? (
                <Heart className="h-16 w-16 text-white" fill="white" />
              ) : (
                <X className="h-16 w-16 text-white" strokeWidth={4} />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-md space-y-4">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border border-white/70 bg-white/78 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-2xl"
        >
          <div className="flex items-start justify-between gap-3" dir="ltr">
            <button
              onClick={() => navigate(-1)}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white/88 text-slate-600 shadow-sm ring-1 ring-slate-200"
              aria-label="חזור"
            >
              <ArrowRight className="h-5 w-5" />
            </button>

            <div className="min-w-0 flex-1 text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-[--theme-orange]">Profile studio</p>
              <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">
                {profile.name}, {profile.age}
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                {formatSearchLocation(profile)}
                {profile?.search_area ? ` · ${profile.search_area}` : ""}
              </p>
            </div>

            {conversationMatch?.id ? (
              <button
                onClick={openChat}
                className="flex min-h-[44px] items-center gap-2 rounded-full bg-[--theme-orange] px-4 text-sm font-bold text-white shadow-[0_14px_30px_rgba(255,122,69,0.24)]"
              >
                <MessageCircle className="h-4 w-4" />
                צ'אט
              </button>
            ) : (
              <div className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-slate-500 ring-1 ring-slate-200">
                <Sparkles className="mr-1 inline h-3.5 w-3.5 text-[--theme-orange]" />
                {showActions ? "Swipe mode" : "Profile ready"}
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Chip tone="white">{currentStatusLabel}</Chip>
            {matchScoreLabel && <Chip tone="orange">{matchScoreLabel}</Chip>}
            <Chip tone={isVerified ? "green" : "slate"}>
              {isVerified ? (
                <>
                  <CheckCircle2 className="ml-1 h-3.5 w-3.5" />
                  מאומת
                </>
              ) : (
                "Needs verification"
              )}
            </Chip>
            {profile.budget_max ? <Chip tone="slate">{formatBudget(profile.budget_max)}</Chip> : null}
            {petTypeLabel ? (
              <Chip tone="white">
                {petTypeIcon}
                {petTypeLabel}
              </Chip>
            ) : null}
            <Chip tone="slate">נוסף {formatRelativeDate(profile.created_date)}</Chip>
          </div>

          {conversationMatch?.id && (
            <button
              onClick={openChat}
              className="mt-4 w-full rounded-[24px] border border-emerald-100 bg-emerald-50/90 p-4 text-right shadow-[0_14px_30px_rgba(16,185,129,0.08)] transition-transform active:scale-[0.99]"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 text-right">
                  <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-600">Conversation ready</p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    ההתאמה פעילה. אפשר להמשיך ישר לשיחה.
                  </p>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-emerald-600 shadow-sm">
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </div>
            </button>
          )}

          {plusMeta?.insight && (
            <div className="mt-4 rounded-[24px] border border-orange-100 bg-orange-50/80 p-4 text-right shadow-[0_12px_30px_rgba(255,122,69,0.10)]">
              <div className="flex items-center gap-2 text-[--theme-orange]">
                <Sparkles className="h-4 w-4" />
                <p className="text-xs font-bold uppercase tracking-[0.28em]">Ruumr Plus</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-700">{plusMeta.insight}</p>
            </div>
          )}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-[32px] border border-white/70 bg-white/76 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-2xl"
        >
          <div className="relative aspect-[4/5] bg-slate-100">
            {media[currentPhotoIndex]?.type === "video" ? (
              <video
                key={currentPhotoIndex}
                src={media[currentPhotoIndex].url}
                className="h-full w-full object-cover"
                controls
                playsInline
              />
            ) : (
              <SmartImage
                key={currentPhotoIndex}
                src={media[currentPhotoIndex]?.url}
                alt={profile.name}
                className="h-full w-full"
                priority={true}
              />
            )}

            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.08)_0%,rgba(15,23,42,0.18)_42%,rgba(15,23,42,0.84)_100%)]" />

            <div className="absolute left-4 right-4 top-4 flex items-center gap-1.5">
              {media.map((_, index) => (
                <div key={index} className="h-1 flex-1 overflow-hidden rounded-full bg-white/25">
                  <div className={`h-full rounded-full transition-all ${index === currentPhotoIndex ? "w-full bg-white" : "w-0"}`} />
                </div>
              ))}
            </div>

            <div className="absolute inset-0 flex">
              <button
                type="button"
                aria-label="Photo previous"
                className="w-1/5 cursor-w-resize"
                onClick={() => setCurrentPhotoIndex((prev) => (prev - 1 + media.length) % media.length)}
              />
              <div className="w-3/5" />
              <button
                type="button"
                aria-label="Photo next"
                className="w-1/5 cursor-e-resize"
                onClick={() => setCurrentPhotoIndex((prev) => (prev + 1) % media.length)}
              />
            </div>

            {currentPhotoIndex === 0 && profile.social_link && (
              <a
                href={ensureProtocol(profile.social_link)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="absolute bottom-24 left-4 z-20 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-[--theme-orange] shadow-lg backdrop-blur-sm transition-transform hover:scale-110"
                aria-label="פתח/י קישור חברתי"
              >
                {getSocialIcon(profile.social_link)}
              </a>
            )}

            <div className="absolute inset-x-4 bottom-4" dir="rtl">
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0 text-right">
                  <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-white/60">
                    {currentPhotoIndex + 1}/{media.length}
                  </p>
                  <h2 className="mt-1 truncate text-3xl font-black tracking-tight text-white">
                    {profile.name}, {profile.age}
                  </h2>
                  <p className="mt-2 flex items-center justify-end gap-1.5 text-sm text-white/82">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{formatSearchLocation(profile)}</span>
                  </p>
                </div>

                <div className="rounded-[1.15rem] border border-white/15 bg-white/12 px-3 py-2 text-right backdrop-blur-md">
                  <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/55">
                    {showActions ? "Action" : "Status"}
                  </p>
                  <p className="mt-1 text-sm font-bold text-white">
                    {showActions ? "Swipe now" : conversationMatch?.id ? "Conversation live" : "Open profile"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 p-4 text-right">
            <div className="flex flex-wrap gap-2">
              {profile.search_area && <Chip tone="slate">{profile.search_area}</Chip>}
              {profile.budget_max ? <Chip tone="orange">{formatBudget(profile.budget_max)}</Chip> : null}
              <Chip tone="white">{currentStatusLabel}</Chip>
            </div>

            <div className="rounded-[24px] border border-slate-100 bg-slate-50/90 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">Media note</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {currentPhotoIndex === 0
                  ? "Swipe across the gallery to see portraits, apartment shots and any clip that was added."
                  : "Portraits and apartment details are mixed together so you can judge the lifestyle, not just the cover photo."}
              </p>
            </div>

            {profile.song_preview_url && (
              <AudioPreview
                src={profile.song_preview_url}
                image={profile.song_image}
                title={profile.song_name}
                artist={profile.song_artist}
              />
            )}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[28px] border border-white/70 bg-white/82 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.10)] backdrop-blur-2xl"
        >
          <h3 className="text-right text-lg font-black tracking-tight text-slate-950">קצת עליי</h3>
          <div className="mt-4 space-y-4 text-right">
            <p className="text-sm leading-7 text-slate-600">{profile.about_me || "אין עדיין טקסט קצר על הפרופיל הזה."}</p>

            <div className="rounded-[24px] border border-orange-100 bg-orange-50/80 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[--theme-orange]">Looking for</p>
              <p className="mt-2 text-sm leading-7 text-slate-700">
                {profile.looking_for_description || "עוד אין תיאור של מה שמחפשים."}
              </p>
            </div>

            {profile.social_link && (
              <a
                href={ensureProtocol(profile.social_link)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[--theme-orange] px-4 py-2 text-sm font-bold text-white shadow-[0_14px_30px_rgba(255,122,69,0.24)]"
              >
                {getSocialIcon(profile.social_link)}
                לפתוח רשת חברתית
              </a>
            )}
          </div>
        </motion.section>

        {profile.current_status === "has_apartment" && apartmentPhotos.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[28px] border border-white/70 bg-white/82 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.10)] backdrop-blur-2xl"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <Chip tone="orange">
                <Home className="ml-1 h-3.5 w-3.5" />
                הדירה שלי
              </Chip>
              <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-slate-400">Apartment</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {apartmentPhotos.slice(0, 4).map((url, index) => (
                <button
                  key={`${url}-${index}`}
                  type="button"
                  className="aspect-[4/3] overflow-hidden rounded-[20px] border border-slate-100 bg-slate-100 shadow-sm"
                  onClick={() => setCurrentPhotoIndex(apartmentStartIndex >= 0 ? apartmentStartIndex + index : currentPhotoIndex)}
                >
                  <SmartImage src={url} alt={`Apartment ${index + 1}`} className="h-full w-full" priority={false} />
                </button>
              ))}
            </div>
          </motion.section>
        )}

        {interestOptions.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[28px] border border-orange-100 bg-orange-50/80 p-4 shadow-[0_18px_50px_rgba(255,122,69,0.08)]"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <Chip tone="orange">
                <Sparkles className="ml-1 h-3.5 w-3.5" />
                תחומי עניין
              </Chip>
              <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-slate-400">Interests</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {interestOptions.map((interest) => (
                <span
                  key={interest.id}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium ${interest.color}`}
                >
                  {interest.label}
                </span>
              ))}
            </div>
          </motion.section>
        )}

        <HouseholdPreferencesGrid
          profile={profile}
          variant="light"
          title="הרגלים בבית"
          description="כך נראית השגרה בבית, כדי להבין אם זה מרגיש נכון עוד לפני הפגישה."
          className="shadow-[0_18px_50px_rgba(15,23,42,0.08)]"
        />

        <ReviewsSection userId={profile.user_id} />

        {isExMatch && (
          <button
            onClick={() => setShowReviewModal(true)}
            className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[24px] border-2 border-dashed border-[--theme-orange] bg-white/85 text-[--theme-orange] shadow-[0_18px_50px_rgba(255,122,69,0.08)]"
          >
            <Star className="h-5 w-5" />
            כתוב/י חוות דעת על השותפות
          </button>
        )}

        {showReviewModal && (
          <WriteReviewModal
            reviewedUserId={profile.user_id}
            reviewedName={profile.name}
            onClose={() => setShowReviewModal(false)}
            onSubmitted={() => {}}
          />
        )}

        {!showActions && !conversationMatch?.id && (
          <div className="rounded-[28px] border border-white/70 bg-white/82 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.10)] backdrop-blur-2xl">
            <p className="text-right text-sm font-bold text-slate-900">אין פעולות ישירות כרגע</p>
            <p className="mt-2 text-right text-sm leading-6 text-slate-500">
              אפשר להמשיך לגלריה או לחזור לרשימות כדי לבחור מישהו אחר.
            </p>
          </div>
        )}
      </div>

      {showActions && (
        <div
          className="fixed inset-x-0 bottom-0 z-50 border-t border-white/70 bg-white/90 px-4 pt-3 backdrop-blur-2xl"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}
        >
          <div className="mx-auto flex max-w-md items-center justify-center gap-5">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSwipe("dislike")}
              className="flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 bg-white shadow-lg"
            >
              <X className="h-8 w-8 text-slate-600" strokeWidth={3} />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSwipe("like")}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ff8a4c_0%,#ff5f2f_100%)] shadow-[0_18px_40px_rgba(255,122,69,0.30)]"
            >
              <Heart className="h-10 w-10 text-white" fill="white" />
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}
