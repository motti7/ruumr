import React from "react";
import { useTranslation } from "react-i18next";
import { Frown, Lightbulb } from "lucide-react";
import Reveal from "./Reveal";

const CARDS = [
  { icon: Frown, titleKey: "our_story_problem_title", textKey: "our_story_problem_text", tone: "from-rose-100 to-orange-50", iconColor: "text-rose-500" },
  { icon: Lightbulb, titleKey: "our_story_solution_title", textKey: "our_story_solution_text", tone: "from-orange-100 to-amber-50", iconColor: "text-[--theme-orange]" },
];

export default function ProblemSolution() {
  const { t } = useTranslation();
  return (
    <section className="grid grid-cols-1 gap-3">
      {CARDS.map((c, i) => {
        const Icon = c.icon;
        return (
          <Reveal key={c.titleKey} delay={i * 0.1}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 h-full">
              <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${c.tone} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${c.iconColor}`} />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{t(c.titleKey)}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{t(c.textKey)}</p>
            </div>
          </Reveal>
        );
      })}
    </section>
  );
}