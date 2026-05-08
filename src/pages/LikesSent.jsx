import React, { useEffect, useState } from "react";
import { Profile, Swipe } from "@/entities/all";
import { User } from "@/entities/User";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Compass, Loader2, MapPin, ThumbsUp } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { enableSimulatorBackend, getSimulatorBackendState } from "@/lib/simulatorBackend";
import { isRuumrSimulatorMode } from "@/lib/simulatorMode";

const DAY_MS = 24 * 60 * 60 * 1000;
const FALLBACK_PALETTE = ["#FF8A4C", "#FF5F2F", "#F97316"];

const escapeXml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

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

const formatLikedLabel = (value) => {
  if (!value) return "היום";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "היום";

  const diffDays = Math.floor((Date.now() - date.getTime()) / DAY_MS);
  if (diffDays <= 0) return "היום";
  if (diffDays === 1) return "אתמול";
  if (diffDays < 7) return `לפני ${diffDays} ימים`;

  return new Intl.DateTimeFormat("he-IL", {
    day: "numeric",
    month: "short",
  }).format(date);
};

const formatBudget = (profile) => {
  const budget = Number(profile?.budget_max ?? profile?.budgetMax ?? profile?.budget_min ?? profile?.budgetMin);
  if (!Number.isFinite(budget) || budget <= 0) return null;
  return `₪${budget.toLocaleString()}`;
};

const isVideoUrl = (url) => typeof url === "string" && /\.(mp4|mov|webm|ogg)$/i.test(url);

const createFallbackCover = (name) => {
  const initials = String(name || "R")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "R")
    .join("") || "R";

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1200" role="img" aria-label="${escapeXml(name || "Ruumr")}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${FALLBACK_PALETTE[0]}" />
          <stop offset="55%" stop-color="${FALLBACK_PALETTE[1]}" />
          <stop offset="100%" stop-color="${FALLBACK_PALETTE[2]}" />
        </linearGradient>
        <radialGradient id="glow" cx="28%" cy="22%" r="70%">
          <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.24" />
          <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="900" height="1200" rx="72" fill="url(#bg)" />
      <circle cx="190" cy="170" r="260" fill="url(#glow)" />
      <circle cx="720" cy="990" r="240" fill="#FFFFFF" fill-opacity="0.08" />
      <rect x="110" y="170" width="680" height="860" rx="52" fill="#FFFFFF" fill-opacity="0.14" stroke="#FFFFFF" stroke-opacity="0.14" />
      <circle cx="450" cy="450" r="150" fill="#FFFFFF" fill-opacity="0.9" />
      <text x="450" y="492" text-anchor="middle" font-size="110" font-weight="800" font-family="Inter, Arial, sans-serif" fill="${FALLBACK_PALETTE[0]}">${escapeXml(initials)}</text>
      <text x="450" y="730" text-anchor="middle" font-size="58" font-weight="800" font-family="Inter, Arial, sans-serif" fill="#FFFFFF">${escapeXml(name || "Ruumr")}</text>
      <text x="450" y="800" text-anchor="middle" font-size="32" font-weight="500" font-family="Inter, Arial, sans-serif" fill="#FFFFFF" fill-opacity="0.9">Liked profile</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const getPrimaryImage = (profile) => {
  const photos = Array.isArray(profile?.photos) ? profile.photos : [];
  const firstImage = photos.find((url) => Boolean(url) && !isVideoUrl(url));
  if (firstImage) return firstImage;

  const apartmentPhotos = Array.isArray(profile?.apartment_photos) ? profile.apartment_photos : [];
  const firstApartmentImage = apartmentPhotos.find(Boolean);
  if (firstApartmentImage) return firstApartmentImage;

  return createFallbackCover(profile?.name);
};

const CoverImage = ({ profile, alt, className = "" }) => {
  const fallback = createFallbackCover(profile?.name);
  const [src, setSrc] = useState(() => getPrimaryImage(profile));

  useEffect(() => {
    setSrc(getPrimaryImage(profile));
  }, [profile?.id]);

  return (
    <img
      src={src}
      alt={alt || profile?.name || "פרופיל"}
      className={className}
      onError={() => {
        if (src !== fallback) {
          setSrc(fallback);
        }
      }}
    />
  );
};

const buildLikedProfilesFromSimulatorState = (state, currentUser) => {
  const swipes = sortByDateDesc(
    getCollection(state, "Swipe").filter(
      (swipe) =>
        String(swipe.swiper_id) === String(currentUser?.id) &&
        String(swipe.action || "").toLowerCase() === "like"
    )
  );

  const likedAtByUserId = new Map();
  swipes.forEach((swipe) => {
    likedAtByUserId.set(String(swipe.swiped_id), swipe.created_date || swipe.updated_date || "");
  });

  return sortByDateDesc(
    getCollection(state, "Profile")
      .filter((profile) => likedAtByUserId.has(String(profile.user_id)))
      .map((profile) => ({
        ...profile,
        liked_at: likedAtByUserId.get(String(profile.user_id)),
        fit_score: Number(profile.ruumrPlus?.score ?? profile.ruumr_plus?.score ?? 0),
      })),
    "liked_at"
  );
};

