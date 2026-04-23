import React, { useState, useRef } from 'react';
import { Check, X, ChevronDown } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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

  const toggleCity = (city) => {
    if (selectedCities.includes(city)) {
      onChange(selectedCities.filter(c => c !== city));
    } else {
      onChange([...selectedCities, city]);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-full min-h-[44px] px-3 py-2 rounded-md border border-input bg-white text-sm shadow-sm flex items-center gap-1.5 overflow-x-auto text-right"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {selectedCities.length === 0 ? (
            <span className="text-gray-400 flex-1">בחר ערים...</span>
          ) : (
            <div className="flex gap-1.5 overflow-x-auto flex-nowrap flex-1" style={{ scrollbarWidth: 'none' }}>
              {selectedCities.map((city) => (
                <span
                  key={city}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 text-xs font-semibold whitespace-nowrap border border-orange-200 flex-shrink-0"
                >
                  {city}
                  <span
                    role="button"
                    onClick={(e) => { e.stopPropagation(); toggleCity(city); }}
                    className="hover:text-red-500 cursor-pointer leading-none"
                  >
                    <X className="h-3 w-3" />
                  </span>
                </span>
              ))}
            </div>
          )}
          <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0 ml-1" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <Command>
          <CommandInput placeholder="חפש עיר..." className="text-right" />
          <CommandList className="max-h-60 overflow-auto">
            <CommandEmpty>לא נמצאה עיר.</CommandEmpty>
            <CommandGroup>
              {CITIES.map((city) => (
                <CommandItem
                  key={city}
                  value={city}
                  onSelect={() => toggleCity(city)}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <span>{city}</span>
                  {selectedCities.includes(city) && <Check className="h-4 w-4 text-[--theme-orange]" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}