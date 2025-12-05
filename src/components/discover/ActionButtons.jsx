import React from "react";
import { motion } from "framer-motion";
import { X, Heart, RotateCcw } from "lucide-react";

export default function ActionButtons({ onDislike, onLike, onRewind, showButtons = true }) {
  if (!showButtons) return null;

  const buttonVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.1 },
    tap: { scale: 0.9 }
  };

  return (
    <div className="flex justify-center items-center gap-6 z-20" dir="ltr">
      {/* Dislike */}
      <motion.button
        variants={buttonVariants}
        initial="initial"
        whileHover="hover"
        whileTap="tap"
        onClick={onDislike}
        className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center text-red-500 border-2 border-gray-200"
      >
        <X className="w-10 h-10" strokeWidth={3} />
      </motion.button>
      
      {/* Rewind */}
      <motion.button
        variants={buttonVariants}
        initial="initial"
        whileHover="hover"
        whileTap="tap"
        onClick={onRewind}
        className="w-16 h-16 bg-white rounded-full shadow-md flex items-center justify-center text-yellow-500 border-2 border-gray-200"
      >
        <RotateCcw className="w-7 h-7" strokeWidth={2.5} />
      </motion.button>

      {/* Like */}
      <motion.button
        variants={buttonVariants}
        initial="initial"
        whileHover="hover"
        whileTap="tap"
        onClick={onLike}
        className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center text-green-500 border-2 border-gray-200"
      >
        <Heart className="w-10 h-10" fill="currentColor" />
      </motion.button>
    </div>
  );
}