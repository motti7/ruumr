import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Puzzle } from 'lucide-react';
import { Match, Profile } from '@/entities/all';
import { User } from '@/entities/User';
import RoomiCharter from './RoomiCharter';
import SmartImage from '@/components/shared/SmartImage';

export default function CharterMatchSelector({ onClose }) {
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadMatches = async () => {
      try {
        const userData = await User.me();
        setUser(userData);

        const userMatches = await Match.filter({ user1_id: userData.id });
        const userMatches2 = await Match.filter({ user2_id: userData.id });
        const allMatches = [...userMatches, ...userMatches2];

        const matchesWithProfiles = await Promise.all(
          allMatches.map(async (match) => {
            const otherUserId = match.user1_id === userData.id ? match.user2_id : match.user1_id;
            const profiles = await Profile.filter({ user_id: otherUserId });
            
            // בדיקה אם המשתמש הנוכחי כבר ענה על כל השאלות
            const { base44 } = require('@/api/base44Client');
            const myAnswers = await base44.entities.CharterAnswer.filter({ 
              match_id: match.id,
              user_id: userData.id 
            });
            
            return {
              ...match,
              profile: profiles[0] || null,
              myAnswersCount: myAnswers.length
            };
          })
        );
        
        setMatches(matchesWithProfiles.filter(m => m.profile));
      } catch (error) {
        console.error("Error loading matches:", error);
      }
      setIsLoading(false);
    };
    loadMatches();
  }, []);

  if (selectedMatch) {
    const myProfile = { name: user?.full_name || 'אני' };
    const theirProfile = selectedMatch.profile;
    
    return (
      <RoomiCharter
        matchId={selectedMatch.id}
        user1Name={myProfile.name}
        user2Name={theirProfile.name}
        onClose={() => setSelectedMatch(null)}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
      dir="rtl"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-yellow-400 p-6 pb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-black text-white">חוזה שותפות 🤝</h1>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/30 active:scale-95 transition-transform"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
          <p className="text-white/90 text-sm">
            בחר עם מי תרצה/י לבדוק התאמה
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-gray-50 p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <motion.div
                className="w-12 h-12 rounded-full gradient-orange flex items-center justify-center"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <MessageCircle className="w-6 h-6 text-white" />
              </motion.div>
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center py-20">
              <div className="relative w-24 h-24 mx-auto mb-4">
                <Puzzle className="w-24 h-24 text-[--theme-orange]" />
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">צריך להתאים עם מישהו קודם</h3>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {matches.map((match, i) => (
                <motion.button
                  key={match.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedMatch(match)}
                  className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-shadow active:scale-95"
                >
                  <div className="aspect-[3/4] relative">
                    <SmartImage 
                      src={match.profile.photos?.[0]} 
                      className="w-full h-full" 
                      alt={match.profile.name}
                      priority={false}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-3">
                      <h3 className="text-white font-bold text-lg">{match.profile.name}</h3>
                      <p className="text-white/80 text-xs">{match.profile.age}</p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}