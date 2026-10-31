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
          style={{ backgroundColor: "#F14D16" }}
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex items-center gap-3"
          >
            <div className="flex flex-col items-center gap-2">
              <img
                src="/ruumr-wordmark-white.svg"
                alt="ruumr"
                style={{ width: "200px", height: "auto" }}
              />
              <span
                style={{
                  fontFamily: "'Nunito', 'Varela Round', 'Quicksand', sans-serif",
                  fontWeight: 400,
                  fontSize: "16px",
                  color: "rgba(255,255,255,0.85)",
                  letterSpacing: "0.5px",
                  textAlign: "center",
                }}
                dir="ltr"
              >
                find your place.
                <br />
                with the right peoples.
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}