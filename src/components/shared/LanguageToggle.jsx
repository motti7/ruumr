import React from "react";
import { useTranslation } from "react-i18next";

// Compact header control that flips the app between Hebrew and English.
// The label shows the language the user will switch *to*, matching the common
// pattern for language toggles. Direction (RTL/LTR) is handled centrally in
// App.jsx via the i18next `languageChanged` event.
export default function LanguageToggle({ className = "" }) {
  const { i18n, t } = useTranslation();
  const isHebrew = i18n.language === "he";
  const nextLang = isHebrew ? "en" : "he";

  const handleToggle = () => {
    i18n.changeLanguage(nextLang);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={t("language_toggle_aria")}
      className={`header-glow select-none flex items-center justify-center touch-manipulation min-w-[44px] min-h-[44px] text-sm font-bold text-gray-400 dark:text-gray-500 ${className}`}
    >
      {isHebrew ? "EN" : "עב"}
    </button>
  );
}
