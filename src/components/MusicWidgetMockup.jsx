import React from 'react';
import { Music, Play } from 'lucide-react';

export default function MusicWidgetMockup() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-[320px]">
        {/* Music Widget */}
        <div className="w-full aspect-square rounded-[2.5rem] bg-white p-6 shadow-2xl relative overflow-hidden border-2 border-gray-100 flex flex-col items-center justify-center text-center">
          
          {/* Vinyl Record */}
          <div className="relative w-32 h-32 mb-6">
            <div className="w-full h-full rounded-full border-4 border-gray-200 bg-gradient-to-br from-gray-100 to-gray-200 shadow-lg overflow-hidden relative flex items-center justify-center">
              <Music className="w-12 h-12 text-gray-300" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 bg-white rounded-full border-3 border-gray-200 shadow-inner flex items-center justify-center">
                  <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                </div>
              </div>
            </div>
            {/* MY VIBE Badge */}
            <div className="absolute -top-2 -right-2 bg-[#FA3803] text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg z-10">
              MY VIBE
            </div>
          </div>

          {/* Text */}
          <h3 className="text-[#FA3803] font-black text-lg mb-2 truncate px-2">שם השיר</h3>
          <p className="text-[#FA3803] text-sm truncate px-4 mb-4 opacity-75">שם האמן</p>
          
          {/* Button */}
          <div className="mt-3 inline-flex items-center gap-1 bg-[#FFE8E2] hover:bg-[#FFDDD0] text-[#FA3803] text-xs px-4 py-2 rounded-full transition-colors font-semibold border-2 border-[#FA3803]">
            <Play className="w-3 h-3" /> בחר שיר או אמן
          </div>
        </div>

        {/* Legend */}
        <div className="mt-8 space-y-2 text-sm text-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-white border border-gray-300 rounded"></div>
            <span>Background: לבן (#FFFFFF)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-[#FA3803] rounded"></div>
            <span>Text & Icons: כתום (#FA3803)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-[#FFE8E2] border border-[#FA3803] rounded"></div>
            <span>Button: ורוד בהיר (#FFE8E2)</span>
          </div>
        </div>
      </div>
    </div>
  );
}