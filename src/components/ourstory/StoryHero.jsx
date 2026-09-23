import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

export default function StoryHero() {
  const { t } = useTranslation();
  return (
    <section className="relative overflow-hidden rounded-3xl gradient-orange text-white px-6 py-9 shadow-lg">
      <div className="absolute -top-12 -end-10 w-40 h-40 bg-white/10 rounded-full" aria-hidden="true" />
      <div className="absolute -bottom-14 -start-8 w-32 h-32 bg-white/10 rounded-full" aria-hidden="true" />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative"
      >
        <span className="inline-block text-[11px] font-bold tracking-wider uppercase bg-white/20 rounded-full px-3 py-1 mb-3">
          {t("our_story_badge")}
        </span>
        <h1 className="text-3xl font-extrabold leading-tight mb-2">{t("our_story_hero_title")}</h1>
        <p className="text-white/90 text-[15px] leading-relaxed">{t("our_story_hero_tagline")}</p>
      </motion.div>
    </section>
  );
}