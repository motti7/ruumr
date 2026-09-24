import React from "react";
import { useTranslation } from "react-i18next";
import { Instagram, Music2, Facebook } from "lucide-react";
import Reveal from "./Reveal";
import SectionHeader from "./SectionHeader";

const SOCIALS = [
  { key: "instagram", url: "https://www.instagram.com/ruumrapp/", Icon: Instagram, label: "Instagram" },
  { key: "tiktok", url: "https://www.tiktok.com/@ruumrapp?_r=1&_t=ZS-9A0Jg8cREkT", Icon: Music2, label: "TikTok" },
  { key: "facebook", url: "https://www.facebook.com/share/19GE6VEZVT/", Icon: Facebook, label: "Facebook" },
];

export default function TeamAndSocial() {
  const { t } = useTranslation();
  return (
    <section className="space-y-5">
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
        </div>
      </Reveal>
    </section>
  );
}