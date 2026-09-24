import React from "react";
import { useTranslation } from "react-i18next";
import { Frown, Lightbulb } from "lucide-react";
import Reveal from "./Reveal";

export default function FoundersStory() {
  const { t } = useTranslation();
  return (
    <Reveal y={24}>
      <section className="relative overflow-hidden rounded-[28px] bg-[--theme-blue] text-white p-6 shadow-xl">
        <div className="absolute -top-16 -end-12 w-48 h-48 bg-white/10 rounded-full blur-md" aria-hidden="true" />
        <div className="absolute -bottom-20 -start-14 w-44 h-44 bg-white/10 rounded-full blur-md" aria-hidden="true" />
        <div className="relative">
          <span className="inline-block text-[11px] font-bold tracking-wider uppercase bg-white/20 rounded-full px-3 py-1 mb-3">
            {t("our_story_origin_eyebrow")}
          </span>
          <h2 className="text-2xl font-extrabold leading-tight mb-2">{t("our_story_origin_title")}</h2>
          <p className="text-white/90 text-[15px] leading-relaxed mb-4">{t("our_story_origin_text")}</p>

          <div className="grid grid-cols-1 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Frown className="w-5 h-5 text-white" />
                <h3 className="font-bold text-white">{t("our_story_problem_title")}</h3>
              </div>
              <p className="text-sm text-white/85 leading-relaxed">{t("our_story_problem_text")}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Lightbulb className="w-5 h-5 text-white" />
                <h3 className="font-bold text-white">{t("our_story_solution_title")}</h3>
              </div>
              <p className="text-sm text-white/85 leading-relaxed">{t("our_story_solution_text")}</p>
            </div>
          </div>
        </div>
      </section>
    </Reveal>
  );
}