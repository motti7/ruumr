import React from "react";
import { useTranslation } from "react-i18next";
import { Newspaper, Trophy, Rocket, Youtube, ExternalLink } from "lucide-react";
import Reveal from "./Reveal";
import SectionHeader from "./SectionHeader";
import { TRUST_ITEMS } from "./ourStoryData";

const ICONS = { press: Newspaper, award: Trophy, accelerator: Rocket, tv: Youtube };

export default function TrustSignals() {
  const { t } = useTranslation();
  return (
    <section>
      <SectionHeader title={t("our_story_trust_title")} subtitle={t("our_story_trust_subtitle")} />
      <div className="grid grid-cols-2 gap-3">
        {TRUST_ITEMS.map((it, i) => {
          const Icon = ICONS[it.type] || Trophy;
          const isTv = it.type === "tv";
          return (
            <Reveal key={it.id} delay={i * 0.07}>
              <a
                href={it.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center text-center gap-2 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 h-full active:scale-[0.98] transition-transform"
              >
                <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-[--theme-orange]" />
                </div>
                <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{t(it.labelKey)}</p>
                <p className="text-[11px] text-gray-400">{t(it.sourceKey)}</p>
                {isTv ? (
                  <span className="text-[11px] text-[--theme-orange] font-semibold">{t("our_story_tv_cta")}</span>
                ) : (
                  <ExternalLink className="w-3.5 h-3.5 text-gray-300" />
                )}
              </a>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}