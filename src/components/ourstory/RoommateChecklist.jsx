import React from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2 } from "lucide-react";

const POINTS = ["1", "2", "3", "4", "5"];

export default function RoommateChecklist() {
  const { t } = useTranslation();
  return (
    <section>
      <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mb-1">{t("our_story_checklist_title")}</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t("our_story_checklist_subtitle")}</p>
      <ul className="space-y-2.5">
        {POINTS.map((n) => (
          <li key={n} className="flex items-start gap-3 bg-white dark:bg-gray-800 rounded-2xl p-3.5 shadow-sm border border-gray-100 dark:border-gray-700">
            <CheckCircle2 className="w-5 h-5 text-[--theme-orange] flex-shrink-0 mt-0.5" />
            <span className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{t(`our_story_checklist_${n}`)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}