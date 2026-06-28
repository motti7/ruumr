import React from "react";
import { useTranslation } from "react-i18next";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

// Locked Discover state for authenticated users who have not created a Profile.
//
// The card behind the overlay uses ONLY static, generic placeholder content —
// never a real user's data — so nothing identifiable is ever delivered to a
// not-yet-registered client (a CSS blur would still ship real data in the DOM).
// Swiping is impossible here; the single action is "complete profile".
export default function LockedProfilePreview({ onComplete }) {
  const { t, i18n } = useTranslation();
  const placeholderBlurb = [t("placeholder_blurb_1"), t("placeholder_blurb_2")];
  return (
    <div className="absolute inset-0" dir={i18n.dir()}>
      {/* Blurred, non-interactive placeholder card (no real data) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 m-3 rounded-3xl overflow-hidden select-none"
        style={{ filter: "blur(12px)", pointerEvents: "none" }}
      >
        <div className="w-full h-full bg-gradient-to-br from-orange-200 via-rose-200 to-amber-100" />
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/50 to-transparent text-white text-right">
          <div className="text-3xl font-bold">{t("placeholder_name_age")}</div>
          <div className="mt-1 text-lg">{t("placeholder_location")}</div>
          {placeholderBlurb.map((line, i) => (
            <div key={i} className="mt-1 text-sm opacity-90">{line}</div>
          ))}
        </div>
      </div>

      {/* Locked overlay + the only available action */}
      <div className="absolute inset-0 m-3 rounded-3xl flex flex-col items-center justify-center text-center px-8 bg-black/10">
        <div className="w-16 h-16 rounded-full bg-white/95 shadow-xl flex items-center justify-center mb-5">
          <Lock className="w-8 h-8 text-[--theme-orange]" />
        </div>
        <h2 className="text-2xl font-bold text-white drop-shadow mb-2">
          {t("complete_profile_to_start")}
        </h2>
        <p className="text-white/90 drop-shadow mb-7 max-w-xs leading-relaxed">
          {t("complete_profile_desc")}
        </p>
        <Button
          onClick={onComplete}
          aria-label={t("complete_profile")}
          className="gradient-orange text-white font-bold py-3 px-10 rounded-full shadow-lg hover:scale-105 transition-transform"
        >
          <Sparkles className="w-5 h-5 ml-2" />
          {t("complete_profile")}
        </Button>
      </div>
    </div>
  );
}
