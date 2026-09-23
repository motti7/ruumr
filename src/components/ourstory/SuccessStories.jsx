import React from "react";
import { useTranslation } from "react-i18next";
import { Quote } from "lucide-react";

const STORIES = [
  { key: "1", nameKey: "our_story_success_1_name", quoteKey: "our_story_success_1_quote", cityKey: "our_story_success_1_city" },
  { key: "2", nameKey: "our_story_success_2_name", quoteKey: "our_story_success_2_quote", cityKey: "our_story_success_2_city" },
  { key: "3", nameKey: "our_story_success_3_name", quoteKey: "our_story_success_3_quote", cityKey: "our_story_success_3_city" },
];

export default function SuccessStories() {
  const { t } = useTranslation();
  return (
    <section>
      <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mb-1">{t("our_story_success_title")}</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t("our_story_success_subtitle")}</p>
      <div className="space-y-3">
        {STORIES.map((s) => (
          <figure key={s.key} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 relative">
            <Quote className="w-6 h-6 text-[--theme-orange]/30 absolute top-4 end-4" aria-hidden="true" />
            <blockquote className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed pe-8">
              “{t(s.quoteKey)}”
            </blockquote>
            <figcaption className="mt-3 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full gradient-orange text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                {t(s.nameKey).charAt(0)}
              </span>
              <div className="text-xs">
                <p className="font-bold text-gray-900 dark:text-white">{t(s.nameKey)}</p>
                <p className="text-gray-400">{t(s.cityKey)}</p>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}