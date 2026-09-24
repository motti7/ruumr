import React from "react";
import { useTranslation } from "react-i18next";
import Reveal from "./Reveal";
import SectionHeader from "./SectionHeader";
import { CHECKLIST_POINTS } from "./ourStoryData";

export default function RoommateChecklist() {
  const { t } = useTranslation();
  return (
    <section>
      <SectionHeader title={t("our_story_checklist_title")} subtitle={t("our_story_checklist_subtitle")} />
      <ul className="space-y-2.5">
        {CHECKLIST_POINTS.map((n, i) => (
          <Reveal key={n} delay={i * 0.06}>
            <li className="flex items-start gap-3 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
              <span className="w-7 h-7 rounded-full gradient-orange text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                {i + 1}
              </span>
              <span className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed pt-0.5">{t(`our_story_checklist_${n}`)}</span>
            </li>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}