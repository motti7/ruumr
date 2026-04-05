import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { motion } from 'framer-motion';

// Memoized wrapper for rendered items to prevent unnecessary re-renders
const MemoizedGridItem = memo(({ item, index, renderItem, onMeasure, enableVarHeights }) => {
  const itemRef = useRef(null);

  // NEW: Measure item height after render (for variable heights)
  useEffect(() => {
    if (!enableVarHeights || !itemRef.current) return;
    const height = itemRef.current.offsetHeight;
    onMeasure(index, height);
  }, [index, onMeasure, enableVarHeights]);

  return (
    <motion.div
      ref={itemRef}
      key={item.id || index}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (index % 2) * 0.05 }}
    >
      {renderItem(item, index)}
    </motion.div>
  );
});

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
  enableVariableHeights = true, // NEW: support variable row heights
}) {
  const containerRef = useRef(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: overscan * columns });
  const [containerWidth, setContainerWidth] = useState(0);
  const [itemHeights, setItemHeights] = useState({}); // NEW: track individual item heights

  // Calculate item width based on columns and container width
  const itemWidth = containerWidth > 0 ? (containerWidth - gap * (columns - 1)) / columns : 0;

  // NEW: Calculate dynamic average height from actual rendered items
  const getAverageHeight = () => {
    if (!enableVariableHeights || Object.keys(itemHeights).length === 0) {
      return itemHeight + gap;
    }
    const heights = Object.values(itemHeights);
    const sum = heights.reduce((a, b) => a + b, 0);
    return (sum / heights.length) + gap;
  };

  const dynamicRowHeight = getAverageHeight();

  // Total rows needed (based on dynamic height)
  const totalRows = Math.ceil(items.length / columns);
  const totalHeight = totalRows * dynamicRowHeight;

  // Handle scroll to update visible range
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const viewportHeight = window.innerHeight;

    // Calculate which rows are visible (use dynamic height)
    const startRow = Math.max(0, Math.floor((scrollTop - containerRef.current.offsetTop) / dynamicRowHeight) - overscan);
    const endRow = Math.min(
      totalRows,
      Math.ceil((scrollTop - containerRef.current.offsetTop + viewportHeight) / dynamicRowHeight) + overscan
    );

    const start = startRow * columns;
    const end = Math.min(items.length, endRow * columns);

    setVisibleRange({ start, end });
  }, [items.length, columns, dynamicRowHeight, totalRows, overscan]);

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

  // Callback to measure item height when rendered (must be before early return)
  const handleItemMeasure = useCallback((index, height) => {
    if (enableVariableHeights && height > 0) {
      setItemHeights(prev => {
        if (prev[index] === height) return prev;
        return { ...prev, [index]: height };
      });
    }
  }, [enableVariableHeights]);

  if (items.length === 0) {
    return <div ref={containerRef} className={containerClassName}>{emptyState}</div>;
  }

  // Create grid layout with spacer divs
  const visibleItems = items.slice(visibleRange.start, visibleRange.end);
  const topSpacerHeight = Math.floor(visibleRange.start / columns) * dynamicRowHeight;
  const bottomSpacerHeight = Math.max(0, (totalRows - Math.ceil(visibleRange.end / columns)) * dynamicRowHeight);

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
              onMeasure={handleItemMeasure}
              enableVarHeights={enableVariableHeights}
            />
          );
        })}
      </div>

      {/* Bottom spacer */}
      {bottomSpacerHeight > 0 && <div style={{ height: bottomSpacerHeight }} />}
    </div>
  );
}