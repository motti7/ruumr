import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  Loader2,
  ShieldCheck,
  Home,
  Star,
  ChevronRight,
  X,
  MapPin,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getPublicProfile } from "@/functions/getPublicProfile";
import { INTEREST_OPTIONS } from "@/lib/interests";

const VIBE_LABELS = [
  "vibe_lvl_quiet",
  "vibe_lvl_relaxed",
  "vibe_balanced",
  "vibe_lvl_social",
  "vibe_lvl_lively",
];

const RELIGION_LABELS = {
  secular: "religion_secular",
  traditional: "religion_traditional",
  national_religious: "religion_national_religious",
  religious: "religion_religious",
  haredi: "religion_haredi",
};

const PET_LABELS = {
  none: "pet_none",
  dog: "pet_dog",
  cat: "pet_cat",
  other: "pet_other",
};

function PrefChip({ label, value }) {
  return (
    <div className="flex flex-col items-start bg-gray-50 rounded-xl px-3 py-2 border border-gray-100 min-w-0">
      <span className="text-[11px] text-gray-400 font-medium">{label}</span>
      <span className="text-sm font-bold text-gray-800 truncate w-full">{value}</span>
    </div>
  );
}

export default function PublicProfile() {
  const { t, i18n } = useTranslation();
  const [userId, setUserId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const uid = params.get("userId");
    setUserId(uid);
    if (!uid) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await getPublicProfile({ userId: uid });
        const data = res?.data;
        if (data && !data.error && data.name) {
          setProfile(data);
        } else {
          setNotFound(true);
        }
      } catch (e) {
        setNotFound(true);
      }
      setIsLoading(false);
    })();
  }, []);

  const dir = i18n.dir();
  const joinTo = userId ? `/register?invited_by_user_id=${encodeURIComponent(userId)}` : "/register";

  const photos = profile?.photos || [];
  const apartmentPhotos = profile?.apartment_photos || [];
  const interests = profile?.interests || [];
  const cities = profile?.search_cities || [];
  const isVideo = (u) => typeof u === "string" && /\.(mp4|mov|webm)$/i.test(u);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-[--theme-blue]" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center" dir={dir}>
        <h1 className="logo-font text-4xl mb-4">Ruumr</h1>
        <p className="text-gray-600 font-medium mb-6">{t("public_not_found")}</p>
        <Link to="/" className="px-5 py-2.5 rounded-full text-white font-bold text-sm" style={{ backgroundColor: "var(--theme-blue)" }}>
          {t("public_back_to_app")}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-28" dir={dir}>
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-md mx-auto flex items-center justify-between px-4 h-12">
          <Link to="/" aria-label={t("public_back_to_app")} className="w-9 h-9 flex items-center justify-center">
            <ChevronRight className="w-5 h-5 text-gray-400" style={{ transform: dir === "rtl" ? "none" : "scaleX(-1)" }} />
          </Link>
          <Link to="/" className="logo-font text-2xl">Ruumr</Link>
          <span className="w-9 h-9" />
        </div>
      </div>

      <div className="max-w-md mx-auto">
        {/* Photo card */}
        <div className="relative w-full aspect-[4/5] bg-gray-100 overflow-hidden">
          {photos.length > 0 ? (
            <>
              {isVideo(photos[activePhoto]) ? (
                <video src={photos[activePhoto]} className="w-full h-full object-cover" muted loop autoPlay playsInline />
              ) : (
                <img
                  src={photos[activePhoto]}
                  alt={t("public_photos_alt", { number: activePhoto + 1, name: profile.name })}
                  className="w-full h-full object-cover"
                  onClick={() => setLightbox(photos[activePhoto])}
                />
              )}
              {photos.length > 1 && (
                <>
                  <div className="absolute top-2 inset-x-2 flex gap-1 z-10">
                    {photos.map((_, i) => (
                      <span key={i} className={`h-1 flex-1 rounded-full ${i === activePhoto ? "bg-white" : "bg-white/50"}`} />
                    ))}
                  </div>
                  <button
                    onClick={() => setActivePhoto((p) => (p + 1) % photos.length)}
                    className="absolute bottom-3 inset-x-3 flex items-center justify-center gap-1 text-white/90 text-xs font-medium"
                    aria-label="next photo"
                  >
                    {photos.map((_, i) => (
                      <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === activePhoto ? "bg-white" : "bg-white/40"}`} />
                    ))}
                  </button>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <Home className="w-10 h-10" />
            </div>
          )}
        </div>

        {/* Name + basics */}
        <div className="px-4 pt-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-extrabold text-gray-900">{profile.name}</h1>
            {typeof profile.age === "number" && profile.age > 0 && (
              <span className="text-lg font-semibold text-gray-500">{t("public_age_suffix", { age: profile.age })}</span>
            )}
            {profile.is_verified && (
              <span className="inline-flex items-center gap-1 bg-green-50 text-green-600 text-xs font-bold px-2 py-1 rounded-full border border-green-100">
                <ShieldCheck className="w-3.5 h-3.5" />
                {t("verified")}
              </span>
            )}
          </div>

          {profile.current_status && (
            <div className="mt-2 inline-flex items-center gap-1.5 bg-orange-50 text-[--theme-orange] text-xs font-bold px-3 py-1.5 rounded-full">
              <Home className="w-3.5 h-3.5" />
              {profile.current_status === "has_apartment" ? t("public_status_has") : t("public_status_seeking")}
            </div>
          )}
        </div>

        {/* About */}
        {profile.about_me && (
          <section className="px-4 mt-5">
            <h3 className="text-sm font-bold text-gray-500 mb-1.5">{t("public_about")}</h3>
            <p className="text-gray-800 text-[15px] leading-relaxed whitespace-pre-wrap">{profile.about_me}</p>
          </section>
        )}

        {/* Looking for */}
        {profile.looking_for_description && (
          <section className="px-4 mt-5">
            <h3 className="text-sm font-bold text-gray-500 mb-1.5">{t("public_looking_for")}</h3>
            <p className="text-gray-800 text-[15px] leading-relaxed whitespace-pre-wrap">{profile.looking_for_description}</p>
          </section>
        )}

        {/* Vibe */}
        {typeof profile.vibe_level === "number" && (
          <section className="px-4 mt-5">
            <h3 className="text-sm font-bold text-gray-500 mb-2">{t("public_vibe")}</h3>
            <div dir="ltr" className="relative">
              <div className="w-full h-2 bg-gray-200 rounded-full" />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-white shadow-md"
                style={{ left: `calc(${((profile.vibe_level - 1) / 4) * 100}% - 10px)`, backgroundColor: "var(--theme-orange)" }}
              />
            </div>
            <div dir="ltr" className="flex justify-between text-[10px] text-gray-400 mt-2 font-medium">
              <span>{t("vibe_lvl_quiet")}</span>
              <span>{t("vibe_balanced")}</span>
              <span>{t("vibe_lvl_lively")}</span>
            </div>
          </section>
        )}

        {/* Roommate preferences */}
        <section className="px-4 mt-5">
          <h3 className="text-sm font-bold text-gray-500 mb-2">{t("public_home_habits")}</h3>
          <div className="grid grid-cols-2 gap-2">
            {profile.religion && (
              <PrefChip label={t("onb_religion_label")} value={t(RELIGION_LABELS[profile.religion] || "not_specified")} />
            )}
            {profile.kosher_preference && (
              <PrefChip label={t("onb_kosher_label")} value={profile.kosher_preference === "for" ? t("pref_for") : profile.kosher_preference === "against" ? t("pref_against") : t("pref_flexible")} />
            )}
            {profile.shabbat_preference && (
              <PrefChip label={t("shabbat_observance")} value={profile.shabbat_preference === "for" ? t("pref_for") : profile.shabbat_preference === "against" ? t("pref_against") : t("pref_flexible")} />
            )}
            {profile.pet_type && profile.pet_type !== "none" && (
              <PrefChip label={t("onb_pet_label")} value={`${t(PET_LABELS[profile.pet_type] || "pet_other")}${profile.pet_other_description ? " — " + profile.pet_other_description : ""}`} />
            )}
          </div>
        </section>

        {/* Interests */}
        {interests.length > 0 && (
          <section className="px-4 mt-5">
            <h3 className="text-sm font-bold text-gray-500 mb-2">{t("public_interests")}</h3>
            <div className="flex flex-wrap gap-2">
              {interests.map((id) => {
                const opt = INTEREST_OPTIONS.find((o) => o.id === id);
                return (
                  <span key={id} className="px-3 py-1.5 rounded-full text-sm font-medium border border-gray-200 bg-white text-gray-700">
                    {opt ? t(opt.labelKey) : id}
                  </span>
                );
              })}
            </div>
          </section>
        )}

        {/* Apartment */}
        {profile.current_status === "has_apartment" && apartmentPhotos.length > 0 && (
          <section className="px-4 mt-5">
            <h3 className="text-sm font-bold text-gray-500 mb-2">{t("public_apartment_section")}</h3>
            <div className="grid grid-cols-2 gap-2">
              {apartmentPhotos.slice(0, 4).map((p, i) => (
                <button
                  key={i}
                  onClick={() => setLightbox(p)}
                  className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-100"
                >
                  {isVideo(p) ? (
                    <video src={p} className="w-full h-full object-cover" muted loop autoPlay playsInline />
                  ) : (
                    <img src={p} alt={t("public_apartment_alt", { number: i + 1 })} className="w-full h-full object-cover" />
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Budget + cities */}
        {(typeof profile.budget_max === "number" && profile.budget_max > 0 || cities.length > 0) && (
          <section className="px-4 mt-5 space-y-2">
            {typeof profile.budget_max === "number" && profile.budget_max > 0 && (
              <div className="flex items-center gap-2 text-gray-800">
                <span className="text-sm font-bold text-gray-500">{t("public_budget")}:</span>
                <span className="font-bold">₪{profile.budget_max.toLocaleString()} / {t("per_month_slash").replace("/", "").trim()}</span>
              </div>
            )}
            {cities.length > 0 && (
              <div className="flex items-start gap-2 text-gray-800">
                <MapPin className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" />
                <div>
                  <span className="text-sm font-bold text-gray-500">{t("public_cities")}:</span>{" "}
                  <span className="font-medium">{cities.join(" · ")}</span>
                </div>
              </div>
            )}
          </section>
        )}
      </div>

      {/* Sticky join CTA */}
      <div className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-gray-100" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-extrabold text-gray-900 text-sm">{t("public_join_cta_title")}</p>
            <p className="text-xs text-gray-500 truncate">{t("public_join_cta_subtitle")}</p>
          </div>
          <Link
            to={joinTo}
            className="shrink-0 flex items-center gap-2 px-5 h-12 rounded-full text-white font-bold text-sm shadow-lg shadow-blue-500/30"
            style={{ backgroundColor: "var(--theme-blue)" }}
          >
            <Star className="w-4 h-4" />
            {t("public_join_button")}
          </Link>
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-[100] flex items-center justify-center"
            onClick={() => setLightbox(null)}
          >
            <button onClick={() => setLightbox(null)} aria-label={t("close")} className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center bg-white/20 rounded-full">
              <X className="w-6 h-6 text-white" />
            </button>
            {isVideo(lightbox) ? (
              <video src={lightbox} className="max-w-full max-h-full object-contain" controls autoPlay loop />
            ) : (
              <img src={lightbox} className="max-w-full max-h-full object-contain" alt="" />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}