import React, { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';

const BANNER_KEY = 'ruumr_plus_banner_seen_session';

export default function RuumrPlusBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show once per session (per app open)
    const seen = sessionStorage.getItem(BANNER_KEY);
    if (!seen) {
      // Small delay so the app shell loads first
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(BANNER_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" dir="rtl">
      <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative text-center">
        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          aria-label="סגור"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-[--theme-orange]" />
        </div>

        {/* Limited time badge */}
        <p className="text-[--theme-orange] text-sm font-semibold mb-2">
          ⏰ הצעה לזמן מוגבל
        </p>

        {/* Title */}
        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-3">
          רומר פלוס הגיע!
        </h2>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-6">
          AI שמוצא לך את השותפים המושלמים בלחיצה אחת — ופותח צ'אט מיידי. רק 25₪ עד תחילת השנה האקדמית הבאה.
        </p>

        {/* CTA Button */}
        <a
          href="https://ruumrapp.com/RuumrPlus"
          target="_blank"
          rel="noopener noreferrer"
          onClick={dismiss}
          className="block w-full py-4 rounded-2xl gradient-orange text-white font-bold text-lg shadow-lg active:opacity-90"
        >
          ✨ גלה עוד
        </a>
      </div>
    </div>
  );
}