import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Smartphone } from "lucide-react";

function isDesktopBrowser() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

export default function DesktopMobileBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isDesktopBrowser()) return;

    const dismissed = localStorage.getItem('ruumr_desktop_banner_dismissed');
    if (dismissed) return;

    setVisible(true);
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem('ruumr_desktop_banner_dismissed', '1');
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden bg-gradient-to-r from-[--theme-orange] to-[--theme-orange-dark]"
        >
          <div className="max-w-md mx-auto flex items-center gap-3 px-4 py-3">
            <Smartphone className="w-5 h-5 text-white flex-shrink-0" />
            <p className="text-white text-sm font-medium flex-1">
              פתח את Ruumr במובייל לחוויית משתמש מלאה 📱
            </p>
            <button
              onClick={dismiss}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-white/10 transition-colors flex-shrink-0"
              aria-label="סגור"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}