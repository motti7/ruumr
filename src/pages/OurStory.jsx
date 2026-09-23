import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import StoryHero from "@/components/ourstory/StoryHero";
import ProblemSolution from "@/components/ourstory/ProblemSolution";
import SuccessStories from "@/components/ourstory/SuccessStories";
import TrustSignals from "@/components/ourstory/TrustSignals";
import RoommateChecklist from "@/components/ourstory/RoommateChecklist";
import TeamAndSocial from "@/components/ourstory/TeamAndSocial";

export default function OurStory() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <div className="px-4 py-4 space-y-9 pb-10">
      <StoryHero />
      <ProblemSolution />
      <SuccessStories />
      <TrustSignals />
      <RoommateChecklist />
      <TeamAndSocial />
      <motion.button
        onClick={() => navigate(createPageUrl("Discover"))}
        whileTap={{ scale: 0.97 }}
        className="w-full py-4 rounded-full gradient-orange text-white font-bold text-base shadow-lg"
      >
        {t("our_story_cta_button")}
      </motion.button>
    </div>
  );
}