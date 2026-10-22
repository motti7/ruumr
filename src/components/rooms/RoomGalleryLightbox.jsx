import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { roomText as rt, roomLocale } from '@/lib/room-i18n';

// Full-screen photo viewer for a room gallery. Opens at `startIndex` and
// supports left/right navigation across all photos. Closes on backdrop tap or
// the X button. Arrow keys work on desktop; the chevrons work on touch.
export default function RoomGalleryLightbox({ photos = [], startIndex = 0, onClose }) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(startIndex);
  const count = photos.length;
  const rtl = document.documentElement.dir === 'rtl';

  const go = useCallback(
    (delta) => {
      setIndex((prev) => {
        const next = prev + delta;
        if (next < 0) return count - 1;
        if (next > count - 1) return 0;
        return next;
      });
    },
    [count]
  );

  useEffect(() => {
    if (count <= 1) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') go(rtl ? -1 : 1);
      else if (e.key === 'ArrowLeft') go(rtl ? 1 : -1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [count, go, onClose, rtl]);

  if (!count) return null;

  const iconCenter = { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center backdrop-blur-sm touch-manipulation"
        onClick={onClose}
      >
        <button
          type="button"
          className="no-tap-expand absolute top-4 right-4 w-[44px] h-[44px] p-0 m-0 bg-white rounded-full hover:bg-gray-100 active:scale-95 transition-transform flex items-center justify-center flex-shrink-0 z-[20] border-0 shadow-xl"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          aria-label={t('close')}
        >
          <X className="w-6 h-6 text-gray-900 shrink-0" style={iconCenter} />
        </button>

        <motion.img
          key={photos[index] + index}
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.18 }}
          src={photos[index]}
          alt={rt('feed.photo', { number: (index + 1).toLocaleString(roomLocale()) })}
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          draggable={false}
        />

        {count > 1 && (
          <>
            <button
              type="button"
              className="no-tap-expand absolute left-3 top-1/2 -translate-y-1/2 w-[44px] h-[44px] p-0 m-0 bg-white/20 rounded-full hover:bg-white/30 active:scale-95 transition-transform flex items-center justify-center flex-shrink-0 border-0"
              onClick={(e) => { e.stopPropagation(); go(rtl ? 1 : -1); }}
              aria-label={rtl ? t('feed.next_photo') : t('feed.prev_photo')}
            >
              <ChevronLeft className="w-7 h-7 text-white shrink-0" style={iconCenter} />
            </button>
            <button
              type="button"
              className="no-tap-expand absolute right-3 top-1/2 -translate-y-1/2 w-[44px] h-[44px] p-0 m-0 bg-white/20 rounded-full hover:bg-white/30 active:scale-95 transition-transform flex items-center justify-center flex-shrink-0 border-0"
              onClick={(e) => { e.stopPropagation(); go(rtl ? -1 : 1); }}
              aria-label={rtl ? t('feed.prev_photo') : t('feed.next_photo')}
            >
              <ChevronRight className="w-7 h-7 text-white shrink-0" style={iconCenter} />
            </button>

            <div
              className="absolute bottom-5 left-0 right-0 flex items-center justify-center gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              {photos.map((url, i) => (
                <span
                  key={url + i}
                  className={i === index ? 'w-2 h-2 rounded-full bg-white' : 'w-2 h-2 rounded-full bg-white/40'}
                />
              ))}
            </div>
            <div className="absolute bottom-12 left-0 right-0 text-center text-white/80 text-xs font-medium" onClick={(e) => e.stopPropagation()}>
              {(index + 1).toLocaleString(roomLocale())} / {count.toLocaleString(roomLocale())}
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}