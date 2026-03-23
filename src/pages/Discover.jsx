import React, { useState, useEffect, useCallback } from "react";
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
import { Heart, X, Home } from "lucide-react";
import CharterMatchSelector from "../components/charter/CharterMatchSelector";

export default function DiscoverPage() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSwipes, setLastSwipes] = useState([]);
  const [matchData, setMatchData] = useState(null);
  const [actionFeedback, setActionFeedback] = useState(null);
  const [showCharterSelector, setShowCharterSelector] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      const userProfiles = await Profile.filter({ user_id: user.id });

      if (userProfiles.length === 0) {
        navigate(createPageUrl('Onboarding'));
        return;
      }
      const currentUserProfile = userProfiles[0];
      setUserProfile(currentUserProfile);
      
      const allProfiles = await Profile.list("-created_date", 500);
      const userSwipes = await Swipe.filter({ swiper_id: user.id });
      const swipedIds = userSwipes.map(s => String(s.swiped_id));
      
      const likedMeSwipes = await Swipe.filter({ swiped_id: user.id, action: "like" });
      const likedMeIds = likedMeSwipes.map(s => String(s.swiper_id));

      const availableProfiles = allProfiles.filter(p => {
        // 1. Filter out self and already swiped
        if (String(p.user_id) === String(user.id) || swipedIds.includes(String(p.user_id))) return false;
        
        // 2. Visibility Check (Default to true if undefined)
        if (p.is_visible === false) return false;

        // 3. Gender Matching (Safe check)
        // If data is missing, we assume match to not hide profiles unnecessarily in early stage
        const myGender = currentUserProfile.gender || 'male'; 
        const myPreference = currentUserProfile.looking_for_gender || 'any';
        
        const theirGender = p.gender || 'male';
        const theirPreference = p.looking_for_gender || 'any';

        const theyWantMe = (theirPreference === 'any' || theirPreference === myGender);
        const iWantThem = (myPreference === 'any' || myPreference === theirGender);

        if (!theyWantMe || !iWantThem) return false;

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
      
      setProfiles(availableProfiles);
    } catch (error) {
      console.error("Error loading data:", error);
      navigate(createPageUrl('Home'));
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

  const handleSwipe = async (action) => {
    if (currentIndex >= profiles.length || !userProfile) return;

    const swipedProfile = profiles[currentIndex];

    setActionFeedback(action);
    setTimeout(() => setActionFeedback(null), 600);

    try {
      // 1. ALWAYS Create Swipe Entity First (CRITICAL - must not fail!)
      const swipeData = {
          swiper_id: userProfile.user_id,
          swiper_name: userProfile.name,
          swiped_id: swipedProfile.user_id,
          swiped_name: swipedProfile.name,
          action
      };
      
      await Swipe.create(swipeData);
      console.log("✅ Swipe saved successfully:", swipeData);

      // Optimistic UI update
      setCurrentIndex(prev => prev + 1);
      setLastSwipes(prev => [...prev, { swiper_id: userProfile.user_id, swiped_id: swipedProfile.user_id, action }]);

      // 2. Check for match - CRITICAL LOGIC!
      if (action === 'like') {
          try {
              console.log(`🔍 Checking if ${swipedProfile.name} liked me back...`);

              // Check if the other person also liked me
              const reverseSwipes = await Swipe.filter({ 
                  swiper_id: swipedProfile.user_id, 
                  swiped_id: userProfile.user_id, 
                  action: 'like' 
              });

              console.log(`📊 Found ${reverseSwipes?.length || 0} reverse swipes`);

              if (reverseSwipes && reverseSwipes.length > 0) {
                  console.log(`💕 IT'S A MATCH! Creating match...`);

                  // It's a match! Check if already exists
                  const existingMatches = await Match.filter({
                      $or: [
                          { user1_id: userProfile.user_id, user2_id: swipedProfile.user_id },
                          { user1_id: swipedProfile.user_id, user2_id: userProfile.user_id }
                      ]
                  });

                  if (existingMatches.length === 0) {
                      await Match.create({
                          user1_id: userProfile.user_id,
                          user2_id: swipedProfile.user_id,
                          user1_name: userProfile.name,
                          user2_name: swipedProfile.name,
                          status: 'active'
                      });
                      console.log(`✅ Match created successfully!`);
                  } else {
                      console.log(`⏭️ Match already exists in database`);
                  }

                  // Show animation
                  setMatchData({ profile1: userProfile, profile2: swipedProfile });

                  // Try to call backend function for emails (optional)
                  try {
                      const { base44 } = require('@/api/base44Client');
                      if (base44.functions?.handleSwipe) {
                          await base44.functions.handleSwipe({
                              swiper_id: userProfile.user_id, 
                              swiped_id: swipedProfile.user_id, 
                              action,
                              origin: window.location.origin
                          });
                          console.log(`📧 Email notifications sent`);
                      }
                  } catch (e) {
                      console.log("📧 Email notification skipped (match was created)");
                  }
              } else {
                  console.log(`👍 Like saved, waiting for them to like back...`);
              }
          } catch (matchError) {
              console.error("❌ CRITICAL ERROR in match detection:", matchError);
              alert("שגיאה בזיהוי התאמה. אנא צור קשר עם התמיכה.");
          }
      }
    } catch (error) { 
        console.error("❌ CRITICAL: Swipe save failed:", error); 
        alert("שגיאה בשמירת הסווייפ. אנא נסה שוב.");
        // Revert UI since swipe wasn't saved
        setCurrentIndex(prev => Math.max(0, prev));
    }
  };
  
  const handleRewind = () => {
    if (currentIndex > 0 && lastSwipes.length > 0) {
      setLastSwipes(prev => prev.slice(0, -1));
      setCurrentIndex(prev => prev - 1);
    }
  };

  const hasProfiles = profiles.length > 0 && currentIndex < profiles.length;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white">
        <div className="w-14 h-14 rounded-full bg-[--theme-orange] flex items-center justify-center animate-pulse">
          <Home className="w-7 h-7 text-white" />
        </div>
        <p className="text-gray-500 font-medium mt-4">מחפש שותפים...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-full bg-white overflow-hidden">
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

      <div className="absolute w-full flex items-start justify-center px-3 pt-20">
        <div style={{ height: 'calc(100vh - 150px)', width: '100%', maxWidth: '448px', position: 'relative' }}>
          <AnimatePresence mode="wait">
            {hasProfiles ? (
              profiles.slice(currentIndex, currentIndex + 2).reverse().map((profile, index, arr) => (
                <ErrorBoundary key={`${profile.id}-${currentIndex}-${index}`} onSkip={() => handleSwipe('dislike')}>
                    <ProfileCard
                    profile={profile}
                    onSwipe={handleSwipe}
                    isActive={index === arr.length - 1}
                    />
                </ErrorBoundary>
              ))
            ) : (
              <motion.div 
                key="no-profiles"
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="flex flex-col items-center justify-center h-full text-center px-8"
              >
                <h2 className="text-2xl font-black text-gray-800 mb-3">זה הכל לעכשיו!</h2>
                <p className="text-gray-500 mb-8 leading-relaxed">סיימת לעבור על כל הפרופילים.<br/>נסה לשנות את העדפות החיפוש שלך או חזור מאוחר יותר.</p>
                <Button onClick={loadData} className="gradient-orange text-white font-bold py-3 px-8 rounded-full hover:scale-105 transition-transform shadow-lg">רענן</Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {hasProfiles && (
        <div className="fixed w-full flex justify-center z-30" style={{ bottom: '70px' }}>
          <ActionButtons onDislike={() => handleSwipe("dislike")} onLike={() => handleSwipe("like")} onRewind={handleRewind} />
        </div>
      )}
    </div>
  );
}