
import React, { useState, useEffect, useCallback } from "react";
import { Match, Profile } from "@/entities/all";
import { User } from "@/entities/User";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import MatchCard from "../components/matches/MatchCard";

export default function MatchesPage() {
  const [matches, setMatches] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadMatches = useCallback(async () => {
    setIsLoading(true);
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
          return {
            ...match,
            profile: profiles[0] || null,
          };
        })
      );
      
      setMatches(matchesWithProfiles.filter(m => m.profile));
    } catch (error) {
      console.error("Error loading matches:", error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <motion.div
            className="w-12 h-12 rounded-full gradient-orange flex items-center justify-center"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
            <Heart className="w-6 h-6 text-white" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24" dir="rtl">
      <div className="sticky top-16 bg-gray-50 z-10 p-4 pb-2">
        <h1 className="text-3xl font-black text-gray-900 mb-2">התאמות</h1>
        {matches.length > 0 && (
          <p className="font-medium text-[--theme-orange]">
            {matches.length} {matches.length === 1 ? "התאמה חדשה" : "התאמות חדשות"}
          </p>
        )}
      </div>

      <div className="px-4">
        {matches.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 flex flex-col items-center"
          >
            <h2 className="text-2xl font-black text-gray-800 mb-3">אין התאמות עדיין</h2>
            <p className="text-gray-500 mb-8 leading-relaxed px-4">
              כשתהיה לך התאמה עם מישהו, היא תופיע כאן.
            </p>
            <Link
              to={createPageUrl("Discover")}
              className="inline-block"
            >
              <motion.button
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                className="gradient-orange text-white font-bold py-4 px-8 rounded-full shadow-lg transition-transform"
              >
                חפש שותפים
              </motion.button>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-2 pb-4">
            {matches.map((match, index) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
              >
                <MatchCard
                  match={match.profile}
                  onClickProfile={() => {
                    window.location.href = createPageUrl(`ProfileView?userId=${match.profile.user_id}`);
                  }}
                  onClickChat={() => {
                    window.location.href = createPageUrl(`Chat?matchId=${match.id}`);
                  }}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
