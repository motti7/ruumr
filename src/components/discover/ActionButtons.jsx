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
    <div className="flex justify-center items-center z-20 select-none gap-23" dir="ltr">
      {/* Dislike — min 44px touch target */}
      {/* Dislike */}
      <motion.button
        variants={buttonVariants}
        initial="initial"
        whileHover="hover"
        whileTap="tap"
        onClick={onDislike}
        className="w-16 h-16 min-w-[44px] min-h-[44px] bg-white rounded-full shadow-lg flex items-center justify-center touch-manipulation">
        
        <X className="w-8 h-8 pointer-events-none text-gray-800" strokeWidth={2.5} />
      </motion.button>
      
      {/* Like */}
      <motion.button
        variants={buttonVariants}
        initial="initial"
        whileHover="hover"
        whileTap="tap"
        onClick={onLike}
        className="w-16 h-16 min-w-[44px] min-h-[44px] bg-red-500 rounded-full shadow-lg flex items-center justify-center touch-manipulation">
        
        <Heart className="w-8 h-8 pointer-events-none text-white" fill="white" />
      </motion.button>
    </div>);

}