function LoadingState() {
  return (
    <div className="rounded-[2rem] border border-white/70 bg-white/78 p-6 text-center shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-2xl">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-[--theme-orange] shadow-inner">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
      <h2 className="text-2xl font-black tracking-tight text-slate-950">טוען לייקים שנשלחו</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">מסדרים את הפרופילים שכבר סימנת, כדי שאפשר יהיה לחזור אליהם בנוחות.</p>
    </div>
  );
}

function EmptyState({ onExplore }) {
  return (
    <div className="rounded-[2rem] border border-white/70 bg-white/82 p-6 text-center shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-2xl">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-[--theme-orange] shadow-inner">
        <Compass className="h-8 w-8" />
      </div>
      <h3 className="mt-4 text-2xl font-black tracking-tight text-slate-950">עוד אין לייקים שנשלחו</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        כשתשלח לייקים, הם יופיעו כאן כגלריה מסודרת שאפשר לחזור אליה בכל רגע.
      </p>
      <button
        onClick={onExplore}
        className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[--theme-orange] px-5 py-3 text-sm font-bold text-white shadow-[0_14px_30px_rgba(255,122,69,0.24)]"
      >
        לגלות אנשים חדשים
        <ArrowUpRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function LikeCard({ profile, onOpen }) {
  const fitScore = Number(profile?.fit_score ?? profile?.ruumrPlus?.score ?? profile?.ruumr_plus?.score ?? 0);
  const fitLabel = Number.isFinite(fitScore) && fitScore > 0 ? `${Math.round(fitScore * 100)}% fit` : null;
  const budgetLabel = formatBudget(profile);
  const likedLabel = formatLikedLabel(profile?.liked_at);
  const locationLabel = profile?.location || profile?.search_area || "מיקום לא צוין";
  const statusLabel = profile?.current_status === "has_apartment" ? "יש דירה" : "מחפש/ת";

  return (
    <motion.article
      whileTap={{ scale: 0.99 }}
      className="overflow-hidden rounded-[30px] border border-white/70 bg-white/82 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-2xl"
      onClick={onOpen}
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        <CoverImage profile={profile} alt={profile?.name || "פרופיל"} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.06)_0%,rgba(15,23,42,0.14)_40%,rgba(15,23,42,0.88)_100%)]" />

        <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-3" dir="rtl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.26em] text-slate-500 shadow-sm">
            <ThumbsUp className="h-3.5 w-3.5 text-[--theme-orange]" />
            Sent
          </span>
          {fitLabel && (
            <span className="inline-flex items-center rounded-full bg-white/16 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-md">
              {fitLabel}
            </span>
          )}
        </div>

        <div className="absolute inset-x-4 bottom-4" dir="rtl">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0 text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-white/65">Liked {likedLabel}</p>
              <h3 className="mt-1 truncate text-3xl font-black tracking-tight text-white">
                {profile?.name}, {profile?.age}
              </h3>
              <p className="mt-2 flex items-center justify-end gap-1.5 text-sm text-white/82">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{locationLabel}</span>
              </p>
            </div>
            <div className="rounded-[1.15rem] border border-white/20 bg-white/12 px-3 py-2 text-right backdrop-blur-md">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/55">Mood</p>
              <p className="mt-1 text-sm font-bold text-white">{statusLabel}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3 p-4 text-right">
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
            {profile?.search_area || "איזור חיפוש"}
          </span>
          {budgetLabel && (
            <span className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-[--theme-orange] ring-1 ring-orange-100">
              {budgetLabel}
            </span>
          )}
          {profile?.search_cities?.[0] && (
            <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500 ring-1 ring-slate-200">
              {profile.search_cities[0]}
            </span>
          )}
        </div>

        {profile?.ruumrPlus?.insight && (
          <p className="text-sm leading-6 text-slate-500">{profile.ruumrPlus.insight}</p>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          className="inline-flex min-h-[44px] items-center gap-2 text-sm font-bold text-[--theme-orange]"
        >
          פתח/י פרופיל
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>
    </motion.article>
  );
}

