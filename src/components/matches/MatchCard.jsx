// @ts-nocheck
import React, { memo, useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Clock3, MapPin, MessageCircleMore, Puzzle, Trash2, X } from "lucide-react";
import SmartImage from '@/components/shared/SmartImage';

const formatTimeLabel = (value) => {
  if (!value) return "New";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "New";

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const MatchCard = /** @type {any} */ (memo(function MatchCard({
  match,
  isOnline,
  onClickProfile,
  onClickChat,
  onClickCharter,
  matchId,
  onDelete,
  isOpened,
  latestMessage = null,
  unreadCount = 0,
}) {
  const [showConfirm, setShowConfirm] = useState(false);

  const messagePreview = useMemo(() => {
    if (latestMessage?.content) return latestMessage.content;
    if (match?.looking_for_description) return match.looking_for_description;
    return "Tap to open the conversation and keep the momentum going.";
  }, [latestMessage?.content, match?.looking_for_description]);

  const timeLabel = useMemo(() => formatTimeLabel(latestMessage?.created_date), [latestMessage?.created_date]);

  const matchScore = useMemo(() => {
    const score = Number(match?.ruumrPlus?.score ?? match?.ruumr_plus?.score);
    return Number.isFinite(score) && score > 0 ? Math.round(score * 100) : null;
  }, [match?.ruumrPlus?.score, match?.ruumr_plus?.score]);

  const handleCardClick = useCallback(() => {
    if (showConfirm) return;
    onClickChat?.();
  }, [onClickChat, showConfirm]);

  const handleProfileClick = useCallback((e) => {
    e.stopPropagation();
    onClickProfile?.();
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
    try {
      const [{ base44 }, { User }] = await Promise.all([
        import('@/api/base44Client'),
        import('@/entities/User')
      ]);
      const user = await User.me();
      const myAnswers = await base44.entities.CharterAnswer.filter({
        match_id: matchId,
        user_id: user.id
      });
      if (myAnswers && myAnswers.length >= 8) {
        onClickChat?.();
        return;
      }
      onClickCharter?.();
    } catch (error) {
      console.error('Charter check error:', error);
      onClickCharter?.();
    }
  }, [matchId, onClickChat, onClickCharter]);

  return (
    <motion.article
      whileTap={{ scale: 0.98 }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.18 }}
      onClick={handleCardClick}
      className="group relative overflow-hidden rounded-[30px] border border-white/80 bg-white/85 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl cursor-pointer dark:border-white/10 dark:bg-slate-950/60"
      role="article"
      aria-label={`התאמה: ${match.name}, ${match.age || ''} בן/בת, ${match.location || 'מיקום לא צוין'}`}
    >
      <div className="flex gap-4" dir="rtl">
        <button
          onClick={handleProfileClick}
          className="relative shrink-0 outline-none"
          aria-label={`הצג את הפרופיל של ${match.name}`}
        >
          <div className="h-20 w-20 overflow-hidden rounded-[24px] ring-2 ring-white shadow-[0_14px_32px_rgba(15,23,42,0.14)]">
            <SmartImage
              src={match.photos?.[0] || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face"}
              alt={`תמונת פרופיל של ${match.name}`}
              className="h-full w-full"
              priority={true}
            />
          </div>
          {isOnline && (
            <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-500 shadow-sm dark:border-slate-950" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-lg font-black tracking-tight text-slate-950 dark:text-white">
                  {match.name}
                </h3>
                {!isOpened && <span className="h-2.5 w-2.5 rounded-full bg-[--theme-orange] shadow-sm" />}
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="truncate">{match.location || 'Location not set'}</span>
              </div>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-2 text-right">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500 dark:bg-white/10 dark:text-slate-300">
                <Clock3 className="h-3 w-3" />
                {timeLabel}
              </div>
              {unreadCount > 0 && (
                <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-[--theme-orange] px-2 py-1 text-[11px] font-bold text-white shadow-sm">
                  {unreadCount}
                </span>
              )}
            </div>
          </div>

          <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {messagePreview}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {match.budget_max ? (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                ₪{Number(match.budget_max).toLocaleString()}
              </span>
            ) : null}
            {matchScore ? (
              <span className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-[--theme-orange] ring-1 ring-orange-100">
                {matchScore}% match
              </span>
            ) : null}
            {match.search_area ? (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                {match.search_area}
              </span>
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={(e) => {
                e.stopPropagation();
                onClickChat?.();
              }}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[--theme-orange] px-4 py-2 text-xs font-bold text-white shadow-[0_14px_30px_rgba(255,122,69,0.28)]"
            >
              <MessageCircleMore className="h-4 w-4" />
              Open chat
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleCharterClick}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
            >
              <Puzzle className="h-4 w-4" />
              Charter
            </motion.button>

            <AnimatePresence mode="wait">
              {showConfirm ? (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="ml-auto flex gap-1.5"
                >
                  <button
                    onClick={handleConfirmDelete}
                    className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-rose-500 text-white shadow-md"
                    aria-label="אישור מחיקה"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleCancelDelete}
                    className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-slate-200 text-slate-600 shadow-md dark:bg-white/10 dark:text-slate-200"
                    aria-label="ביטול"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </motion.div>
              ) : (
                <motion.button
                  key="delete"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleDeleteClick}
                  className="ml-auto flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition-colors hover:bg-rose-50 hover:text-rose-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                  aria-label="הסר התאמה"
                >
                  <Trash2 className="h-4 w-4" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.article>
  );
}));

export default MatchCard;
