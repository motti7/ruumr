import React from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Capacitor } from "@capacitor/core";
import { User, Settings, Home, Smartphone, ThumbsUp, Puzzle, UsersRound, Sparkles, Lock } from "lucide-react";
import WriteReviewButton from "./components/reviews/WriteReviewButton";
import RuumrPlusBanner from "./components/shared/RuumrPlusBanner";
import LanguageToggle from "./components/shared/LanguageToggle";
import { motion } from "framer-motion";

import { User as UserEntity } from "@/entities/User";
import { useState, useEffect, useRef } from "react";
import useAndroidBackButton from "@/hooks/useAndroidBackButton";
import useTabHistory from "@/hooks/useTabHistory";
import { markRuumrPlusActivationIntent } from "@/lib/ruumrPlusActivation";
import { trackMixpanel } from "@/lib/mixpanelTracking";
import { isPlusEntitled } from "@/lib/ruumrPlusEntitlement";
import { isRuumrSimulatorMode } from "@/lib/simulatorMode";
import { useOptionalAuth } from "@/lib/AuthContext";
import { ensureBguPlusEntitlement } from "@/functions/ensureBguPlusEntitlement";
import { listIncomingTeamInvites } from "@/api/teamInvites";

function FilterHintButton() {
  const { t } = useTranslation();
  return (
    <button
      onClick={() => window.dispatchEvent(new Event('openDiscoverFilters'))}
      aria-label={t("filters")}
      className="header-glow select-none min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
    >
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ pointerEvents: 'none' }}>
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
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [matchesCount, setMatchesCount] = useState(0);
  const [validMatchIdsList, setValidMatchIdsList] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const matchesCountRef = useRef(0);
  const [seenMatchIds, setSeenMatchIds] = useState(() => {
    try {
      const saved = localStorage.getItem('roomi_seen_match_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [likesCount, setLikesCount] = useState(0);
  const [pendingLikerUserIds, setPendingLikerUserIds] = useState([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [seenLikeIds, setSeenLikeIds] = useState(() => {
    try {
      const saved = localStorage.getItem('roomi_seen_like_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const navigate = useNavigate();
  // Authenticated users without a Profile get locked bottom-nav tabs (they can
  // still reach Settings in the header so account deletion stays accessible).
  const { hasProfile } = useOptionalAuth();
  const tabsLocked = hasProfile === false;
  const isBrowserRuntime = typeof window !== 'undefined' && !Capacitor.isNativePlatform();

  useEffect(() => {
    matchesCountRef.current = matchesCount;
  }, [matchesCount]);

  // Pending team-join requests this user must approve.
  const [teamRequestCount, setTeamRequestCount] = useState(0);
  useEffect(() => {
    const userId = currentUser?.id;
    if (!userId || currentPageName === 'Onboarding') return;
    let cancelled = false;
    const poll = async () => {
      try {
        const requests = await listIncomingTeamInvites(userId);
        if (!cancelled) setTeamRequestCount(requests.length);
      } catch (err) {
        console.error('[ruumr] team requests poll failed', err);
      }
    };
    poll();
    const interval = setInterval(poll, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [currentUser?.id, currentPageName]);

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
        setCurrentUser(user);

        // Auto-grant Ruumr Plus for BGU students
        try {
          const email = String(user.email || '').trim().toLowerCase();
          if (email.endsWith('@post.bgu.ac.il') && !user.is_ruumr_plus) {
            ensureBguPlusEntitlement({}).then(() => {
              // Refresh user data so is_ruumr_plus updates in context
              UserEntity.me().then((fresh) => {
                if (fresh) setCurrentUser(fresh);
              }).catch(() => {});
            }).catch(() => {});
          }
        } catch {}

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
        // matchesCount is now updated inside the likes/messages block below
        // (after filtering for visible profiles). We only keep the desktop notification here.
        const previousTotal = matchesCountRef.current;

        // Count unseen likes and unread messages — only count users with real visible profiles
        try {
          const { base44: b44 } = await import('@/api/base44Client');
          const [likesSwipes, mySwipes, allMessages, allProfiles] = await Promise.all([
            b44.entities.Swipe.filter({ swiped_id: user.id, action: 'like' }),
            b44.entities.Swipe.filter({ swiper_id: user.id }),
            b44.entities.Message.filter({ is_read: false }),
            b44.entities.Profile.list('-created_date', 500),
          ]);
          // Only count likes from users who still have a visible profile
          const visibleUserIds = new Set(allProfiles.filter(p => p.is_visible !== false).map(p => p.user_id));
          const alreadySwiped = new Set(mySwipes.map(s => s.swiped_id));
          const pendingLikerIds = likesSwipes
            .map(l => l.swiper_id)
            .filter(id => !alreadySwiped.has(id) && visibleUserIds.has(id));
          setLikesCount(pendingLikerIds.length);
          setPendingLikerUserIds(pendingLikerIds);

          // Count unread messages only from matches where the other user still has a visible profile
          const [matches1, matches2] = await Promise.all([
            b44.entities.Match.filter({ user1_id: user.id, status: 'active' }),
            b44.entities.Match.filter({ user2_id: user.id, status: 'active' }),
          ]);
          const allMatches = [...matches1, ...matches2];
          // Only keep matches where the other user has a visible profile
          const validMatchIds = new Set(
            allMatches
              .filter(m => {
                const otherId = m.user1_id === user.id ? m.user2_id : m.user1_id;
                return visibleUserIds.has(otherId);
              })
              .map(m => m.id)
          );
          // Update real match count (for the matches badge) + desktop notification
          const validMatchCount = validMatchIds.size;
          if (browserNotificationsEnabled && validMatchCount > previousTotal && previousTotal !== 0) {
            if (Notification.permission === 'granted') {
              new Notification('ruumr', {
                body: t('new_match_notification'),
                icon: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68c919adff6ac6fafb51bed6/8bae169ed_1770239914916.png'
              });
            }
          }
          matchesCountRef.current = validMatchCount;
          setMatchesCount(validMatchCount);
          setValidMatchIdsList([...validMatchIds]);
          const unread = allMessages.filter(m => m.sender_id !== user.id && validMatchIds.has(m.match_id)).length;
          setUnreadMessagesCount(unread);
        } catch {}

      } catch (e) {}
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 30000); // Poll every 30s

    // Real-time subscription to Match entity — immediately re-check when a new match is created
    let unsubMatch = null;
    import('@/api/base44Client').then(({ base44: b44 }) => {
      unsubMatch = b44.entities.Match.subscribe((event) => {
        if (event.type === 'create') {
          checkNotifications();
        }
      });
    }).catch(() => {});

    // Backup: listen for custom match-created event from Discover/ProfileView pages
    const handleRuumrMatchCreated = () => {
      checkNotifications();
    };
    window.addEventListener('ruumrMatchCreated', handleRuumrMatchCreated);

    return () => {
      clearInterval(interval);
      if (unsubMatch) unsubMatch();
      window.removeEventListener('ruumrMatchCreated', handleRuumrMatchCreated);
    };
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

  // Listen for likes seen updates (from LikesYou page)
  useEffect(() => {
    const handler = () => {
      try {
        const saved = localStorage.getItem('roomi_seen_like_ids');
        setSeenLikeIds(saved ? JSON.parse(saved) : []);
      } catch {}
    };
    window.addEventListener('roomi_likes_seen_updated', handler);
    return () => window.removeEventListener('roomi_likes_seen_updated', handler);
  }, []);

  // Clear unread messages badge when entering Chat page
  useEffect(() => {
    if (currentPageName === 'Chat') {
      setUnreadMessagesCount(0);
    }
  }, [currentPageName]);

  // Stack-based tab history tracking
  useTabHistory();

  // Android hardware back button support
  useAndroidBackButton();

  // Calculate unseen matches count — only count valid matches not yet seen
  const seenMatchSet = new Set(seenMatchIds);
  const unseenMatchesCount = validMatchIdsList.filter(id => !seenMatchSet.has(id)).length;
  const seenSet = new Set(seenLikeIds);
  const unseenLikesCount = pendingLikerUserIds.filter(id => !seenSet.has(id)).length;

  const navigationItems = [
    { id: "discover", name: t("nav_discover"), path: createPageUrl("Discover"), icon: Home },
    { id: "matches", name: t("nav_matches"), path: createPageUrl("Matches"), icon: Puzzle, badgeCount: unseenMatchesCount, messageBadge: unreadMessagesCount },
    { id: "plus", name: "Plus", path: createPageUrl("RuumrPlus"), icon: Sparkles },
    { id: "likes", name: t("nav_likes"), path: createPageUrl("LikesYou"), icon: ThumbsUp, badgeCount: unseenLikesCount },
    { id: "team", name: t("nav_team"), path: createPageUrl("GroupTracker"), icon: UsersRound }
  ].filter(Boolean);

  const shouldShowNav = !['Onboarding', 'Chat', 'ProfileView', 'Charter', 'Verification', 'Banned', 'RuumrPlusPricing', 'RuumrPlusCheckout'].includes(currentPageName);
  const appShellWidthClass = "w-full max-w-md md:max-w-5xl mx-auto";
  
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
    <div className="min-h-[100dvh] bg-gray-100 dark:bg-gray-900 antialiased overscroll-none" dir={i18n.dir()}>
        {!['Onboarding', 'Banned', 'Verification'].includes(currentPageName) && <RuumrPlusBanner />}
        {showPhotoError && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm text-center shadow-2xl">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Smartphone className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 dark:text-white">{t("photo_error_title")}</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        {t("photo_error_body")}
                    </p>
                    <button 
                        onClick={() => {
                            setShowPhotoError(false);
                            window.location.href = createPageUrl('Profile');
                        }}
                        className="w-full py-3 rounded-full gradient-orange text-white font-bold shadow-lg"
                    >
                        {t("photo_error_fix_button")}
                    </button>
                    <button
                        onClick={() => setShowPhotoError(false)}
                        className="mt-3 text-gray-400 text-sm font-medium min-h-[44px] flex items-center justify-center px-4"
                        aria-label={t("remind_me_later")}
                    >
                        {t("remind_me_later")}
                    </button>
                </div>
            </div>
        )}
        {/* App chrome (header + bottom nav) must render at all viewport widths.
            Previously the mobile chrome was `sm:hidden` and a separate
            chrome-less block rendered at >=640px, which hid the Settings gear and
            bottom nav on iPad — the app WebView is not detected as a native
            Capacitor platform, so it fell into the wide-screen branch. The
            chrome is shared across sizes, while the content shell widens on
            tablet so iPad screens do not render as a narrow phone column. */}
        <div>
            {shouldShowNav && (
               <header className="bg-white dark:bg-gray-800 fixed top-0 left-0 right-0 z-[60]" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
                {/* Pinned dir so the header controls keep fixed positions and don't
                    swap sides when the user switches language (logo stays centered). */}
                <div dir="rtl" className={`${appShellWidthClass} flex items-center justify-between h-12 relative`}>

        {/* קבוצה ימין — קבועה בכל הטאבים (הגדרות + החלפת שפה) כדי שהכפתורים
            לא יזוזו ושיישאר מרווח מספק מהלוגו במרכז. */}
        <div className="flex items-center w-[120px] justify-start gap-1 ps-2 z-10">
            <Link to={createPageUrl("Settings")} aria-label={t("settings")} className="header-glow select-none flex items-center justify-center touch-manipulation w-11 h-11">
                <Settings className="w-6 h-6 text-gray-400 dark:text-gray-500"/>
            </Link>
            <LanguageToggle />
        </div>

        {/* אמצע: כותרת רומר — תמיד במרכז מוחלט של המסך */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Link to={createPageUrl("Discover")} className="header-glow select-none pointer-events-auto">
                 <h1 className="text-4xl font-bold tracking-tight logo-font bg-gradient-to-r from-[--theme-orange] via-red-500 to-[--theme-orange] bg-clip-text text-transparent">Ruumr</h1>
            </Link>
        </div>

        {/* קבוצה שמאל — כפתור הפרופיל קבוע בקצה החיצוני (justify-end נועל אותו
            במקום), והכפתור תלוי-הטאב מופיע מצדו הפנימי בלבד: פילטר ב-Discover,
            כתיבת ביקורת ב-Matches. הם לעולם לא מופיעים יחד, כך שהקבוצה מכילה
            לכל היותר שני כפתורים ושום כפתור אחר לא זז בין הטאבים. */}
        <div className="flex items-center w-[120px] justify-end gap-1 pe-2 z-10">
            {currentPageName === 'Discover' && (
                <FilterHintButton />
            )}
            {currentPageName === 'Matches' && (
                <WriteReviewButton />
            )}
            <Link to={createPageUrl("Profile")} aria-label={t("my_profile")} className="header-glow relative z-10 select-none flex items-center justify-center touch-manipulation w-11 h-11">
                <User className="w-6 h-6 text-gray-400 dark:text-gray-500"/>
            </Link>
        </div>

    </div>
</header>
            )}

            {/* 4. הקטנו את הריווח העליון של המיין כדי שהתמונה תעלה למעלה */}
            <main className={`${appShellWidthClass} bg-gray-50 dark:bg-gray-900`} style={shouldShowNav ? { paddingTop: 'calc(48px + env(safe-area-inset-top, 0px))', paddingBottom: 'calc(64px + var(--app-safe-area-bottom, env(safe-area-inset-bottom, 0px)))' } : undefined}>
                {shouldShowNav && teamRequestCount > 0 && currentPageName !== 'GroupTracker' && (
                    <button
                        onClick={() => navigate(createPageUrl('GroupTracker'))}
                        className="w-full flex items-center gap-3 bg-orange-50 border-b border-orange-100 px-4 py-3 text-right active:bg-orange-100"
                        dir={i18n.dir()}
                    >
                        <div className="w-9 h-9 rounded-full gradient-orange flex items-center justify-center flex-shrink-0">
                            <UsersRound className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-800">
                                {teamRequestCount === 1 ? t('team_request_one') : t('team_request_many', { count: teamRequestCount })}
                            </p>
                            <p className="text-xs text-gray-500">{t('team_request_tap_hint')}</p>
                        </div>
                        <span className="text-[--theme-orange] font-bold text-sm">{t('team_request_view')} ›</span>
                    </button>
                )}
                {children}
            </main>

            {shouldShowNav && (
                <nav className="fixed left-0 right-0 bottom-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl z-50 border-t border-gray-100 dark:border-gray-800" style={{ paddingBottom: 'var(--app-safe-area-bottom, env(safe-area-inset-bottom, 0px))' }}>
                    <div className={`${appShellWidthClass} flex items-center justify-around py-2`}>
                    {navigationItems.map((item) => {
                        const isActive = location.pathname === item.path ||
                            (item.id === "discover" && (location.pathname === '/' || currentPageName === 'Discover'));
                        const Icon = item.icon;
                        const isPlusItem = item.id === "plus";
                        const hasMessageBadge = (item.messageBadge || 0) > 0;
                        const handleClick = (e) => {
                            if (tabsLocked) {
                                // No Profile yet: tabs are non-functional. Keep the
                                // user on Discover, where the "complete profile" CTA lives.
                                e.preventDefault();
                                navigate(createPageUrl("Discover"));
                                return;
                            }

                            if (isPlusItem) {
                                e.preventDefault();
                                // Track Plus nav button click
                                trackMixpanel('Plus Nav Button Clicked', { source: currentPageName });
                                // Entitled users go straight to Plus (and auto-activate);
                                // everyone else sees the coming-soon screen.
                                if (isPlusEntitled(currentUser)) {
                                    markRuumrPlusActivationIntent({ source: "nav" });
                                    navigate(createPageUrl("RuumrPlus"));
                                } else {
                                    navigate(createPageUrl("RuumrPlusComingSoon"));
                                }
                                return;
                            }

                            if (isActive) {
                                e.preventDefault();
                                navigate(item.path);
                            }
                        };
                        return (
                        <Link key={item.id} to={item.path} onClick={handleClick} className="flex-1 select-none">
                            <motion.div
                            whileTap={{ scale: 0.9 }}
                            className={`flex flex-col items-center justify-center transition-colors duration-200 select-none relative ${tabsLocked ? 'opacity-40' : ''} ${
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
                                    <Icon className={`${isPlusItem ? 'w-5 h-5' : 'w-7 h-7'}`} fill="none" />
                                    {isPlusItem && <span className="text-[10px] font-bold leading-none">Plus</span>}
                                </div>
                            )}
                            {item.badgeCount > 0 && (
                                <span className="absolute -top-1 right-3 min-w-[16px] h-[16px] bg-[--theme-orange] text-white text-[9px] font-bold flex items-center justify-center rounded-full border border-white px-0.5 shadow-sm">
                                    {item.badgeCount}
                                </span>
                            )}
                            {hasMessageBadge && (
                                <span className="absolute -top-1 left-3 min-w-[16px] h-[16px] bg-yellow-400 text-white text-[9px] font-bold flex items-center justify-center rounded-full border border-white px-0.5 shadow-sm">
                                    {item.messageBadge}
                                </span>
                            )}
                            {tabsLocked && !isPlusItem && (
                                <span className="absolute -top-1 right-2 w-[14px] h-[14px] bg-gray-400 text-white flex items-center justify-center rounded-full border border-white shadow-sm" aria-hidden="true">
                                    <Lock className="w-2 h-2" strokeWidth={3} />
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