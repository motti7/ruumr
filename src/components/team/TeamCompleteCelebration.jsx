import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { PartyPopper, ArrowRight } from "lucide-react";

const CONFETTI_COLORS = ["#FA3803", "#FF7A45", "#FFC93C", "#22C55E", "#ffffff"];

function initials(name = "") {
  return String(name).trim().slice(0, 1).toUpperCase() || "?";
}

/**
 * Dramatic full-screen celebration shown when the roommate team is completed.
 * Fires layered confetti, animates in the team's avatars, and offers a single
 * CTA that moves the flow forward (to apartment search).
 */
export default function TeamCompleteCelebration({ members = [], onContinue }) {
  const { t } = useTranslation();

  useEffect(() => {
    const colors = CONFETTI_COLORS;
    // One big central burst...
    confetti({ particleCount: 180, spread: 110, startVelocity: 45, origin: { y: 0.35 }, colors, scalar: 1.1 });
    // ...then a couple of seconds of side cannons for drama.
    const end = Date.now() + 2200;
    const frame = () => {
      confetti({ particleCount: 5, angle: 60, spread: 75, origin: { x: 0, y: 0.7 }, colors });
      confetti({ particleCount: 5, angle: 120, spread: 75, origin: { x: 1, y: 0.7 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    const id = requestAnimationFrame(frame);
    const pop = setTimeout(() => {
      confetti({ particleCount: 120, spread: 90, startVelocity: 38, origin: { y: 0.4 }, colors });
    }, 700);
    return () => {
      cancelAnimationFrame(id);
      clearTimeout(pop);
    };
  }, []);

  const shown = members.slice(0, 4);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center px-8 text-center bg-gradient-to-b from-[#1b1205] via-[#3a1a06] to-[#0b0a09]"
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl gradient-orange shadow-2xl"
      >
        <PartyPopper className="h-10 w-10 text-white" />
      </motion.div>

      <motion.h1
        initial={{ y: -24, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 140, damping: 14, delay: 0.25 }}
        className="text-4xl font-black leading-tight text-white drop-shadow-lg sm:text-5xl"
      >
        {t("team_complete_title")}
      </motion.h1>

      {shown.length > 0 && (
        <div className="mt-8 flex items-center justify-center -space-x-4">
          {shown.map((member, i) => (
            <motion.div
              key={`${member.name}-${i}`}
              initial={{ scale: 0, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.5 + i * 0.12 }}
              className="h-16 w-16 overflow-hidden rounded-full border-4 border-white bg-orange-100 shadow-xl"
            >
              {member.photo ? (
                <img src={member.photo} alt={member.name || ""} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xl font-black text-orange-700">
                  {initials(member.name)}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="mt-8 max-w-sm text-lg leading-7 text-white/85"
      >
        {t("team_complete_subtitle")}
      </motion.p>

      <motion.button
        type="button"
        onClick={onContinue}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.15 }}
        whileTap={{ scale: 0.97 }}
        className="mt-10 inline-flex items-center gap-2 rounded-full gradient-orange px-8 py-4 text-lg font-extrabold text-white shadow-2xl"
      >
        {t("team_complete_cta")}
        <ArrowRight className="h-5 w-5 rtl:rotate-180" />
      </motion.button>
    </motion.div>
  );
}
