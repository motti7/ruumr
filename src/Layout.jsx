import React from "react";
import { Link, useLocation } from "react-router-dom";
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

  useEffect(() => {
       const checkNotifications = async () => {
           try {
               const user = await UserEntity.me();
               const matches = await Match.filter({ user1_id: user.id }); // basic filter
               const matches2 = await Match.filter({ user2_id: user.id });
               // Simplified count of total matches as "notification" for now, or new ones if we tracked it.
               // User asked for "small numbers on the button... depending on how many matches".
               setMatchesCount(matches.length + matches2.length);
           } catch(e) {}
       };
       if (!['Onboarding', 'Home'].includes(currentPageName)) {
           checkNotifications();
       }
  }, [currentPageName]);

  const navigationItems = [
    { name: "גלה", path: createPageUrl("Discover"), icon: Home },
    { name: "התאמות", path: createPageUrl("Matches"), icon: MessageCircle, badgeCount: matchesCount },
    { name: "לייקים", path: createPageUrl("LikesYou"), icon: ThumbsUp }
  ];

  const shouldShowNav = !['Onboarding', 'Home', 'Chat'].includes(currentPageName);

  return (
    <div className="min-h-screen bg-gray-100 antialiased" dir="rtl">
        <meta name="theme-color" content="#FF5722" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="icon" href="https://cdn-icons-png.flaticon.com/512/3405/3405802.png" />
        <link rel="apple-touch-icon" href="https://cdn-icons-png.flaticon.com/512/3405/3405802.png" />
        <meta property="og:image" content="https://cdn-icons-png.flaticon.com/512/3405/3405802.png" />
        <meta property="og:title" content="Roomi - למצוא שותפים בכיף" />
        <meta property="og:description" content="האפליקציה החדשה למציאת שותפים ודירות בישראל" />
        <style>{`body { background-color: #f3f4f6; }`}</style>

        <div className="hidden sm:flex flex-col items-center justify-center fixed inset-0 gradient-orange z-[1000] text-white p-8 text-center">
            <div className="flex flex-col items-center max-w-lg">
                <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center mb-6 shadow-xl">
                    <Home className="w-12 h-12 text-white" />
                </div>
                <h1 className="text-6xl mb-6 logo-font drop-shadow-md">Roomi</h1>
                <h2 className="text-2xl font-bold mb-4 opacity-95">חווית המובייל המושלמת מחכה לך</h2>
                <p className="text-lg opacity-90 mb-10 leading-relaxed max-w-md">
                    האפליקציה זמינה כרגע לשימוש בטלפון הנייד בלבד, כדי להבטיח לך את החוויה הטובה ביותר.
                </p>
                <div className="flex items-center gap-3 bg-white text-[--theme-orange] px-8 py-4 rounded-full shadow-lg font-bold text-lg hover:scale-105 transition-transform cursor-default">
                    <Smartphone className="w-6 h-6" />
                    <span>נא לפתוח דרך הנייד</span>
                </div>
            </div>
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