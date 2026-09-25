import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion, useScroll, useTransform } from "framer-motion";
import { Quote, MapPin, Heart } from "lucide-react";
import SectionHeader from "./SectionHeader";
import { SUCCESS_STORIES } from "./ourStoryData";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
};

const cardVar = (i) => ({
  hidden: { opacity: 0, y: 56, x: i % 2 === 0 ? -36 : 36, scale: 0.9, rotate: i % 2 === 0 ? -2 : 2 },
  show: {
    opacity: 1,
    y: 0,
    x: 0,
    scale: 1,
    rotate: 0,
    transition: { type: "spring", stiffness: 120, damping: 14, mass: 0.7 },
  },
});

function SuccessCard({ story, index }) {
  const { t } = useTranslation();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const drift = useTransform(scrollYProgress, [0, 1], [22, -22]);

  return (
    <motion.figure
      ref={ref}
      variants={cardVar(index)}
      whileHover={{ y: -8, transition: { duration: 0.25 } }}
      className="relative bg-gradient-to-br from-white to-blue-50/50 dark:from-gray-800 dark:to-gray-800/60 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-shadow hover:shadow-xl"
    >
      <div className="absolute top-0 inset-x-0 h-1.5 rounded-b-full opacity-90" style={{ background: "linear-gradient(135deg, var(--theme-blue), #4f7df0)" }} />
      <Quote className="w-20 h-20 text-blue-100/70 dark:text-blue-500/10 absolute -top-3 -end-3 rotate-180" aria-hidden="true" />
      <motion.div style={{ y: drift }} className="relative">
        <div className="flex items-center gap-3 mb-3">
          {story.photoUrl ? (
            <img
              src={story.photoUrl}
              alt={t(story.nameKey)}
              className="w-12 h-12 rounded-full object-cover flex-shrink-0 ring-2 ring-blue-100 dark:ring-blue-500/20 shadow-sm"
              loading="lazy"
            />
          ) : (
            <div className="w-12 h-12 rounded-full text-white flex items-center justify-center text-lg font-bold flex-shrink-0 ring-2 ring-blue-100 dark:ring-blue-500/20 shadow-sm" style={{ backgroundColor: "var(--theme-blue)" }}>
              {t(story.nameKey).charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{t(story.nameKey)}</p>
            <p className="flex items-center gap-1 text-xs text-gray-400">
              <MapPin className="w-3 h-3" />
              {t(story.cityKey)}
            </p>
          </div>
          <Heart className="w-4 h-4 ms-auto" fill="currentColor" style={{ color: "var(--theme-blue)" }} />
        </div>
        <blockquote className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed bg-white/60 dark:bg-gray-900/30 rounded-xl p-3">
          “{t(story.quoteKey)}”
        </blockquote>
      </motion.div>
    </motion.figure>
  );
}

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
        className="space-y-4"
      >
        {SUCCESS_STORIES.map((s, i) => (
          <SuccessCard key={s.id} story={s} index={i} />
        ))}
      </motion.div>
    </section>
  );
}