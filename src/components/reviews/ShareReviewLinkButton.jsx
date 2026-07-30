import React, { useState } from "react";
import { Share2, Check, X, Copy, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }
  // Fallback for environments without the Clipboard API (e.g. native WebViews)
  return new Promise((resolve, reject) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      ok ? resolve() : reject(new Error("copy failed"));
    } catch (e) {
      document.body.removeChild(textarea);
      reject(e);
    }
  });
}

export default function ShareReviewLinkButton({ userId }) {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const url = `https://app.ruumrapp.com/WriteExternalReview?userId=${userId}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "רומר - כתיבת ביקורת",
          text: "היי! אשמח שתכתוב/י עליי ביקורת קצרה ברומר ❤️",
          url,
        });
        return;
      } catch (e) {
        // User cancelled or share failed — fall back to showing the link.
      }
    }
    setShowModal(true);
  };

  const handleWhatsApp = () => {
    const message = `היי! אשמח שתכתוב/י עליי ביקורת קצרה ברומר ❤️\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  const handleCopy = async () => {
    try {
      await copyText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // Selection remains visible in the input for manual copy.
    }
  };

  return (
    <>
      <button
        onClick={handleShare}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-[--theme-orange] text-[--theme-orange] font-bold text-sm"
      >
        <Share2 className="w-5 h-5" />
        שתפו קישור לקבלת ביקורת
      </button>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[200] flex items-end justify-center"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ y: 300 }}
              animate={{ y: 0 }}
              exit={{ y: 300 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white rounded-t-3xl w-full max-w-md p-6"
              dir="rtl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">שתפו את הקישור הזה</h3>
                <button onClick={() => setShowModal(false)} aria-label="סגירה">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <button
                onClick={handleWhatsApp}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] text-white font-bold text-sm mb-3"
              >
                <MessageCircle className="w-5 h-5" />
                שיתוף ב-WhatsApp
              </button>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={url}
                  onFocus={(e) => e.target.select()}
                  className="flex-1 border border-gray-200 rounded-xl p-3 text-xs text-gray-600 focus:outline-none"
                />
                <button
                  onClick={handleCopy}
                  className="shrink-0 flex items-center gap-1 px-4 py-3 rounded-xl gradient-orange text-white font-bold text-sm"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "הועתק" : "העתקה"}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-3 text-center">
                שלחו את הקישור לחבר/ה כדי שיוכלו לכתוב עליכם ביקורת, גם אם אין להם חשבון ברומר.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}