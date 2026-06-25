import React, { useState } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import { Trash2, UserPlus } from "lucide-react";

const ACTION_WIDTH = 88;

/**
 * Wraps a match row so it can be swiped horizontally to reveal an action:
 * - swipe right→left (negative x): reveals a Delete button on the RIGHT
 * - swipe left→right (positive x): reveals an Add-to-team button on the LEFT
 *
 * @param {{ onDelete?: () => void, onAddToTeam?: () => void, children: React.ReactNode }} props
 */
export default function SwipeableMatchRow({ onDelete, onAddToTeam, children }) {
  const x = useMotionValue(0);
  const [openSide, setOpenSide] = useState(null); // 'delete' | 'add' | null

  const settle = (target, side) => {
    animate(x, target, { type: "spring", stiffness: 500, damping: 42 });
    setOpenSide(side);
  };

  const close = () => settle(0, null);

  const handleDragEnd = (_e, info) => {
    const { offset, velocity } = info;
    if (offset.x < -ACTION_WIDTH / 2 || velocity.x < -500) settle(-ACTION_WIDTH, "delete");
    else if (offset.x > ACTION_WIDTH / 2 || velocity.x > 500) settle(ACTION_WIDTH, "add");
    else close();
  };

  return (
    <div className="relative rounded-2xl shadow-md overflow-hidden">
      {/* Add to team — left side, revealed on swipe right */}
      <button
        type="button"
        onClick={() => { onAddToTeam?.(); close(); }}
        tabIndex={openSide === "add" ? 0 : -1}
        aria-hidden={openSide !== "add"}
        className="absolute inset-y-0 left-0 flex flex-col items-center justify-center gap-1 gradient-orange text-white"
        style={{ width: ACTION_WIDTH }}
        aria-label="הוסף לצוות"
      >
        <UserPlus className="w-5 h-5" />
        <span className="text-[11px] font-bold leading-none">לצוות</span>
      </button>

      {/* Delete — right side, revealed on swipe left */}
      <button
        type="button"
        onClick={() => { onDelete?.(); close(); }}
        tabIndex={openSide === "delete" ? 0 : -1}
        aria-hidden={openSide !== "delete"}
        className="absolute inset-y-0 right-0 flex flex-col items-center justify-center gap-1 bg-red-500 text-white"
        style={{ width: ACTION_WIDTH }}
        aria-label="הסר התאמה"
      >
        <Trash2 className="w-5 h-5" />
        <span className="text-[11px] font-bold leading-none">מחק</span>
      </button>

      {/* Foreground card (opaque, covers the actions at rest) */}
      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -ACTION_WIDTH, right: ACTION_WIDTH }}
        dragElastic={0.08}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="relative z-10 bg-white dark:bg-gray-800 rounded-2xl"
      >
        {children}
      </motion.div>
    </div>
  );
}
