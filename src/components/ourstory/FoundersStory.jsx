import React from "react";
import { useTranslation } from "react-i18next";
import { Frown, Lightbulb } from "lucide-react";
import Reveal from "./Reveal";

export default function FoundersStory() {
  const { t } = useTranslation();
  return (
    <Reveal y={24}>
      <section className="relative overflow-hidden rounded-[28px] bg-[--theme-blue] text-white p-6 shadow-xl">
        {/* decorative orange circles */}
        <div className="absolute -top-16 -end-12 w-48 h-48 rounded-full bg-[--theme-orange] opacity-20 blur-md" aria-hidden="true" />
        <div className="absolute -bottom-20 -start-14 w-44 h-44 rounded-full bg-[--theme-orange] opacity-15 blur-md" aria-hidden="true" />
        <div className="absolute top-1/3 -start-10 w-24 h-24 rounded-full bg-[--theme-orange] opacity-10 blur-sm" aria-hidden="true" />

        <div className="relative">
          <span className="inline-block text-[11px] font-bold tracking-wider uppercase bg-white/20 rounded-full px-3 py-1 mb-3">
            {t("our_story_origin_eyebrow")}
          </span>
          <h2 className="text-2xl font-extrabold leading-tight mb-2">{t("our_story_origin_title")}</h2>
          <p className="text-white/90 text-[15px] leading-relaxed mb-5">{t("our_story_origin_text")}</p>

          {/* problem — orange circle icon, inline (no separate card) */}
          <div className="flex items-start gap-3 mb-4">
            <div className="w-11 h-11 rounded-full bg-[--theme-orange] flex items-center justify-center flex-shrink-0 shadow-md">
              <Frown className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white mb-0.5">{t("our_story_problem_title")}</h3>
              <p className="text-sm text-white/85 leading-relaxed">{t("our_story_problem_text")}</p>
            </div>
          </div>

          {/* solution — orange circle icon, inline */}
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-full bg-[--theme-orange] flex items-center justify-center flex-shrink-0 shadow-md">
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white mb-0.5">{t("our_story_solution_title")}</h3>
              <p className="text-sm text-white/85 leading-relaxed">{t("our_story_solution_text")}</p>
            </div>
          </div>
        </div>
      </section>
    </Reveal>
  );
}