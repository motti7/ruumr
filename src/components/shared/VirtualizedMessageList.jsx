// @ts-nocheck
import React, { useEffect, useRef, memo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MemoizedMessageBubble = memo(({ message, index, renderMessage }) => (
  <motion.div
    key={message.id || `${index}`}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.2 }}
  >
    {renderMessage(message, index)}
  </motion.div>
));

MemoizedMessageBubble.displayName = 'MemoizedMessageBubble';

const TypingIndicator = memo(({ renderTypingIndicator }) => (
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
));

TypingIndicator.displayName = 'TypingIndicator';

/**
 * VirtualizedMessageList — renders all messages with auto-scroll on new arrivals.
 * Uses natural DOM height for variable-size chat messages.
 */
const VirtualizedMessageList = /** @type {any} */ (function VirtualizedMessageList({
  messages = [],
  renderMessage,
  containerHeight = "100%",
  otherIsTyping = false,
  renderTypingIndicator,
}) {
  const scrollAreaRef = useRef(null);
  const prevMessageCountRef = useRef(messages.length);
  const isNearBottomRef = useRef(true);

  const checkNearBottom = useCallback(() => {
    if (!scrollAreaRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
    isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 100;
  }, []);

  const scrollToBottom = useCallback(() => {
    if (!scrollAreaRef.current) return;
    requestAnimationFrame(() => {
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
      }
    });
  }, []);

  useEffect(() => {
    if (messages.length > prevMessageCountRef.current || otherIsTyping) {
      if (isNearBottomRef.current) {
        scrollToBottom();
      }
    }
    prevMessageCountRef.current = messages.length;
  }, [messages.length, otherIsTyping, scrollToBottom]);

  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  return (
    <div
      ref={scrollAreaRef}
      onScroll={checkNearBottom}
      style={{
        height: containerHeight,
        overflowY: "auto",
        overflowX: "hidden",
      }}
      className="scroll-smooth"
    >
      <div className="space-y-3 px-4 py-2">
        <AnimatePresence mode="popLayout">
          {messages.map((msg, idx) => (
            <MemoizedMessageBubble
              key={msg.id || idx}
              message={msg}
              index={idx}
              renderMessage={renderMessage}
            />
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {otherIsTyping && (
            <TypingIndicator renderTypingIndicator={renderTypingIndicator} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

export default VirtualizedMessageList;
