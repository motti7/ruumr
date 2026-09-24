import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import FoundersPanel from "@/components/ourstory/FoundersPanel";
import SuccessStories from "@/components/ourstory/SuccessStories";
import Partners from "@/components/ourstory/Partners";
import RoommateChecklist from "@/components/ourstory/RoommateChecklist";
import TeamAndSocial from "@/components/ourstory/TeamAndSocial";

export default function OurStory() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <div className="px-4 py-4 space-y-9 pb-10">
      <FoundersPanel />
      <Partners />
      <SuccessStories />
      <RoommateChecklist />
      <TeamAndSocial />
      <motion.button
        onClick={() => navigate(createPageUrl("Discover"))}
        whileTap={{ scale: 0.97 }}
        className="w-full py-4 rounded-full text-white font-bold text-base shadow-lg" style={{ backgroundColor: "var(--theme-blue)" }}
      >
        {t("our_story_cta_button")}
      </motion.button>
    </div>
  );
}