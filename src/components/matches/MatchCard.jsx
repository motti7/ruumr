import React from "react";
import { motion } from "framer-motion";
import { MessageCircle, MapPin, FileText, Sparkles } from "lucide-react";
import SmartImage from '@/components/shared/SmartImage';
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { User } from '@/entities/User';

export default function MatchCard({ match, isOnline, onClickProfile, onClickChat, onClickCharter, matchId }) {
  const [showCharterHint, setShowCharterHint] = useState(false);

  useEffect(() => {
    const checkCharterStatus = async () => {
      try {
        const user = await User.me();
        const myAnswers = await base44.entities.CharterAnswer.filter({ 
          match_id: matchId, 
          user_id: user.id 
        });
        
        if (myAnswers.length === 0 || !myAnswers[0].is_complete) {
          setShowCharterHint(true);
        }
      } catch (e) {}
    };
    checkCharterStatus();
  }, [matchId]);
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
            className="relative text-white bg-gradient-to-r from-yellow-400 to-orange-500 p-3 rounded-full hover:brightness-110 transition-all shadow-md"
          >
            <FileText className="w-5 h-5" />
            {showCharterHint && (
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute -top-1 -right-1"
              >
                <Sparkles className="w-4 h-4 text-yellow-200" fill="currentColor" />
              </motion.div>
            )}
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