import React from "react";
import { useTranslation } from "react-i18next";
import { Instagram, Music2, Heart } from "lucide-react";

// TODO: replace with the official Ruumr social links.
const SOCIALS = [
  { key: "instagram", url: "https://www.instagram.com/ruumr.app", Icon: Instagram, label: "Instagram" },
  { key: "tiktok", url: "https://www.tiktok.com/@ruumr", Icon: Music2, label: "TikTok" },
];

export default function TeamAndSocial() {
  const { t } = useTranslation();
  return (
    <section className="space-y-5">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <Heart className="w-5 h-5 text-[--theme-orange]" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t("our_story_team_title")}</h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{t("our_story_team_text")}</p>
      </div>
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">{t("our_story_social_title")}</h2>
        <div className="flex flex-wrap gap-3">
          {SOCIALS.map(({ key, url, Icon, label }) => (
            <a
              key={key}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-full px-4 py-2.5 shadow-sm active:scale-95 transition-transform"
            >
              <Icon className="w-5 h-5 text-[--theme-orange]" />
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{label}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}