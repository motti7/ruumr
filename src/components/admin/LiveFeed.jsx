import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";

export default function LiveFeed({ events }) {
  const bottomRef = useRef(null);

  // Subscribe to real-time match/swipe events
  useEffect(() => {
    // Subscriptions are handled in parent via polling
  }, []);

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  const typeStyle = {
    match: "text-pink-400",
    like: "text-orange-400",
    default: "text-gray-400",
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col h-[500px]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-400">Live Feed</h2>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-green-400">{events.length} אירועים</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
        {events.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-600 text-sm">
            ממתין לאירועים...
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {events.map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -10, height: 0 }}
                animate={{ opacity: 1, x: 0, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-start gap-3 p-3 rounded-xl bg-gray-800/60 border border-gray-700/50"
              >
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium leading-snug ${typeStyle[event.type] || typeStyle.default}`}>
                    {event.text}
                  </p>
                  <p className="text-[10px] text-gray-600 mt-0.5">{formatTime(event.time)}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}