import React from "react";
import { useTranslation } from "react-i18next";
import { Frown, Lightbulb } from "lucide-react";

export default function ProblemSolution() {
  const { t } = useTranslation();
  return (
    <section className="grid grid-cols-1 gap-3">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <Frown className="w-5 h-5 text-[--theme-orange]" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t("our_story_problem_title")}</h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{t("our_story_problem_text")}</p>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="w-5 h-5 text-[--theme-orange]" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t("our_story_solution_title")}</h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{t("our_story_solution_text")}</p>
      </div>
    </section>
  );
}