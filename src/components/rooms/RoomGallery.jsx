import React, { useRef, useState, useEffect, useCallback } from 'react';
import { roomText as rt, roomLocale } from '@/lib/room-i18n';

export default function RoomGallery({ photos = [], failed = {}, onFail }) {
  const scrollerRef = useRef(null);
  const [active, setActive] = useState(0);
  const count = photos.length;

  const goTo = useCallback((index) => {
    const el = scrollerRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(count - 1, index));
    el.scrollTo({ left: clamped * el.clientWidth, behavior: 'smooth' });
  }, [count]);

  // Track active slide while scrolling/swiping
  const handleScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    if (idx !== active) setActive(idx);
  }, [active]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => window.requestAnimationFrame(handleScroll);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [handleScroll]);

  if (!count) return null;

  return (
    <div className="rf-gallery" role="group" aria-label={rt('feed.photos_label')}>
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
                onError={() => onFail && onFail(url)}
              />
            )}
          </div>
        ))}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            className="rf-nav rf-nav-prev"
            aria-label={rt('feed.prev_photo')}
            onClick={() => goTo(active - 1)}
            disabled={active === 0}
          />
          <button
            type="button"
            className="rf-nav rf-nav-next"
            aria-label={rt('feed.next_photo')}
            onClick={() => goTo(active + 1)}
            disabled={active === count - 1}
          />
          <div className="rf-dots" aria-hidden="true">
            {photos.map((url, i) => (
              <span key={url + i} className={i === active ? 'rf-dot is-active' : 'rf-dot'} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}