export default function LikesSentPage() {
  const [profiles, setProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadSentLikes = async () => {
      setIsLoading(true);

      try {
        if (isRuumrSimulatorMode()) {
          enableSimulatorBackend(base44);
        }

        let currentUser = null;
        try {
          currentUser = await User.me();
        } catch (error) {
          const simulatorState = getSimulatorBackendState();
          if (simulatorState?.currentUser) {
            currentUser = simulatorState.currentUser;
          } else {
            throw error;
          }
        }

        let nextProfiles = [];
        try {
          const [myLikes, allProfiles] = await Promise.all([
            Swipe.filter({ swiper_id: currentUser.id, action: "like" }),
            Profile.list("-created_date", 500),
          ]);

          const likedAtByUserId = new Map();
          sortByDateDesc(myLikes).forEach((swipe) => {
            likedAtByUserId.set(String(swipe.swiped_id), swipe.created_date || swipe.updated_date || "");
          });

          nextProfiles = allProfiles
            .filter((profile) => likedAtByUserId.has(String(profile.user_id)))
            .map((profile) => ({
              ...profile,
              liked_at: likedAtByUserId.get(String(profile.user_id)),
              fit_score: Number(profile.ruumrPlus?.score ?? profile.ruumr_plus?.score ?? 0),
            }));
        } catch (error) {
          console.warn("Falling back to simulator likes-sent data:", error);
        }

        if ((!nextProfiles || nextProfiles.length === 0) && currentUser) {
          const simulatorState = getSimulatorBackendState();
          if (simulatorState?.currentUser) {
            nextProfiles = buildLikedProfilesFromSimulatorState(simulatorState, currentUser);
          }
        }

        setProfiles(sortByDateDesc(nextProfiles, "liked_at"));
      } catch (error) {
        console.error("Error loading sent likes:", error);
        const simulatorState = getSimulatorBackendState();
        if (simulatorState?.currentUser) {
          setProfiles(buildLikedProfilesFromSimulatorState(simulatorState, simulatorState.currentUser));
        } else {
          setProfiles([]);
        }
      }

      setIsLoading(false);
    };

    loadSentLikes();
  }, []);

  const heroProfiles = profiles.slice(0, 3);

  return (
    <div className="relative min-h-[100dvh] overflow-hidden px-4 pt-4 pb-28" dir="rtl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top_left,_rgba(255,111,63,0.14),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(255,255,255,0.9),_transparent_26%),linear-gradient(180deg,_rgba(255,255,255,0.64)_0%,_rgba(255,255,255,0.05)_100%)]" />

      <div className="mx-auto max-w-md space-y-4">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border border-white/70 bg-white/78 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-2xl"
        >
          <div className="flex items-start justify-between gap-4" dir="ltr">
            <button
              onClick={() => navigate(-1)}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white/88 text-slate-600 shadow-sm ring-1 ring-slate-200"
              aria-label="חזור"
            >
              <ArrowRight className="h-5 w-5" />
            </button>

            <div className="min-w-0 flex-1 text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-[--theme-orange]">Sent likes</p>
              <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">לייקים ששלחתי</h1>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                כל הפרופילים שכבר סימנת בלב נשמרים כאן. קל לחזור אליהם, להשוות ולהמשיך משם.
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-[1.3rem] bg-slate-100/90 px-3 py-3 text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">Total</p>
              <p className="mt-1 text-xl font-black text-slate-950">{profiles.length}</p>
            </div>
            <div className="rounded-[1.3rem] bg-orange-50/90 px-3 py-3 text-right ring-1 ring-orange-100">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[--theme-orange]">Fresh</p>
              <p className="mt-1 text-xl font-black text-slate-950">{profiles.length > 0 ? "Yes" : "0"}</p>
            </div>
            <div className="rounded-[1.3rem] bg-white px-3 py-3 text-right ring-1 ring-slate-200">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">Ready</p>
              <p className="mt-1 text-xl font-black text-slate-950">{profiles.length > 0 ? "View" : "Explore"}</p>
            </div>
          </div>

          {heroProfiles.length > 0 && (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-[1.5rem] border border-orange-100 bg-orange-50/80 p-3">
              <div className="flex -space-x-2 rtl:space-x-reverse">
                {heroProfiles.map((profile) => (
                  <div
                    key={profile.id}
                    className="h-11 w-11 overflow-hidden rounded-full border-2 border-white shadow-sm"
                  >
                    <CoverImage profile={profile} alt={profile.name} className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-[--theme-orange]">Preview</p>
                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {heroProfiles[0]?.name || "עוד לא התחלת"} ולצידם עוד {Math.max(profiles.length - heroProfiles.length, 0)} פרופילים
                </p>
              </div>
            </div>
          )}
        </motion.section>

        {isLoading ? (
          <LoadingState />
        ) : profiles.length === 0 ? (
          <EmptyState onExplore={() => navigate(createPageUrl("Discover"))} />
        ) : (
          <div className="space-y-4">
            {profiles.map((profile, index) => (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
                onClick={() => navigate(createPageUrl("ProfileView") + `?userId=${profile.user_id}&fromLikes=true`)}
                className="cursor-pointer"
              >
                <LikeCard
                  profile={profile}
                  onOpen={() => navigate(createPageUrl("ProfileView") + `?userId=${profile.user_id}&fromLikes=true`)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
