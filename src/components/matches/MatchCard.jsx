import React from "react";
import { motion } from "framer-motion";
import { MessageCircle, MapPin } from "lucide-react";

export default function MatchCard({ match, onClickProfile, onClickChat }) {
  const handleProfileClick = (e) => {
    e.stopPropagation();
    onClickProfile();
  };

  const handleChatClick = (e) => {
    e.stopPropagation();
    onClickChat();
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
          <img
            src={match.photos?.[0] || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face"}
            alt={match.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-gray-100"
          />
          <div className="absolute -bottom-1 -left-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white" />
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
        
        <motion.div 
          whileTap={{ scale: 0.85 }}
          onClick={handleChatClick}
          className="text-[--theme-orange] bg-orange-50 p-3 rounded-full hover:bg-orange-100 transition-colors"
        >
          <MessageCircle className="w-6 h-6" />
        </motion.div>
      </div>
    </motion.div>
  );
}