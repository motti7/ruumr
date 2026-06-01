import React, { useState, useEffect, useCallback } from "react";

import { Profile, Swipe } from "@/entities/all";
import { User } from "@/entities/User";
import { motion, AnimatePresence } from "framer-motion";
import ProfileCard from "../components/discover/ProfileCard";
import ActionButtons from "../components/discover/ActionButtons";
import MatchAnimation from "../components/discover/MatchAnimation";
import ErrorBoundary from "@/components/shared/ErrorBoundary";
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Heart, X, Puzzle } from "lucide-react";
import CharterMatchSelector from "../components/charter/CharterMatchSelector";
import DiscoverFilters from "../components/discover/DiscoverFilters";
import { useMutationWithOptimistic } from "@/hooks/useMutationWithOptimistic";
import { base44 } from "@/api/base44Client";
import { enableSimulatorBackend, getSimulatorBackendState } from "@/lib/simulatorBackend";
import { isRuumrSimulatorMode } from "@/lib/simulatorMode";
import { processSwipeMatch } from "@/lib/swipeMatchProcessing";
import { trackMixpanel } from '@/lib/mixpanelTracking';

const sortProfilesByCreatedDateDesc = (records = []) => {
  return [...records].sort((left, right) => {
    const leftTime = Date.parse(left?.created_date);
    const rightTime = Date.parse(right?.created_date);

    if (Number.isFinite(leftTime) && Number.isFinite(rightTime)) {
      return rightTime - leftTime;
    }

    const leftValue = String(left?.created_date ?? '').trim();
    const rightValue = String(right?.created_date ?? '').trim();
    return rightValue.localeCompare(leftValue);
  });
};

