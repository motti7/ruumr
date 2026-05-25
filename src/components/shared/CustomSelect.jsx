import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function CustomSelect({ label, value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selected = options.find((o) => o.v === value);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, []);

  return (
    <div ref={ref} className="relative">
      {label &&
      <label className="text-sm font-bold block mb-2 py-1" style={{ color: '#FA3803' }}>{label}</label>
      }
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full h-11 px-3 rounded-md border border-gray-200 bg-gray-50 text-sm text-gray-800 flex items-center justify-between gap-2 transition-colors"
        style={{ borderColor: open ? '#FA3803' : undefined }}>
        
        <span>{selected ? selected.l : 'בחר/י'}</span>
        <ChevronDown
          className="w-4 h-4 flex-shrink-0 transition-transform"
          style={{ color: '#FA3803', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
        
      </button>

      {open &&
      <div
        className="absolute z-50 w-full bg-white rounded-2xl overflow-y-auto"
        style={{
          top: 'calc(100% + 4px)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          maxHeight: '220px'
        }}>
        
          {options.map((opt) =>
        <button
          key={opt.v}
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            onChange(opt.v);
            setOpen(false);
          }}
          className="w-full px-4 py-3 text-sm text-black text-right flex items-center justify-between hover:bg-gray-50 transition-colors">
          
              <span>{opt.l}</span>
              {value === opt.v && <Check className="w-4 h-4 flex-shrink-0" style={{ color: '#FA3803' }} />}
            </button>
        )}
        </div>
      }
    </div>);

}