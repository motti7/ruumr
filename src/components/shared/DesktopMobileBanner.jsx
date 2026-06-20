import React, { useState, useEffect } from "react";
import { X, Smartphone } from "lucide-react";

function isDesktopBrowser() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

export default function DesktopMobileBanner() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!isDesktopBrowser()) return;
    const dismissed = localStorage.getItem('ruumr_desktop_banner_dismissed');
    if (dismissed) return;
    setMounted(true);
    // Small delay so the DOM is ready before showing
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem('ruumr_desktop_banner_dismissed', '1');
    setTimeout(() => setMounted(false), 300);
  };

  if (!mounted) return null;

  return (
    <div
      className="bg-gradient-to-r from-[--theme-orange] to-[--theme-orange-dark] transition-all duration-300"
      style={{ opacity: visible ? 1 : 0, maxHeight: visible ? '80px' : '0', overflow: 'hidden' }}
    >
      <div className="max-w-md mx-auto flex items-center gap-3 px-4 py-3">
        <Smartphone className="w-5 h-5 text-white flex-shrink-0" />
        <p className="text-white text-sm font-medium flex-1 select-none">
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
    </div>
  );
}