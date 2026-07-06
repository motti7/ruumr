import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [local, setLocal] = useState({ kosher: 'all', shabbat: 'all', apartmentStatus: 'all', ...filters, maxAge: filters.maxAge ?? 60 });
  const [cityInput, setCityInput] = useState("");
  const [citySuggestions, setCitySuggestions] = useState([]);

  useEffect(() => {
    const handler = () => { setLocal({ kosher: 'all', shabbat: 'all', apartmentStatus: 'all', ...filters }); setCityInput(""); setOpen(true); };
    window.addEventListener('openDiscoverFilters', handler);
    return () => window.removeEventListener('openDiscoverFilters', handler);
  }, [filters]);

  const activeCount = [
    local.cities?.length > 0,
    local.maxBudget < 10000,
    local.minAge > 18 || local.maxAge < 50,
    local.kosher && local.kosher !== 'all',
    local.shabbat && local.shabbat !== 'all',
    local.apartmentStatus && local.apartmentStatus !== 'all',
  ].filter(Boolean).length;

  const apply = () => {
    onChange(local);
    setOpen(false);
  };

  const reset = () => {
    const defaults = { cities: [], minBudget: 0, maxBudget: 10000, minAge: 18, maxAge: 60, kosher: 'all', shabbat: 'all', apartmentStatus: 'all' };
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[300] flex items-end justify-center"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white rounded-t-3xl w-full max-w-md flex flex-col"
              style={{ maxHeight: '85dvh' }}
              dir={i18n.dir()}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between items-center px-6 pt-6 pb-4 flex-shrink-0">
                <h3 className="text-xl font-bold text-gray-900">{t("filters")}</h3>
                <button
                  aria-label={t("close_filters")}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="overflow-y-auto px-6 flex-1">

              {/* City free-text */}
              <div className="mb-6">
                <label className="text-sm font-bold text-gray-700 mb-2 block flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-[--theme-orange]" /> {t("desired_area")}
                </label>
                <div className="relative">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={cityInput}
                      onChange={handleCityInputChange}
                      onKeyDown={handleCityKeyDown}
                      placeholder={t("type_city")}
                      className="flex-1 border-2 border-gray-200 rounded-full px-4 py-2 text-sm outline-none focus:outline-none focus:ring-0 focus:border-[--theme-orange] transition-colors"
                      dir={i18n.dir()}
                    />
                    <button
                      onClick={() => addCity(cityInput)}
                      disabled={!cityInput.trim()}
                      className="px-4 py-2 rounded-full gradient-orange text-white text-sm font-bold disabled:opacity-40"
                    >
                      {t("add")}
                    </button>
                  </div>
                  {citySuggestions.length > 0 && (
                    <div className="absolute top-full right-0 left-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-lg z-10 overflow-hidden">
                      {citySuggestions.map(city => (
                        <button
                          key={city}
                          onMouseDown={(e) => { e.preventDefault(); addCity(city); }}
                          className="w-full text-right px-4 py-2.5 text-sm text-gray-800 hover:bg-orange-50 hover:text-[--theme-orange] transition-colors font-medium"
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
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-orange-50 border-2 border-[--theme-orange] text-[--theme-orange] text-sm font-semibold"
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
              <div className="mb-6">
                <label className="text-sm font-bold text-gray-700 mb-1 block">
                  {t("max_budget")} <span className="text-[--theme-orange]">₪{local.maxBudget.toLocaleString()}</span>
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
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>₪1,000</span>
                    <span>₪10,000</span>
                  </div>
                </div>
              </div>

              {/* Kosher */}
              <div className="mb-6">
                <label className="text-sm font-bold text-gray-700 mb-2 block">{t("onb_kosher_label")}</label>
                <div className="flex bg-gray-100 p-1 rounded-xl">
                  {[
                    { v: 'all', l: t('all') },
                    { v: 'for_or_flow', l: t('for_or_flexible') },
                    { v: 'against', l: t('pref_against') },
                  ].map(opt => (
                    <button
                      key={opt.v}
                      onClick={() => setLocal(prev => ({ ...prev, kosher: opt.v }))}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${local.kosher === opt.v ? 'bg-white shadow-sm text-black' : 'text-gray-400'}`}
                    >
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Shabbat */}
              <div className="mb-6">
                <label className="text-sm font-bold text-gray-700 mb-2 block">{t("shabbat_observance")}</label>
                <div className="flex bg-gray-100 p-1 rounded-xl">
                  {[
                    { v: 'all', l: t('all') },
                    { v: 'for_or_flow', l: t('for_or_flexible') },
                    { v: 'against', l: t('pref_against') },
                  ].map(opt => (
                    <button
                      key={opt.v}
                      onClick={() => setLocal(prev => ({ ...prev, shabbat: opt.v }))}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${local.shabbat === opt.v ? 'bg-white shadow-sm text-black' : 'text-gray-400'}`}
                    >
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Age Range */}
              <div className="mb-8">
                <label className="text-sm font-bold text-gray-700 mb-1 block">
                  {t("age_range")} <span className="text-[--theme-orange]">{local.minAge}-{local.maxAge}</span>
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
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>18</span>
                    <span>60</span>
                  </div>
                </div>
              </div>

              {/* Apartment Status */}
              <div className="mb-8">
                <label className="text-sm font-bold text-gray-700 mb-2 block">{t("apartment_status_filter")}</label>
                <div className="flex bg-gray-100 p-1 rounded-xl">
                  {[
                    { v: 'all', l: t('all') },
                    { v: 'has_apartment', l: t('apartment_status_has') },
                    { v: 'seeking_apartment', l: t('apartment_status_seeking') },
                  ].map(opt => (
                    <button
                      key={opt.v}
                      onClick={() => setLocal(prev => ({ ...prev, apartmentStatus: opt.v }))}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${local.apartmentStatus === opt.v ? 'bg-white shadow-sm text-black' : 'text-gray-400'}`}
                    >
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>
              </div>

              {/* Actions */}
              <div
                className="flex gap-3 px-6 pt-4 flex-shrink-0"
                style={{ paddingBottom: 'calc(1rem + var(--app-safe-area-bottom, env(safe-area-inset-bottom, 0px)))' }}
              >
                <button
                  onClick={reset}
                  className="flex-1 py-3 rounded-full border-2 border-gray-200 text-gray-600 font-bold text-sm"
                >
                  {t("reset")}
                </button>
                <button
                  onClick={apply}
                  className="flex-1 py-3 rounded-full gradient-orange text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg"
                >
                  <Check className="w-4 h-4" />
                  {t("apply_filters")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}