import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

export default function MatchAnimation({ profile1, profile2, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onDismiss}
    >
      <motion.h1
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-5xl font-black mb-12 text-[--theme-orange] drop-shadow-lg"
        dir="ltr"
      >
        IT'S A MATCH!
      </motion.h1>

      <div className="relative flex items-center justify-center w-64 h-32">
        <motion.div
          initial={{ x: "-100%", rotate: -15, scale: 0.8 }}
          animate={{ x: "-25%", rotate: -8, scale: 1 }}
          transition={{ type: 'spring', stiffness: 100, delay: 0.3 }}
          className="absolute w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-2xl"
        >
          <img src={profile1.photos[0]} alt={profile1.name} className="w-full h-full object-cover" />
        </motion.div>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 150, delay: 0.8 }}
          className="absolute z-10 w-16 h-16 rounded-full gradient-red flex items-center justify-center"
        >
          <Heart className="w-8 h-8 text-white" fill="currentColor" />
        </motion.div>

        <motion.div
          initial={{ x: "100%", rotate: 15, scale: 0.8 }}
          animate={{ x: "25%", rotate: 8, scale: 1 }}
          transition={{ type: 'spring', stiffness: 100, delay: 0.3 }}
          className="absolute w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-2xl"
        >
          <img src={profile2.photos[0]} alt={profile2.name} className="w-full h-full object-cover" />
        </motion.div>
      </div>

      <motion.p
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-white text-lg mt-12"
      >
        את/ה ו{profile2.name} התאמתם!
      </motion.p>
    </motion.div>
  );
}