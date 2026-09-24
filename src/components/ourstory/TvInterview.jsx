import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Play, Tv } from "lucide-react";
import Reveal from "./Reveal";
import SectionHeader from "./SectionHeader";

const VIDEO_ID = "MoWpnl560qY";
const WATCH_URL = `https://www.youtube.com/watch?v=${VIDEO_ID}`;
const THUMBNAIL = `https://img.youtube.com/vi/${VIDEO_ID}/hqdefault.jpg`;

export default function TvInterview() {
  const { t } = useTranslation();
  const [imgError, setImgError] = useState(false);
  return (
    <section className="space-y-5">
      <SectionHeader title={t("our_story_tv_title")} subtitle={t("our_story_tv_subtitle")} />
      <Reveal delay={0.1}>
        <motion.a
          href={WATCH_URL}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.01 }}
          className="block rounded-3xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800"
        >
          <div className="relative w-full bg-black" style={{ paddingTop: "56.25%" }}>
            {!imgError ? (
              <img
                src={THUMBNAIL}
                alt={t("our_story_tv_title")}
                loading="lazy"
                onError={() => setImgError(true)}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-black" />
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <span className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-xl ring-4 ring-white/30">
                <Play className="w-7 h-7 text-white ms-1" fill="white" />
              </span>
            </div>
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