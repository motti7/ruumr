import React, { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Match, Profile } from "@/entities/all";
import { User } from "@/entities/User";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Puzzle, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import MatchCard from "../components/matches/MatchCard";
import SwipeableMatchRow from "../components/matches/SwipeableMatchRow";
import PullToRefresh from "@/components/shared/PullToRefresh";
import TeamCompleteCelebration from "@/components/team/TeamCompleteCelebration";
import { requestTeamMember } from "@/api/teamInvites";
import { DEMO_STAGES, setDemoStage } from "@/lib/demoStage";
import { useToast } from "@/components/ui/use-toast";

export default function MatchesPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [matches, setMatches] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const retryRef = useRef(0);
  const retryTimerRef = useRef(null);
  const mountedRef = useRef(true);
  const [seenMatchIds, setSeenMatchIds] = useState(() => {
    try {return JSON.parse(localStorage.getItem('roomi_seen_match_ids') || '[]');} catch {return [];}
  });
  const [celebration, setCelebration] = useState(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const loadMatches = useCallback(async () => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    setIsLoading(true);
    setError(null);
    try {
      const userData = await User.me();
      setUser(userData);

      const userMatches = await Match.filter({ user1_id: userData.id, status: 'active' });
      const userMatches2 = await Match.filter({ user2_id: userData.id, status: 'active' });
      const allMatches = [...userMatches, ...userMatches2];

      if (allMatches.length === 0) {
        setMatches([]);
        setIsLoading(false);
        return;
      }

      // Batch-fetch all relevant profiles in one call instead of N individual fetches
      const allProfiles = await Profile.list('-created_date', 500);
      const profileMap = {};
      allProfiles.forEach(p => { profileMap[p.user_id] = p; });

      // A pair of users can end up with two Match rows (one created from each
      // direction), which would render the same person twice. Collapse to one
      // card per counterpart, keeping the most recently created match.
      const byCounterpart = new Map();
      for (const match of allMatches) {
        const otherUserId = match.user1_id === userData.id ? match.user2_id : match.user1_id;
        const existing = byCounterpart.get(otherUserId);
        if (!existing || new Date(match.created_date) > new Date(existing.created_date)) {
          byCounterpart.set(otherUserId, match);
        }
      }
      const uniqueMatches = [...byCounterpart.values()];

      // Fetch messages per match with individual error resilience
      const matchesWithProfiles = await Promise.all(
        uniqueMatches.map(async (match) => {
          const otherUserId = match.user1_id === userData.id ? match.user2_id : match.user1_id;
          let unreadCount = 0;
          try {
            const allMessages = await base44.entities.Message.filter({ match_id: match.id });
            unreadCount = allMessages.filter(m => m.sender_id !== userData.id && !m.is_read).length;
          } catch (e) {
            console.warn('Failed to load messages for match', match.id, e);
          }

          return {
            ...match,
            profile: profileMap[otherUserId] || null,
            isOnline: false,
            unreadCount,
          };
        })
      );

      setMatches(matchesWithProfiles.filter((m) => m.profile));
      retryRef.current = 0; // Reset retry on success
    } catch (error) {
      console.error("Error loading matches:", error);
      // Auto-retry up to 3 times with increasing delay
      if (retryRef.current < 3 && mountedRef.current) {
        const delay = (retryRef.current + 1) * 1500;
        console.log(`Retrying matches load in ${delay}ms (attempt ${retryRef.current + 1}/3)...`);
        retryTimerRef.current = setTimeout(() => {
          retryRef.current += 1;
          loadMatches();
        }, delay);
      } else {
        setError(t("matches_load_error"));
        setMatches([]);
        setIsLoading(false);
      }
      return; // Don't set isLoaded false yet, retrying
    }
    setIsLoading(false);
  }, []);

  // Load matches on mount AND when location changes (back/forward navigation)
  useEffect(() => {
    retryRef.current = 0;
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    loadMatches();
  }, [location.key, loadMatches]);

  // Real-time subscription: reload when a new match is created
  useEffect(() => {
    const unsub = base44.entities.Match.subscribe((event) => {
      if (event.type === 'create') {
        loadMatches();
      }
    });
    return () => unsub();
  }, [loadMatches]);

  // Mark all matches as seen when the Matches page is opened
  useEffect(() => {
    if (matches.length > 0) {
      const allIds = matches.map(m => m.id);
      const existing = JSON.parse(localStorage.getItem('roomi_seen_match_ids') || '[]');
      const merged = [...new Set([...existing, ...allIds])];
      localStorage.setItem('roomi_seen_match_ids', JSON.stringify(merged));
      setSeenMatchIds(merged);
      window.dispatchEvent(new Event('roomi_seen_updated'));
    }
  }, [matches]);

  // Listen for seen updates (e.g. from Charter click)
  useEffect(() => {
    const handler = () => {
      try {setSeenMatchIds(JSON.parse(localStorage.getItem('roomi_seen_match_ids') || '[]'));} catch {}
    };
    window.addEventListener('roomi_seen_updated', handler);
    return () => window.removeEventListener('roomi_seen_updated', handler);
  }, []);

  const handleDeleteMatch = useCallback(async (matchId) => {
    try {
      await Match.delete(matchId);
      setMatches((prev) => prev.filter((m) => m.id !== matchId));
      // Also remove from seen
      const seenIds = JSON.parse(localStorage.getItem('roomi_seen_match_ids') || '[]');
      localStorage.setItem('roomi_seen_match_ids', JSON.stringify(seenIds.filter((id) => id !== matchId)));
      window.dispatchEvent(new Event('roomi_seen_updated'));
    } catch (e) {
      console.error("Error deleting match:", e);
    }
  }, []);

  const handleCelebrationContinue = useCallback(() => {
    setCelebration(null);
    setDemoStage(DEMO_STAGES.APARTMENT_SEARCH);
    navigate(`${createPageUrl('Home')}?simulator_mode=true&demo_stage=${DEMO_STAGES.APARTMENT_SEARCH}`);
  }, [navigate]);

  const handleAddToTeam = useCallback(async (partnerUserId, partnerName) => {
    if (!partnerUserId) return;
    try {
      const res = await requestTeamMember(partnerUserId, partnerName);
      if (res?.status === 'already_member') {
        toast({ title: t("already_in_team", { name: partnerName || t("the_roommate") }) });
        return;
      }
      if (res?.status === 'already_pending') {
        toast({ title: t("request_already_pending") });
        return;
      }
      // In demo/simulator the request is approved immediately (no counterparty
      // to accept), so the teammate joins right away.
      await loadMatches();
      if (res?.team_complete) {
        let members = [];
        try {
          const profiles = await Profile.filter({ user_id: user.id });
          const me = profiles[0];
          members = [
            { name: me?.name, photo: me?.photos?.find(Boolean) || null },
            ...((me?.team_members || []).map((m) => ({ name: m.name, photo: m.photo }))),
          ];
        } catch { /* avatars are best-effort */ }
        setCelebration({ members });
      } else {
        toast({ title: t("teammate_added", { name: partnerName || t("the_roommate_short") }), duration: 3000 });
      }
    } catch (e) {
      console.error("Error requesting team member:", e);
      toast({ title: t("team_request_failed"), variant: "destructive" });
    }
  }, [toast, t, loadMatches, user]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadMatches();
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 p-4">
        <div className="space-y-4">
          {[...Array(6)].map((_, i) =>
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
          )}
        </div>
      </div>);

  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24" dir={i18n.dir()} style={{ height: 'calc(100dvh - 60px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))', overflow: 'hidden' }}>
      <PullToRefresh onRefresh={loadMatches}>
      <div className="bg-gray-50 dark:bg-gray-900 p-4 pb-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t("nav_matches")}</h1>
          <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full select-none touch-manipulation"
              aria-label={t("refresh")}>
              
            <motion.span
                animate={isRefreshing ? { rotate: 360 } : { rotate: 0 }}
                transition={isRefreshing ? { duration: 0.8, repeat: Infinity, ease: "linear" } : {}}>
                
              <Puzzle className={`w-6 h-6 ${isRefreshing ? 'text-[--theme-orange]' : 'text-gray-400'}`} />
            </motion.span>
          </motion.button>
        </div>
        {(() => {
            const unseen = matches.filter((m) => !seenMatchIds.includes(m.id)).length;
            return unseen > 0 ?
            <p className="font-medium text-black">
              {unseen} {unseen === 1 ? t("new_match_singular") : t("new_match_plural")}
            </p> :
            null;
          })()}
      </div>

      {error &&
        <div className="mx-4 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div>
            <p className="text-red-700 font-medium text-sm">{error}</p>
            <button onClick={handleRefresh} className="text-red-600 text-xs font-bold hover:underline mt-1">{t("try_again")}</button>
          </div>
        </div>
        }

      <div className="px-4">
         {matches.length === 0 && !error ?
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 flex flex-col items-center">
            
             <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">{t("no_matches_yet")}</h2>
             <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed px-4">
               {t("no_matches_desc")}
             </p>
             <Link
              to={createPageUrl("Discover")}
              className="inline-block">
              
               <motion.button
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                className="gradient-orange text-white font-bold py-4 px-8 rounded-full shadow-lg transition-transform">
                
                 {t("find_roommates")}
               </motion.button>
             </Link>
           </motion.div> :

          <div className="space-y-2 pb-4">
            {matches.map((match, index) =>
            <motion.div
              key={match.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}>

               <SwipeableMatchRow
                onDelete={() => handleDeleteMatch(match.id)}
                onAddToTeam={() => handleAddToTeam(match.profile?.user_id, match.profile?.name)}>
                <MatchCard
                match={match.profile}
                isOnline={match.isOnline}
                matchId={match.id}
                matchType={match.match_type || "mutual"}
                unreadCount={match.unreadCount || 0}
                onClickProfile={() => {
                  if (match.profile && match.profile.user_id) {
                    navigate(createPageUrl('ProfileView') + `?userId=${match.profile.user_id}`);
                  } else {
                    console.error("Missing profile ID", match);
                  }
                }}
                onClickChat={() => {
                  navigate(createPageUrl('Chat') + `?matchId=${encodeURIComponent(match.id)}&from=matches`);
                }}
                isOpened={seenMatchIds.includes(match.id)}
                onClickCharter={async () => {
                // Mark match as seen
                const seenIds = JSON.parse(localStorage.getItem('roomi_seen_match_ids') || '[]');
                if (!seenIds.includes(match.id)) {
                  localStorage.setItem('roomi_seen_match_ids', JSON.stringify([...seenIds, match.id]));
                  window.dispatchEvent(new Event('roomi_seen_updated'));
                }
                // Check if questionnaire is fully completed (all 8 required questions answered)
                const REQUIRED_QUESTIONS = ['q_smoking','q_partners','q_pets','q_cleaning_strictness','q_shopping','q_dishes','q_ac','q_hosting'];
                const prefs = await base44.entities.QuestionnairePreference.filter({ user_id: user.id });
                const completed = prefs.some(p => p.answers && REQUIRED_QUESTIONS.every(q => p.answers[q] === 'a' || p.answers[q] === 'b'));
                if (completed) {
                  navigate(createPageUrl('Chat') + `?matchId=${encodeURIComponent(match.id)}&from=matches`);
                } else {
                  navigate(createPageUrl('Charter') + `?matchId=${match.id}`);
                }
                }}
                onDelete={handleDeleteMatch} />
               </SwipeableMatchRow>

              </motion.div>
            )}
          </div>
          }
      </div>
      </PullToRefresh>
      {celebration && (
        <TeamCompleteCelebration members={celebration.members} onContinue={handleCelebrationContinue} />
      )}
    </div>);

}
