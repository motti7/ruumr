import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

export default function StoryHero() {
  const { t } = useTranslation();
  return (
    <section className="relative overflow-hidden rounded-[28px] gradient-orange text-white px-6 pt-9 pb-11 shadow-xl">
      <motion.div
        className="absolute -top-16 -end-12 w-52 h-52 bg-white/10 rounded-full blur-md"
        animate={{ scale: [1, 1.18, 1], opacity: [0.45, 0.7, 0.45] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden="true"
      />
      <motion.div
        className="absolute -bottom-24 -start-14 w-48 h-48 bg-white/10 rounded-full blur-md"
        animate={{ scale: [1, 1.22, 1], opacity: [0.35, 0.6, 0.35] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        aria-hidden="true"
      />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative text-center"
      >
        <span className="inline-block text-[11px] font-bold tracking-wider uppercase bg-white/20 rounded-full px-3 py-1 mb-3">
          {t("our_story_badge")}
        </span>
        <h1 className="logo-font text-5xl leading-none mb-3">ruumr</h1>
        <p className="text-white font-extrabold text-lg leading-snug mb-1.5">{t("our_story_hero_title")}</p>
        <p className="text-white/90 text-[15px] leading-relaxed max-w-xs mx-auto">{t("our_story_hero_tagline")}</p>
      </motion.div>
    </section>
  );
}