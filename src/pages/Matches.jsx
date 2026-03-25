import React, { useState, useEffect, useCallback } from "react";
import { Match, Profile } from "@/entities/all";
import { User } from "@/entities/User";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Puzzle, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import MatchCard from "../components/matches/MatchCard";
import PullToRefresh from "@/components/shared/PullToRefresh";

export default function MatchesPage() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [seenMatchIds, setSeenMatchIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('roomi_seen_match_ids') || '[]'); } catch { return []; }
  });

  const loadMatches = useCallback(async () => {
    setIsLoading(true);
    setError(null);
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

          return {
            ...match,
            profile: profiles[0] || null,
            isOnline: false
          };
        })
      );

      setMatches(matchesWithProfiles.filter(m => m.profile));
    } catch (error) {
      console.error("Error loading matches:", error);
      setError("שגיאה בטעינת ההתאמות. אנא נסה שוב.");
      setMatches([]);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 p-4">
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-4">
                <Skeleton className="w-16 h-16 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="w-12 h-12 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24" dir="rtl" style={{ height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      <PullToRefresh onRefresh={loadMatches}>
      <div className="sticky top-0 bg-gray-50 dark:bg-gray-900 z-10 p-4 pb-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">התאמות</h1>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full select-none touch-manipulation"
            aria-label="רענן"
          >
            <motion.span
              animate={isRefreshing ? { rotate: 360 } : { rotate: 0 }}
              transition={isRefreshing ? { duration: 0.8, repeat: Infinity, ease: "linear" } : {}}
            >
              <Puzzle className={`w-6 h-6 ${isRefreshing ? 'text-[--theme-orange]' : 'text-gray-400'}`} />
            </motion.span>
          </motion.button>
        </div>
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
      </PullToRefresh>
    </div>
  );
}