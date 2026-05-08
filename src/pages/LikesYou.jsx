import React, { useEffect, useMemo, useState } from "react";
import { Profile, Swipe } from "@/entities/all";
import { User } from "@/entities/User";
import { AlertCircle, Heart, MapPin, RefreshCw, Sparkles, ThumbsUp, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import SmartImage from "@/components/shared/SmartImage";
import PullToRefresh from "@/components/shared/PullToRefresh";
import { base44 } from "@/api/base44Client";
import { enableSimulatorBackend, getSimulatorBackendState } from "@/lib/simulatorBackend";
import { isRuumrSimulatorMode } from "@/lib/simulatorMode";

const sortByCreatedDateDesc = (records = []) => {
  return [...records].sort((left, right) => {
    const leftTime = Date.parse(left?.created_date);
    const rightTime = Date.parse(right?.created_date);

    if (Number.isFinite(leftTime) && Number.isFinite(rightTime)) {
      return rightTime - leftTime;
    }

    const leftValue = String(left?.created_date ?? "").trim();
    const rightValue = String(right?.created_date ?? "").trim();
    return rightValue.localeCompare(leftValue);
  });
};

const getCollection = (state, name) => {
  if (!state?.collections?.[name]) return [];
  return Array.isArray(state.collections[name]) ? state.collections[name] : [];
};

const formatBudget = (value) => {
  const budget = Number(value);
  if (!Number.isFinite(budget) || budget <= 0) {
    return null;
  }
  return `₪${budget.toLocaleString()}`;
};

const buildLikesFromSimulatorState = (state, currentUser) => {
  const likes = getCollection(state, "Swipe").filter(
    (swipe) => String(swipe.swiped_id) === String(currentUser.id) && String(swipe.action) === "like"
  );
  const mySwipes = getCollection(state, "Swipe").filter((swipe) => String(swipe.swiper_id) === String(currentUser.id));
  const alreadySwiped = new Set(mySwipes.map((swipe) => String(swipe.swiped_id)));
  const pendingLikerIds = new Set(
    likes.map((like) => String(like.swiper_id)).filter((id) => !alreadySwiped.has(id))
  );

  return sortByCreatedDateDesc(
    getCollection(state, "Profile").filter(
      (profile) => pendingLikerIds.has(String(profile.user_id)) && profile.is_visible !== false
    )
  );
};

function LoadingState() {
  return (
    <div className="relative min-h-screen overflow-hidden px-4 pb-28 pt-6" dir="rtl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top_left,_rgba(255,111,63,0.16),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(255,255,255,0.92),_transparent_26%),linear-gradient(180deg,_rgba(255,255,255,0.6)_0%,_rgba(255,255,255,0.05)_100%)]" />
      <div className="mx-auto max-w-md space-y-4">
        <div className="rounded-[2rem] border border-white/70 bg-white/75 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-2xl">
          <Skeleton className="h-3 w-24 rounded-full" />
          <Skeleton className="mt-3 h-10 w-56 rounded-2xl" />
          <Skeleton className="mt-3 h-4 w-[88%] rounded-full" />
          <div className="mt-5 flex gap-2">
            <Skeleton className="h-8 w-20 rounded-full" />
            <Skeleton className="h-8 w-20 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
        </div>

        {[...Array(2)].map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-[32px] border border-white/70 bg-white/75 p-3 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-2xl"
          >
            <Skeleton className="aspect-[4/5] rounded-[28px]" />
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-24 rounded-full" />
                <Skeleton className="h-5 w-32 rounded-full" />
                <Skeleton className="h-3.5 w-28 rounded-full" />
              </div>
              <Skeleton className="h-10 w-24 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="relative min-h-screen overflow-hidden px-4 pb-28 pt-6" dir="rtl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top_left,_rgba(255,111,63,0.16),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(255,255,255,0.92),_transparent_26%),linear-gradient(180deg,_rgba(255,255,255,0.6)_0%,_rgba(255,255,255,0.05)_100%)]" />
      <div className="mx-auto max-w-md rounded-[2rem] border border-rose-200 bg-rose-50/90 p-5 text-right shadow-[0_24px_80px_rgba(244,63,94,0.08)] backdrop-blur-2xl">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-rose-500 shadow-sm">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-black text-rose-950">Couldn’t load likes</h2>
            <p className="mt-2 text-sm leading-6 text-rose-800/90">{message}</p>
            <button
              onClick={onRetry}
              className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-rose-200/60"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onExplore }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[2rem] border border-white/70 bg-white/78 p-6 text-center shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-2xl"
    >
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-[--theme-orange]">
        <ThumbsUp className="h-7 w-7" />
      </div>
      <h3 className="text-2xl font-black tracking-tight text-slate-950">עדיין אין לייקים נכנסים</h3>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">
        המשך/י להחליק ב-Discover, או עדכן/י את הפרופיל כדי לקבל התאמות חכמות יותר.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <button
          onClick={onExplore}
          className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-[--theme-orange] px-5 py-2 text-sm font-bold text-white shadow-lg shadow-orange-200/60"
        >
          Discover
        </button>
        <Link
          to={createPageUrl("Profile")}
          className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-bold text-slate-600 shadow-sm"
        >
          Edit profile
        </Link>
      </div>
    </motion.div>
  );
}

