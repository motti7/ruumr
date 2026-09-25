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
        <div className="relative overflow-hidden rounded-3xl mb-5 bg-gradient-to-br from-orange-50 via-orange-50/40 to-transparent dark:from-orange-500/10 dark:via-transparent dark:to-transparent p-4 pb-5">
          {/* soft decorative glow bleeding into the section */}
          <div className="absolute -top-10 -left-6 w-32 h-32 rounded-full bg-orange-200/40 dark:bg-orange-400/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-8 w-28 h-28 rounded-full bg-orange-100/50 dark:bg-orange-400/5 blur-2xl pointer-events-none" />

          <div className="relative flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="w-8 h-1.5 rounded-full bg-[--theme-orange] mb-2" />
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-white leading-tight">
                {t("our_story_checklist_title")}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {t("our_story_checklist_subtitle")}
              </p>
            </div>

            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
              className="relative flex-shrink-0 w-24 h-24"
            >
              {/* soft halo behind Joss */}
              <div className="absolute -inset-3 rounded-full bg-orange-200/50 dark:bg-orange-400/10 blur-2xl pointer-events-none" />
              <img
                src={JOSS_IMAGE}
                alt="Joss"
                className="relative w-full h-full rounded-3xl object-cover shadow-lg"
                loading="lazy"
              />
              {/* grounded shadow */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-16 h-2 rounded-full bg-orange-300/40 dark:bg-black/20 blur-md pointer-events-none" />
            </motion.div>
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