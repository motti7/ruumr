import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import Reveal from "./Reveal";
import SectionHeader from "./SectionHeader";
import { CHECKLIST_POINTS } from "./ourStoryData";

const JOSS_IMAGE =
  "https://media.base44.com/images/public/68c919adff6ac6fafb51bed6/ca96a4387_357897a1-0224-4a00-bb12-9c2f9bb7c685.jpg";

export default function RoommateChecklist() {
  const { t } = useTranslation();
  return (
    <section>
      <SectionHeader title={t("our_story_checklist_title")} subtitle={t("our_story_checklist_subtitle")} />

      {/* Joss introduces his tips — mascot + speech bubble */}
      <Reveal>
        <div className="flex items-end gap-3 mb-4">
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            className="relative flex-shrink-0 w-[84px] h-[84px]"
          >
            <div className="w-full h-full rounded-2xl overflow-hidden shadow-md ring-2 ring-orange-200 bg-orange-50">
              <img src={JOSS_IMAGE} alt={t("our_story_checklist_joss_name")} className="w-full h-full object-cover" loading="lazy" />
            </div>
            <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-white text-[10px] font-extrabold text-[--theme-orange] px-2 py-0.5 rounded-full shadow-sm border border-orange-100 whitespace-nowrap">
              {t("our_story_checklist_joss_name")}
            </span>
          </motion.div>

          <div className="relative flex-1 bg-white dark:bg-gray-800 rounded-2xl rounded-br-sm p-3.5 shadow-sm border border-gray-100 dark:border-gray-700">
            <span className="absolute -bottom-2 right-3 w-3.5 h-3.5 bg-white dark:bg-gray-800 border-b border-r border-gray-100 dark:border-gray-700 rotate-45" />
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-relaxed">
              {t("our_story_checklist_joss_intro")}
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