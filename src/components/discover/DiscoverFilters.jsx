import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, X, Check } from "lucide-react";
import { Slider } from "@/components/ui/slider";

const CITIES = ["תל אביב", "ירושלים", "חיפה", "ראשון לציון", "פתח תקווה", "אשדוד", "נתניה", "באר שבע", "בני ברק", "רמת גן", "הרצליה", "חולון", "רחובות"];

export default function DiscoverFilters({ filters, onChange }) {
  const [open, setOpen] = useState(false);
  const [local, setLocal] = useState(filters);

  const activeCount = [
    local.cities?.length > 0,
    local.maxBudget < 10000,
    local.minAge > 18 || local.maxAge < 50,
  ].filter(Boolean).length;

  const apply = () => {
    onChange(local);
    setOpen(false);
  };

  const reset = () => {
    const defaults = { cities: [], minBudget: 0, maxBudget: 10000, minAge: 18, maxAge: 50 };
    setLocal(defaults);
    onChange(defaults);
    setOpen(false);
  };

  const toggleCity = (city) => {
    setLocal(prev => ({
      ...prev,
      cities: prev.cities.includes(city)
        ? prev.cities.filter(c => c !== city)
        : [...prev.cities, city]
    }));
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => { setLocal(filters); setOpen(true); }}
        className="relative flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-full shadow-md border border-gray-100 text-sm font-semibold text-gray-700 active:scale-95 transition-transform"
      >
        <SlidersHorizontal className="w-4 h-4 text-[--theme-orange]" />
        פילטרים
        {activeCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-[--theme-orange] text-white text-[9px] font-black rounded-full flex items-center justify-center">
            {activeCount}
          </span>
        )}
      </button>

      {/* Bottom Sheet */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[300] flex items-end justify-center"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white rounded-t-3xl w-full max-w-md p-6"
              style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom) + 80px)' }}
              dir="rtl"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-gray-900">פילטרים</h3>
                <button onClick={() => setOpen(false)}>
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Cities */}
              <div className="mb-6">
                <label className="text-sm font-bold text-gray-700 mb-3 block">אזור מגורים</label>
                <div className="flex flex-wrap gap-2">
                  {CITIES.map(city => {
                    const selected = local.cities.includes(city);
                    return (
                      <button
                        key={city}
                        onClick={() => toggleCity(city)}
                        className={`px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition-all ${
                          selected
                            ? 'border-[--theme-orange] bg-orange-50 text-[--theme-orange]'
                            : 'border-gray-200 bg-white text-gray-600'
                        }`}
                      >
                        {city}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Budget */}
              <div className="mb-6">
                <label className="text-sm font-bold text-gray-700 mb-1 block">
                  תקציב מקסימלי: <span className="text-[--theme-orange]">₪{local.maxBudget.toLocaleString()}</span>
                </label>
                <Slider
                  value={[local.maxBudget]}
                  min={1000}
                  max={10000}
                  step={100}
                  onValueChange={([v]) => setLocal(prev => ({ ...prev, maxBudget: v }))}
                  className="py-3"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>₪10,000</span>
                  <span>₪1,000</span>
                </div>
              </div>

              {/* Age Range */}
              <div className="mb-8">
                <label className="text-sm font-bold text-gray-700 mb-1 block">
                  טווח גילאים: <span className="text-[--theme-orange]">{local.minAge}–{local.maxAge}</span>
                </label>
                <Slider
                  value={[local.minAge, local.maxAge]}
                  min={18}
                  max={50}
                  step={1}
                  onValueChange={([min, max]) => setLocal(prev => ({ ...prev, minAge: min, maxAge: max }))}
                  className="py-3"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>50</span>
                  <span>18</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={reset}
                  className="flex-1 py-3 rounded-full border-2 border-gray-200 text-gray-600 font-bold text-sm"
                >
                  איפוס
                </button>
                <button
                  onClick={apply}
                  className="flex-1 py-3 rounded-full gradient-orange text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg"
                >
                  <Check className="w-4 h-4" />
                  החל פילטרים
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}