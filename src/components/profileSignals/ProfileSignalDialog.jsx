import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Sparkles, X } from "lucide-react";
import { PROFILE_SIGNAL_VIDEO_MAX_REVEAL_SECONDS } from "@/lib/profileSignals/config";
import {
  getPreferredProfileSignalLanguage,
  getProfileSignalAnswerLabel,
  getProfileSignalCopy,
  getProfileSignalDirection,
  getProfileSignalPrompt,
} from "@/lib/profileSignals/questions";
import { cn } from "@/lib/utils";

const ANSWER_PANEL_CLASSES = [
  "bg-stone-50/90 border-stone-100/90 text-gray-950",
  "bg-zinc-50/90 border-zinc-100/90 text-gray-950",
  "bg-slate-50/90 border-slate-100/90 text-gray-950",
  "bg-neutral-50/90 border-neutral-100/90 text-gray-950",
  "bg-gray-50/90 border-gray-100/90 text-gray-950",
];

function shuffledPanelClasses() {
  return [...ANSWER_PANEL_CLASSES].sort(() => Math.random() - 0.5);
}

export default function ProfileSignalDialog({
  open,
  question,
  source = "profile_prompt",
  dismissible = true,
  language = null,
  onAnswer,
  onClose,
}) {
  const [showAnswers, setShowAnswers] = useState(false);
  const [selectedAnswerId, setSelectedAnswerId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const isMountedRef = useRef(false);
  const panelClasses = useMemo(() => shuffledPanelClasses(), [open, question?.id]);
  const activeLanguage = getPreferredProfileSignalLanguage(language);
  const copy = getProfileSignalCopy(activeLanguage);
  const direction = getProfileSignalDirection(activeLanguage);
  const textAlignClass = direction === "rtl" ? "text-right" : "text-left";

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!open || !question) return undefined;
    setShowAnswers(false);
    setSelectedAnswerId(null);
    setIsSaving(false);

    const revealAfterSeconds = question.media?.type === "video"
      ? PROFILE_SIGNAL_VIDEO_MAX_REVEAL_SECONDS
      : Number(question.media?.revealAfterSeconds) || 4;
    const timerId = window.setTimeout(() => {
      setShowAnswers(true);
    }, revealAfterSeconds * 1000);

    return () => window.clearTimeout(timerId);
  }, [open, question]);

  if (!open || !question) return null;

  const mediaType = question.media?.type || "image";

  const handleAnswer = async (answerId) => {
    if (isSaving) return;
    setSelectedAnswerId(answerId);
    setIsSaving(true);
    try {
      await onAnswer?.(answerId, { question, source });
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/78 p-3 backdrop-blur-sm"
        dir={direction}
        role="dialog"
        aria-modal="true"
        aria-label={copy.dialogLabel}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="relative h-[min(82dvh,720px)] w-full max-w-md overflow-hidden rounded-[22px] bg-black shadow-2xl md:max-w-lg"
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          transition={{ duration: 0.22 }}
        >
          {dismissible && (
            <button
              type="button"
              onClick={onClose}
              aria-label={copy.close}
              className="absolute left-3 top-3 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-black/42 text-white shadow-lg backdrop-blur-md transition hover:bg-black/56"
            >
              <X className="h-5 w-5" />
            </button>
          )}

          <div className="absolute right-3 top-3 z-20 flex items-center gap-1.5 rounded-full bg-black/36 px-3 py-2 text-xs font-bold text-white backdrop-blur-md">
            <Sparkles className="h-4 w-4" />
            {copy.badge}
          </div>

          {mediaType === "video" ? (
            <video
              className="h-full w-full object-cover"
              src={question.media.src}
              playsInline
              autoPlay
              muted
              onEnded={() => setShowAnswers(true)}
            />
          ) : (
            <img
              className="h-full w-full object-cover"
              src={question.media.src}
              alt={question.media.alt || ""}
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/18 to-black/12" />
          {showAnswers && (
            <motion.div
              className="absolute inset-x-0 bottom-0 z-10 h-[84%] bg-gradient-to-t from-black/70 via-black/40 to-transparent"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.22 }}
            />
          )}

          {!showAnswers && (
            <div className="absolute inset-x-0 bottom-0 z-20 p-5 text-center text-white">
              <div className="mx-auto mb-3 h-1.5 w-24 overflow-hidden rounded-full bg-white/24">
                <motion.div
                  className="h-full rounded-full bg-white/88"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{
                    duration: mediaType === "video"
                      ? PROFILE_SIGNAL_VIDEO_MAX_REVEAL_SECONDS
                      : Number(question.media?.revealAfterSeconds) || 4,
                    ease: "linear",
                  }}
                />
              </div>
              <p className="text-sm font-semibold text-white/88">{copy.watch}</p>
            </div>
          )}

          <AnimatePresence>
            {showAnswers && (
              <motion.div
                className="absolute inset-x-0 bottom-0 z-20 max-h-[78%] overflow-y-auto p-4"
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 28 }}
                transition={{ duration: 0.28 }}
              >
                <div className={cn("mb-4 rounded-2xl bg-black/[.55] p-4 text-white shadow-xl backdrop-blur-md", textAlignClass)}>
                  <p className="text-lg font-extrabold leading-snug">{getProfileSignalPrompt(question, activeLanguage)}</p>
                </div>

                <div className="grid gap-2.5">
                  {question.answers.map((answer, index) => {
                    const isSelected = selectedAnswerId === answer.id;
                    return (
                      <button
                        key={answer.id}
                        type="button"
                        disabled={isSaving}
                        onClick={() => handleAnswer(answer.id)}
                        className={cn(
                          "min-h-[62px] rounded-2xl border px-4 py-3 text-base font-extrabold leading-snug shadow-[0_12px_32px_rgba(0,0,0,0.32)] backdrop-blur-md transition",
                          "hover:scale-[1.01] active:scale-[0.99] disabled:cursor-wait disabled:opacity-80",
                          textAlignClass,
                          panelClasses[index % panelClasses.length],
                          isSelected && "ring-2 ring-white"
                        )}
                      >
                        <span className="flex items-center justify-between gap-3">
                          <span>{getProfileSignalAnswerLabel(answer, activeLanguage)}</span>
                          {isSelected && isSaving && <Loader2 className="h-4 w-4 shrink-0 animate-spin" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
