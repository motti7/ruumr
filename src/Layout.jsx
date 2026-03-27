import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Compass, User, Settings, Home, Smartphone, ThumbsUp, Puzzle, UsersRound, SlidersHorizontal } from "lucide-react";
import WriteReviewButton from "./components/reviews/WriteReviewButton";
import { Match } from "@/entities/Match";
import { motion } from "framer-motion";

import { User as UserEntity } from "@/entities/User";
import { Message } from "@/entities/Message";
import { useState, useEffect } from "react";
import useAndroidBackButton from "@/hooks/useAndroidBackButton";
import useTabHistory from "@/hooks/useTabHistory";

function FilterHintButton() {
  return (
    <button
      onClick={() => window.dispatchEvent(new Event('openDiscoverFilters'))}
      aria-label="פילטרים"
      className="hover:scale-110 transition-transform select-none min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
    >
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Line 1 */}
        <line x1="3" y1="7" x2="23" y2="7" stroke="#FF5722" strokeWidth="2.2" strokeLinecap="round"/>
        <circle cx="9" cy="7" r="3" fill="#FF5722"/>
        {/* Line 2 */}
        <line x1="3" y1="13" x2="23" y2="13" stroke="#FF5722" strokeWidth="2.2" strokeLinecap="round"/>
        <circle cx="17" cy="13" r="3" fill="#FF5722"/>
        {/* Line 3 */}
        <line x1="3" y1="19" x2="23" y2="19" stroke="#FF5722" strokeWidth="2.2" strokeLinecap="round"/>
        <circle cx="11" cy="19" r="3" fill="#FF5722"/>
      </svg>
    </button>
  );
}

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [matchesCount, setMatchesCount] = useState(0);
  const [seenMatchIds, setSeenMatchIds] = useState(() => {
    try {
      const saved = localStorage.getItem('roomi_seen_match_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const navigate = useNavigate();

  useEffect(() => {
       const checkBanned = async () => {
           try {
               const user = await UserEntity.me();
               // Check if banned
               const { base44 } = require('@/api/base44Client');
               const banned = await base44.entities.BannedUser.filter({ email: user.email });
               if (banned.length > 0) {
                   window.location.href = createPageUrl('Banned');
               }
           } catch(e) {}
       };

       const checkNotifications = async () => {
           try {
               await checkBanned();
               const user = await UserEntity.me();
               const matches = await Match.filter({ user1_id: user.id }); 
               const matches2 = await Match.filter({ user2_id: user.id });
               const allMatches = [...matches, ...matches2];
               const total = allMatches.length;

               if (total > matchesCount && matchesCount !== 0) {
                   // New match detected!
                   if (Notification.permission === 'granted') {
                       new Notification('Ruumr', {
                           body: 'יש לך התאמה חדשה!',
                           icon: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68c919adff6ac6fafb51bed6/8bae169ed_1770239914916.png'
                       });
                   }
               }
               setMatchesCount(total);

               // Request permissions if not denied/granted yet
               if (user.enable_notifications !== false && Notification.permission === 'default') {
                   Notification.requestPermission();
               }

           } catch(e) {}
           };
           if (currentPageName !== 'Onboarding') {
           checkNotifications();
           const interval = setInterval(checkNotifications, 10000); // Poll every 10s
           return () => clearInterval(interval);
       }
       }, [currentPageName, matchesCount]);

  // Mark match as seen when viewing Chat page
  useEffect(() => {
    if (currentPageName === 'Chat') {
      const urlParams = new URLSearchParams(window.location.search);
      const matchId = urlParams.get('matchId');
      if (matchId && !seenMatchIds.includes(matchId)) {
        const newSeenIds = [...seenMatchIds, matchId];
        setSeenMatchIds(newSeenIds);
        localStorage.setItem('roomi_seen_match_ids', JSON.stringify(newSeenIds));
      }
    }
  }, [currentPageName, seenMatchIds]);

  // Listen for charter click updates (seen matches updated from Matches page)
  useEffect(() => {
    const handler = () => {
      try {
        const saved = localStorage.getItem('roomi_seen_match_ids');
        setSeenMatchIds(saved ? JSON.parse(saved) : []);
      } catch {}
    };
    window.addEventListener('roomi_seen_updated', handler);
    return () => window.removeEventListener('roomi_seen_updated', handler);
  }, []);

  // Stack-based tab history tracking
  useTabHistory();

  // Android hardware back button support
  useAndroidBackButton();

  // Calculate unseen matches count
  const unseenMatchesCount = Math.max(0, matchesCount - seenMatchIds.length);

  const navigationItems = [
    { name: "גלה", path: createPageUrl("Discover"), icon: Home },
    { name: "התאמות", path: createPageUrl("Matches"), icon: Puzzle, badgeCount: unseenMatchesCount },
    { name: "לייקים", path: createPageUrl("LikesYou"), icon: ThumbsUp },
    { name: "הצוות", path: createPageUrl("GroupTracker"), icon: UsersRound }
  ];

  const shouldShowNav = !['Onboarding', 'Chat'].includes(currentPageName);
  
  // Check for bad photos (blob URLs) and prompt user
  const [showPhotoError, setShowPhotoError] = useState(false);
  useEffect(() => {
      // Skip for Onboarding page
      if (currentPageName === 'Onboarding') {
          return;
      }

      const checkPhotos = async () => {
          try {
              const user = await UserEntity.me();
              const profiles = await require('@/api/base44Client').base44.entities.Profile.filter({user_id: user.id});
              if (profiles.length > 0) {
                  const p = profiles[0];
                  const hasBadPhotos = (p.photos && p.photos.some(ph => ph && ph.startsWith('blob:'))) ||
                                       (p.apartment_photos && p.apartment_photos.some(ph => ph && ph.startsWith('blob:')));
                  if (hasBadPhotos) {
                      setShowPhotoError(true);
                  }
              }
          } catch(e) {}
      };
      checkPhotos();
  }, [currentPageName]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 antialiased overscroll-behavior-none" dir="rtl">
        {showPhotoError && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm text-center shadow-2xl">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Smartphone className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 dark:text-white">אופס! יש בעיה עם התמונות</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        חלק מהתמונות בפרופיל שלך לא עלו כראוי ולא ניתן לראות אותן. אנא העלה אותן מחדש כדי שכולם יוכלו לראות אותך.
                    </p>
                    <button 
                        onClick={() => {
                            setShowPhotoError(false);
                            window.location.href = createPageUrl('Profile');
                        }}
                        className="w-full py-3 rounded-full gradient-orange text-white font-bold shadow-lg"
                    >
                        תיקון תמונות
                    </button>
                    <button 
                        onClick={() => setShowPhotoError(false)}
                        className="mt-3 text-gray-400 text-sm font-medium min-h-[44px] flex items-center justify-center px-4"
                        aria-label="אזכיר לי אחר כך"
                    >
                        אזכיר לי אחר כך
                    </button>
                </div>
            </div>
        )}
        <meta name="theme-color" content="#FF5722" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <link rel="icon" href="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68c919adff6ac6fafb51bed6/8bae169ed_1770239914916.png" />
        <link rel="apple-touch-icon" href="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68c919adff6ac6fafb51bed6/8bae169ed_1770239914916.png" />
        <title>Ruumr</title>
        <style>{`body { background-color: #f3f4f6; }`}</style>

        <div className="hidden sm:flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 text-center p-4">
            <div className="w-full max-w-6xl mx-auto bg-white min-h-screen shadow-sm">
                {children}
            </div>
        </div>

        <div className="sm:hidden">
            <style>
            {`
            @import url('https://fonts.googleapis.com/css2?family=Pacifico&display=swap');
            .logo-font {
                    font-family: 'Pacifico', cursive;
                    color: var(--theme-orange);
                    font-weight: 400;
                }
                .gradient-orange {
                    background: linear-gradient(135deg, var(--theme-orange) 0%, var(--theme-orange-dark) 100%);
                }
                .components-slider-thumb {
                    background-color: var(--theme-orange) !important;
                    border-color: var(--theme-orange) !important;
                }
                .components-slider-range, .components-progress-indicator {
                    background-color: var(--theme-orange) !important;
                }
                `}
            </style>
            
            {shouldShowNav && (
                <header className="bg-white dark:bg-gray-800 sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700">
                    <div style={{ height: 'env(safe-area-inset-top)' }} />
                    <div className="max-w-md mx-auto px-2 h-16 flex items-center justify-between">
                        <div className="flex-1 flex items-center gap-1">
                            <Link to={createPageUrl("Settings")} aria-label="הגדרות" className="select-none flex items-center justify-center min-w-[44px] min-h-[44px] touch-manipulation">
                                <Settings className="w-6 h-6 text-gray-400 dark:text-gray-500"/>
                            </Link>
                            <WriteReviewButton />
                        </div>
                        <div className="flex-1 flex items-center justify-center">
                            <Link to={createPageUrl("Discover")} className="select-none">
                                 <h1 className="text-4xl font-black tracking-tight logo-font bg-gradient-to-r from-[--theme-orange] via-red-500 to-[--theme-orange] bg-clip-text text-transparent drop-shadow-lg" style={{textShadow: '0 2px 8px rgba(255, 87, 34, 0.3)'}}>ruumr</h1>
                            </Link>
                        </div>
                        <div className="flex-1 flex items-center justify-end gap-2">
                            {currentPageName === 'Discover' && (
                                <FilterHintButton />
                            )}
                            <Link to={createPageUrl("Profile")} aria-label="הפרופיל שלי" className="select-none flex items-center justify-center min-w-[44px] min-h-[44px] touch-manipulation">
                                <User className="w-6 h-6 text-gray-400 dark:text-gray-500"/>
                            </Link>
                        </div>
                    </div>
                </header>
            )}

            <main className={`max-w-md mx-auto bg-gray-50 dark:bg-gray-900 ${shouldShowNav ? 'pb-20' : ''}`}>
                {children}
            </main>

            {shouldShowNav && (
                <nav className="fixed bottom-2 right-1/2 transform translate-x-1/2 max-w-[360px] w-[calc(100%-32px)] bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-2 border-yellow-400 z-50 rounded-2xl shadow-lg shadow-yellow-100" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
                    <div className="flex items-center justify-around py-2">
                    {navigationItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;
                        const handleClick = (e) => {
                            if (isActive) {
                                e.preventDefault();
                                navigate(item.path);
                            }
                        };
                        return (
                        <Link key={item.name} to={item.path} onClick={handleClick} className="flex-1 select-none">
                            <motion.div
                            whileTap={{ scale: 0.9 }}
                            className={`flex flex-col items-center py-2 px-3 min-h-[44px] justify-center transition-colors duration-200 select-none ${
                                isActive ? 'text-[--theme-orange]' : 'text-gray-400 dark:text-gray-500'
                            } relative`}
                            >
                            {item.customIcon ? (
                                <div className={`rounded-full p-1 border-2 ${isActive ? 'border-[--theme-orange]' : 'border-gray-300'}`}>
                                    <img src={item.customIcon} className="w-7 h-7 object-contain" style={{ filter: isActive ? 'invert(40%) sepia(90%) saturate(500%) hue-rotate(340deg) brightness(90%)' : 'invert(0%)' }} alt={item.name} />
                                </div>
                            ) : (
                                <Icon className="w-7 h-7" fill={isActive ? 'currentColor' : 'none'} />
                            )}
                            {item.badgeCount > 0 && (
                                <span className="absolute -top-1 right-3 min-w-[16px] h-[16px] bg-[--theme-orange] text-white text-[9px] font-bold flex items-center justify-center rounded-full border border-white px-0.5 shadow-sm">
                                    {item.badgeCount}
                                </span>
                            )}
                            </motion.div>
                        </Link>
                        );
                    })}
                    </div>
                </nav>
            )}
        </div>
    </div>
  );
}