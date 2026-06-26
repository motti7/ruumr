// @ts-nocheck
import React, { memo, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Puzzle, Trash2, X, Check, Sparkles } from "lucide-react";
import SmartImage from '@/components/shared/SmartImage';

const MatchCard = /** @type {any} */ (memo(function MatchCard({ match, isOnline, onClickProfile, onClickChat, onClickCharter, matchId, matchType = "mutual", onDelete, isOpened, unreadCount = 0 }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const showPlusLabel = matchType === "ruumr_plus";
  const matchTypeLabel = showPlusLabel ? "התאמת Ruumr Plus" : matchType === "mutual" ? "התאמה הדדית" : "התאמה";
  const handleProfileClick = useCallback((e) => {
    e.stopPropagation();
    onClickProfile();
  }, [onClickProfile]);

  const handleDeleteClick = useCallback((e) => {
    e.stopPropagation();
    setShowConfirm(true);
  }, []);

  const handleConfirmDelete = useCallback((e) => {
    e.stopPropagation();
    onDelete?.(matchId);
  }, [matchId, onDelete]);

  const handleCancelDelete = useCallback((e) => {
    e.stopPropagation();
    setShowConfirm(false);
  }, []);

  const handleCharterClick = useCallback(async (e) => {
    e.stopPropagation();
    onClickCharter();
  }, [onClickCharter]);

  return (
    <motion.div
      whileTap={{ scale: 0.93 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      onClick={() => onClickProfile()}
      className="bg-white rounded-2xl shadow-md border border-gray-100 cursor-pointer overflow-hidden hover:shadow-xl"
      role="article"
      aria-label={`${matchTypeLabel}: ${match.name}, ${match.age || ''} בן/בת, ${match.location || 'מיקום לא צוין'}`}
    >
      <div className="flex items-center p-4" dir="rtl">
        <div className="relative w-24 shrink-0 flex justify-start">
          <div className="w-16 h-16 rounded-full border-2 border-gray-100 overflow-hidden">
            <SmartImage
              src={match.photos?.[0] || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face"}
              alt={`תמונת פרופיל של ${match.name}`}
              className="w-full h-full"
              priority={true}
            />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-gray-900 text-lg" id={`match-name-${matchId}`}>{match.name}</h3>
            {unreadCount > 0 && (
              <span className="min-w-[20px] h-5 bg-yellow-400 text-white text-[11px] font-bold flex items-center justify-center rounded-full px-1 shadow-sm">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center text-gray-500 text-sm mb-2">
            <MapPin className="w-3 h-3 ml-1" aria-hidden="true" />
            <span id={`match-location-${matchId}`}>{match.location}</span>
          </div>
          {showPlusLabel && (
            <div className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-bold text-[--theme-orange] mb-2">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>התאמת Ruumr Plus</span>
            </div>
          )}
          <div className="flex items-center text-gray-500 text-sm">
            <span id={`match-budget-${matchId}`}>תקציב: ₪{match.budget_max?.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          <AnimatePresence mode="wait">
            {showConfirm ? (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex gap-1.5"
              >
                <button
                  onClick={handleConfirmDelete}
                  className="bg-red-500 text-white p-2.5 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center shadow-md"
                  aria-label="אישור מחיקה"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCancelDelete}
                  className="bg-gray-200 text-gray-600 p-2.5 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center shadow-md"
                  aria-label="ביטול"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ) : (
              <motion.button
                key="delete"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                whileTap={{ scale: 0.85 }}
                onClick={handleDeleteClick}
                className="text-gray-400 bg-gray-100 p-3 rounded-full hover:bg-red-50 hover:text-red-400 transition-all shadow-sm min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="הסר התאמה"
              >
                <Trash2 className="w-5 h-5" />
              </motion.button>
            )}
          </AnimatePresence>
          <div className="relative">
            <motion.div
              whileTap={{ scale: 0.85 }}
              onClick={handleCharterClick}
              className="text-white bg-[--theme-orange] dark:bg-orange-500 p-3 rounded-full hover:brightness-110 transition-all shadow-md min-w-[44px] min-h-[44px] flex items-center justify-center"
              role="button"
              tabIndex={0}
              aria-label="compatibility checker"
            >
              <Puzzle className="w-5 h-5" />
            </motion.div>
            {!isOpened && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}));

export default MatchCard;
