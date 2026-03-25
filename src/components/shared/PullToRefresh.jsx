import React, { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw } from "lucide-react";

const THRESHOLD = 72; // px to pull before triggering

export default function PullToRefresh({ onRefresh, children }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef(null);
  const containerRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    const el = containerRef.current;
    if (!el) return;
    // Only activate when scrolled to top
    if (el.scrollTop <= 0) {
      startYRef.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (startYRef.current === null || isRefreshing) return;
    const delta = e.touches[0].clientY - startYRef.current;
    if (delta > 0) {
      e.preventDefault();
      setPullDistance(Math.min(delta * 0.5, THRESHOLD * 1.5));
    }
  }, [isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(THRESHOLD);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    startYRef.current = null;
    setPullDistance(0);
  }, [pullDistance, isRefreshing, onRefresh]);

  const progress = Math.min(pullDistance / THRESHOLD, 1);

  return (
    <div
      ref={containerRef}
      className="relative overflow-y-auto h-full"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ overscrollBehavior: "none" }}
    >
      {/* Pull indicator */}
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