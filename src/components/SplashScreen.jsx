import React, { useEffect } from "react";
import { motion } from "framer-motion";

// SVG puzzle house pieces - each piece slides in from a different direction
// The house is divided into 4 puzzle pieces: top-left (roof left), top-right (roof right + chimney), bottom-left (door), bottom-right (wall right)

const PIECE_SIZE = 120;

// Each piece: initial offset (where it starts), and its clip/shape via SVG path
const pieces = [
  {
    id: "top-left",
    initial: { x: -150, y: -150 },
    // Roof left side with puzzle connector
    path: "M0,60 L60,0 L60,30 Q75,20 75,35 Q75,50 60,40 L60,60 Z",
    clipPath: "M0,60 L60,0 L60,30 Q75,20 75,35 Q75,50 60,40 L60,60 Z"
  },
  {
    id: "top-right",
    initial: { x: 150, y: -150 },
    path: "M60,60 L60,40 Q75,50 75,35 Q75,20 60,30 L60,0 L120,60 Z",
    clipPath: "M60,60 L60,40 Q75,50 75,35 Q75,20 60,30 L60,0 L120,60 Z"
  },
  {
    id: "bottom-left",
    initial: { x: -150, y: 150 },
    path: "M0,60 L0,120 L55,120 L55,90 Q45,75 60,75 Q75,75 65,90 L65,60 Z",
    clipPath: "M0,60 L0,120 L55,120 L55,90 Q45,75 60,75 Q75,75 65,90 L65,60 Z"
  },
  {
    id: "bottom-right",
    initial: { x: 150, y: 150 },
    path: "M65,60 L65,90 Q75,75 60,75 Q45,75 55,90 L55,120 L120,120 L120,60 Z",
    clipPath: "M65,60 L65,90 Q75,75 60,75 Q45,75 55,90 L55,120 L120,120 L120,60 Z"
  }
];

export default function SplashScreen({ onDone }) {
  useEffect(() => {
    // Total animation: ~0.8s pieces + 0.4s text + 0.5s hold = ~1.7s total
    const timer = setTimeout(() => {
      onDone();
    }, 2200);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backgroundColor: "#FF5722" }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-center gap-4">
        {/* Puzzle House SVG */}
        <div className="relative" style={{ width: 120, height: 120 }}>
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
            {/* Top-left piece: left roof */}
            <motion.path
              d="M5,65 L60,5 L60,35 Q72,25 72,38 Q72,52 60,42 L60,65 Z"
              fill="white"
              initial={{ x: -160, y: -160, opacity: 0 }}
              animate={{ x: 0, y: 0, opacity: 1 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
            />
            {/* Top-right piece: right roof + chimney */}
            <motion.path
              d="M60,65 L60,42 Q72,52 72,38 Q72,25 60,35 L60,5 L115,65 Z"
              fill="white"
              initial={{ x: 160, y: -160, opacity: 0 }}
              animate={{ x: 0, y: 0, opacity: 1 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
            />
            {/* Bottom-left piece: left wall + door */}
            <motion.path
              d="M5,65 L5,115 L55,115 L55,88 Q46,74 60,74 Q60,74 60,74 L60,65 Z"
              fill="white"
              initial={{ x: -160, y: 160, opacity: 0 }}
              animate={{ x: 0, y: 0, opacity: 1 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
            />
            {/* Bottom-right piece: right wall */}
            <motion.path
              d="M60,65 L60,74 Q60,74 60,74 Q74,74 65,88 L65,115 L115,115 L115,65 Z"
              fill="white"
              initial={{ x: 160, y: 160, opacity: 0 }}
              animate={{ x: 0, y: 0, opacity: 1 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
            />
            {/* Puzzle connector lines (visible after assembly) */}
            <motion.g
              stroke="#FF5722"
              strokeWidth="1.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65, duration: 0.2 }}
            >
              {/* Vertical center line */}
              <line x1="60" y1="5" x2="60" y2="115" />
              {/* Horizontal center line */}
              <line x1="5" y1="65" x2="115" y2="65" />
            </motion.g>
          </svg>
        </div>

        {/* Ruumr text */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7, duration: 0.5, ease: "easeOut" }}
        >
          <style>{`@import url('https://fonts.googleapis.com/css2?family=Pacifico&display=swap');`}</style>
          <span
            style={{
              fontFamily: "'Pacifico', cursive",
              fontSize: "52px",
              color: "white",
              fontWeight: 400,
              lineHeight: 1,
              letterSpacing: "-1px"
            }}
          >
            ruumr
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
}