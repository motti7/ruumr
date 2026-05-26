import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User } from "@/entities/User";
import { Profile } from "@/entities/Profile";
import { Swipe } from "@/entities/all";
import { base44 } from "@/api/base44Client";
import { trackMixpanel } from "@/lib/mixpanelTracking";
import { createPageUrl } from "@/utils";
import {
  activateRuumrPlusRecommendations,
  mergeRuumrPlusRecommendations,
  RUUMR_PLUS_RECOMMENDATION_LIMIT,
  syncCurrentProfileToRuumrPlus,
} from "@/api/ruumrPlus";
import {
  buildSimulatorRuumrPlusRecommendations,
} from "@/lib/ruumrPlusSimulator";
import { isRuumrSimulatorMode } from "@/lib/simulatorMode";
import { isPlusEntitled } from "@/lib/ruumrPlusEntitlement";
import { processSwipeMatch } from "@/lib/swipeMatchProcessing";
import {
  buildRuumrPlusActivationRecord,
  consumeRuumrPlusActivationIntent,
  clearRuumrPlusActivation,
  getRuumrPlusActivationRemainingMs,
  isRuumrPlusActivationFresh,
  loadRuumrPlusActivation,
  saveRuumrPlusActivation,
  normalizeRuumrPlusActivation,
} from "@/lib/ruumrPlusActivation";
import SmartImage from "@/components/shared/SmartImage";
import { getInterestLabel } from "@/lib/interests";
import {
  Crown,
  Lock,
  MessageCircle,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UsersRound,
  ChevronLeft,
  Heart,
  X,
} from "lucide-react";

const featureCards = [
  {
    icon: Sparkles,
    title: "התאמות חכמות",
    description: "Ruumr Plus מדרג התאמות לפי שגרה, דירה, תקציב והרגלים משותפים.",
  },
  {
    icon: MessageCircle,
    title: "שיחות חכמות",
    description: "כשרמת ההתאמה גבוהה, אפשר לפתוח הודעות מוקדם יותר ולשוחח מהר יותר.",
  },
  {
    icon: SlidersHorizontal,
    title: "הרגלים בבית",
    description: "הסינון לוקח בחשבון סדר יום, ניקיון, אורחים, רעש ומידע ביתי נוסף.",
  },
  {
    icon: ShieldCheck,
    title: "פרופיל מדויק",
    description: "פרופיל מלא ומאומת מאפשר ל-Plus לחשב התאמות אמינות יותר.",
  },
];

const quickLinks = [
  {
    title: "המשך/י ל-Discover",
    description: "אם תרצה/י להמשיך לסווייפ הרגיל אחרי שראית את תוצאות Plus.",
    to: createPageUrl("Discover"),
    icon: Sparkles,
  },
  {
    title: "ערוך/י את הפרופיל",
    description: "פרטי הפרופיל וההרגלים הביתיים משפרים את איכות ה-Plus.",
    to: createPageUrl("Profile"),
    icon: UsersRound,
  },
];

function getRecommendationLocation(profile = {}) {
  if (profile.current_status !== "has_apartment" && Array.isArray(profile.search_cities) && profile.search_cities.length > 0) {
    const cityParts = [profile.search_cities[0], profile.search_area].filter(Boolean);
    return cityParts.join(" • ");
  }

  return [profile.location, profile.search_area].filter(Boolean).join(" • ");
}

function formatActivationWindow(milliseconds = 0) {
  const totalMinutes = Math.max(0, Math.ceil(Number(milliseconds) / 60000));
  if (totalMinutes <= 0) {
    return "כעת";
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return minutes > 0 ? `${hours} שעות ו-${minutes} דקות` : `${hours} שעות`;
  }

  return `${totalMinutes} דקות`;
}

