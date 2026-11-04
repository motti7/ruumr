import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Lock, Sparkles } from "lucide-react";

// Signed-out state for the Discover feed.
//
// The whole app is behind sign-in: a guest sees the roommate feed only as a
// blurred, generic placeholder (never real profile data in the DOM) and the
// only actions are sign-in / create account.
export default function LockedFeedPreview() {
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

      {/* Locked overlay + the only available actions */}
      <div className="absolute inset-0 m-3 rounded-3xl flex flex-col items-center justify-center text-center px-8 bg-black/10">
        <div className="w-16 h-16 rounded-full bg-white/95 shadow-xl flex items-center justify-center mb-5">
          <Lock className="w-8 h-8 text-[--theme-orange]" />
        </div>
        <h2 className="text-2xl font-bold text-white drop-shadow mb-2">
          {t("login_gate_title")}
        </h2>
        <p className="text-white/90 drop-shadow mb-7 max-w-xs leading-relaxed">
          {t("login_gate_desc")}
        </p>
        <Link
          to="/login?next=Partner"
          aria-label={t("login_gate_sign_in")}
          className="gradient-orange text-white font-bold py-3 px-10 rounded-full shadow-lg hover:scale-105 transition-transform inline-flex items-center min-h-[44px]"
        >
          <Sparkles className="w-5 h-5 ml-2" />
          {t("login_gate_sign_in")}
        </Link>
        <Link
          to="/register?next=Partner"
          className="mt-4 inline-flex items-center justify-center min-h-[44px] text-sm font-bold text-white underline drop-shadow"
        >
          {t("login_gate_register")}
        </Link>
      </div>
    </div>
  );
}