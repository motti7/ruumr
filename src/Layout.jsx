import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Capacitor } from "@capacitor/core";
import { User, Settings, Home, Smartphone, ThumbsUp, Puzzle, UsersRound } from "lucide-react";
import WriteReviewButton from "./components/reviews/WriteReviewButton";
import { Match } from "@/entities/Match";
import { motion } from "framer-motion";

import { User as UserEntity } from "@/entities/User";
import { useState, useEffect, useRef } from "react";
import useAndroidBackButton from "@/hooks/useAndroidBackButton";
import useTabHistory from "@/hooks/useTabHistory";
import { markRuumrPlusActivationIntent } from "@/lib/ruumrPlusActivation";
import { isRuumrSimulatorMode } from "@/lib/simulatorMode";

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

function isDesktopBrowserContext() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }

  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

function isIosLikeBrowserContext() {
  if (typeof navigator === 'undefined') {
    return false;
  }

  const ua = navigator.userAgent || '';
  const platform = navigator.platform || '';
  return /iPad|iPhone|iPod/.test(ua) || (platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [matchesCount, setMatchesCount] = useState(0);
  const matchesCountRef = useRef(0);
  const [seenMatchIds, setSeenMatchIds] = useState(() => {
    try {
      const saved = localStorage.getItem('roomi_seen_match_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const navigate = useNavigate();
  const isBrowserRuntime = typeof window !== 'undefined' && !Capacitor.isNativePlatform();

  useEffect(() => {
    matchesCountRef.current = matchesCount;
  }, [matchesCount]);

  useEffect(() => {
    if (currentPageName === 'Onboarding') {
      return;
    }

    const checkBanned = async (currentUser = null) => {
      try {
        const user = currentUser ?? await UserEntity.me();
        // Check if banned
        const { base44: b44 } = await import('@/api/base44Client');
        const banned = await b44.entities.BannedUser.filter({ email: user.email });
        if (banned.length > 0) {
          window.location.href = createPageUrl('Banned');
        }
      } catch (e) {}
    };

  const checkNotifications = async () => {
      try {
        const notificationsSupported = typeof Notification !== 'undefined';
        const isBrowserWeb = typeof window !== 'undefined' && window.location.protocol.startsWith('http');
        const user = await UserEntity.me();
        const browserNotificationsEnabled =
          notificationsSupported &&
          isBrowserWeb &&
          isDesktopBrowserContext() &&
          !isIosLikeBrowserContext() &&
          isBrowserRuntime &&
          !isRuumrSimulatorMode() &&
          user.enable_notifications !== false;

        console.info('[ruumr] Layout notifications', {
          protocol: typeof window !== 'undefined' ? window.location.protocol : 'n/a',
          isBrowserWeb,
          isDesktopBrowser: isDesktopBrowserContext(),
          isIosLikeBrowser: isIosLikeBrowserContext(),
          isBrowserRuntime,
          simulatorMode: isRuumrSimulatorMode(),
          permission: notificationsSupported ? Notification.permission : 'unsupported',
        });
        await checkBanned(user);
        const matches = await Match.filter({ user1_id: user.id }); 
        const matches2 = await Match.filter({ user2_id: user.id });
        const allMatches = [...matches, ...matches2];
        const total = allMatches.length;
        const previousTotal = matchesCountRef.current;

        if (browserNotificationsEnabled && total > previousTotal && previousTotal !== 0) {
          // New match detected!
          if (Notification.permission === 'granted') {
            new Notification('ruumr', {
              body: 'יש לך התאמה חדשה! - ruumr',
              icon: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68c919adff6ac6fafb51bed6/8bae169ed_1770239914916.png'
            });
          }
        }

        matchesCountRef.current = total;
        setMatchesCount(total);

      } catch (e) {}
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [currentPageName]);

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
    // RUUMR PLUS NAV ITEM — disabled, re-enable by uncommenting:
    // { name: "Plus", path: createPageUrl("RuumrPlus"), icon: Sparkles },
    { name: "לייקים", path: createPageUrl("LikesYou"), icon: ThumbsUp },
    { name: "הצוות", path: createPageUrl("GroupTracker"), icon: UsersRound }
  ];

  const shouldShowNav = !['Onboarding', 'Chat', 'ProfileView', 'Charter', 'Verification', 'Banned'].includes(currentPageName);
  
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
              const { base44: b44 } = await import('@/api/base44Client');
              const profiles = await b44.entities.Profile.filter({user_id: user.id});
              if (profiles.length > 0) {
                  const p = profiles[0];
                  const isBadPhoto = (ph) => ph && (ph.startsWith('blob:') || ph.toLowerCase().endsWith('.heic') || ph.toLowerCase().endsWith('.heif'));
                  const hasBadPhotos = (p.photos && p.photos.some(isBadPhoto)) ||
                                       (p.apartment_photos && p.apartment_photos.some(isBadPhoto));
                  if (hasBadPhotos) {
                      setShowPhotoError(true);
                  }
              }
          } catch(e) {}
      };
      checkPhotos();
  }, [currentPageName]);

  return (
    <div className="min-h-[100dvh] bg-gray-100 dark:bg-gray-900 antialiased overscroll-none" dir="rtl">
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
        {!Capacitor.isNativePlatform() && (
        <div className="hidden sm:flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 text-center p-4">
            <div className="w-full max-w-6xl mx-auto bg-white min-h-screen shadow-sm">
                {children}
            </div>
        </div>
        )}

        <div className={Capacitor.isNativePlatform() ? "" : "sm:hidden"}>
            {shouldShowNav && (
               <header className="bg-white dark:bg-gray-800 fixed top-0 left-0 right-0 z-[60]">
                <div className="max-w-md mx-auto px-2 flex items-center h-12 relative">
        
        {/* קבוצה ימין: הגדרות הכי ימני, ואז כוכב */}
        <div className="flex items-center gap-2 z-10">
            <Link to={createPageUrl("Settings")} aria-label="הגדרות" className="select-none flex items-center justify-center touch-manipulation">
                <Settings className="w-6 h-6 text-gray-400 dark:text-gray-500"/>
            </Link>
            <WriteReviewButton />
        </div>

        {/* אמצע: כותרת רומר — תמיד במרכז מוחלט של המסך */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Link to={createPageUrl("Discover")} className="select-none pointer-events-auto">
                 <h1 className="text-4xl font-bold tracking-tight logo-font bg-gradient-to-r from-[--theme-orange] via-red-500 to-[--theme-orange] bg-clip-text text-transparent">Ruumr</h1>
            </Link>
        </div>

        {/* קבוצה שמאל: מסננים ופרופיל */}
        <div className="flex items-center gap-2 z-10 mr-auto">
            {currentPageName === 'Discover' && (
                <FilterHintButton /> 
            )}
            <Link to={createPageUrl("Profile")} aria-label="הפרופיל שלי" className="select-none flex items-center justify-center touch-manipulation">
                <User className="w-6 h-6 text-gray-400 dark:text-gray-500"/>
            </Link>
        </div>

    </div>
</header>
            )}

            {/* 4. הקטנו את הריווח העליון של המיין כדי שהתמונה תעלה למעלה */}
            <main className={`max-w-md mx-auto bg-gray-50 dark:bg-gray-900 `} style={shouldShowNav ? { paddingTop: '48px', paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' } : undefined}>
                {children}
            </main>

            {shouldShowNav && (
                <nav className="fixed right-1/2 transform translate-x-1/2 max-w-[360px] w-[calc(100%-32px)] bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-2 border-yellow-400 z-50 rounded-2xl shadow-lg shadow-yellow-100" style={{ bottom: 'max(8px, env(safe-area-inset-bottom, 0px))' }}>
                    <div className="flex items-center justify-around py-2">
                    {navigationItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;
                        const isPlusItem = item.name === "Plus";
                        const handleClick = (e) => {
                            if (isPlusItem) {
                                e.preventDefault();
                                markRuumrPlusActivationIntent({ source: "nav" });
                                navigate(item.path);
                                return;
                            }

                            if (isActive) {
                                e.preventDefault();
                                navigate(item.path);
                            }
                        };
                        return (
                        <Link key={item.name} to={item.path} onClick={handleClick} className="flex-1 select-none">
                            <motion.div
                            whileTap={{ scale: 0.9 }}
                            className={`flex flex-col items-center justify-center transition-colors duration-200 select-none relative ${
                                isPlusItem
                                    ? `min-h-[44px] rounded-full px-3 py-2 mx-1 ${
                                        isActive
                                            ? 'bg-gradient-to-br from-[--theme-orange] to-[#FF7A45] text-white shadow-lg'
                                            : 'bg-orange-50 text-[--theme-orange] border border-orange-200'
                                      }`
                                    : `py-2 px-3 min-h-[44px] ${
                                        isActive ? 'text-[--theme-orange]' : 'text-gray-400 dark:text-gray-500'
                                      }`
                            }`}
                            >
                            {item.customIcon ? (
                                <div className={`rounded-full p-1 border-2 ${isActive ? 'border-[--theme-orange]' : 'border-gray-300'}`}>
                                    <img src={item.customIcon} className="w-7 h-7 object-contain" style={{ filter: isActive ? 'invert(40%) sepia(90%) saturate(500%) hue-rotate(340deg) brightness(90%)' : 'invert(0%)' }} alt={item.name} />
                                </div>
                            ) : (
                                <div className={isPlusItem ? 'flex items-center gap-1.5' : ''}>
                                    <Icon className={`${isPlusItem ? 'w-5 h-5' : 'w-7 h-7'}`} fill={isActive ? 'currentColor' : 'none'} />
                                    {isPlusItem && <span className="text-[10px] font-bold leading-none">Plus</span>}
                                </div>
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