export default function DiscoverPage() {
  const navigate = useNavigate();
  // profiles = רשימת הפרופילים שעוד לא נראו (מתקצרת בכל swipe)
  // allProfiles = כל הפרופילים הזמינים (לפני פילטרים), ללא מי שנראה
  const [profiles, setProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userProfile, setUserProfile] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [lastSwipes, setLastSwipes] = useState([]);
  const [matchData, setMatchData] = useState(null);
  const [actionFeedback, setActionFeedback] = useState(null);
  const [showCharterSelector, setShowCharterSelector] = useState(false);
  const [filters, setFilters] = useState({ cities: [], minBudget: 0, maxBudget: 10000, minAge: 18, maxAge: 60, kosher: 'all', shabbat: 'all' });
  const [allProfiles, setAllProfiles] = useState([]); // כל הזמינים שטרם נראו - מתעדכן בכל swipe
  const [seenUserIds, setSeenUserIds] = useState(new Set());
  useEffect(() => {
    try {
      window.localStorage.setItem('ruumr_discover_marker', 'discover-mounted');
    } catch {
      // Debug only.
    }
  }, []);

  // Optimistic swipe mutation
  const swipeMutation = /** @type {any} */ (useMutationWithOptimistic(
    (swipeData) => Swipe.create(swipeData),
    {
      queryKey: ['swipes', userProfile?.user_id],
      updateFn: (old = [], newSwipe) => [...old, newSwipe],
      onError: () => {},
    }
  ));

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      if (isRuumrSimulatorMode()) {
        enableSimulatorBackend(base44);
      }

      window.localStorage.setItem('ruumr_discover_marker', 'discover-loading');
    } catch {
      // Debug only.
    }
    try {
      let user = null;
      try {
        user = await User.me();
      } catch (authError) {
        const simulatorState = getSimulatorBackendState();
        if (simulatorState?.currentUser) {
          user = simulatorState.currentUser;
        } else {
          throw authError;
        }
      }

      let userProfiles = [];
      try {
        userProfiles = await Profile.filter({ user_id: user.id });
      } catch {
        const simulatorState = getSimulatorBackendState();
        userProfiles = simulatorState?.collections?.Profile?.filter((profile) => String(profile.user_id) === String(user.id)) || [];
      }

      if (userProfiles.length === 0) {
        navigate(createPageUrl('Onboarding'));
        return;
      }
      const currentUserProfile = userProfiles[0];
      setUserProfile(currentUserProfile);
      setCurrentUserId(user.id);
      
      let allProfiles = [];
      try {
        allProfiles = await Profile.list("-created_date", 500);
      } catch {
        const simulatorState = getSimulatorBackendState();
        allProfiles = simulatorState?.collections?.Profile ? [...simulatorState.collections.Profile] : [];
      }
      allProfiles = sortProfilesByCreatedDateDesc(allProfiles);

      let userSwipes = [];
      try {
        userSwipes = await Swipe.filter({ swiper_id: user.id });
      } catch {
        const simulatorState = getSimulatorBackendState();
        userSwipes = simulatorState?.collections?.Swipe?.filter((swipe) => String(swipe.swiper_id) === String(user.id)) || [];
      }
      const swipedIds = userSwipes.map(s => String(s.swiped_id));
      
      let likedMeSwipes = [];
      try {
        likedMeSwipes = await Swipe.filter({ swiped_id: user.id, action: "like" });
      } catch {
        const simulatorState = getSimulatorBackendState();
        likedMeSwipes = simulatorState?.collections?.Swipe?.filter((swipe) => String(swipe.swiped_id) === String(user.id) && String(swipe.action) === 'like') || [];
      }
      const likedMeIds = likedMeSwipes.map(s => String(s.swiper_id));

      const isAdminViewer = user.email === 'mottishif7@gmail.com';

      const availableProfiles = allProfiles.filter(p => {
        // 1. Filter out self and already swiped
        if (String(p.user_id) === String(user.id) || swipedIds.includes(String(p.user_id))) return false;
        
        // 2. Visibility Check (Default to true if undefined)
        if (p.is_visible === false) return false;

        // 3. Gender Matching (Admin bypasses gender filter for review purposes)
        if (!isAdminViewer) {
          const myGender = currentUserProfile.gender || 'male'; 
          const myPreference = currentUserProfile.looking_for_gender || 'any';
          
          const theirGender = p.gender || 'male';
          const theirPreference = p.looking_for_gender || 'any';

          const theyWantMe = (theirPreference === 'any' || theirPreference === myGender);
          const iWantThem = (myPreference === 'any' || myPreference === theirGender);

          if (!theyWantMe || !iWantThem) return false;
        }

        // 4. Status Matching
        // Only block if BOTH clearly have an apartment (searching for roommate for THEIR apartment)
        // If data is missing, allow.
        if (currentUserProfile.current_status === 'has_apartment' && p.current_status === 'has_apartment') {
            return false;
        }

        // 5. Budget Overlap (Safe check)
        // If anyone doesn't have budget set, we assume overlap.
        const myMin = currentUserProfile.budget_min || 0;
        const myMax = currentUserProfile.budget_max || 100000;
        
        const theirMin = p.budget_min || 0;
        const theirMax = p.budget_max || 100000;

        const overlap = (theirMin <= myMax && theirMax >= myMin);
        
        return overlap;
      });

      setAllProfiles(availableProfiles);
      setProfiles(availableProfiles);
      try {
        window.localStorage.setItem('ruumr_discover_marker', `discover-ready:${availableProfiles.length}`);
      } catch {
        // Debug only.
      }
    } catch (error) {
      console.error("Error loading data:", error);
      setLoadError(error instanceof Error ? error.message : 'Failed to load Discover');
      try {
        window.localStorage.setItem('ruumr_discover_marker', 'discover-error');
        window.localStorage.setItem(
          'ruumr_discover_error',
          JSON.stringify({
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : null,
          })
        );
      } catch {
        // Debug only.
      }
    }
    setIsLoading(false);
  }, [navigate]);

  useEffect(() => { loadData(); }, [loadData]);
  
  useEffect(() => {
    const handleOpenCharter = () => setShowCharterSelector(true);
    window.addEventListener('openCharter', handleOpenCharter);
    return () => window.removeEventListener('openCharter', handleOpenCharter);
  }, []);
  
  // Aggressive Prefetch: Next 5 profiles
  useEffect(() => {
    if (!profiles || profiles.length === 0) return;

    // Prefetch main photo for next 5 profiles
    for (let i = 1; i <= 5; i++) {
        const nextIndex = currentIndex + i;
        if (profiles.length > nextIndex) {
            const nextProfile = profiles[nextIndex];
            if (nextProfile.photos?.[0]) {
                const img = new Image();
                img.src = nextProfile.photos[0];
                img.fetchPriority = "low"; // Background prefetch
            }
        }
    }

    // Also prefetch the SECOND photo of the CURRENT and NEXT profile (for carousel users)
    const currentProfile = profiles[currentIndex];
    if (currentProfile?.photos?.[1]) {
        const img = new Image();
        img.src = currentProfile.photos[1];
    }
    
    const nextProfile = profiles[currentIndex + 1];
    if (nextProfile?.photos?.[1]) {
        const img = new Image();
        img.src = nextProfile.photos[1];
    }

  }, [currentIndex, profiles]);

  const handleSwipeIntent = useCallback((action) => {
    setActionFeedback(action);
    setTimeout(() => setActionFeedback(null), 600);
  }, []);

  const handleSwipe = useCallback(async (action) => {
    if (currentIndex >= profiles.length || !userProfile) return;

    const swipedProfile = profiles[currentIndex];
    const prevIndex = currentIndex;
    const swiperId = currentUserId || userProfile.user_id;
    const optimisticSwipe = { swiper_id: swiperId, swiped_id: swipedProfile.user_id, action };

    // הסרת הפרופיל שנראה מ-allProfiles — כך שגם אחרי שינוי פילטרים הוא לא יחזור
    setAllProfiles(prev => prev.filter(p => String(p.user_id) !== String(swipedProfile.user_id)));
    setSeenUserIds(prev => new Set([...prev, String(swipedProfile.user_id)]));
    setCurrentIndex(prev => prev + 1);
    setLastSwipes(prev => [...prev, optimisticSwipe]);
    setActionFeedback(action);
    setTimeout(() => setActionFeedback(null), 600);

    try {
      const swipeData = {
          swiper_id: swiperId,
          swiper_name: userProfile.name,
          swiped_id: swipedProfile.user_id,
          swiped_name: swipedProfile.name,
          action
      };

      await swipeMutation.mutateAsync(swipeData);
      base44.analytics.track({
        eventName: 'profile_swiped',
        properties: {
          direction: action === 'like' ? 'right' : 'left',
          target_profile_id: swipedProfile.user_id,
        },
      });
      trackMixpanel('Swipe', {
        direction: action === 'like' ? 'right' : 'left',
        target_profile_id: swipedProfile.user_id,
      });

      if (action === 'like') {
        try {
          const matchResult = await processSwipeMatch({
            swiperId: swiperId,
            swipedId: swipedProfile.user_id,
            action,
            origin: window.location.origin,
          });

          if (matchResult?.match) {
            base44.analytics.track({
              eventName: 'match_created',
              properties: {
                matched_with_id: swipedProfile.user_id,
              },
            });
            trackMixpanel('Match Created', {
              matched_with_id: swipedProfile.user_id,
            });
            setMatchData({ profile1: userProfile, profile2: swipedProfile });
          }
        } catch (matchError) {
          console.error("Failed to process swipe match:", matchError);
        }
      }
    } catch (error) { 
        console.error("Swipe save failed:", error);
        // Rollback optimistic update on server failure
        setAllProfiles(prev => {
          // מחזירים את הפרופיל למקומו המקורי
          const withProfile = [...prev];
          withProfile.splice(prevIndex, 0, swipedProfile);
          return withProfile;
        });
        setSeenUserIds(prev => { const next = new Set(prev); next.delete(String(swipedProfile.user_id)); return next; });
        setCurrentIndex(prevIndex);
        setLastSwipes(prev => prev.slice(0, -1));
    }
  }, [currentIndex, profiles, userProfile, currentUserId, swipeMutation]);
  
  const handleRewind = () => {
    if (currentIndex > 0 && lastSwipes.length > 0) {
      setLastSwipes(prev => prev.slice(0, -1));
      setCurrentIndex(prev => prev - 1);
    }
  };

  const applyFilters = (newFilters) => {
    setFilters(newFilters);
    // allProfiles כבר לא מכיל את מי שנראה — פשוט מפלטרים ממנו
    setAllProfiles(currentAll => {
      const filtered = currentAll.filter(p => {
        if (newFilters.cities.length > 0) {
          const profileCities = p.search_cities || (p.location ? [p.location] : []);
          const match = newFilters.cities.some(c => profileCities.some(pc => pc.includes(c) || c.includes(pc)));
          if (!match) return false;
        }
        if (p.budget_max && p.budget_max > newFilters.maxBudget) return false;
        if (p.age && (p.age < newFilters.minAge || p.age > newFilters.maxAge)) return false;
        if (newFilters.kosher && newFilters.kosher !== 'all') {
          if (newFilters.kosher === 'for_or_flow') {
            if (p.kosher_preference && p.kosher_preference === 'against') return false;
          } else if (newFilters.kosher === 'against') {
            if (p.kosher_preference && p.kosher_preference !== 'against') return false;
          }
        }
        if (newFilters.shabbat && newFilters.shabbat !== 'all') {
          if (newFilters.shabbat === 'for_or_flow') {
            if (p.shabbat_preference && p.shabbat_preference === 'against') return false;
          } else if (newFilters.shabbat === 'against') {
            if (p.shabbat_preference && p.shabbat_preference !== 'against') return false;
          }
        }
        return true;
      });
      setCurrentIndex(0);
      setProfiles(filtered);
      return currentAll; // לא משנים את allProfiles עצמו בפילטור
    });
  };

  const hasProfiles = profiles.length > 0 && currentIndex < profiles.length;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-gradient-to-br from-gray-50 to-orange-50">
        <div className="relative w-20 h-20 mb-6">
          {/* Outer rotating ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-3 border-transparent border-t-[--theme-orange] border-r-[--theme-orange]"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          {/* Inner pulsing circle */}
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-[--theme-orange] to-red-400 flex items-center justify-center animate-pulse">
            <Puzzle className="w-8 h-8 text-white" />
          </div>
        </div>
        <p className="text-gray-600 font-bold text-lg">מחפש שותפים...</p>
        <p className="text-gray-400 text-xs mt-2">זה יקח רק שנייה</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-b from-white via-orange-50 to-orange-100 px-6 text-center">
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-xl">
          <Puzzle className="h-10 w-10 text-[--theme-orange]" />
        </div>
        <h2 className="mb-3 text-2xl font-bold text-gray-900">הייתה בעיה בטעינת המסך</h2>
        <p className="mb-6 max-w-sm text-sm leading-relaxed text-gray-600">
          אפשר לנסות שוב. אם זה ממשיך לקרות, צריך לבדוק את חיבור הנתונים של הסימולטור.
        </p>
        <div className="flex flex-col gap-3">
          <Button onClick={loadData} className="gradient-orange text-white font-bold px-8 rounded-full shadow-lg">
            נסה שוב
          </Button>
          <button
            onClick={() => navigate(createPageUrl('Onboarding'))}
            className="text-sm font-semibold text-gray-500"
          >
            מעבר להרשמה
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-full overflow-hidden" style={{ backgroundColor: '#EFEFEF', height: '100dvh' }}>
      <AnimatePresence>
        {matchData && <MatchAnimation {...matchData} onDismiss={() => setMatchData(null)} />}
      </AnimatePresence>

      {showCharterSelector && (
        <CharterMatchSelector onClose={() => setShowCharterSelector(false)} />
      )}

      <AnimatePresence>
        {actionFeedback && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[150]"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5 }}
              className={`w-32 h-32 rounded-full flex items-center justify-center shadow-2xl ${
                actionFeedback === 'like' 
                  ? 'bg-red-500' 
                  : 'bg-black'
              }`}
            >
              {actionFeedback === 'like' ? (
                <Heart className="w-16 h-16 text-white" fill="white" />
              ) : (
                <X className="w-16 h-16 text-white" strokeWidth={4} />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <DiscoverFilters filters={filters} onChange={applyFilters} />

      {/* Card — full screen from header to bottom nav */}
      <div
        className="absolute left-0 right-0"
        style={{
          top: 'calc(48px + env(safe-area-inset-top, 0px))',
          bottom: 'calc(64px + var(--app-safe-area-bottom, env(safe-area-inset-bottom, 0px)))',
        }}
      >
        <AnimatePresence mode="popLayout">
          {hasProfiles ? (
            profiles.slice(currentIndex, currentIndex + 1).map((profile) => (
              <ErrorBoundary key={`${profile.id || profile.user_id}`} onSkip={() => handleSwipe('dislike')}>
                <div className="absolute inset-0">
                  <ProfileCard
                    profile={profile}
                    onSwipe={handleSwipe}
                    onSwipeIntent={handleSwipeIntent}
                    isActive={true}
                  />
                </div>
              </ErrorBoundary>
            ))
          ) : (
            <motion.div
              key="no-profiles"
              initial={{ opacity: 1, scale: 1 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center h-full text-center px-8"
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-3">זה הכל לעכשיו!</h2>
              <p className="text-gray-500 mb-8 leading-relaxed">סיימת לעבור על כל הפרופילים.<br/>נסה לשנות את העדפות החיפוש שלך או חזור מאוחר יותר.</p>
              <Button onClick={loadData} className="gradient-orange text-white font-bold py-3 px-8 rounded-full hover:scale-105 transition-transform shadow-lg">רענן</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action buttons — floating above nav bar */}
      {hasProfiles && (
        <div className="fixed w-full flex justify-center z-20" style={{ bottom: 'calc(max(16px, var(--app-safe-area-bottom, env(safe-area-inset-bottom, 0px))) + 100px)' }}>
          <ActionButtons onDislike={() => handleSwipe("dislike")} onLike={() => handleSwipe("like")} onRewind={handleRewind} />
        </div>
      )}
    </div>
  );
}