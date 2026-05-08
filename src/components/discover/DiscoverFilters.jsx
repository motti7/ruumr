import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, MapPin } from "lucide-react";
import { Slider } from "@/components/ui/slider";

const ISRAEL_CITIES = [
  "תל אביב", "ירושלים", "חיפה", "ראשון לציון", "פתח תקווה", "אשדוד", "נתניה", "באר שבע",
  "בני ברק", "חולון", "רמת גן", "אשקלון", "רחובות", "בת ים", "בית שמש", "כפר סבא",
  "הרצליה", "חדרה", "מודיעין", "לוד", "נס ציונה", "רמלה", "רעננה", "פ\"ת", "גבעתיים",
  "קריית גת", "אילת", "נהריה", "עפולה", "רהט", "קריית ביאליק", "קריית ים", "קריית מוצקין",
  "אום אל פחם", "הוד השרון", "טבריה", "קריית אתא", "קריית שמונה", "יבנה", "גבעת שמואל",
  "ראש העין", "נצרת", "נצרת עילית", "עכו", "כפר יונה", "אור יהודה", "מזכרת בתיה",
  "קרית אונו", "גדרה", "מעלה אדומים"
];

export default function DiscoverFilters({ filters, onChange }) {
  const [open, setOpen] = useState(false);
  const [local, setLocal] = useState({ ...filters, maxAge: filters.maxAge ?? 60 });
  const [cityInput, setCityInput] = useState("");
  const [citySuggestions, setCitySuggestions] = useState([]);

  useEffect(() => {
    const handler = () => { setLocal(filters); setCityInput(""); setOpen(true); };
    window.addEventListener('openDiscoverFilters', handler);
    return () => window.removeEventListener('openDiscoverFilters', handler);
  }, [filters]);

  const activeCount = [
    local.cities?.length > 0,
    local.maxBudget < 10000,
    local.minAge > 18 || local.maxAge < 60,
  ].filter(Boolean).length;

  const apply = () => {
    onChange(local);
    setOpen(false);
  };

  const reset = () => {
    const defaults = { cities: [], minBudget: 0, maxBudget: 10000, minAge: 18, maxAge: 60 };
    setLocal(defaults);
    setCityInput("");
    onChange(defaults);
    setOpen(false);
  };

  const addCity = (city) => {
    const trimmed = city.trim();
    if (!trimmed || local.cities.includes(trimmed)) return;
    setLocal(prev => ({ ...prev, cities: [...prev.cities, trimmed] }));
    setCityInput("");
    setCitySuggestions([]);
  };

  const removeCity = (city) => {
    setLocal(prev => ({ ...prev, cities: prev.cities.filter(c => c !== city) }));
  };

  const handleCityKeyDown = (e) => {
    if (e.key === "Enter") addCity(cityInput);
  };

  const handleCityInputChange = (e) => {
    const val = e.target.value;
    setCityInput(val);
    if (val.trim().length >= 1) {
      const matches = ISRAEL_CITIES.filter(c => c.includes(val.trim()) && !local.cities.includes(c));
      setCitySuggestions(matches.slice(0, 5));
    } else {
      setCitySuggestions([]);
    }
  };

  return (
    <>
      {/* Bottom Sheet */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-end justify-center bg-slate-950/45 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full max-w-md rounded-t-[2.25rem] border border-white/70 bg-[linear-gradient(180deg,#ffffff_0%,#fffaf4_100%)] p-5 shadow-[0_-28px_90px_rgba(15,23,42,0.18)]"
              style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom) + 80px)' }}
              dir="rtl"
              onClick={e => e.stopPropagation()}
            >
              <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-slate-200/80" />

              {/* Header */}
              <div className="mb-6 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[--theme-orange]">Refine</p>
                  <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-950">פילטרים</h3>
                </div>
                <span className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-[--theme-orange] ring-1 ring-orange-100">
                  {activeCount} active
                </span>
                <button
                  aria-label="סגור פילטרים"
                  onClick={() => setOpen(false)}
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white/80 text-slate-400 shadow-sm ring-1 ring-slate-200 transition-colors hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* City free-text */}
              <div className="mb-5 rounded-[1.75rem] border border-white/70 bg-white/75 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                <label className="mb-2 block flex items-center gap-1 text-sm font-bold text-slate-700">
                  <MapPin className="h-4 w-4 text-[--theme-orange]" /> אזור מגורים רצוי
                </label>
                <div className="relative">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={cityInput}
                      onChange={handleCityInputChange}
                      onKeyDown={handleCityKeyDown}
                      placeholder="הקלד עיר..."
                      className="flex-1 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-[--theme-orange] focus:ring-4 focus:ring-orange-100"
                      dir="rtl"
                    />
                    <button
                      onClick={() => addCity(cityInput)}
                      disabled={!cityInput.trim()}
                      className="rounded-2xl px-4 py-3 text-sm font-bold text-white shadow-lg shadow-orange-200/60 transition-transform disabled:cursor-not-allowed disabled:opacity-40"
                      style={{ background: 'linear-gradient(135deg, var(--theme-orange) 0%, var(--theme-orange-dark) 100%)' }}
                    >
                      הוסף
                    </button>
                  </div>
                  {citySuggestions.length > 0 && (
                    <div className="absolute top-full right-0 left-0 z-10 mt-2 overflow-hidden rounded-2xl border border-white/80 bg-white shadow-[0_20px_40px_rgba(15,23,42,0.12)]">
                      {citySuggestions.map(city => (
                        <button
                          key={city}
                          onMouseDown={(e) => { e.preventDefault(); addCity(city); }}
                          className="w-full px-4 py-3 text-right text-sm font-medium text-slate-800 transition-colors hover:bg-orange-50 hover:text-[--theme-orange]"
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {local.cities.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {local.cities.map(city => (
                      <span
                        key={city}
                        className="flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-sm font-semibold text-[--theme-orange]"
                      >
                        {city}
                        <button onClick={() => removeCity(city)} className="ml-1">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Budget */}
              <div className="mb-5 rounded-[1.75rem] border border-white/70 bg-white/75 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  תקציב מקסימלי: <span className="text-[--theme-orange]">₪{local.maxBudget.toLocaleString()}</span>
                </label>
                <div dir="ltr">
                  <Slider
                    value={[local.maxBudget]}
                    min={1000}
                    max={10000}
                    step={100}
                    onValueChange={([v]) => setLocal(prev => ({ ...prev, maxBudget: v }))}
                    className="py-3"
                  />
                  <div className="mt-1 flex justify-between text-xs text-slate-400">
                    <span>₪1,000</span>
                    <span>₪10,000</span>
                  </div>
                </div>
              </div>

              {/* Age Range */}
              <div className="mb-6 rounded-[1.75rem] border border-white/70 bg-white/75 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  טווח גילאים: <span className="text-[--theme-orange]">{local.minAge}-{local.maxAge}</span>
                </label>
                <div dir="ltr">
                  <Slider
                    value={[local.minAge, local.maxAge]}
                    min={18}
                    max={60}
                    step={1}
                    onValueChange={([min, max]) => setLocal(prev => ({ ...prev, minAge: min, maxAge: max }))}
                    className="py-3"
                  />
                  <div className="mt-1 flex justify-between text-xs text-slate-400">
                    <span>18</span>
                    <span>60</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={reset}
                  className="flex-1 rounded-2xl border border-slate-200 bg-white/80 py-3 text-sm font-bold text-slate-600 shadow-sm transition-colors hover:bg-white"
                >
                  איפוס
                </button>
                <button
                  onClick={apply}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-white shadow-lg shadow-orange-200/60"
                  style={{ background: 'linear-gradient(135deg, var(--theme-orange) 0%, var(--theme-orange-dark) 100%)' }}
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
