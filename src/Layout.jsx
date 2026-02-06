import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Compass, User, Settings, Home, Smartphone, ThumbsUp, Puzzle } from "lucide-react";
import { Match } from "@/entities/Match";
import { motion } from "framer-motion";

import { User as UserEntity } from "@/entities/User";
import { Message } from "@/entities/Message";
import { useState, useEffect } from "react";

function CharterHintButton() {
  return (
    <button
      onClick={() => window.dispatchEvent(new Event('openCharter'))}
      className="bg-[--theme-orange] p-2 rounded-full shadow-md hover:scale-110 transition-transform"
    >
      <Puzzle className="w-4 h-4 text-white" />
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
       if (!['Onboarding'].includes(currentPageName)) {
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

  // Calculate unseen matches count
  const unseenMatchesCount = Math.max(0, matchesCount - seenMatchIds.length);

  const navigationItems = [
    { name: "גלה", path: createPageUrl("Discover"), icon: Home },
    { name: "התאמות", path: createPageUrl("Matches"), icon: Puzzle, badgeCount: unseenMatchesCount },
    { name: "לייקים", path: createPageUrl("LikesYou"), icon: ThumbsUp }
  ];

  const shouldShowNav = !['Onboarding', 'Chat'].includes(currentPageName);
  
  // Check for bad photos (blob URLs) and prompt user
  const [showPhotoError, setShowPhotoError] = useState(false);
  useEffect(() => {
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
      // Only check once on mount if we are not in Onboarding (to avoid annoying new users)
      if (currentPageName !== 'Onboarding') {
          checkPhotos();
      }
  }, []);

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
                        className="mt-3 text-gray-400 text-sm font-medium"
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
        <link rel="apple-touch-icon" sizes="180x180" href="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68c919adff6ac6fafb51bed6/8bae169ed_1770239914916.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68c919adff6ac6fafb51bed6/8bae169ed_1770239914916.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68c919adff6ac6fafb51bed6/8bae169ed_1770239914916.png" />
        <meta property="og:site_name" content="Ruumr" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://ruumr.me" />
        <meta property="og:locale" content="he_IL" />
        <title>Ruumr - למצוא שותפים בכיף | מציאת דירות ושותפים בישראל</title>
        <meta name="description" content="Ruumr - האפליקציה החכמה למציאת שותפים ודירות בישראל. התאמה על בסיס וייב, אורח חיים ותחומי עניין משותפים. מחפשים שותפים לדירה? הצטרפו לקהילה הגדולה של סטודנטים וצעירים." />
        <meta property="og:title" content="Ruumr - למצוא שותפים בכיף | האפליקציה המובילה לחיפוש שותפים" />
        <meta property="og:description" content="מחפשים שותפים? Ruumr היא הדרך הקלה והחכמה למצוא את השותף המושלם. אלגוריתם התאמה חכם, ממשק נוח וקהילה איכותית." />
        <meta property="og:image" content="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68c919adff6ac6fafb51bed6/8bae169ed_1770239914916.png" />
        <meta property="og:image:secure_url" content="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68c919adff6ac6fafb51bed6/8bae169ed_1770239914916.png" />
        <meta property="og:image:width" content="512" />
        <meta property="og:image:height" content="512" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:alt" content="Ruumr - אפליקציה למציאת שותפים" />
        <link rel="image_src" href="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68c919adff6ac6fafb51bed6/8bae169ed_1770239914916.png" />
        <meta name="thumbnail" content="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68c919adff6ac6fafb51bed6/8bae169ed_1770239914916.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@Ruumr" />
        <meta name="twitter:title" content="Ruumr - למצוא שותפים בכיף" />
        <meta name="twitter:description" content="האפליקציה החכמה למציאת שותפים ודירות בישראל. התאמה על בסיס וייב, אורח חיים ותחומי עניין." />
        <meta name="twitter:image" content="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68c919adff6ac6fafb51bed6/8bae169ed_1770239914916.png" />
        <meta name="twitter:image:alt" content="Ruumr Logo" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Ruumr",
            "url": "https://ruumr.me",
            "logo": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68c919adff6ac6fafb51bed6/8bae169ed_1770239914916.png",
            "description": "האפליקציה החכמה למציאת שותפים ודירות בישראל",
            "applicationCategory": "LifestyleApplication",
            "operatingSystem": "Web",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "ILS"
            }
          })}
        </script>
        <style>{`body { background-color: #f3f4f6; }`}</style>

        <div className="hidden sm:flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 text-center p-4">
            {currentPageName === 'Onboarding' || currentPageName === 'Terms' || currentPageName === 'HelpCenter' ? (
                <div className="w-full max-w-6xl mx-auto bg-white min-h-screen shadow-sm">
                    {children}
                </div>
            ) : (
                <div className="max-w-md w-full bg-white dark:bg-gray-800 p-10 rounded-3xl shadow-xl flex flex-col items-center">
                    <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-6">
                        <Smartphone className="w-10 h-10 text-[--theme-orange]" />
                    </div>
                    <h1 className="text-2xl font-black text-gray-800 dark:text-white mb-2">האפליקציה זמינה בנייד בלבד</h1>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 text-lg">
                        Ruumr היא חוויה שנועדה למובייל.
                        <br/>
                        אנא פתח/י את האפליקציה מהטלפון שלך.
                    </p>

                </div>
            )}
        </div>

        <div className="sm:hidden">
            <style>
                {`
                @import url('https://fonts.googleapis.com/css2?family=Pacifico&display=swap');
                :root {
                    --theme-orange: #FF5722;
                    --theme-orange-dark: #E64A19;
                }
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
                <header className="bg-white dark:bg-gray-800 sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
                    <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between relative">
                        <Link to={createPageUrl("Settings")} className="select-none">
                            <Settings className="w-6 h-6 text-gray-400 dark:text-gray-500"/>
                        </Link>
                        <Link to={createPageUrl("Discover")} className="select-none">
                             <h1 className="text-3xl logo-font">ruumr</h1>
                        </Link>
                        <div className="flex items-center gap-2">
                            {currentPageName === 'Discover' && (
                                <CharterHintButton />
                            )}
                            <Link to={createPageUrl("Profile")} className="select-none">
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
                <nav className="fixed bottom-0 right-1/2 transform translate-x-1/2 max-w-md w-full bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
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
                            className={`flex flex-col items-center py-2 px-3 transition-colors duration-200 select-none ${
                                isActive ? 'text-[--theme-orange]' : 'text-gray-400 dark:text-gray-500'
                            } relative`}
                            >
                            <Icon className="w-7 h-7" fill={isActive ? 'currentColor' : 'none'} />
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