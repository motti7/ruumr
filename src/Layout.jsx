import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Compass, MessageCircle, User, Settings, Home, Smartphone } from "lucide-react";
import { motion } from "framer-motion";

import { User as UserEntity } from "@/entities/User";
import { Message } from "@/entities/Message";
import { useState, useEffect } from "react";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
       const checkNotifications = async () => {
           try {
               const user = await UserEntity.me();
               if (user.enable_notifications === false) {
                   setUnreadCount(0);
                   return;
               }
               // Ideally check unread messages count here. 
               // For demo purposes/simplicity, we assume no unread logic in Layout unless implemented.
               // But if we want to show badge:
               // const unread = await Message.filter({ is_read: false, recipient_id: user.id }); // Logic depends on schema
           } catch(e) {}
       };
       if (!['Onboarding', 'Home'].includes(currentPageName)) {
           checkNotifications();
       }
  }, [currentPageName]);

  const navigationItems = [
    { name: "גלה", path: createPageUrl("Discover"), icon: Compass },
    { name: "התאמות", path: createPageUrl("Matches"), icon: MessageCircle, badge: unreadCount > 0 },
    { name: "פרופיל", path: createPageUrl("Profile"), icon: User }
  ];

  const shouldShowNav = !['Onboarding', 'Home', 'Chat'].includes(currentPageName);

  return (
    <div className="min-h-screen bg-gray-100 antialiased" dir="rtl">
        <meta name="theme-color" content="#FF5722" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-capable" content="yes" />

        <div className="hidden sm:flex flex-col items-center justify-center fixed inset-0 bg-white z-[1000] text-gray-800 p-8 text-center">
            <div className="max-w-md w-full bg-orange-50 p-12 rounded-3xl border border-orange-100 shadow-2xl flex flex-col items-center">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center mb-8 shadow-lg transform rotate-3">
                    <Home className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-4xl font-black mb-4 text-gray-900" style={{fontFamily: 'Pacifico, cursive'}}>Roomi</h1>
                <h2 className="text-2xl font-bold mb-6">חווית המובייל המושלמת מחכה לך</h2>
                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                    פיתחנו את Roomi במיוחד עבור הטלפון הנייד שלך, כדי לספק לך את חווית המשתמש הטובה, האישית והנוחה ביותר.
                </p>
                <div className="flex items-center gap-3 text-orange-600 font-semibold bg-white px-6 py-3 rounded-full shadow-sm border border-orange-100">
                    <Smartphone className="w-5 h-5" />
                    <span>אנא פתח/י דרך הנייד</span>
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
                        <Link to={createPageUrl("Profile")}>
                            <User className="w-6 h-6 text-gray-400"/>
                        </Link>
                        <Link to={createPageUrl("Discover")} className="flex items-center gap-2">
                             <h1 className="text-3xl logo-font">Roomi</h1>
                        </Link>
                        <Link to={createPageUrl("Settings")}>
                            <Settings className="w-6 h-6 text-gray-400"/>
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
                            {item.badge && (
                                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></span>
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