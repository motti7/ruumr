/**
 * Mobile-friendly bottom sheet replacement for <Select>.
 * Renders a tap target that opens a bottom sheet with full-size option rows.
 */
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, X } from "lucide-react";

export default function BottomSheetSelect({
  value,
  onValueChange,
  options = [],        // [{ value, label }]
  placeholder = "בחר...",
  disabled = false,
  label,
  dir = "rtl",
  className = "",
}) {
  const [open, setOpen] = useState(false);

  const selectedLabel = options.find(o => o.value === value)?.label ?? placeholder;

  const handleSelect = (val) => {
    onValueChange?.(val);
    setOpen(false);
  };

  return (
    <>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label ? `${label}: ${selectedLabel}` : selectedLabel}
        onClick={() => !disabled && setOpen(true)}
        className={`flex items-center justify-between w-full min-h-[44px] px-4 py-2 rounded-md border border-input bg-white text-sm shadow-sm transition-colors
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-gray-50 active:scale-[0.98]"}
          ${className}`}
        dir={dir}
      >
        <span className={value ? "text-gray-900" : "text-gray-400"}>{selectedLabel}</span>
        <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
      </button>

      {/* Bottom Sheet */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] flex items-end justify-center bg-black/50"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="bg-white rounded-t-3xl w-full max-w-md overflow-hidden"
              style={{ paddingBottom: "calc(1rem + var(--app-safe-area-bottom, env(safe-area-inset-bottom, 0px)))" }}
              dir={dir}
              onClick={e => e.stopPropagation()}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>

              {/* Header */}
              {label && (
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900 text-base">{label}</h3>
                  <button
                    aria-label="סגור"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full text-gray-400 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Options */}
              <div role="listbox" aria-label={label}>
                {options.map(option => (
                  <button
                    key={option.value}
                    role="option"
                    aria-selected={value === option.value}
                    onClick={() => handleSelect(option.value)}
                    className={`flex items-center justify-between w-full min-h-[52px] px-5 text-base transition-colors
                      ${value === option.value
                        ? "text-[--theme-orange] font-bold bg-orange-50"
                        : "text-gray-800 hover:bg-gray-50 active:bg-gray-100"
                      }`}
                  >
                    <span>{option.label}</span>
                    {value === option.value && <Check className="w-5 h-5 text-[--theme-orange]" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}