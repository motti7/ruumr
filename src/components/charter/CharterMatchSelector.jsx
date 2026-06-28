import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { X, Puzzle } from 'lucide-react';
import { Match, Profile } from '@/entities/all';
import { User } from '@/entities/User';
import SmartImage from '@/components/shared/SmartImage';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function CharterMatchSelector({ onClose }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMatches = async () => {
      try {
        const userData = await User.me();
        const userMatches = await Match.filter({ user1_id: userData.id, status: 'active' });
        const userMatches2 = await Match.filter({ user2_id: userData.id, status: 'active' });
        const allMatches = [...userMatches, ...userMatches2];

        const matchesWithProfiles = await Promise.all(
          allMatches.map(async (match) => {
            const otherUserId = match.user1_id === userData.id ? match.user2_id : match.user1_id;
            const profiles = await Profile.filter({ user_id: otherUserId });
            
            return {
              ...match,
              profile: profiles[0] || null
            };
          })
        );
        
        const validMatches = matchesWithProfiles.filter(m => m.profile);
        console.log("Found matches:", validMatches.length, validMatches);
        setMatches(validMatches);
      } catch (error) {
        console.error("Error loading matches:", error);
      }
      setIsLoading(false);
    };
    loadMatches();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
      dir={i18n.dir()}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-black p-6 pb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-black text-white">{t("partnership_charter")}</h1>
            <button
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/30 active:scale-95 transition-transform"
              aria-label={t("close")}
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
          <p className="text-white/90 text-sm">
            {t("choose_who_to_check")}
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
                <Puzzle className="w-6 h-6 text-white" aria-hidden="true" />
              </motion.div>
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center py-20">
              <div className="relative w-24 h-24 mx-auto mb-4">
                <Puzzle className="w-24 h-24 text-[--theme-orange]" />
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">{t("need_match_first")}</h3>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {matches.map((match, i) => (
                <motion.button
                  key={match.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => {
                    onClose();
                    navigate(createPageUrl('Charter') + `?matchId=${match.id}`);
                  }}
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
