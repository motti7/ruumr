import React from "react";
import { useTranslation } from "react-i18next";
import { Instagram, Music2, Youtube, Heart } from "lucide-react";
import Reveal from "./Reveal";
import SectionHeader from "./SectionHeader";

// TODO: replace with the official Ruumr social links + TV feature YouTube URL.
const SOCIALS = [
  { key: "instagram", url: "https://www.instagram.com/ruumr.app", Icon: Instagram, label: "Instagram" },
  { key: "tiktok", url: "https://www.tiktok.com/@ruumr", Icon: Music2, label: "TikTok" },
];
const TV_URL = "https://www.youtube.com/";

export default function TeamAndSocial() {
  const { t } = useTranslation();
  return (
    <section className="space-y-5">
      <Reveal>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
          <div className="flex items-center justify-center gap-1 mb-4">
            <span className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-200 to-orange-400 shadow-sm" />
            <span className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-300 to-orange-500 shadow-sm -ms-3" />
            <span className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-200 to-orange-400 shadow-sm -ms-3" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Heart className="w-5 h-5 text-[--theme-orange]" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t("our_story_team_title")}</h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{t("our_story_team_text")}</p>
        </div>
      </Reveal>

      <SectionHeader title={t("our_story_social_title")} />

      <Reveal delay={0.1}>
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
          <a
            href={TV_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-black text-white rounded-full px-4 py-2.5 shadow-sm active:scale-95 transition-transform"
          >
            <Youtube className="w-5 h-5 text-[--theme-orange]" />
            <span className="text-sm font-semibold">{t("our_story_tv_cta")}</span>
          </a>
        </div>
      </Reveal>
    </section>
  );
}