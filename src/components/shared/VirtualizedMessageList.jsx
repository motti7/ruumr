import React, { useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * VirtualizedMessageList — renders only visible messages to optimize performance.
 * Automatically scrolls to bottom when new messages arrive.
 * 
 * Props:
 *   - messages: Array of message objects
 *   - renderMessage: Function(message, index) => ReactNode
 *   - itemHeight: Approximate height of each item (default 60px)
 *   - containerHeight: Height of scrollable container (default '100%')
 *   - otherIsTyping: Boolean, shows typing indicator if true
 *   - renderTypingIndicator: Function (optional) custom typing bubble
 */
export default function VirtualizedMessageList({
  messages = [],
  renderMessage,
  itemHeight = 60,
  containerHeight = "100%",
  otherIsTyping = false,
  renderTypingIndicator,
}) {
  const containerRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const prevMessageCountRef = useRef(messages.length);

  // Calculate visible range
  const [visibleRange, setVisibleRange] = React.useState({ start: 0, end: 20 });

  const handleScroll = () => {
    if (!scrollAreaRef.current) return;

    const { scrollTop, clientHeight } = scrollAreaRef.current;
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - 2);
    const end = Math.min(messages.length, Math.ceil((scrollTop + clientHeight) / itemHeight) + 2);

    setVisibleRange({ start, end });
  };

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current || otherIsTyping) {
      prevMessageCountRef.current = messages.length;
      setTimeout(() => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
      }, 0);
    }
  }, [messages.length, otherIsTyping]);

  const visibleMessages = useMemo(
    () => messages.slice(visibleRange.start, visibleRange.end),
    [messages, visibleRange]
  );

  const offsetTop = visibleRange.start * itemHeight;
  const totalHeight = messages.length * itemHeight;

  return (
    <div
      ref={scrollAreaRef}
      onScroll={handleScroll}
      style={{
        height: containerHeight,
        overflowY: "auto",
        overflowX: "hidden",
      }}
      className="scroll-smooth"
    >
      {/* Spacer for above-viewport messages */}
      <div style={{ height: offsetTop }} />

      {/* Visible messages */}
      <div className="space-y-3 px-4">
        <AnimatePresence mode="popLayout">
          {visibleMessages.map((msg, idx) => (
            <motion.div
              key={msg.id || `${visibleRange.start}-${idx}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderMessage(msg, visibleRange.start + idx)}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        <AnimatePresence>
          {otherIsTyping && (
            renderTypingIndicator ? (
              renderTypingIndicator()
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex justify-start"
              >
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 flex items-center gap-1">
                  {[0, 0.15, 0.3].map((delay, i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-gray-400"
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay }}
                    />
                  ))}
                </div>
              </motion.div>
            )
          )}
        </AnimatePresence>
      </div>

      {/* Spacer for below-viewport messages */}
      <div style={{ height: Math.max(0, totalHeight - offsetTop - visibleRange.end * itemHeight) }} />
    </div>
  );
}