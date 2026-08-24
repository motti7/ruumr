import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Share2, Check, X, Copy, MessageCircle, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }
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

// Two side-by-side share buttons rendered on the Profile page:
//  - Orange (gradient-orange): share MY public profile link
//  - Blue (Base44 brand blue): request a review link (existing behavior)
// Both open the same native-share / fallback modal, parameterized by `mode`.
export default function ShareReviewLinkButton({ userId }) {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState("review"); // "profile" | "review"
  const [copied, setCopied] = useState(false);

  const reviewUrl = `https://app.ruumrapp.com/WriteExternalReview?userId=${userId}`;
  const profileUrl = `https://app.ruumrapp.com/PublicProfile?userId=${userId}`;

  const isProfile = mode === "profile";
  const url = isProfile ? profileUrl : reviewUrl;
  const modalTitle = isProfile ? t("share_profile_link_title") : t("share_review_link_title");
  const shareText = isProfile
    ? t("share_profile_share_text")
    : "היי! אשמח שתכתוב/י עליי ביקורת קצרה ברומר :-)";
  const hint = isProfile ? t("share_profile_share_text") : t("share_review_link_hint");

  const openShare = async (which) => {
    setMode(which);
    const u = which === "profile" ? profileUrl : reviewUrl;
    const title = which === "profile" ? t("share_profile_link_title") : "רומר - כתיבת ביקורת";
    const text = which === "profile"
      ? t("share_profile_share_text")
      : "היי! אשמח שתכתוב/י עליי ביקורת קצרה ברומר :-)";
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: u });
        return;
      } catch (e) {
        // cancelled / failed — fall back to the in-app modal
      }
    }
    setShowModal(true);
  };

  const handleWhatsApp = () => {
    const message = `${shareText}\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  const handleCopy = async () => {
    try {
      await copyText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // selection remains in the input for manual copy
    }
  };

  return (
    <>
      <div className="flex gap-2 w-full">
        <button
          onClick={() => openShare("profile")}
          className="flex-1 flex items-center justify-center gap-2 py-4 rounded-full gradient-orange text-white font-bold text-sm shadow-lg shadow-orange-500/30"
        >
          {t("share_my_profile")}
          <Share2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => openShare("review")}
          className="flex-1 flex items-center justify-center gap-2 py-4 rounded-full text-white font-bold text-sm shadow-lg shadow-blue-500/30"
          style={{ backgroundColor: "var(--theme-blue)" }}
        >
          {t("request_review")}
          <Star className="w-4 h-4" />
        </button>
      </div>

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
                <h3 className="text-lg font-bold text-gray-900">{modalTitle}</h3>
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
                  className="shrink-0 flex items-center gap-1 px-4 py-3 rounded-xl text-white font-bold text-sm"
                  style={{ backgroundColor: "var(--theme-blue)" }}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "הועתק" : "העתקה"}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-3 text-center">{hint}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}