import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Maximize2, ChevronLeft, ChevronRight } from 'lucide-react';
import { roomText as rt, roomLocale } from '@/lib/room-i18n';
import RoomGalleryLightbox from './RoomGalleryLightbox';

export default function RoomGallery({ photos = [], failed = {}, onFail }) {
  const scrollerRef = useRef(null);
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const count = photos.length;

  const goTo = useCallback((index) => {
    const el = scrollerRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(count - 1, index));
    const target = el.children[clamped];
    if (target && target.scrollIntoView) {
      target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    } else {
      el.scrollTo({ left: clamped * el.clientWidth, behavior: 'smooth' });
    }
  }, [count]);

  const handleScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const idx = Math.round(Math.abs(el.scrollLeft) / el.clientWidth);
    if (idx !== active) setActive(idx);
  }, [active]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => window.requestAnimationFrame(handleScroll);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [handleScroll]);

  // Instagram-style tap navigation: a tap on the right half advances,
  // a tap on the left half goes back. Horizontal swipes still scroll natively
  // because they produce movement and no click event fires.
  const handleClick = useCallback((event) => {
    if (count <= 1) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const isRight = x > rect.width / 2;
    // In RTL layouts the visual order is mirrored, so flip the direction.
    const rtl = document.documentElement.dir === 'rtl';
    const nextIndex = isRight ? active + 1 : active - 1;
    goTo(rtl ? (isRight ? active - 1 : active + 1) : nextIndex);
  }, [active, count, goTo]);

  if (!count) return null;

  const goodPhotos = photos.filter((url) => !failed[url]);
  const lightboxStart = Math.max(0, goodPhotos.indexOf(photos[active]));

  return (
    <>
      <div className="rf-gallery" role="group" aria-label={rt('feed.photos_label')} onClick={handleClick}>
        <div className="rf-scroller" ref={scrollerRef}>
          {photos.map((url, i) => (
            <div className="rf-slide" key={url + i}>
              {failed[url] ? (
                <p>{rt('feed.photo_failed')}</p>
              ) : (
                <img
                  src={url}
                  alt={rt('feed.photo', { number: (i + 1).toLocaleString(roomLocale()) })}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  draggable={false}
                  onError={() => onFail && onFail(url)}
                />
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          className="rf-expand no-tap-expand"
          aria-label={rt('feed.photos_label')}
          onClick={(e) => { e.stopPropagation(); setLightboxOpen(true); }}
        >
          <Maximize2 className="w-4 h-4 shrink-0" />
        </button>

        {count > 1 && (
          <div className="rf-gallery-controls">
            <button type="button" disabled={active === 0} aria-label={rt('feed.prev_photo')} onClick={e=>{e.stopPropagation();goTo(active-1);}}><ChevronLeft/></button>
            <button type="button" disabled={active === count-1} aria-label={rt('feed.next_photo')} onClick={e=>{e.stopPropagation();goTo(active+1);}}><ChevronRight/></button>
          </div>
        )}
        {count > 1 && (
          <div className="rf-dots" aria-hidden="true">
            {photos.map((url, i) => (
              <span key={url + i} className={i === active ? 'rf-dot is-active' : 'rf-dot'} />
            ))}
          </div>
        )}
      </div>

      {lightboxOpen && goodPhotos.length > 0 && (
        <RoomGalleryLightbox
          photos={goodPhotos}
          startIndex={lightboxStart}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}
