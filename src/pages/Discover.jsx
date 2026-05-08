import React, { useState, useEffect, useCallback, useMemo } from "react";

import { Profile, Swipe, Match } from "@/entities/all";
import { User } from "@/entities/User";
import { motion, AnimatePresence } from "framer-motion";
import ProfileCard from "../components/discover/ProfileCard";
import ActionButtons from "../components/discover/ActionButtons";
import MatchAnimation from "../components/discover/MatchAnimation";
import ErrorBoundary from "@/components/shared/ErrorBoundary";
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Heart, Puzzle, RotateCcw, SlidersHorizontal, Sparkles, Star, X } from "lucide-react";
import CharterMatchSelector from "../components/charter/CharterMatchSelector";
import DiscoverFilters from "../components/discover/DiscoverFilters";
import { useMutationWithOptimistic } from "@/hooks/useMutationWithOptimistic";
import { base44 } from "@/api/base44Client";
import { enableSimulatorBackend, getSimulatorBackendState } from "@/lib/simulatorBackend";
import { isRuumrSimulatorMode } from "@/lib/simulatorMode";
import mixpanel from 'mixpanel-browser';

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
  const [profiles, setProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [lastSwipes, setLastSwipes] = useState([]);
  const [isRewinding, setIsRewinding] = useState(false);
  const [matchData, setMatchData] = useState(null);
  const [actionFeedback, setActionFeedback] = useState(null);
  const [showCharterSelector, setShowCharterSelector] = useState(false);
  const [filters, setFilters] = useState({ cities: [], minBudget: 0, maxBudget: 10000, minAge: 18, maxAge: 60 });
  const [allProfiles, setAllProfiles] = useState([]);
  const shouldTrackMixpanel = useMemo(() => {
    const hostname = window.location.hostname.toLowerCase();
    return !hostname.includes('localhost') && !hostname.includes('preview-sandbox') && !hostname.includes('base44');
  }, []);

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
      setLastSwipes([]);
      setMatchData(null);
      setActionFeedback(null);
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

  const handleSwipe = useCallback(async (action) => {
    if (currentIndex >= profiles.length || !userProfile) return;

    const swipedProfile = profiles[currentIndex];
    const prevIndex = currentIndex;
    const historyId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const optimisticSwipe = {
      id: historyId,
      previousIndex: prevIndex,
      swiper_id: userProfile.user_id,
      swiped_id: swipedProfile.user_id,
      swiped_name: swipedProfile.name,
      action,
      swipeId: null,
      createdMatchId: null,
      createdMatch: false,
    };

    // Standardized optimistic UI pattern: update state BEFORE server call
    setCurrentIndex(prev => prev + 1);
    setLastSwipes(prev => [...prev, optimisticSwipe]);
    setActionFeedback(action);
    setTimeout(() => setActionFeedback(null), 600);

    try {
      const swipeData = {
          swiper_id: userProfile.user_id,
          swiper_name: userProfile.name,
          swiped_id: swipedProfile.user_id,
          swiped_name: swipedProfile.name,
          action
      };

      const createdSwipe = await swipeMutation.mutateAsync(swipeData);
      const swipeRecordId = createdSwipe?.id ?? createdSwipe?.swipeId ?? createdSwipe?.swipe_id ?? null;
      if (shouldTrackMixpanel) {
        mixpanel.track('Swipe', {
          direction: action === 'dislike' ? 'left' : 'right',
          target_profile_id: swipedProfile.user_id,
        });
      }

      const countsAsLike = action === 'like' || action === 'super_like';

      // Check for match only on likes / super likes
      if (countsAsLike) {
          const reverseSwipes = await Swipe.filter({ 
              $or: [
                { swiper_id: swipedProfile.user_id, swiped_id: userProfile.user_id, action: 'like' },
                { swiper_id: swipedProfile.user_id, swiped_id: userProfile.user_id, action: 'super_like' },
              ]
          });

          if (reverseSwipes?.length > 0) {
              const existingMatches = await Match.filter({
                  $or: [
                      { user1_id: userProfile.user_id, user2_id: swipedProfile.user_id },
                      { user1_id: swipedProfile.user_id, user2_id: userProfile.user_id }
                  ]
              });

              if (existingMatches.length === 0) {
                  const createdMatch = await Match.create({
                      user1_id: userProfile.user_id,
                      user2_id: swipedProfile.user_id,
                      user1_name: userProfile.name,
                      user2_name: swipedProfile.name,
                      status: 'active'
                  });
                  const createdMatchId = createdMatch?.id ?? createdMatch?.matchId ?? null;
                  if (shouldTrackMixpanel) {
                    mixpanel.track('Match Created', {
                      matched_with_id: swipedProfile.user_id,
                    });
                  }

                  setLastSwipes(prev =>
                    prev.map((entry) =>
                      entry.id === historyId
                        ? {
                            ...entry,
                            swipeId: swipeRecordId,
                            createdMatchId,
                            createdMatch: Boolean(createdMatchId),
                          }
                        : entry
                    )
                  );
              } else {
                  setLastSwipes(prev =>
                    prev.map((entry) =>
                      entry.id === historyId
                        ? {
                            ...entry,
                            swipeId: swipeRecordId,
                          }
                        : entry
                    )
                  );
              }

              setMatchData({ profile1: userProfile, profile2: swipedProfile });

              // Async email notification (fire-and-forget)
              import('@/api/base44Client').then(({ base44: b44 }) => {
                  const functions = /** @type {any} */ (b44.functions);
                  if (functions?.handleSwipe) {
                    functions.handleSwipe({
                      swiper_id: userProfile.user_id,
                      swiped_id: swipedProfile.user_id,
                      action,
                      origin: window.location.origin
                    });
                  }
              }).catch(() => {});
          }
      } else {
          setLastSwipes(prev =>
            prev.map((entry) =>
              entry.id === historyId
                ? {
                    ...entry,
                    swipeId: swipeRecordId,
                  }
                : entry
            )
          );
      }
    } catch (error) { 
        console.error("Swipe save failed:", error);
        // Rollback optimistic update on server failure
        setCurrentIndex(prevIndex);
        setLastSwipes(prev => prev.slice(0, -1));
    }
  }, [currentIndex, profiles, shouldTrackMixpanel, userProfile, swipeMutation]);

  const handleRewind = useCallback(async () => {
    if (isRewinding || lastSwipes.length === 0 || !userProfile) return;

    const lastSwipe = lastSwipes[lastSwipes.length - 1];
    const restoreIndex = currentIndex;

    setIsRewinding(true);
    setActionFeedback('rewind');
    setTimeout(() => setActionFeedback(null), 600);
    setCurrentIndex(lastSwipe.previousIndex ?? Math.max(0, currentIndex - 1));
    setLastSwipes(prev => prev.slice(0, -1));
    setMatchData(null);

    try {
      const swipeCandidates =
        lastSwipe.swipeId
          ? null
          : await Swipe.filter({
              swiper_id: userProfile.user_id,
              swiped_id: lastSwipe.swiped_id,
              action: lastSwipe.action,
            });
      const swipeRecord =
        lastSwipe.swipeId
          ? { id: lastSwipe.swipeId }
          : swipeCandidates?.[swipeCandidates.length - 1] || swipeCandidates?.[0] || null;

      if (swipeRecord?.id) {
        await Swipe.delete(swipeRecord.id);
      }

      if (lastSwipe.createdMatchId) {
        await Match.delete(lastSwipe.createdMatchId);
      }
    } catch (error) {
      console.error("Failed to rewind last swipe:", error);
      setCurrentIndex(restoreIndex);
      setLastSwipes(prev => [...prev, lastSwipe]);
    } finally {
      setIsRewinding(false);
    }
  }, [currentIndex, isRewinding, lastSwipes, userProfile]);

  const applyFilters = (newFilters) => {
    setFilters(newFilters);
    setCurrentIndex(0);
    const filtered = allProfiles.filter(p => {
      if (newFilters.cities.length > 0) {
        const profileCities = p.search_cities || (p.location ? [p.location] : []);
        const match = newFilters.cities.some(c => profileCities.some(pc => pc.includes(c) || c.includes(pc)));
        if (!match) return false;
      }
      if (p.budget_max && p.budget_max > newFilters.maxBudget) return false;
      if (p.age && (p.age < newFilters.minAge || p.age > newFilters.maxAge)) return false;
      return true;
    });
    setProfiles(filtered);
    setLastSwipes([]);
    setMatchData(null);
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
        <h2 className="mb-3 text-2xl font-black text-gray-900">הייתה בעיה בטעינת המסך</h2>
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
    <div className="relative min-h-screen overflow-hidden px-4 pb-28 pt-6" dir="rtl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top_left,_rgba(255,111,63,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(255,255,255,0.9),_transparent_24%),linear-gradient(180deg,_rgba(255,255,255,0.55)_0%,_rgba(255,255,255,0.04)_100%)]" />

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
            className="fixed left-1/2 top-1/2 z-[150] -translate-x-1/2 -translate-y-1/2"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5 }}
              className={`flex h-32 w-32 items-center justify-center rounded-full shadow-2xl ${
                actionFeedback === 'like'
                  ? 'bg-red-500'
                  : actionFeedback === 'super_like'
                    ? 'bg-amber-400'
                    : actionFeedback === 'rewind'
                      ? 'bg-slate-800'
                    : 'bg-black'
              }`}
            >
              {actionFeedback === 'like' ? (
                <Heart className="h-16 w-16 text-white" fill="white" />
              ) : actionFeedback === 'super_like' ? (
                <Star className="h-16 w-16 text-white" fill="white" />
              ) : actionFeedback === 'rewind' ? (
                <RotateCcw className="h-16 w-16 text-white" strokeWidth={3.2} />
              ) : (
                <X className="h-16 w-16 text-white" strokeWidth={4} />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <DiscoverFilters filters={filters} onChange={applyFilters} />

      <div className="mx-auto flex w-full max-w-[430px] flex-col gap-4">
        <div className="flex items-end justify-between gap-3 px-1" dir="ltr">
          <h1 className="text-[3.8rem] font-black leading-none tracking-tight text-black" style={{ color: '#000000' }}>Discover</h1>

          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => window.dispatchEvent(new Event('openDiscoverFilters'))}
            className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/75 bg-white/80 text-slate-500 shadow-sm transition-colors hover:text-[--theme-orange]"
            aria-label="Filters"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </motion.button>
        </div>

        <div className="relative mx-auto w-full max-w-[430px] flex-none" style={{ height: 'min(78vh, 720px)' }}>
          <div className="relative h-full">
            <AnimatePresence mode="wait">
              {hasProfiles ? (
                profiles.slice(currentIndex, currentIndex + 2).reverse().map((profile, index, arr) => {
                  const isTopCard = index === arr.length - 1;
                  return (
                    <ErrorBoundary key={`${profile.id || profile.user_id}-${currentIndex}-${index}`} onSkip={() => handleSwipe('dislike')}>
                      <div
                        className={`absolute inset-0 transition-all duration-300 ${
                          isTopCard
                            ? 'z-10 scale-100 translate-y-0 opacity-100'
                            : '-z-10 scale-95 translate-y-8 opacity-80'
                        }`}
                      >
                        <ProfileCard
                          profile={profile}
                          onSwipe={handleSwipe}
                          isActive={isTopCard}
                        />
                      </div>
                    </ErrorBoundary>
                  );
                })
              ) : (
                <motion.div
                  key="no-profiles"
                  initial={{ opacity: 1, scale: 1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex h-full flex-col items-center justify-center px-8 text-center"
                >
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-[--theme-orange] shadow-sm">
                    <Sparkles className="h-7 w-7" />
                  </div>
                  <h2 className="text-3xl font-black tracking-tight text-slate-950">All caught up</h2>
                  <p className="mt-3 max-w-sm leading-7 text-slate-500">
                    You’ve seen every profile in this feed. Adjust your filters or come back later for a fresh batch.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <Button
                      onClick={loadData}
                      className="rounded-full px-6 py-3 font-bold text-white shadow-lg shadow-orange-200/60"
                      style={{ background: 'linear-gradient(135deg, var(--theme-orange) 0%, var(--theme-orange-dark) 100%)' }}
                    >
                      Refresh feed
                    </Button>
                    <button
                      onClick={() => window.dispatchEvent(new Event('openDiscoverFilters'))}
                      className="min-h-[44px] rounded-full border border-slate-200 bg-white/90 px-5 py-3 text-sm font-bold text-slate-600 shadow-sm"
                    >
                      Adjust filters
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {hasProfiles && (
            <div className="pointer-events-none absolute inset-x-0 bottom-20 z-20 flex justify-center">
              <div className="pointer-events-auto w-full max-w-[22rem]">
                <ActionButtons
                  onDislike={() => handleSwipe("dislike")}
                  onBack={handleRewind}
                  canGoBack={lastSwipes.length > 0 && !isRewinding}
                  onLike={() => handleSwipe("like")}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
