import React from "react";
import { motion } from "framer-motion";
import { MessageCircle, MapPin, Puzzle } from "lucide-react";
import SmartImage from '@/components/shared/SmartImage';

export default function MatchCard({ match, isOnline, onClickProfile, onClickChat, onClickCharter, matchId }) {
  const handleProfileClick = (e) => {
    e.stopPropagation();
    onClickProfile();
  };

  const handleChatClick = (e) => {
    e.stopPropagation();
    onClickChat();
  };

  const handleCharterClick = (e) => {
    e.stopPropagation();
    onClickCharter();
  };

  return (
    <motion.div
      whileTap={{ scale: 0.93 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      onClick={handleProfileClick}
      className="bg-white rounded-2xl shadow-md border border-gray-100 cursor-pointer overflow-hidden hover:shadow-xl"
    >
      <div className="flex items-center p-4" dir="rtl">
        <div className="relative ml-4">
          <div className="w-16 h-16 rounded-full border-2 border-gray-100 overflow-hidden">
            <SmartImage
              src={match.photos?.[0] || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face"}
              alt={match.name}
              className="w-full h-full"
              priority={false}
            />
          </div>
          {/* Online status removed */}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-lg mb-1">{match.name}</h3>
          <div className="flex items-center text-gray-500 text-sm mb-2">
            <MapPin className="w-3 h-3 ml-1" />
            <span>{match.location}</span>
          </div>
          <div className="flex items-center text-gray-500 text-sm">
            <span>תקציב: ₪{match.budget_max?.toLocaleString()}</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <motion.div 
            whileTap={{ scale: 0.85 }}
            onClick={handleCharterClick}
            className="text-white bg-white p-3 rounded-full hover:brightness-110 transition-all shadow-md"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path d="M8 3H3v5h2v2h3V8h2V6h-2V3zm8 0h5v5h-2v2h-3V8h-2V6h2V3z" fill="#FF5722"/>
              <path d="M3 11v5h2v-2h3v2h2v-3H8v-2H3zm13 0v5h-2v-2h-3v2h-2v-3h2v-2h5z" fill="#E64A19"/>
              <path d="M8 16v5H3v-5h2v2h3v-2h3zm8 0v5h5v-5h-2v2h-3v-2h-3z" fill="#FF5722"/>
            </svg>
          </motion.div>
          <motion.div 
            whileTap={{ scale: 0.85 }}
            onClick={handleChatClick}
            className="text-[--theme-orange] bg-orange-50 p-3 rounded-full hover:bg-orange-100 transition-colors"
          >
            <MessageCircle className="w-6 h-6" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}