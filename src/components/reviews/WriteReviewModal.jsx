import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { base44 } from "@/api/base44Client";
import { User } from "@/entities/User";
import { Star, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function WriteReviewModal({ reviewedUserId, reviewedName, onClose, onSubmitted = undefined }) {
  const { t, i18n } = useTranslation();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setIsSubmitting(true);
    const user = await User.me();
    const myProfile = await base44.entities.Profile.filter({ user_id: user.id });
    await base44.entities.Review.create({
      reviewer_id: user.id,
      reviewed_id: reviewedUserId,
      rating,
      text: text.trim(),
      reviewer_name: myProfile[0]?.name || user.full_name || t("user_fallback")
    });
    setIsSubmitting(false);
    onSubmitted && onSubmitted();
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-[200] flex items-end justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 300 }}
          animate={{ y: 0 }}
          exit={{ y: 300 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="bg-yellow-50 rounded-t-3xl w-full max-w-md p-6 border-t-4 border-yellow-300"
          style={{ paddingBottom: 'calc(1.5rem + var(--app-safe-area-bottom, env(safe-area-inset-bottom, 0px)) + 80px)' }}
          dir={i18n.dir()}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-xl font-black text-gray-900">{t("write_review_about", { name: reviewedName })}</h3>
            <button
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-yellow-100 transition-colors"
              aria-label={t("close")}
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="flex justify-center gap-2 mb-5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
              >
                <Star
                  className="w-10 h-10 transition-colors"
                  fill={(hoverRating || rating) >= star ? "#facc15" : "none"}
                  stroke={(hoverRating || rating) >= star ? "#eab308" : "#d1d5db"}
                />
              </button>
            ))}
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("review_placeholder")}
            className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none h-28 focus:outline-none focus:ring-2 focus:ring-[--theme-orange]"
          />

          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || isSubmitting}
            className="w-full mt-4 gradient-orange text-white font-bold rounded-full h-12"
          >
            {isSubmitting ? t("sending_short") : t("send_review")}
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