// Fire to both analytics sinks (Base44 + Mixpanel) without ever disrupting the
// Plus flow if a sink throws or its async call rejects.
function trackPlusEvent(eventName, mixpanelName, properties = {}) {
  try {
    const result = base44.analytics?.track?.({ eventName, properties });
    if (result && typeof result.then === "function") {
      result.catch(() => {});
    }
  } catch (_) {
    // Analytics is best-effort; swallow.
  }
  trackMixpanel(mixpanelName, properties);
}

function RuumrPlusRecommendationCard({ profile, position, onSwipe }) {
  const navigate = useNavigate();
  const plusMeta = profile.ruumrPlus || profile.ruumr_plus || null;
  const score = Math.round((Number(plusMeta?.score) || 0) * 100);
  const locationLabel = getRecommendationLocation(profile) || "ללא מיקום";
  const insight = plusMeta?.insight || "יש כאן התאמה מעניינת לשיחה ראשונה.";
  const sharedCities = Array.isArray(plusMeta?.reasons?.shared_cities) ? plusMeta.reasons.shared_cities : [];
  const sharedInterests = Array.isArray(plusMeta?.reasons?.shared_interests) ? plusMeta.reasons.shared_interests : [];
  const tags = [
    ...(profile.current_status === "has_apartment" ? ["יש לי דירה"] : []),
    ...sharedCities.slice(0, 2),
    ...sharedInterests.slice(0, 2).map((interest) => getInterestLabel(interest)),
  ];

  const openProfile = () => {
    trackPlusEvent("plus_recommendation_clicked", "Plus Recommendation Clicked", {
      target_profile_id: profile.user_id,
      position,
      score: plusMeta?.score ?? null,
      messageable: Boolean(plusMeta?.messageable),
    });
    navigate(`${createPageUrl("ProfileView")}?userId=${encodeURIComponent(profile.user_id)}&fromPlus=true`);
  };

  const handleSwipeClick = (event, action) => {
    event.stopPropagation();
    onSwipe?.(profile.user_id, action);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={openProfile}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openProfile(); } }}
      className="group cursor-pointer overflow-hidden rounded-[1.75rem] border border-orange-100 bg-white shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg"
      aria-label={`פתח/י את הפרופיל של ${profile.name}`}
    >
      <div className="relative aspect-[4/3] bg-gray-100">
        <SmartImage
          src={profile.photos?.[0]}
          alt={profile.name}
          className="h-full w-full"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />

        <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
          <span className="rounded-full bg-black/75 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm">
            {score}% התאמה
          </span>
          <span className={`rounded-full px-3 py-1.5 text-xs font-bold backdrop-blur-sm ${
            plusMeta?.messageable ? "bg-emerald-500/90 text-white" : "bg-white/90 text-gray-800"
          }`}>
            {plusMeta?.messageable ? "הודעות פתוחות" : "שיחה נעולה"}
          </span>
        </div>

        <div className="absolute bottom-3 right-3 left-3 text-white">
          <div className="flex items-center gap-2 justify-end">
            {profile.is_verified && (
              <span className="rounded-full bg-blue-500/90 px-2 py-1 text-[10px] font-bold">מאומת</span>
            )}
            <h3 className="text-2xl font-black leading-tight drop-shadow">
              {profile.name}, {profile.age}
            </h3>
          </div>
          <p className="mt-1 text-sm text-white/85">{locationLabel}</p>
        </div>
      </div>

      <div className="p-4">
        <p className="text-sm leading-6 text-gray-600">{insight}</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-bold text-[--theme-orange]"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => handleSwipeClick(e, "like")}
              aria-label={`אהבתי את ${profile.name}`}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-pink-500 text-white shadow"
            >
              <Heart className="h-4 w-4" fill="white" />
            </button>
            <button
              type="button"
              onClick={(e) => handleSwipeClick(e, "dislike")}
              aria-label={`דחה את ${profile.name}`}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:border-gray-300"
            >
              <X className="h-4 w-4" strokeWidth={3} />
            </button>
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-bold text-[--theme-orange]">
            פתח/י פרופיל
            <ChevronLeft className="w-4 h-4" />
          </span>
        </div>
      </div>
    </div>
  );
}

