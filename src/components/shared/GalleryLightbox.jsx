import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Full-screen image gallery: open at a given index, then swipe (drag),
 * click the arrows, or use the arrow keys to move between images. Click the
 * backdrop, the ✕, or press Esc to close.
 */
export default function GalleryLightbox({ images = [], startIndex = 0, onClose }) {
  const { t } = useTranslation();
  const count = images.length;
  const [index, setIndex] = useState(Math.min(Math.max(startIndex, 0), Math.max(count - 1, 0)));

  const go = useCallback(
    (dir) => setIndex((i) => (i + dir + count) % count),
    [count]
  );

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose]);

  // Stop the browser's horizontal overscroll/back gesture (e.g. a macOS
  // trackpad two-finger swipe) from navigating history while the gallery is open.
  useEffect(() => {
    const el = document.documentElement;
    const prev = el.style.overscrollBehaviorX;
    el.style.overscrollBehaviorX = "none";
    return () => {
      el.style.overscrollBehaviorX = prev;
    };
  }, []);

  // Let a horizontal trackpad swipe move between photos too (throttled).
  const wheelLock = useRef(false);
  const handleWheel = (e) => {
    if (count < 2) return;
    if (Math.abs(e.deltaX) < 25 || Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    if (wheelLock.current) return;
    wheelLock.current = true;
    go(e.deltaX > 0 ? 1 : -1);
    window.setTimeout(() => { wheelLock.current = false; }, 350);
  };

  if (!count) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm overscroll-x-none"
        onClick={onClose}
        onWheel={handleWheel}
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          className="absolute top-4 right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 active:scale-95 transition-transform"
          onClick={onClose}
          aria-label={t("close")}
        >
          <X className="h-6 w-6 text-white" />
        </button>

        {count > 1 && (
          <>
            <button
              type="button"
              className="absolute left-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 hover:bg-white/30 active:scale-95 transition-transform"
              onClick={(e) => { e.stopPropagation(); go(-1); }}
              aria-label={t("previous_image")}
            >
              <ChevronLeft className="h-7 w-7 text-white" />
            </button>
            <button
              type="button"
              className="absolute right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 hover:bg-white/30 active:scale-95 transition-transform"
              onClick={(e) => { e.stopPropagation(); go(1); }}
              aria-label={t("next_image")}
            >
              <ChevronRight className="h-7 w-7 text-white" />
            </button>
          </>
        )}

        <motion.img
          key={index}
          src={images[index]}
          alt=""
          className="max-h-[85vh] max-w-[90vw] select-none rounded-lg object-contain shadow-2xl"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          drag={count > 1 ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onClick={(e) => e.stopPropagation()}
          onDragEnd={(_e, info) => {
            if (info.offset.x < -80) go(1);
            else if (info.offset.x > 80) go(-1);
          }}
        />

        {count > 1 && (
          <div
            className="absolute bottom-6 left-0 right-0 flex justify-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            {images.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-white" : "w-1.5 bg-white/40"}`}
              />
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
