import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Loader2, X, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/lib/AuthContext";
import { clearClientUserData } from "@/lib/clientSessionCleanup";

export default function DeleteAccountModal({ isOpen, onClose }) {
  const { t, i18n } = useTranslation();
  const { logout } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' }

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleConfirmDeletion = async () => {
    setIsDeleting(true);
    try {
      await base44.functions.invoke("deleteAccount", {});
      showToast(t("account_deleted_success"), "success");
      setTimeout(async () => {
        await clearClientUserData();
        await logout(false);
        window.location.href = createPageUrl("Home");
      }, 1500);
    } catch (error) {
      console.error("Delete account error:", error);
      showToast(t("delete_error"));
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) onClose();
  };

  return (
    <>
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-[300] px-5 py-3 rounded-2xl shadow-xl text-white font-bold text-sm flex items-center gap-2 ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}
            dir={i18n.dir()}
          >
            {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 z-[200] flex items-end justify-center"
          onClick={handleClose}
          dir={i18n.dir()}
        >
          <motion.div
            initial={{ y: 300 }}
            animate={{ y: 0 }}
            exit={{ y: 300 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bg-white rounded-t-3xl w-full max-w-md shadow-2xl"
            style={{ paddingBottom: 'calc(1.5rem + var(--app-safe-area-bottom, env(safe-area-inset-bottom, 0px)))' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <button
                onClick={handleClose}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={t("close")}
                disabled={isDeleting}
              >
                <X className="w-6 h-6" />
              </button>
              <h2 className="text-xl font-black text-gray-900">{t("delete_account_title")}</h2>
              <div className="w-[44px]" />
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-bold text-gray-900 text-center">
                  {t("irreversible_action")}
                </h3>
                <p className="text-sm text-gray-600 text-center leading-relaxed">
                  {t("delete_removes_all")}
                </p>
                <ul className="text-sm text-gray-600 space-y-2 mr-4">
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">•</span>
                    <span>{t("delete_item_profile")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">•</span>
                    <span>{t("delete_item_matches")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">•</span>
                    <span>{t("delete_item_prefs")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">•</span>
                    <span>{t("delete_item_login")}</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  onClick={handleConfirmDeletion}
                  disabled={isDeleting}
                  className="w-full py-3 px-4 min-h-[44px] bg-red-600 hover:bg-red-700 text-white font-bold rounded-full transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  aria-label={t("delete_my_account")}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t("deleting")}
                    </>
                  ) : (
                    t("delete_account")
                  )}
                </button>
                <button
                  onClick={handleClose}
                  disabled={isDeleting}
                  className="w-full py-3 px-4 min-h-[44px] bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold rounded-full transition-colors disabled:opacity-50"
                  aria-label={t("cancel")}
                >
                  {t("cancel")}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
