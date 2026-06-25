import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw } from "lucide-react";

const THRESHOLD = 72;

export default function PullToRefresh({ onRefresh, children }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef(null);
  const containerRef = useRef(null);
  const pullDistanceRef = useRef(0);
  const isRefreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);

  onRefreshRef.current = onRefresh;

  useEffect(() => {
    pullDistanceRef.current = pullDistance;
  }, [pullDistance]);

  useEffect(() => {
    isRefreshingRef.current = isRefreshing;
  }, [isRefreshing]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleTouchStart = (e) => {
      startYRef.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      if (startYRef.current === null || isRefreshingRef.current) return;
      // Only pull-to-refresh while the list is scrolled to the very top.
      // While there's content scrolled above (scrollTop > 0) — including when
      // the user is scrolling back UP toward the top — keep the baseline pinned
      // to the finger so no pull builds up. The pull only starts once they
      // actually reach the top and keep dragging downward.
      if (el.scrollTop > 0) {
        startYRef.current = e.touches[0].clientY;
        if (pullDistanceRef.current !== 0) {
          pullDistanceRef.current = 0;
          setPullDistance(0);
        }
        return;
      }
      const delta = e.touches[0].clientY - startYRef.current;
      if (delta > 0) {
        e.preventDefault();
        const dist = Math.min(delta * 0.5, THRESHOLD * 1.5);
        pullDistanceRef.current = dist;
        setPullDistance(dist);
      } else if (pullDistanceRef.current !== 0) {
        pullDistanceRef.current = 0;
        setPullDistance(0);
      }
    };

    const handleTouchEnd = async () => {
      if (pullDistanceRef.current >= THRESHOLD && !isRefreshingRef.current) {
        isRefreshingRef.current = true;
        setIsRefreshing(true);
        setPullDistance(THRESHOLD);
        try {
          await onRefreshRef.current();
        } finally {
          isRefreshingRef.current = false;
          setIsRefreshing(false);
        }
      }
      startYRef.current = null;
      pullDistanceRef.current = 0;
      setPullDistance(0);
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  const progress = Math.min(pullDistance / THRESHOLD, 1);

  return (
    <div
      ref={containerRef}
      className="relative overflow-y-auto overflow-x-hidden h-full"
      style={{ overscrollBehavior: "none" }}
    >
      <AnimatePresence>
        {(pullDistance > 0 || isRefreshing) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-0 left-0 right-0 flex justify-center z-10 pointer-events-none"
            style={{ transform: `translateY(${Math.min(pullDistance, THRESHOLD) - 44}px)` }}
          >
            <div className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center border border-gray-100">
              <motion.div
                animate={isRefreshing ? { rotate: 360 } : { rotate: progress * 360 }}
                transition={isRefreshing ? { duration: 0.8, repeat: Infinity, ease: "linear" } : {}}
              >
                <RefreshCw
                  className="w-5 h-5"
                  style={{ color: progress >= 1 || isRefreshing ? "#FF5722" : "#9ca3af" }}
                />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        style={{ transform: `translateY(${Math.min(pullDistance, THRESHOLD)}px)` }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
