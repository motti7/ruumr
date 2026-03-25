import React, { useState } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { User } from "@/entities/User";
import { createPageUrl } from "@/utils";

export default function DeleteAccountModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1); // 1: Warning, 2: Confirmation
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDeletion = async () => {
    setIsDeleting(true);
    try {
      await base44.functions.invoke("deleteAccount", {});
      alert("החשבון והמידע שלך נמחקו בהצלחה.");
      await User.logout();
      window.location.href = createPageUrl("Home");
    } catch (error) {
      console.error("Delete account error:", error);
      alert("אירעה שגיאה במחיקת הנתונים. אנא נסה שנית או צור קשר עם התמיכה.");
      setIsDeleting(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setIsDeleting(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 z-[200] flex items-end justify-center"
          onClick={handleReset}
          dir="rtl"
        >
          <motion.div
            initial={{ y: 300 }}
            animate={{ y: 0 }}
            exit={{ y: 300 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bg-white rounded-t-3xl w-full max-w-md shadow-2xl"
            style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <button
                onClick={handleReset}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="סגור"
              >
                <X className="w-6 h-6" />
              </button>
              <h2 className="text-xl font-black text-gray-900">מחיקת חשבון</h2>
              <div className="w-[44px]" />
            </div>

            {/* Step 1: Warning */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="p-6 space-y-6"
              >
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-gray-900 text-center">
                    פעולה זו בלתי הפיכה
                  </h3>
                  <p className="text-sm text-gray-600 text-center leading-relaxed">
                    מחיקת החשבון תסיר את כל המידע שלך מהמערכת, כולל:
                  </p>
                  <ul className="text-sm text-gray-600 space-y-2 mr-4">
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 font-bold">•</span>
                      <span>הפרופיל וכל התמונות</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 font-bold">•</span>
                      <span>כל ההתאמות וההודעות</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 font-bold">•</span>
                      <span>ההעדפות והחיפושים</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 font-bold">•</span>
                      <span>פרטי הכניסה עם גוגל</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-3 pt-4">
                  <button
                    onClick={() => setStep(2)}
                    disabled={isDeleting}
                    className="w-full py-3 px-4 min-h-[44px] bg-red-600 hover:bg-red-700 text-white font-bold rounded-full transition-colors disabled:opacity-50"
                    aria-label="אני בטוח שברצוני למחוק את החשבון"
                  >
                    אני בטוח/ה שברצוני למחוק
                  </button>
                  <button
                    onClick={handleReset}
                    disabled={isDeleting}
                    className="w-full py-3 px-4 min-h-[44px] bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold rounded-full transition-colors disabled:opacity-50"
                    aria-label="ביטול מחיקת החשבון"
                  >
                    ביטול
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Final Confirmation */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="p-6 space-y-6"
              >
                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-gray-900">
                    אישור סופי של מחיקה
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    זה הצעד האחרון. לא יוכל לחזור. האם את/ה בטוח/ה?
                  </p>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-xs font-bold text-red-600 text-center">
                    ⚠️ לא יוכל לשחזר את הנתונים
                  </p>
                </div>

                <div className="space-y-3 pt-4">
                  <button
                    onClick={handleConfirmDeletion}
                    disabled={isDeleting}
                    className="w-full py-3 px-4 min-h-[44px] bg-red-600 hover:bg-red-700 text-white font-bold rounded-full transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    aria-label="מחק את החשבון שלי סופית"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        מחיקה בעדכון...
                      </>
                    ) : (
                      "מחק לצמיתות"
                    )}
                  </button>
                  <button
                    onClick={() => setStep(1)}
                    disabled={isDeleting}
                    className="w-full py-3 px-4 min-h-[44px] bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold rounded-full transition-colors disabled:opacity-50"
                    aria-label="חזור לעצירת מחיקה"
                  >
                    חזור אחורה
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}