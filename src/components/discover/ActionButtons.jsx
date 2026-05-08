import React from "react";
import { motion } from "framer-motion";
import { X, Heart, RotateCcw } from "lucide-react";

export default function ActionButtons({ onDislike, onBack, onLike, canGoBack = true, showButtons = true }) {
  if (!showButtons) return null;

  const buttonVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.06 },
    tap: { scale: 0.94 }
  };

  return (
    <div className="mx-auto flex w-full items-end justify-center gap-3 select-none" dir="ltr">
      <div className="flex flex-1 flex-col items-center gap-2">
        <motion.button
          variants={buttonVariants}
          initial="initial"
          whileHover="hover"
          whileTap="tap"
          onClick={onDislike}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-[0_16px_34px_rgba(15,23,42,0.34)] ring-1 ring-white/30 transition-shadow touch-manipulation"
        >
          <X className="h-7 w-7 pointer-events-none" strokeWidth={2.8} />
        </motion.button>
        <span className="text-[11px] font-medium tracking-[-0.01em] text-white/90">
          Pass
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center gap-2">
        <motion.button
          variants={buttonVariants}
          initial="initial"
          whileHover="hover"
          whileTap="tap"
          onClick={onBack}
          disabled={!canGoBack}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-slate-950 shadow-[0_20px_44px_rgba(15,23,42,0.18)] ring-1 ring-white/70 transition-shadow touch-manipulation disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none"
        >
          <RotateCcw className="h-6 w-6 pointer-events-none" strokeWidth={2.6} />
        </motion.button>
        <span className="text-[11px] font-medium tracking-[-0.01em] text-white/90">
          Back
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center gap-2">
        <motion.button
          variants={buttonVariants}
          initial="initial"
          whileHover="hover"
          whileTap="tap"
          onClick={onLike}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-[0_16px_34px_rgba(244,63,94,0.28)] ring-1 ring-white/30 transition-shadow touch-manipulation"
        >
          <Heart className="h-7 w-7 pointer-events-none" fill="currentColor" />
        </motion.button>
        <span className="text-[11px] font-medium tracking-[-0.01em] text-white/90">
          Like
        </span>
      </div>
    </div>
  );
}