export default function RuumrPlusPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [localProfiles, setLocalProfiles] = useState([]);
  const [userSwipes, setUserSwipes] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const resultsRef = useRef(null);
  const activationIntentRef = useRef(null);
  const [isActivating, setIsActivating] = useState(false);
  const [activationRecord, setActivationRecord] = useState(null);
  const [plusRecommendations, setPlusRecommendations] = useState([]);
  const [plusRecommendationsMeta, setPlusRecommendationsMeta] = useState({
    matchedCount: 0,
    candidateCount: 0,
    generatedAt: null,
    source: "loading",
  });
  const [plusState, setPlusState] = useState({
    status: "loading",
    label: "בודק מצב Plus...",
    description: "טוען נתוני חשבון והתראות שמורות.",
  });

  const applyActivationRecord = useCallback((record, {
    statusOverride = null,
    sourceOverride = null,
    candidateCount: candidateCountOverride = null,
  } = {}) => {
    const normalized = normalizeRuumrPlusActivation(record);
    if (!normalized) {
      return null;
    }

    setActivationRecord(normalized);
    setPlusRecommendations(normalized.recommendations ?? []);
    setPlusRecommendationsMeta({
      matchedCount: normalized.matched_count ?? normalized.recommendations?.length ?? 0,
      candidateCount: candidateCountOverride ?? normalized.candidate_count ?? 0,
      generatedAt: normalized.generated_at ?? normalized.activated_at ?? null,
      source: sourceOverride ?? normalized.source ?? "saved",
    });

    const fresh = isRuumrPlusActivationFresh(normalized);
    const remainingMs = getRuumrPlusActivationRemainingMs(normalized);
    const hasRecs = (normalized.recommendations?.length ?? 0) > 0;
    // Only a fresh run that returned results enters the 24h cooldown ("active").
    const nextStatus = statusOverride ?? (fresh && hasRecs ? "active" : "saved");

    setPlusState({
      status: nextStatus,
      label:
        nextStatus === "active"
          ? "Plus פעיל"
          : nextStatus === "saved"
            ? "תוצאות שמורות"
            : nextStatus === "locked"
              ? "Plus נעול"
              : nextStatus === "fallback"
                ? "מצב דמו"
                : "Ruumr Plus",
      description:
        nextStatus === "active"
          ? `Plus פעיל. אפשר להפעיל שוב בעוד ${formatActivationWindow(remainingMs)}.`
          : nextStatus === "saved"
            ? "התוצאות האחרונות נשמרו כאן. אפשר להפעיל שוב עכשיו."
            : nextStatus === "locked"
              ? "Ruumr Plus עוד לא פתוח לחשבון הזה."
              : nextStatus === "fallback"
                ? "לא הצלחנו לטעון את מצב החשבון כרגע."
                : "לחיצה על Plus תחשב 5 התאמות ותשמור אותן כאן ל-24 שעות.",
    });

    return normalized;
  }, []);

  const loadAndRestoreActivation = useCallback(async (cancelledRef = { current: false }) => {
    try {
      const user = await User.me();
      if (cancelledRef.current) return;

      // Route-level entitlement gate: non-subscribers never see the Plus page,
      // covering deep links and nav-intent in addition to the button handler.
      if (!isPlusEntitled(user)) {
        navigate(createPageUrl("RuumrPlusPricing"), { replace: true });
        return;
      }

      setCurrentUser(user);
      setIsAdmin(user?.role === "admin");

      const [userProfilesResult, allProfilesResult, swipesResult] = await Promise.allSettled([
        Profile.filter({ user_id: user.id }),
        Profile.list("-created_date", 500),
        Swipe.filter({ swiper_id: user.id }),
      ]);

      const profile =
        userProfilesResult.status === "fulfilled"
          ? userProfilesResult.value?.[0] || null
          : null;

      const profiles =
        allProfilesResult.status === "fulfilled" && Array.isArray(allProfilesResult.value)
          ? allProfilesResult.value
          : profile
            ? [profile]
            : [];

      const swipes =
        swipesResult.status === "fulfilled" && Array.isArray(swipesResult.value)
          ? swipesResult.value
          : [];

      if (cancelledRef.current) return;

      setCurrentProfile(profile);
      setLocalProfiles(profiles);
      setUserSwipes(swipes);

      const savedActivation = loadRuumrPlusActivation(user.id);
      if (savedActivation) {
        applyActivationRecord(savedActivation, {
          sourceOverride: savedActivation.source ?? "saved",
          candidateCount: Math.max(0, profiles.length - 1),
        });
        return;
      }

      setActivationRecord(null);
      setPlusRecommendations([]);
      setPlusRecommendationsMeta({
        matchedCount: 0,
        candidateCount: Math.max(0, profiles.length - 1),
        generatedAt: null,
        source: "idle",
      });
      setPlusState({
        status: "idle",
        label: "Ruumr Plus מוכן",
        description: "לחיצה על Plus תחשב 5 התאמות ותשמור אותן כאן ל-24 שעות.",
      });
    } catch (error) {
      if (cancelledRef.current) return;

      console.error("Failed to load Ruumr Plus profile state:", error);
      setPlusState({
        status: "fallback",
        label: "מצב דמו",
        description: "לא הצלחנו לטעון את מצב החשבון כרגע.",
      });
    }
  }, [applyActivationRecord, navigate]);

  useEffect(() => {
    const cancelledRef = { current: false };

    const run = async () => {
      await loadAndRestoreActivation(cancelledRef);
    };

    run();

    return () => {
      cancelledRef.current = true;
    };
  }, [loadAndRestoreActivation]);

  const activatePlus = useCallback(async ({ source = "page" } = {}) => {
    if (isActivating || !currentUser || !currentProfile) {
      return null;
    }

    // Cooldown: a fresh run that returned matches locks re-runs for 24h. An
    // empty past run never locks, so the user can retry to pick up new
    // candidates.
    const existing = loadRuumrPlusActivation(currentUser.id);
    if (existing && isRuumrPlusActivationFresh(existing) && (existing.recommendations?.length ?? 0) > 0) {
      applyActivationRecord(existing, { sourceOverride: existing.source ?? "saved" });
      window.requestAnimationFrame(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      return existing;
    }

    setIsActivating(true);
    setPlusState((prev) => ({
      ...prev,
      status: "loading",
      label: "מפעיל/ה Plus...",
      description: "מחפש 5 התאמות ושומר אותן למסך הזה.",
    }));

    try {
      try {
        await syncCurrentProfileToRuumrPlus();
      } catch (syncError) {
        console.error("Failed to sync current profile before Ruumr Plus activation:", syncError);
      }

      const response = await activateRuumrPlusRecommendations({
        userId: currentUser.id,
        localProfiles,
        currentProfile,
        userSwipes,
      });

      // Use all recommendations the service returns. mergeRuumrPlusRecommendations
      // fills profile data from the service payload itself, so we don't need the
      // candidate to be in the client's locally-loaded list (that filter was
      // silently dropping valid matches).
      const serviceRecommendations = Array.isArray(response?.recommendations)
        ? response.recommendations
        : [];

      const mergedRecommendations = mergeRuumrPlusRecommendations({
        localProfiles,
        recommendations: serviceRecommendations,
      });

      const activationRecord = buildRuumrPlusActivationRecord({
        response,
        recommendations: mergedRecommendations,
        matchedCount: mergedRecommendations.length,
        candidateCount: response?.candidate_count ?? Math.max(0, localProfiles.length - 1),
        source: response?.mode ?? (isRuumrSimulatorMode() ? "simulator" : source),
      });

      if (!activationRecord) {
        throw new Error("Failed to build the Plus activation record");
      }

      const savedActivation = saveRuumrPlusActivation(currentUser.id, activationRecord) || activationRecord;
      applyActivationRecord(savedActivation, {
        sourceOverride: savedActivation.source ?? response?.mode ?? source,
        candidateCount: Math.max(0, localProfiles.length - 1),
      });

      trackPlusEvent("plus_activated", "Plus Activated", {
        source,
        from_cache: false,
        matched_count: mergedRecommendations.length,
        result_source: response?.mode ?? (isRuumrSimulatorMode() ? "simulator" : "live"),
      });

      window.requestAnimationFrame(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });

      return savedActivation;
    } catch (error) {
      if (error?.status === 403) {
        clearRuumrPlusActivation(currentUser.id);
        setActivationRecord(null);
        setPlusRecommendations([]);
        setPlusRecommendationsMeta({
          matchedCount: 0,
          candidateCount: 0,
          generatedAt: null,
          source: "locked",
        });
        setPlusState({
          status: "locked",
          label: "Plus נעול",
          description: "Ruumr Plus עוד לא פתוח לחשבון הזה.",
        });
        trackPlusEvent("plus_locked_shown", "Plus Locked Shown", { source });
        return null;
      }

      if (isRuumrSimulatorMode() && currentProfile) {
        try {
          const simulatorResponse = await buildSimulatorRuumrPlusRecommendations({
            userId: currentUser.id,
            limit: RUUMR_PLUS_RECOMMENDATION_LIMIT,
            refresh: false,
            requirePlus: true,
            localProfiles,
            currentProfile,
            userSwipes,
          });

          const activationRecord = buildRuumrPlusActivationRecord({
            response: simulatorResponse,
            recommendations: simulatorResponse.recommendations || [],
            matchedCount: simulatorResponse.matched_count ?? simulatorResponse.recommendations?.length ?? 0,
            candidateCount: simulatorResponse.candidate_count ?? Math.max(0, localProfiles.length - 1),
            source: "simulator-fallback",
          });

          if (activationRecord) {
            const savedActivation = saveRuumrPlusActivation(currentUser.id, activationRecord) || activationRecord;
            applyActivationRecord(savedActivation, {
              sourceOverride: "simulator-fallback",
              candidateCount: Math.max(0, localProfiles.length - 1),
            });
            trackPlusEvent("plus_activated", "Plus Activated", {
              source,
              from_cache: false,
              matched_count: simulatorResponse.matched_count ?? simulatorResponse.recommendations?.length ?? 0,
              result_source: "simulator-fallback",
            });
            window.requestAnimationFrame(() => {
              resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            });
            return savedActivation;
          }
        } catch (fallbackError) {
          console.error("Simulator fallback for Ruumr Plus activation failed:", fallbackError);
        }
      }

      console.error("Failed to activate Ruumr Plus:", error);
      trackPlusEvent("plus_request_failed", "Plus Request Failed", {
        source,
        reason: error?.message || "unknown",
        status: error?.status ?? null,
      });
      setPlusState({
        status: "fallback",
        label: "מצב דמו",
        description: "לא הצלחנו להפעיל את Ruumr Plus כרגע.",
      });
      return null;
    } finally {
      setIsActivating(false);
    }
  }, [applyActivationRecord, currentProfile, currentUser, isActivating, localProfiles, userSwipes]);

  useEffect(() => {
    if (!currentUser || !currentProfile) {
      return;
    }

    const pendingIntent = consumeRuumrPlusActivationIntent();
    if (!pendingIntent) {
      return;
    }

    const intentMarker = pendingIntent.requested_at || location.key || "ruumr-plus";
    if (activationIntentRef.current === intentMarker) {
      return;
    }

    activationIntentRef.current = intentMarker;
    activatePlus({ source: pendingIntent.source || "nav" }).catch((error) => {
      console.error("Failed to honor Ruumr Plus activation intent:", error);
    });
  }, [activatePlus, currentProfile, currentUser, location.key]);

  const activationFresh = activationRecord ? isRuumrPlusActivationFresh(activationRecord) : false;
  const isLocked = plusState.status === "locked";
  // The 24h cooldown only applies when a fresh run actually returned matches.
  const cooldownActive = activationFresh && plusRecommendations.length > 0;
  const cooldownRemainingMs = cooldownActive ? getRuumrPlusActivationRemainingMs(activationRecord) : 0;
  const primaryActionLabel = isActivating
    ? "מפעיל/ה Plus..."
    : isLocked
      ? "Plus עדיין לא זמין"
      : cooldownActive
        ? `זמין שוב בעוד ${formatActivationWindow(cooldownRemainingMs)}`
        : activationRecord
          ? "הפעל/י Plus שוב"
          : "הפעל/י Plus";
  const resultsHeading = activationRecord
    ? "התוצאות האחרונות שלך ב-Ruumr Plus"
    : "התוצאות שלך ב-Ruumr Plus";
  const resultsSubheading = activationRecord
    ? activationFresh
      ? "התוצאות השמורות שלך מופיעות כאן. אפשר להפעיל שוב בעוד 24 שעות."
      : "התוצאות השמורות שלך מופיעות כאן. אפשר להפעיל שוב עכשיו."
    : "כאן תראה/י את ההתאמות שחושבו עבורך, בלי לצאת ממסך Plus.";

  const handlePrimaryAction = useCallback(() => {
    if (isActivating || isLocked || cooldownActive || !currentUser || !currentProfile) {
      return;
    }

    activatePlus({ source: "hero" }).catch((error) => {
      console.error("Failed to activate Ruumr Plus from the primary action:", error);
    });
  }, [activatePlus, cooldownActive, isLocked, currentProfile, currentUser, isActivating]);

  // Like/reject a Ruumr Plus recommendation from a card. Records the swipe (so
  // it behaves like Discover and won't resurface), removes the card, and forms
  // a match on a mutual like.
  const handleCardSwipe = useCallback(async (swipedUserId, action) => {
    if (!currentUser || !currentProfile) {
      return;
    }
    const swipedProfile = plusRecommendations.find((p) => String(p.user_id) === String(swipedUserId)) || null;
    setPlusRecommendations((prev) => prev.filter((p) => String(p.user_id) !== String(swipedUserId)));

    // Persist the removal so the swiped card doesn't reappear on reload.
    const storedActivation = loadRuumrPlusActivation(currentUser.id);
    if (storedActivation) {
      const remaining = (storedActivation.recommendations || []).filter(
        (p) => String(p.user_id) !== String(swipedUserId)
      );
      const updated = saveRuumrPlusActivation(currentUser.id, {
        ...storedActivation,
        recommendations: remaining,
        matched_count: remaining.length,
      });
      if (updated) {
        setActivationRecord(updated);
      }
    }

    trackPlusEvent("plus_recommendation_swiped", "Plus Recommendation Swiped", {
      target_profile_id: swipedUserId,
      action,
    });
    try {
      await Swipe.create({
        swiper_id: currentProfile.user_id,
        swiper_name: currentProfile.name,
        swiped_id: swipedUserId,
        swiped_name: swipedProfile?.name,
        action,
      });
      if (action === "like") {
        await processSwipeMatch({
          swiperId: currentProfile.user_id,
          swipedId: swipedUserId,
          action,
          origin: window.location.origin,
        });
      }
    } catch (error) {
      console.error("Ruumr Plus card swipe failed:", error);
    }
  }, [currentUser, currentProfile, plusRecommendations]);

  const statusStyles = {
    idle: "bg-white/15 text-white border border-white/10",
    saved: "bg-white/15 text-white border border-white/10",
    active: "bg-emerald-500/20 text-emerald-50 border border-emerald-200/30",
    locked: "bg-white/15 text-white border border-white/10",
    fallback: "bg-black/15 text-white border border-white/10",
    loading: "bg-white/15 text-white border border-white/10 animate-pulse",
  };

  const statusIcon = plusState.status === "active" ? Crown : Sparkles;
  const StatusIcon = statusIcon;

  return (
    <div
      className="min-h-screen pb-40 sm:pb-24 bg-[radial-gradient(circle_at_top_right,_rgba(250,56,3,0.16),_transparent_36%),linear-gradient(180deg,_#fff8f4_0%,_#ffffff_40%,_#f8fafc_100%)]"
      dir="rtl"
    >
      <div className="px-4 pt-4 space-y-5">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#FA3803] via-[#ff6a2a] to-[#ffb45c] px-5 py-6 text-white shadow-2xl">
          <div className="absolute -top-12 left-0 h-32 w-32 rounded-full bg-white/15 blur-2xl" />
          <div className="absolute -bottom-8 right-0 h-28 w-28 rounded-full bg-white/10 blur-2xl" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-white/90">
              <Sparkles className="w-4 h-4" />
              Ruumr Plus
            </div>

            <h1 className="mt-4 text-3xl font-black leading-tight">
              התאמות חכמות יותר. פרופילים מדויקים יותר.
            </h1>

            <p className="mt-3 max-w-md text-sm leading-6 text-white/90">
              לחיצה על Plus מפעילה עד 5 התאמות חכמות, שומרת אותן כאן למשך 24 שעות,
              ומאפשרת לחזור אליהן בלי לעבור למסך הסווייפ הרגיל.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${statusStyles[plusState.status] || statusStyles.fallback}`}>
                <StatusIcon className="w-4 h-4" />
                {plusState.label}
              </span>
              {currentUser?.full_name && (
                <span className="text-xs font-medium text-white/80">
                  מחובר/ת כ-{currentUser.full_name}
                </span>
              )}
            </div>

            <p className="mt-3 text-sm text-white/90">
              {plusState.description}
            </p>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button
                type="button"
                onClick={handlePrimaryAction}
                disabled={isActivating || isLocked || cooldownActive || !currentUser || !currentProfile}
                className="flex h-12 items-center justify-center gap-2 rounded-full bg-white text-[--theme-orange] font-bold shadow-lg hover:bg-white/90 disabled:opacity-60"
              >
                {(isActivating || (!currentUser && !currentProfile)) ? (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>{primaryActionLabel}</span>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-12 rounded-full border-white/25 bg-white/10 text-white font-bold hover:bg-white/15"
              >
                <Link to={createPageUrl("Profile")}>ערוך/י פרופיל</Link>
              </Button>

            </div>
          </div>
        </div>

        <div
          ref={resultsRef}
          className="rounded-3xl border border-orange-100 bg-white p-5 shadow-sm scroll-mt-24"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-gray-900">{resultsHeading}</h2>
              <p className="mt-1 text-sm leading-6 text-gray-500">
                {resultsSubheading}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              {!isLocked && (
                <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-[--theme-orange]">
                  {(plusRecommendationsMeta.matchedCount ?? plusRecommendations.length ?? 0)} התאמות
                </span>
              )}
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                plusState.status === "active"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-gray-100 text-gray-600"
              }`}>
                {plusState.label}
              </span>
            </div>
          </div>

          {plusState.status === "loading" ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {[0, 1, 2, 3, 4].map((index) => (
                <div key={index} className="overflow-hidden rounded-[1.75rem] border border-gray-100 bg-gray-50">
                  <div className="aspect-[4/3] animate-pulse bg-gray-200" />
                  <div className="space-y-3 p-4">
                    <div className="h-5 w-3/4 animate-pulse rounded-full bg-gray-200" />
                    <div className="h-4 w-1/2 animate-pulse rounded-full bg-gray-100" />
                    <div className="h-4 w-full animate-pulse rounded-full bg-gray-100" />
                    <div className="flex gap-2">
                      <div className="h-7 w-20 animate-pulse rounded-full bg-gray-100" />
                      <div className="h-7 w-20 animate-pulse rounded-full bg-gray-100" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : isLocked ? (
            <div className="mt-4 rounded-[1.75rem] border border-dashed border-orange-200 bg-orange-50/70 p-6 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white text-[--theme-orange] shadow-sm">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-gray-900">Ruumr Plus עדיין לא זמין לחשבון שלך</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                התאמות Plus נפתחות בהדרגה. נעדכן אותך כאן ברגע שהן יהיו זמינות — בינתיים אפשר להמשיך לגלות התאמות במסך הרגיל.
              </p>
              <Button
                asChild
                className="mt-4 h-11 rounded-full bg-[--theme-orange] font-bold text-white hover:brightness-110"
              >
                <Link to={createPageUrl("Discover")}>המשך/י ל-Discover</Link>
              </Button>
            </div>
          ) : plusRecommendations.length > 0 ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {plusRecommendations.slice(0, RUUMR_PLUS_RECOMMENDATION_LIMIT).map((profile, index) => (
                <RuumrPlusRecommendationCard key={profile.user_id} profile={profile} position={index} onSwipe={handleCardSwipe} />
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-[1.75rem] border border-dashed border-orange-200 bg-orange-50/70 p-5 text-center">
              <h3 className="text-lg font-black text-gray-900">
                {activationRecord ? "לא נמצאו התאמות שמורות" : "עוד אין תוצאות להצגה"}
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                {activationRecord
                  ? "אפשר להפעיל את Ruumr Plus שוב כדי לרענן את ההתאמות השמורות."
                  : "לחיצה על Plus תחשב 5 התאמות ותשמור אותן כאן למשך 24 שעות."}
              </p>
              <Button
                type="button"
                onClick={handlePrimaryAction}
                disabled={isActivating || !currentUser || !currentProfile}
                className="mt-4 h-11 rounded-full bg-[--theme-orange] font-bold text-white hover:brightness-110"
              >
                {primaryActionLabel}
              </Button>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-gray-500">
            {plusRecommendationsMeta.generatedAt && (
              <span>
                עודכן לאחרונה: {new Date(plusRecommendationsMeta.generatedAt).toLocaleString("he-IL")}
              </span>
            )}
            {plusRecommendationsMeta.source && (
              <span className="rounded-full bg-gray-100 px-2.5 py-1 font-bold text-gray-600">
                {plusRecommendationsMeta.source === "simulator" || plusRecommendationsMeta.source === "simulator-fallback"
                  ? "מצב סימולטור"
                  : plusRecommendationsMeta.source === "saved"
                    ? "תוצאות שמורות"
                    : "תוצאות חיות"}
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {featureCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className="rounded-3xl border border-orange-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-[--theme-orange]">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-gray-900">{card.title}</h2>
                    <p className="mt-1 text-sm leading-5 text-gray-600">{card.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-3xl border border-orange-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-gray-900">איפה תראה/י את Plus</h2>
              <p className="mt-1 text-sm text-gray-500">אלה המסכים שבהם Ruumr Plus כבר מחובר לאפליקציה.</p>
            </div>
            <div className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-[--theme-orange]">
              Entry points
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {quickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.title}
                  to={item.to}
                  className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 transition-colors hover:bg-orange-50/70"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[--theme-orange] shadow-sm">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{item.title}</p>
                      <p className="text-sm text-gray-500">{item.description}</p>
                    </div>
                  </div>
                  <ChevronLeft className="w-5 h-5 text-gray-300" />
                </Link>
              );
            })}
          </div>
        </div>


      </div>
    </div>
  );
}
