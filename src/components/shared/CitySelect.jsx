import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between text-right h-auto min-h-[40px]">
            {selectedCities.length > 0 ? `${selectedCities.length} ערים נבחרו` : "בחר ערים..."}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="חפש עיר..." className="text-right" />
            <CommandList className="max-h-60 overflow-auto custom-scrollbar">
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
      
      <div className="flex flex-wrap gap-2 mt-2">
        {selectedCities.map((city) => (
          <Badge key={city} variant="secondary" className="px-3 py-1 flex items-center gap-2 bg-orange-50 text-orange-700 hover:bg-orange-100">
            {city}
            <X 
              className="h-3 w-3 cursor-pointer hover:text-red-500" 
              onClick={(e) => {
                e.stopPropagation();
                toggleCity(city);
              }}
            />
          </Badge>
        ))}
      </div>
    </div>
  );
}