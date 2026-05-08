// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import { Check, X, ChevronDown } from 'lucide-react';

const CITIES = [
  "תל אביב-יפו", "ירושלים", "חיפה", "ראשון לציון", "פתח תקווה", "אשדוד", "נתניה", "באר שבע", "בני ברק", "חולון",
  "רמת גן", "אשקלון", "רחובות", "בת ים", "הרצליה", "כפר סבא", "חדרה", "מודיעין-מכבים-רעות", "לוד", "רעננה",
  "רמלה", "נצרת", "בית שמש", "נהריה", "קריית אתא", "גבעתיים", "קריית גת", "אילת", "עכו", "הוד השרון",
  "כרמיאל", "טבריה", "עפולה", "נס ציונה", "קריית מוצקין", "ראש העין", "קריית ים", "קריית ביאליק", "רמת השרון",
  "דימונה", "יבנה", "אור יהודה", "נתיבות", "יהוד-מונוסון", "צפת", "קריית אונו", "מגדל העמק", "ערד", "טמרה",
  "קצרין", "קריית שמונה", "סח'נין", "נשר", "מעלות-תרשיחא", "אופקים", "שדרות", "גבעת שמואל", "טירה", "טייבה"
].sort();

export default function CitySelect({ selectedCities = [], onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  const filtered = query.trim()
    ? CITIES.filter(c => c.includes(query.trim()))
    : CITIES;

  const toggleCity = (city) => {
    if (selectedCities.includes(city)) {
      onChange(selectedCities.filter(c => c !== city));
    } else {
      onChange([...selectedCities, city]);
      setQuery('');
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Main input trigger */}
      <div
        className="w-full min-h-[44px] px-3 py-2 rounded-md border border-input bg-white text-sm shadow-sm flex items-center gap-1.5 cursor-text"
        onClick={() => { setOpen(true); inputRef.current?.focus(); }}
      >
        {/* Selected city tags */}
        {selectedCities.length > 0 && (
          <div className="flex gap-1.5 flex-nowrap overflow-x-auto flex-shrink-0" style={{ scrollbarWidth: 'none' }}>
            {selectedCities.map((city) => (
              <span
                key={city}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 text-xs font-semibold whitespace-nowrap border border-orange-200 flex-shrink-0"
                style={{ color: '#FA3803' }}
              >
                {city}
                <span
                  role="button"
                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); toggleCity(city); }}
                  className="hover:text-red-500 cursor-pointer leading-none"
                >
                  <X className="h-3 w-3" />
                </span>
              </span>
            ))}
          </div>
        )}

        {/* Search input inline */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={selectedCities.length === 0 ? 'בחר ערים...' : ''}
          className="flex-1 min-w-[60px] bg-transparent outline-none border-none text-sm text-right placeholder-gray-400"
          style={{ boxShadow: 'none' }}
          dir="rtl"
        />

        <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0 ml-1" />
      </div>

      {/* Dropdown */}
      {open && filtered.length > 0 && (
        <div
          className="absolute z-50 w-full bg-white overflow-hidden"
          style={{
            top: 'calc(100% + 4px)',
            borderRadius: '12px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
            maxHeight: '132px',
            overflowY: 'auto',
          }}
        >
          {filtered.map((city) => (
            <div
              key={city}
              onMouseDown={(e) => { e.preventDefault(); toggleCity(city); }}
              className="flex items-center justify-between px-3 py-2.5 text-sm cursor-pointer hover:bg-orange-50 transition-colors"
            >
              <span>{city}</span>
              {selectedCities.includes(city) && <Check className="h-4 w-4 text-[--theme-orange]" />}
            </div>
          ))}
        </div>
      )}

      {open && query.trim() && filtered.length === 0 && (
        <div
          className="absolute z-50 w-full bg-white px-3 py-3 text-sm text-gray-400 text-right"
          style={{
            top: 'calc(100% + 4px)',
            borderRadius: '12px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
          }}
        >
          לא נמצאה עיר.
        </div>
      )}
    </div>
  );
}