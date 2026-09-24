import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

// Quality lifestyle background image (generated). Replace URL with a brand photo if desired.
const HERO_IMAGE = "https://media.base44.com/images/public/68c919adff6ac6fafb51bed6/dacba61d9_generated_image.png";

export default function StoryHero() {
  const { t } = useTranslation();
  return (
    <section className="relative overflow-hidden rounded-[28px] shadow-xl h-[340px]">
      <motion.img
        src={HERO_IMAGE}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover"
        initial={{ scale: 1.12 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.4, ease: "easeOut" }}
      />
      {/* scrims for legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
      <div className="absolute inset-0 bg-gradient-to-br from-[--theme-orange]/30 to-transparent" />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        className="relative h-full flex flex-col justify-end p-6 pb-7 text-white"
      >
        <span className="self-start inline-block text-[11px] font-bold tracking-wider uppercase bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 mb-3">
          {t("our_story_badge")}
        </span>
        <p className="logo-font text-3xl leading-none mb-2 opacity-90">ruumr</p>
        <h1 className="text-[28px] font-extrabold leading-tight mb-2">{t("our_story_hero_title")}</h1>
        <p className="text-white/90 text-[15px] leading-relaxed max-w-xs">{t("our_story_hero_tagline")}</p>
      </motion.div>
    </section>
  );
}