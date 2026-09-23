import React from "react";
import { useTranslation } from "react-i18next";
import { Quote } from "lucide-react";
import Reveal from "./Reveal";
import SectionHeader from "./SectionHeader";
import { SUCCESS_STORIES } from "./ourStoryData";

export default function SuccessStories() {
  const { t } = useTranslation();
  return (
    <section>
      <SectionHeader title={t("our_story_success_title")} subtitle={t("our_story_success_subtitle")} />
      <div className="space-y-3">
        {SUCCESS_STORIES.map((s, i) => (
          <Reveal key={s.id} delay={i * 0.08}>
            <figure className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
              <Quote className="w-16 h-16 text-orange-200 dark:text-orange-500/20 absolute -top-2 -end-2 rotate-180" aria-hidden="true" />
              <div className="flex items-center gap-3 mb-3 relative">
                <div className="w-11 h-11 rounded-full gradient-orange text-white flex items-center justify-center text-base font-bold flex-shrink-0">
                  {t(s.nameKey).charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-sm">{t(s.nameKey)}</p>
                  <p className="text-xs text-gray-400">{t(s.cityKey)}</p>
                </div>
              </div>
              <blockquote className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed relative">
                “{t(s.quoteKey)}”
              </blockquote>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}