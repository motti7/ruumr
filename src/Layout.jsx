import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Compass, MessageCircle, User, Settings, Home, Smartphone, ThumbsUp } from "lucide-react";
import { Match } from "@/entities/Match";
import { motion } from "framer-motion";

import { User as UserEntity } from "@/entities/User";
import { Message } from "@/entities/Message";
import { useState, useEffect } from "react";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [matchesCount, setMatchesCount] = useState(0);
  const navigate = useNavigate(); // Import this hook if not imported!

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
               const total = matches.length + matches2.length;
               
               if (total > matchesCount && matchesCount !== 0) {
                   // New match detected!
                   if (Notification.permission === 'granted') {
                       new Notification('Roomi', {
                           body: 'יש לך התאמה חדשה!',
                           icon: 'https://cdn-icons-png.flaticon.com/512/3405/3405802.png'
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
       if (!['Onboarding', 'Home'].includes(currentPageName)) {
           checkNotifications();
           const interval = setInterval(checkNotifications, 10000); // Poll every 10s
           return () => clearInterval(interval);
       }
  }, [currentPageName, matchesCount]);

  const navigationItems = [
    { name: "גלה", path: createPageUrl("Discover"), icon: Home },
    { name: "התאמות", path: createPageUrl("Matches"), icon: MessageCircle, badgeCount: matchesCount },
    { name: "לייקים", path: createPageUrl("LikesYou"), icon: ThumbsUp }
  ];

  const shouldShowNav = !['Onboarding', 'Home', 'Chat'].includes(currentPageName);
  
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
    <div className="min-h-screen bg-gray-100 antialiased" dir="rtl">
        {showPhotoError && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <div className="bg-white rounded-2xl p-6 max-w-sm text-center shadow-2xl">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Smartphone className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">אופס! יש בעיה עם התמונות</h3>
                    <p className="text-gray-600 mb-6">
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
        <link rel="icon" href="https://cdn-icons-png.flaticon.com/512/3405/3405802.png" />
        <link rel="apple-touch-icon" href="https://cdn-icons-png.flaticon.com/512/3405/3405802.png" />
        <meta property="og:site_name" content="Roomi" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Roomi - למצוא שותפים בכיף" />
        <meta property="og:description" content="האפליקציה החדשה למציאת שותפים ודירות בישראל" />
        <meta property="og:image" content="https://cdn-icons-png.flaticon.com/512/3405/3405802.png" />
        <meta property="og:image:width" content="512" />
        <meta property="og:image:height" content="512" />
        <meta property="og:image:type" content="image/png" />
        <link rel="image_src" href="https://cdn-icons-png.flaticon.com/512/3405/3405802.png" />
        <meta name="thumbnail" content="https://cdn-icons-png.flaticon.com/512/3405/3405802.png" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Roomi - למצוא שותפים בכיף" />
        <meta name="twitter:description" content="האפליקציה החדשה למציאת שותפים ודירות בישראל" />
        <meta name="twitter:image" content="https://cdn-icons-png.flaticon.com/512/3405/3405802.png" />
        <style>{`body { background-color: #f3f4f6; }`}</style>

        <div className="hidden sm:flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden w-[375px] h-[750px] max-h-[90vh] border-8 border-gray-900 relative shrink-0">
                <div className="absolute top-0 left-0 right-0 h-6 bg-gray-900 z-50 flex justify-center">
                    <div className="w-32 h-4 bg-black rounded-b-xl"></div>
                </div>
                <div className="flex flex-col h-full bg-gray-50 relative">
                    <style>{`
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
                    .no-scrollbar::-webkit-scrollbar {
                        display: none;
                    }
                    .no-scrollbar {
                        -ms-overflow-style: none;
                        scrollbar-width: none;
                    }
                    `}</style>
                    
                    {shouldShowNav && (
                        <header className="bg-white shrink-0 z-40 border-b border-gray-200">
                            <div className="px-4 h-16 flex items-center justify-between">
                                <Link to={createPageUrl("Settings")}>
                                    <Settings className="w-6 h-6 text-gray-400"/>
                                </Link>
                                <Link to={createPageUrl("Discover")} className="flex items-center gap-2">
                                     <h1 className="text-3xl logo-font">Roomi</h1>
                                </Link>
                                <Link to={createPageUrl("Profile")}>
                                    <User className="w-6 h-6 text-gray-400"/>
                                </Link>
                            </div>
                        </header>
                    )}

                    <div className="flex-1 overflow-y-auto no-scrollbar relative">
                        <main className="bg-gray-50 pb-4">
                            {children}
                        </main>
                    </div>

                    {shouldShowNav && (
                        <nav className="shrink-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 z-40">
                            <div className="flex items-center justify-around py-2">
                            {navigationItems.map((item) => {
                                const isActive = location.pathname === item.path;
                                const Icon = item.icon;
                                return (
                                <Link key={item.name} to={item.path} className="flex-1">
                                    <motion.div
                                    whileTap={{ scale: 0.9 }}
                                    className={`flex flex-col items-center py-2 px-3 transition-colors duration-200 ${
                                        isActive ? 'text-[--theme-orange]' : 'text-gray-400'
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
            <p className="mt-6 text-gray-400 font-medium">תצוגה מקדימה במצב מובייל</p>
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
                <header className="bg-white sticky top-0 z-50 border-b border-gray-200">
                    <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
                        <Link to={createPageUrl("Settings")}>
                            <Settings className="w-6 h-6 text-gray-400"/>
                        </Link>
                        <Link to={createPageUrl("Discover")} className="flex items-center gap-2">
                             <h1 className="text-3xl logo-font">Roomi</h1>
                        </Link>
                        <Link to={createPageUrl("Profile")}>
                            <User className="w-6 h-6 text-gray-400"/>
                        </Link>
                    </div>
                </header>
            )}

            <main className={`max-w-md mx-auto bg-gray-50 ${shouldShowNav ? 'pb-20' : ''}`}>
                {children}
            </main>

            {shouldShowNav && (
                <nav className="fixed bottom-0 right-1/2 transform translate-x-1/2 max-w-md w-full bg-white/95 backdrop-blur-sm border-t border-gray-200 z-50">
                    <div className="flex items-center justify-around py-2">
                    {navigationItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;
                        return (
                        <Link key={item.name} to={item.path} className="flex-1">
                            <motion.div
                            whileTap={{ scale: 0.9 }}
                            className={`flex flex-col items-center py-2 px-3 transition-colors duration-200 ${
                                isActive ? 'text-[--theme-orange]' : 'text-gray-400'
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