import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import Reveal from "./Reveal";
import { CHECKLIST_POINTS } from "./ourStoryData";

const JOSS_IMAGE =
  "https://media.base44.com/images/public/68c919adff6ac6fafb51bed6/ca96a4387_357897a1-0224-4a00-bb12-9c2f9bb7c685.jpg";

export default function RoommateChecklist() {
  const { t } = useTranslation();
  return (
    <section>
      <Reveal>
        <div className="flex items-center gap-3 mb-4">
          <motion.img
            src={JOSS_IMAGE}
            alt="Joss"
            className="flex-shrink-0 w-16 h-16 rounded-2xl object-cover shadow-sm ring-2 ring-orange-200"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            loading="lazy"
          />
          <div>
            <div className="w-8 h-1.5 rounded-full bg-[--theme-orange] mb-2" />
            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white leading-tight">
              {t("our_story_checklist_title")}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {t("our_story_checklist_subtitle")}
            </p>
          </div>
        </div>
      </Reveal>

      <ul className="space-y-2.5">
        {CHECKLIST_POINTS.map((n, i) => (
          <Reveal key={n} delay={i * 0.06}>
            <li className="flex items-start gap-3 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
              <span className="w-7 h-7 rounded-full gradient-orange text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                {i + 1}
              </span>
              <span className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed pt-0.5">
                {t(`our_story_checklist_${n}`)}
              </span>
            </li>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}