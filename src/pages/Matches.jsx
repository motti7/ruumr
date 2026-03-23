import React, { useState, useEffect, useCallback } from "react";
import { Match, Profile } from "@/entities/all";
import { User } from "@/entities/User";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Puzzle } from "lucide-react";
import MatchCard from "../components/matches/MatchCard";

export default function MatchesPage() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullStart, setPullStart] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [seenMatchIds, setSeenMatchIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('roomi_seen_match_ids') || '[]'); } catch { return []; }
  });

  const loadMatches = useCallback(async () => {
    setIsLoading(true);
    try {
      const userData = await User.me();
      setUser(userData);

      const userMatches = await Match.filter({ user1_id: userData.id, status: 'active' });
      const userMatches2 = await Match.filter({ user2_id: userData.id, status: 'active' });
      const allMatches = [...userMatches, ...userMatches2];

      const matchesWithProfiles = await Promise.all(
        allMatches.map(async (match) => {
          const otherUserId = match.user1_id === userData.id ? match.user2_id : match.user1_id;
          const profiles = await Profile.filter({ user_id: otherUserId });
          
          let isOnline = false;
          try {
             // We can try to infer online status. 
             // Since we can't easily subscribe to real-time status of all users efficiently in this list without backend functions,
             // we will assume for this "mock" requirement that we check if we can get the user and check a timestamp 
             // or simply rely on the fact the user asked for it to be "reliable".
             // Since I cannot implement a real WebSocket presence system here easily without backend, 
             // I will check the user's updated_date if available or just random for demo if not possible? 
             // No, better to be honest. I'll fetch the user and check if updated_date is recent.
             // However, User.get(id) might not be available in the client directly for other users due to privacy unless public.
             // But Profile is public. I'll use a heuristic or just leave it false if I can't determine.
             // Actually, the prompt says "only if he is truly active".
             // I'll fetch the user using filter (if allowed)
             /* const otherUser = await User.get(otherUserId); */
             /* if (otherUser && otherUser.show_active_status !== false) {
                 const lastActive = new Date(otherUser.updated_date).getTime();
                 const now = new Date().getTime();
                 isOnline = (now - lastActive) < 1000 * 60 * 10; // 10 minutes
             } */
             // Since I can't guarantee User.get(id) works for other users due to RLS, 
             // and Profile doesn't have last_active.
             // I'll skip implementation of *true* online status if I can't, but I removed the unconditional green dot.
             // Wait, I can try to use the Profile's updated_date as a proxy if the user updates profile often? No.
             // I will leave isOnline as false for now to be safe, or check if I can fetch the user.
             // Let's try to fetch the user public info if possible.
             // Check context: "The User entity has special built-in security rules that only allow admin users to list, update, or delete other users."
             // So I CANNOT fetch other users.
             // I CANNOT know if they are online.
             // I will remove the green dot logic or set it to false always, as requested "only if truly active".
             // Since I can't know, I won't show it.
          } catch(e) {}

          return {
            ...match,
            profile: profiles[0] || null,
            isOnline: false // Cannot determine without admin rights or backend function
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

  // Listen for seen updates (e.g. from Charter click)
  useEffect(() => {
    const handler = () => {
      try { setSeenMatchIds(JSON.parse(localStorage.getItem('roomi_seen_match_ids') || '[]')); } catch {}
    };
    window.addEventListener('roomi_seen_updated', handler);
    return () => window.removeEventListener('roomi_seen_updated', handler);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadMatches();
    setIsRefreshing(false);
  };

  const handleTouchStart = (e) => {
    if (window.scrollY === 0) {
      setPullStart(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e) => {
    if (pullStart > 0 && window.scrollY === 0) {
      const distance = e.touches[0].clientY - pullStart;
      if (distance > 0) {
        setPullDistance(Math.min(distance, 100));
      }
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 60) {
      handleRefresh();
    }
    setPullStart(0);
    setPullDistance(0);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <motion.div
            className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-400 to-orange-700 flex items-center justify-center"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
            <Puzzle className="w-8 h-8 text-white" />
        </motion.div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24" 
      dir="rtl"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {pullDistance > 0 && (
        <div 
          className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 transition-opacity"
          style={{ opacity: pullDistance / 60 }}
        >
          <motion.div
            className="w-8 h-8 rounded-full bg-[--theme-orange] flex items-center justify-center"
            animate={{ rotate: pullDistance * 3.6 }}
          >
            <Puzzle className="w-4 h-4 text-white" />
          </motion.div>
        </div>
      )}
      {isRefreshing && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50">
          <motion.div
            className="w-8 h-8 rounded-full bg-[--theme-orange] flex items-center justify-center"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Puzzle className="w-4 h-4 text-white" />
          </motion.div>
        </div>
      )}
      <div className="sticky top-16 bg-gray-50 dark:bg-gray-900 z-10 p-4 pb-2">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">התאמות</h1>
        {(() => {
          const unseen = matches.filter(m => !seenMatchIds.includes(m.id)).length;
          return unseen > 0 ? (
            <p className="font-medium text-[--theme-orange]">
              {unseen} {unseen === 1 ? "התאמה חדשה" : "התאמות חדשות"}
            </p>
          ) : null;
        })()}
      </div>

      <div className="px-4">
        {matches.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 flex flex-col items-center"
          >
            <h2 className="text-2xl font-black text-gray-800 dark:text-white mb-3">אין התאמות עדיין</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed px-4">
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
                  isOnline={match.isOnline}
                  matchId={match.id}
                  onClickProfile={() => {
                    if (match.profile && match.profile.user_id) {
                        navigate(createPageUrl('ProfileView') + `?userId=${match.profile.user_id}`);
                    } else {
                        console.error("Missing profile ID", match);
                    }
                  }}
                  onClickChat={() => {
                     navigate(createPageUrl('Chat') + `?matchId=${match.id}`);
                  }}
                  onClickCharter={() => {
                     // Mark match as seen (removes from unseen count badge)
                     const seenIds = JSON.parse(localStorage.getItem('roomi_seen_match_ids') || '[]');
                     if (!seenIds.includes(match.id)) {
                       localStorage.setItem('roomi_seen_match_ids', JSON.stringify([...seenIds, match.id]));
                       window.dispatchEvent(new Event('roomi_seen_updated'));
                     }
                     navigate(createPageUrl('Charter') + `?matchId=${match.id}`);
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