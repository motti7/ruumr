import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Capacitor } from "@capacitor/core";
import { User, Settings, Home, Smartphone, Heart, Puzzle } from "lucide-react";
import { Match } from "@/entities/Match";
import { motion } from "framer-motion";

import { User as UserEntity } from "@/entities/User";
import { useState, useEffect, useRef } from "react";
import useAndroidBackButton from "@/hooks/useAndroidBackButton";
import useTabHistory from "@/hooks/useTabHistory";
import { isRuumrSimulatorMode } from "@/lib/simulatorMode";

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
    { name: "Discover", path: createPageUrl("Discover"), icon: Home },
    { name: "Matches", path: createPageUrl("Matches"), icon: Puzzle, badgeCount: unseenMatchesCount },
    { name: "Likes", path: createPageUrl("LikesYou"), icon: Heart },
    { name: "Profile", path: createPageUrl("Profile"), icon: User }
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
    <div className="relative min-h-[100dvh] overflow-hidden bg-transparent text-slate-950 antialiased overscroll-none dark:text-white" dir="rtl">
        <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(255,111,63,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(255,255,255,0.88),_transparent_24%),linear-gradient(180deg,_#fffdf8_0%,_#f8f4ed_44%,_#f3eee6_100%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(255,112,67,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.08),_transparent_30%),linear-gradient(180deg,_#0f172a_0%,_#111827_42%,_#020617_100%)]" />
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
        <div className="hidden sm:flex flex-col items-center justify-center min-h-screen bg-transparent text-center p-4">
            <div className="w-full max-w-6xl mx-auto min-h-screen shadow-sm bg-white/70 dark:bg-slate-950/70 backdrop-blur-2xl">
                {children}
            </div>
        </div>

        <div className="sm:hidden">
            {shouldShowNav && (
               <header className="fixed left-0 right-0 top-0 z-[60] border-b border-white/60 bg-white/70 shadow-[0_12px_30px_rgba(15,23,42,0.04)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/55">
                <div className="mx-auto flex h-16 max-w-md items-center justify-between px-4">
                    {currentPageName === "Discover" ? (
                        <Link
                            to={createPageUrl("Settings")}
                            aria-label="הגדרות"
                            className="flex h-11 w-11 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-white/70 hover:text-[--theme-orange] dark:text-slate-400 dark:hover:bg-white/10"
                        >
                            <Settings className="h-5 w-5" />
                        </Link>
                    ) : (
                        <Link
                            to={createPageUrl("Profile")}
                            aria-label="הפרופיל שלי"
                            className="flex h-11 w-11 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-white/70 hover:text-[--theme-orange] dark:text-slate-400 dark:hover:bg-white/10"
                        >
                            <User className="h-5 w-5" />
                        </Link>
                    )}

                    <Link to={createPageUrl("Discover")} className="select-none">
                        <h1
                            className="bg-gradient-to-r from-[#ff7a45] via-[#ff8f5d] to-[#ff5722] bg-clip-text text-[2rem] font-black tracking-[-0.08em] text-transparent drop-shadow-sm"
                            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        >
                            ruumr
                        </h1>
                    </Link>

                    {currentPageName === "Discover" ? (
                        <div className="h-11 w-11" aria-hidden="true" />
                    ) : (
                        <Link
                            to={createPageUrl("Settings")}
                            aria-label="הגדרות"
                            className="flex h-11 w-11 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-white/70 hover:text-[--theme-orange] dark:text-slate-400 dark:hover:bg-white/10"
                        >
                            <Settings className="h-5 w-5" />
                        </Link>
                    )}
                </div>
            </header>
            )}

            <main
                className="relative mx-auto max-w-md bg-transparent"
                style={shouldShowNav ? { paddingTop: '4.75rem', paddingBottom: 'calc(6.75rem + env(safe-area-inset-bottom, 0px))' } : undefined}
            >
                {children}
            </main>

            {shouldShowNav && (
                <nav
                    className="fixed left-1/2 z-50 w-[calc(100%-20px)] max-w-[380px] -translate-x-1/2 rounded-[30px] border border-white/70 bg-white/85 px-2 py-2 shadow-[0_24px_60px_rgba(15,23,42,0.14)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/70"
                    style={{ bottom: 'max(8px, env(safe-area-inset-bottom, 0px))' }}
                >
                    <div className="flex items-center justify-around gap-1">
                    {navigationItems.map((item) => {
                        const isActive = location.pathname === item.path || (item.path === createPageUrl("Discover") && (location.pathname === "/" || location.pathname === ""));
                        const isBadgeActive = item.name === "Matches";
                        const Icon = item.icon;
                        return (
                        <Link key={item.name} to={item.path} className="flex-1 select-none">
                            <motion.div
                            whileTap={{ scale: 0.9 }}
                            className={`relative flex min-h-[44px] flex-col items-center justify-center rounded-[22px] px-3 py-2 transition-all duration-200 select-none ${
                                isBadgeActive
                                  ? 'text-[--theme-orange]'
                                  : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
                            }`}
                            aria-current={isActive ? 'page' : undefined}
                            >
                            <Icon className="h-5 w-5" fill={isBadgeActive ? 'currentColor' : 'none'} />
                            {item.badgeCount > 0 && (
                                <span className="absolute -top-1 right-2 min-w-[18px] h-[18px] bg-[--theme-orange] text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-white px-0.5 shadow-sm dark:border-slate-950">
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
