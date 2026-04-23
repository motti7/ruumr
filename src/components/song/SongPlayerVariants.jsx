import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Music, Disc3 } from 'lucide-react';

const SongPlayerVariants = ({ song = { name: 'Dreams in Motion', artist: 'Neon Nights', image: null }, onSelect = () => {} }) => {
  const [selectedVariant, setSelectedVariant] = useState(null);

  const handleSelect = (variant) => {
    setSelectedVariant(variant);
    onSelect(variant);
  };

  // Variant A: Geometric Glow
  const VariantA = () => (
    <div className="w-full aspect-square max-w-[320px] mx-auto relative group">
      <div className="absolute inset-0 rounded-[2.5rem] bg-white border-2" style={{ borderColor: '#FA3803' }}>
        {/* Glowing effect layers */}
        <div className="absolute inset-0 rounded-[2.5rem] opacity-20" style={{ backgroundColor: '#FA3803', boxShadow: '0 0 40px rgba(250, 56, 3, 0.3) inset, 0 0 60px rgba(250, 56, 3, 0.2)' }} />
        
        {/* Geometric shapes */}
        <div className="absolute top-6 right-6 w-16 h-16 border-2 rounded-lg" style={{ borderColor: '#FA3803', opacity: 0.3 }} />
        <div className="absolute bottom-6 left-6 w-12 h-12 border-2 rounded-full" style={{ borderColor: '#FFB29D', opacity: 0.4 }} />
        
        {/* Content */}
        <div className="relative h-full flex flex-col items-center justify-center p-8 text-center z-10">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br mb-6 flex items-center justify-center border-2" style={{ backgroundImage: 'linear-gradient(135deg, #FFE8E2 0%, #FFB29D 100%)', borderColor: '#FA3803' }}>
            {song.image ? (
              <img src={song.image} className="w-full h-full object-cover rounded-xl" alt={song.name} />
            ) : (
              <Music className="w-12 h-12" style={{ color: '#FA3803' }} />
            )}
          </div>
          
          <h3 className="text-lg font-black mb-2" style={{ color: '#FA3803' }}>{song.name}</h3>
          <p className="text-sm" style={{ color: '#FFB29D' }}>{song.artist}</p>
          
          {/* Speaker icon */}
          <div className="mt-6 flex gap-1">
            {[0.3, 0.6, 1].map((scale, i) => (
              <motion.div
                key={i}
                animate={{ scaleY: [0.5, 1, 0.5] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }}
                className="w-1.5 rounded-full"
                style={{ backgroundColor: '#FA3803', height: `${20 * scale}px` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Variant B: Gradient Vibe (Sunburst)
  const VariantB = () => (
    <div className="w-full aspect-square max-w-[320px] mx-auto relative group">
      <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(135deg, #FFE8E2 0%, #FFB29D 50%, #FA3803 100%)' }} />
        
        {/* Sunburst radiating lines */}
        <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 100">
          {Array.from({ length: 12 }).map((_, i) => (
            <line
              key={i}
              x1="50"
              y1="50"
              x2="50"
              y2="5"
              stroke="white"
              strokeWidth="0.5"
              transform={`rotate(${(i * 30)}deg) origin(50px 50px)`}
            />
          ))}
        </svg>

        {/* Content container */}
        <div className="relative h-full flex flex-col items-center justify-center p-8 text-center z-10">
          {/* Album art with glow */}
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="w-28 h-28 rounded-3xl mb-6 flex items-center justify-center shadow-2xl border-4 border-white/50"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
          >
            {song.image ? (
              <img src={song.image} className="w-full h-full object-cover rounded-2xl" alt={song.name} />
            ) : (
              <Music className="w-14 h-14 text-white" />
            )}
          </motion.div>
          
          <h3 className="text-2xl font-black mb-2 text-white drop-shadow-lg">{song.name}</h3>
          <p className="text-sm text-white/90 drop-shadow-md">{song.artist}</p>
          
          {/* Pulsing dot indicator */}
          <motion.div
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="mt-6 w-3 h-3 rounded-full bg-white"
          />
        </div>
      </div>
    </div>
  );

  // Variant C: Retro Tech (Vinyl)
  const VariantC = () => (
    <div className="w-full aspect-square max-w-[320px] mx-auto relative group">
      <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br p-6" style={{ backgroundImage: 'linear-gradient(135deg, #FFE8E2 0%, #FFB29D 100%)' }}>
        
        {/* Vinyl record container */}
        <div className="relative h-full flex flex-col items-center justify-center">
          {/* Outer vinyl ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="w-32 h-32 rounded-full border-8 mb-6 relative flex items-center justify-center shadow-xl"
            style={{ borderColor: '#FA3803' }}
          >
            {/* Inner album label */}
            <div className="absolute w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FA3803' }}>
              {song.image ? (
                <img src={song.image} className="w-full h-full object-cover rounded-full" alt={song.name} />
              ) : (
                <Music className="w-10 h-10 text-white" />
              )}
            </div>
            
            {/* Vinyl grooves effect */}
            <div className="absolute inset-2 rounded-full border-4 border-opacity-20" style={{ borderColor: '#FA3803' }} />
            <div className="absolute inset-4 rounded-full border-2 border-opacity-20" style={{ borderColor: '#FA3803' }} />
          </motion.div>
          
          <h3 className="text-lg font-black text-center mb-1" style={{ color: '#FA3803' }}>{song.name}</h3>
          <p className="text-sm text-center" style={{ color: '#FA3803', opacity: 0.8 }}>{song.artist}</p>
          
          {/* Stylus indicator */}
          <div className="mt-6 flex items-center gap-2">
            <div className="w-2 h-8 rounded-full" style={{ backgroundColor: '#FA3803' }} />
            <div className="text-xs font-bold" style={{ color: '#FA3803' }}>PLAYING</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-gray-50 rounded-2xl">
      <h2 className="text-3xl font-black text-center mb-2">עיצובים חדשים לנשנ השיר</h2>
      <p className="text-center text-gray-600 mb-8">בחר את העיצוב שאתה אוהב ביותר</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Variant A */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          onClick={() => handleSelect('geometric')}
          className={`cursor-pointer p-6 rounded-2xl transition-all border-2 ${
            selectedVariant === 'geometric' ? 'border-[#FA3803] bg-orange-50 shadow-lg' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <VariantA />
          <p className="text-center font-bold mt-4 mb-2">Geometric Glow</p>
          <p className="text-center text-sm text-gray-600">צורות הנדסיות נקיות עם אפקטי זוהר עדינים</p>
        </motion.div>

        {/* Variant B */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          onClick={() => handleSelect('gradient')}
          className={`cursor-pointer p-6 rounded-2xl transition-all border-2 ${
            selectedVariant === 'gradient' ? 'border-[#FA3803] bg-orange-50 shadow-lg' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <VariantB />
          <p className="text-center font-bold mt-4 mb-2">Gradient Vibe</p>
          <p className="text-center text-sm text-gray-600">תדרגים רכים עם אפקטי קרינה סנברסט</p>
        </motion.div>

        {/* Variant C */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          onClick={() => handleSelect('vinyl')}
          className={`cursor-pointer p-6 rounded-2xl transition-all border-2 ${
            selectedVariant === 'vinyl' ? 'border-[#FA3803] bg-orange-50 shadow-lg' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <VariantC />
          <p className="text-center font-bold mt-4 mb-2">Retro Tech</p>
          <p className="text-center text-sm text-gray-600">ויניל בעיצוב טכנו ריטרו מודרני</p>
        </motion.div>
      </div>

      {selectedVariant && (
        <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
          <p className="text-green-800 font-medium">✓ בחרת: <span className="font-black">{
            selectedVariant === 'geometric' ? 'Geometric Glow' :
            selectedVariant === 'gradient' ? 'Gradient Vibe' :
            'Retro Tech'
          }</span></p>
        </div>
      )}
    </div>
  );
};

export default SongPlayerVariants;