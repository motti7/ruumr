import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { motion } from 'framer-motion';

// Memoized wrapper for rendered items to prevent unnecessary re-renders
const MemoizedGridItem = memo(({ item, index, renderItem }) => (
  <motion.div
    key={item.id || index}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: (index % 2) * 0.05 }}
  >
    {renderItem(item, index)}
  </motion.div>
));

MemoizedGridItem.displayName = 'MemoizedGridItem';

/**
 * VirtualizedGrid — Efficient grid rendering for profile lists on low-end Android.
 * Only renders visible items + buffer, dramatically reducing DOM nodes.
 * Assumes uniform item dimensions for predictable scroll calculations.
 * Uses memoization to prevent unnecessary re-renders of visible items.
 */
export default function VirtualizedGrid({
  items = [],
  columns = 2,
  itemHeight = 300,
  gap = 16,
  renderItem = () => null,
  containerClassName = 'px-4 py-4',
  emptyState = null,
  overscan = 3,
}) {
  const containerRef = useRef(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: overscan * columns });
  const [containerWidth, setContainerWidth] = useState(0);

  // Calculate item width based on columns and container width
  const itemWidth = containerWidth > 0 ? (containerWidth - gap * (columns - 1)) / columns : 0;

  // Calculate row height including gap
  const rowHeight = itemHeight + gap;

  // Total rows needed
  const totalRows = Math.ceil(items.length / columns);
  const totalHeight = totalRows * rowHeight;

  // Handle scroll to update visible range
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const viewportHeight = window.innerHeight;

    // Calculate which rows are visible
    const startRow = Math.max(0, Math.floor((scrollTop - containerRef.current.offsetTop) / rowHeight) - overscan);
    const endRow = Math.min(
      totalRows,
      Math.ceil((scrollTop - containerRef.current.offsetTop + viewportHeight) / rowHeight) + overscan
    );

    const start = startRow * columns;
    const end = Math.min(items.length, endRow * columns);

    setVisibleRange({ start, end });
  }, [items.length, columns, rowHeight, totalRows, overscan]);

  // Update container width on mount and window resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const paddingX = 32; // px-4 on both sides
        setContainerWidth(containerRef.current.offsetWidth - paddingX);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('resize', updateWidth);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  if (items.length === 0) {
    return <div ref={containerRef} className={containerClassName}>{emptyState}</div>;
  }

  // Create grid layout with spacer divs
  const visibleItems = items.slice(visibleRange.start, visibleRange.end);
  const topSpacerHeight = Math.floor(visibleRange.start / columns) * rowHeight;
  const bottomSpacerHeight = Math.max(0, (totalRows - Math.ceil(visibleRange.end / columns)) * rowHeight);

  return (
    <div ref={containerRef} className={containerClassName}>
      {/* Top spacer — invisible element that takes up space for scrolled-past items */}
      {topSpacerHeight > 0 && <div style={{ height: topSpacerHeight }} />}

      {/* Visible items grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: `${gap}px`,
          marginBottom: bottomSpacerHeight > 0 ? `${gap}px` : 0,
        }}
      >
        {visibleItems.map((item, idx) => {
          const absoluteIdx = visibleRange.start + idx;
          return (
            <MemoizedGridItem
              key={item.id || absoluteIdx}
              item={item}
              index={absoluteIdx}
              renderItem={renderItem}
            />
          );
        })}
      </div>

      {/* Bottom spacer */}
      {bottomSpacerHeight > 0 && <div style={{ height: bottomSpacerHeight }} />}
    </div>
  );
}