function LikeCard({ profile, isSeen, onOpen, index }) {
  const budgetLabel = formatBudget(profile?.budget_max);
  const matchScore = Number(profile?.ruumrPlus?.score ?? profile?.ruumr_plus?.score);
  const scoreLabel = Number.isFinite(matchScore) && matchScore > 0 ? `${Math.round(matchScore * 100)}% fit` : null;
  const vibeLevel = Number(profile?.vibe_level || 0);
  const vibeText = ["שקט", "רגוע", "מאוזן", "חברותי", "תוסס"][Math.max(0, Math.min(4, vibeLevel - 1))] || null;

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.985 }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={onOpen}
      className="group w-full text-right"
      aria-label={`פתח את הפרופיל של ${profile.name}`}
    >
      <div className="overflow-hidden rounded-[32px] border border-white/80 bg-white/86 p-3 shadow-[0_22px_60px_rgba(15,23,42,0.10)] backdrop-blur-2xl transition-transform group-hover:-translate-y-0.5">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[28px]">
          <SmartImage src={profile.photos?.[0]} className="h-full w-full" alt={profile.name} priority={index === 0} />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.06)_0%,rgba(15,23,42,0.05)_45%,rgba(15,23,42,0.80)_100%)]" />

          <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-2">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black tracking-[0.24em] ${
                isSeen
                  ? "bg-white/90 text-slate-500"
                  : "bg-[--theme-orange] text-white shadow-[0_10px_24px_rgba(255,122,69,0.28)]"
              }`}
            >
              {isSeen ? "SEEN" : "NEW"}
            </span>
            {scoreLabel && (
              <span className="inline-flex items-center rounded-full bg-slate-950/70 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
                {scoreLabel}
              </span>
            )}
          </div>

          <div className="absolute inset-x-4 bottom-4">
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-3xl font-black tracking-tight text-white">
                  {profile.name}
                  {profile.age ? <span className="text-white/90">, {profile.age}</span> : null}
                </h3>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-white/85">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{profile.location || "Location not set"}</span>
                </p>
              </div>

              <div className="rounded-full bg-white/14 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-white/90 backdrop-blur-sm">
                {isSeen ? "Viewed" : "Tap"}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {budgetLabel && (
                <span className="inline-flex items-center rounded-full bg-white/16 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
                  {budgetLabel}
                </span>
              )}
              {profile.search_area && (
                <span className="inline-flex items-center rounded-full bg-white/16 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
                  {profile.search_area}
                </span>
              )}
              {vibeText && (
                <span className="inline-flex items-center rounded-full bg-white/16 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
                  {vibeText}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 px-1">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-slate-400">Open profile</p>
            <p className="mt-1 truncate text-sm text-slate-500">Tap to see the full profile and message context.</p>
          </div>
          <span className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-orange-100 bg-orange-50 px-4 py-2 text-xs font-bold text-[--theme-orange] shadow-sm">
            View
          </span>
        </div>
      </div>
    </motion.button>
  );
}

export default function LikesYouPage() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [seenLikeIds, setSeenLikeIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("roomi_seen_like_ids") || "[]");
    } catch {
      return [];
    }
  });

  const loadLikes = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (isRuumrSimulatorMode()) {
        enableSimulatorBackend(base44);
      }

      const simulatorState = getSimulatorBackendState();
      if (simulatorState?.currentUser) {
        setProfiles(buildLikesFromSimulatorState(simulatorState, simulatorState.currentUser));
        setIsLoading(false);
        return;
      }

      const user = await User.me();

      const [likes, mySwipes, allProfiles] = await Promise.all([
        Swipe.filter({ swiped_id: user.id, action: "like" }),
        Swipe.filter({ swiper_id: user.id }),
        Profile.list("-created_date", 500),
      ]);

      const alreadySwiped = new Set(mySwipes.map((swipe) => String(swipe.swiped_id)));
      const pendingLikerIds = new Set(
        likes.map((like) => String(like.swiper_id)).filter((id) => !alreadySwiped.has(id))
      );

      const matched = sortByCreatedDateDesc(
        allProfiles.filter((profile) => pendingLikerIds.has(String(profile.user_id)) && profile.is_visible !== false)
      );

      setProfiles(matched);
    } catch (e) {
      console.error(e);
      setError("שגיאה בטעינת הלייקים. אנא נסה שוב.");
      setProfiles([]);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadLikes();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadLikes();
    setIsRefreshing(false);
  };

  const handleOpenProfile = (profile) => {
    const userId = String(profile.user_id);
    const newSeen = [...new Set([...seenLikeIds.map(String), userId])];
    setSeenLikeIds(newSeen);
    localStorage.setItem("roomi_seen_like_ids", JSON.stringify(newSeen));
    navigate(createPageUrl("ProfileView") + `?userId=${profile.user_id}&fromLikes=true`);
  };

  const unseenCount = useMemo(
    () => profiles.filter((profile) => !seenLikeIds.map(String).includes(String(profile.user_id))).length,
    [profiles, seenLikeIds]
  );

  const viewedCount = Math.max(0, profiles.length - unseenCount);
  const featuredFaces = profiles.slice(0, 4);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={handleRefresh} />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden px-4 pb-28 pt-6" dir="rtl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top_left,_rgba(255,111,63,0.16),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(255,255,255,0.92),_transparent_26%),linear-gradient(180deg,_rgba(255,255,255,0.6)_0%,_rgba(255,255,255,0.05)_100%)]" />

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="mx-auto max-w-md space-y-4">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[2rem] border border-white/70 bg-white/78 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-2xl"
            dir="ltr"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="text-left">
                <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.34em] text-[--theme-orange]">
                  <Sparkles className="h-3.5 w-3.5" />
                  Incoming
                </p>
                <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">לייקים נכנסים</h1>
                <p className="mt-3 max-w-sm text-sm leading-6 text-slate-500">
                  הפרופילים שכבר סימנו אותך, מסודרים בצורה רגועה וברורה כדי שתוכלי/תוכל לבחור במהירות.
                </p>
              </div>

              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-white/70 bg-white/85 text-slate-500 shadow-sm transition-colors hover:text-[--theme-orange] disabled:opacity-70"
                aria-label="Refresh likes"
              >
                <RefreshCw className={`h-5 w-5 ${isRefreshing ? "animate-spin text-[--theme-orange]" : ""}`} />
              </motion.button>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                {profiles.length} total
              </span>
              <span className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-[--theme-orange] ring-1 ring-orange-100">
                {unseenCount} new
              </span>
              <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500 ring-1 ring-slate-200">
                {viewedCount} viewed
              </span>
            </div>

            {featuredFaces.length > 0 && (
              <div className="mt-5">
                <div className="mb-3 flex items-center justify-between" dir="ltr">
                  <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-slate-400">Fast preview</p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">
                    <Users className="h-3.5 w-3.5" />
                    {featuredFaces.length} highlighted
                  </span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {featuredFaces.map((profile) => {
                    const isSeen = seenLikeIds.map(String).includes(String(profile.user_id));
                    return (
                      <button
                        key={profile.id || profile.user_id}
                        type="button"
                        onClick={() => handleOpenProfile(profile)}
                        className="flex w-20 shrink-0 flex-col items-center gap-2 text-left"
                      >
                        <div className="relative">
                          <div
                            className={`h-20 w-20 overflow-hidden rounded-[28px] border shadow-[0_18px_40px_rgba(15,23,42,0.12)] ${
                              isSeen ? "border-white/90 ring-4 ring-slate-100" : "border-[rgba(255,122,69,0.22)] ring-4 ring-orange-50"
                            }`}
                          >
                            <SmartImage
                              src={profile.photos?.[0]}
                              alt={profile.name}
                              className="h-full w-full"
                              priority={false}
                            />
                          </div>
                          <span
                            className={`absolute -bottom-1 -right-1 rounded-full px-2 py-0.5 text-[10px] font-black tracking-[0.18em] ${
                              isSeen
                                ? "bg-white text-slate-500 shadow-[0_8px_20px_rgba(15,23,42,0.12)] ring-1 ring-slate-200"
                                : "bg-[--theme-orange] text-white shadow-[0_8px_20px_rgba(255,122,69,0.28)]"
                            }`}
                          >
                            {isSeen ? "Seen" : "New"}
                          </span>
                        </div>
                        <div className="text-center">
                          <span className="block truncate text-sm font-bold text-slate-950">{profile.name}</span>
                          <span className="block text-[11px] text-slate-500">
                            {profile.location || "Location not set"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <Link
                to={createPageUrl("LikesSent")}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/70 bg-white/85 px-4 py-2 text-xs font-bold text-slate-600 shadow-sm transition-colors hover:text-[--theme-orange]"
              >
                <Heart className="h-4 w-4" />
                לייקים ששלחתי
              </Link>
            </div>
          </motion.section>

          {profiles.length === 0 ? (
            <EmptyState onExplore={() => navigate(createPageUrl("Discover"))} />
          ) : (
            <div className="space-y-4 pb-2">
              {profiles.map((profile, index) => {
                const isSeen = seenLikeIds.map(String).includes(String(profile.user_id));
                return (
                  <LikeCard
                    key={profile.id || profile.user_id}
                    profile={profile}
                    isSeen={isSeen}
                    index={index}
                    onOpen={() => handleOpenProfile(profile)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </PullToRefresh>
    </div>
  );
}
