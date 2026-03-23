import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SplashScreen({ onDone }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 500);
    }, 3500);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[99999] flex items-center justify-center"
          style={{ backgroundColor: "#E8420A" }}
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex items-center gap-3"
          >
            <div className="flex flex-col items-center gap-2">
              <span
                style={{
                  fontFamily: "'Nunito', 'Varela Round', 'Quicksand', sans-serif",
                  fontWeight: 800,
                  fontSize: "72px",
                  color: "white",
                  letterSpacing: "-1px",
                  lineHeight: 1,
                }}
              >
                ruumr
              </span>
              <span
                style={{
                  fontFamily: "'Nunito', 'Varela Round', 'Quicksand', sans-serif",
                  fontWeight: 400,
                  fontSize: "16px",
                  color: "rgba(255,255,255,0.85)",
                  letterSpacing: "0.5px",
                }}
              >
                find your perfect roommates
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}