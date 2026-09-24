import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import SectionHeader from "./SectionHeader";
import { SUCCESS_STORIES } from "./ourStoryData";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
};

const cardVar = (i) => ({
  hidden: { opacity: 0, y: 56, x: i % 2 === 0 ? -32 : 32, scale: 0.9, rotate: i % 2 === 0 ? -2.5 : 2.5 },
  show: {
    opacity: 1,
    y: 0,
    x: 0,
    scale: 1,
    rotate: 0,
    transition: { type: "spring", stiffness: 130, damping: 15, mass: 0.7 },
  },
});

export default function SuccessStories() {
  const { t } = useTranslation();
  return (
    <section>
      <SectionHeader title={t("our_story_success_title")} subtitle={t("our_story_success_subtitle")} />
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
        className="space-y-3"
      >
        {SUCCESS_STORIES.map((s, i) => (
          <motion.figure
            key={s.id}
            variants={cardVar(i)}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden transition-shadow hover:shadow-md"
          >
            <div className="absolute top-0 inset-x-0 h-1 gradient-orange opacity-80" />
            <Quote className="w-16 h-16 text-orange-200 dark:text-orange-500/20 absolute -top-2 -end-2 rotate-180" aria-hidden="true" />
            <div className="flex items-center gap-3 mb-3 relative">
              <div className="w-11 h-11 rounded-full gradient-orange text-white flex items-center justify-center text-base font-bold flex-shrink-0">
                {t(s.nameKey).charAt(0)}
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white text-sm">{t(s.nameKey)}</p>
                <p className="text-xs text-gray-400">{t(s.cityKey)}</p>
              </div>
            </div>
            <blockquote className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed relative">
              “{t(s.quoteKey)}”
            </blockquote>
          </motion.figure>
        ))}
      </motion.div>
    </section>
  );
}