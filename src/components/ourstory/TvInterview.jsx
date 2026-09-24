import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Tv } from "lucide-react";
import Reveal from "./Reveal";
import SectionHeader from "./SectionHeader";

const VIDEO_ID = "MoWpnl560qY";

export default function TvInterview() {
  const { t } = useTranslation();
  return (
    <section className="space-y-5">
      <SectionHeader title={t("our_story_tv_title")} subtitle={t("our_story_tv_subtitle")} />
      <Reveal delay={0.1}>
        <motion.a
          href={`https://www.youtube.com/watch?v=${VIDEO_ID}`}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.01 }}
          className="block rounded-3xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800"
        >
          <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube.com/embed/${VIDEO_ID}`}
              title={t("our_story_tv_title")}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="flex items-center gap-2 px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
            <Tv className="w-4 h-4" style={{ color: "var(--theme-orange)" }} />
            {t("our_story_tv_caption")}
          </div>
        </motion.a>
      </Reveal>
    </section>
  );
}