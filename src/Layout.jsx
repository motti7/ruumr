import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Compass, MessageCircle, User, Settings, Home } from "lucide-react";
import { motion } from "framer-motion";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();

  const navigationItems = [
    { name: "גלה", path: createPageUrl("Discover"), icon: Compass },
    { name: "התאמות", path: createPageUrl("Matches"), icon: MessageCircle },
    { name: "פרופיל", path: createPageUrl("Profile"), icon: User }
  ];

  const shouldShowNav = !['Onboarding', 'Home', 'Chat'].includes(currentPageName);

  return (
    <div className="min-h-screen bg-gray-100 antialiased" dir="rtl">
        <meta name="theme-color" content="#FF5722" />
        
        <div className="hidden sm:flex flex-col items-center justify-center fixed inset-0 bg-gradient-to-br from-orange-500 to-amber-500 z-[1000] text-white p-8 text-center">
            <Home className="w-24 h-24 mb-6" />
            <h1 className="text-3xl font-bold mb-4">Roomi מיועדת למובייל בלבד</h1>
            <p className="text-lg">לחוויה הטובה ביותר, אנא פתח את האפליקציה במכשיר הנייד שלך.</p>
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
                            }`}
                            >
                            <Icon className="w-7 h-7" fill={isActive ? 'currentColor' : 'none'} />
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