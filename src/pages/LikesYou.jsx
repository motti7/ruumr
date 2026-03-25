import React, { useState, useEffect } from "react";
import { Profile, Swipe } from "@/entities/all";
import { User } from "@/entities/User";
import { Loader2, ThumbsUp, ArrowRight, AlertCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import SmartImage from '@/components/shared/SmartImage';

export default function LikesYouPage() {
    const [profiles, setProfiles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [pullStart, setPullStart] = useState(0);
    const [pullDistance, setPullDistance] = useState(0);
    const [seenLikeIds, setSeenLikeIds] = useState(() => {
      try { return JSON.parse(localStorage.getItem('roomi_seen_like_ids') || '[]'); } catch { return []; }
    });
    const navigate = useNavigate();

    const loadLikes = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const user = await User.me();
            const likes = await Swipe.filter({ swiped_id: user.id, action: "like" });
            const swiperIds = likes.map(l => l.swiper_id);
            
            if (swiperIds.length > 0) {
                const profilesData = await Promise.all(
                    swiperIds.map(id => Profile.filter({ user_id: id }).then(res => res[0]))
                );
                setProfiles(profilesData.filter(p => p));
            } else {
                setProfiles([]);
            }
        } catch (e) {
            console.error(e);
            setError("שגיאה בטעינת הלייקים. אנא נסה שוב.");
            setProfiles([]);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadLikes();
    }, []);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await loadLikes();
        setIsRefreshing(false);
    };

    const handleTouchStart = (e) => {
        if (window.scrollY === 0) {
            setPullStart(e.touches[0].clientY);
        }
    };

    const handleTouchMove = (e) => {
        if (pullStart > 0 && window.scrollY === 0) {
            const distance = e.touches[0].clientY - pullStart;
            if (distance > 0) {
                setPullDistance(Math.min(distance, 100));
            }
        }
    };

    const handleTouchEnd = () => {
        if (pullDistance > 60) {
            handleRefresh();
        }
        setPullStart(0);
        setPullDistance(0);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 p-4">
                <div className="grid grid-cols-2 gap-4 pt-20">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="rounded-xl overflow-hidden">
                            <Skeleton className="aspect-[3/4]" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div 
            className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24" 
            dir="rtl"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {pullDistance > 0 && (
                <div 
                    className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 transition-opacity"
                    style={{ opacity: pullDistance / 60 }}
                >
                    <motion.div
                        className="w-8 h-8 rounded-full bg-[--theme-orange] flex items-center justify-center"
                        animate={{ rotate: pullDistance * 3.6 }}
                    >
                        <ThumbsUp className="w-4 h-4 text-white" />
                    </motion.div>
                </div>
            )}
            {isRefreshing && (
                <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50">
                    <motion.div
                        className="w-8 h-8 rounded-full bg-[--theme-orange] flex items-center justify-center"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                        <ThumbsUp className="w-4 h-4 text-white" />
                    </motion.div>
                </div>
            )}
            <div className="sticky top-16 bg-gray-50 dark:bg-gray-900 z-10 p-4 pb-2">
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white">לייקים</h1>
                    <button 
                        onClick={() => navigate(createPageUrl('LikesSent'))}
                        className="text-sm font-bold text-[--theme-orange] hover:underline select-none"
                    >
                        לייקים ששלחתי
                    </button>
                </div>
                {(() => {
                    const unseen = profiles.filter(p => !seenLikeIds.includes(p.user_id)).length;
                    return unseen > 0 ? (
                        <p className="font-medium text-[--theme-orange]">
                            {unseen} {unseen === 1 ? "לייק חדש" : "לייקים חדשים"}
                        </p>
                    ) : null;
                })()}
            </div>

            {error && (
                <div className="mx-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 mb-4">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <div>
                        <p className="text-red-700 font-medium text-sm">{error}</p>
                        <button onClick={handleRefresh} className="text-red-600 text-xs font-bold hover:underline mt-1">נסה שוב</button>
                    </div>
                </div>
            )}

            <div className="px-4 grid grid-cols-2 gap-4">
                {profiles.length === 0 && !error ? (
                    <div className="col-span-2 text-center py-20">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ThumbsUp className="w-10 h-10 text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-700 dark:text-white mb-2">עדיין אין לייקים</h3>
                        <p className="text-gray-500 dark:text-gray-400">המשך/י להחליק ולעדכן את הפרופיל שלך</p>
                    </div>
                ) : (
                    profiles.map((profile, i) => (
                        <motion.div 
                            key={profile.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 relative group cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation();
                                // Mark like as seen
                                const newSeen = [...new Set([...seenLikeIds, profile.user_id])];
                                setSeenLikeIds(newSeen);
                                localStorage.setItem('roomi_seen_like_ids', JSON.stringify(newSeen));
                                navigate(createPageUrl('ProfileView') + `?userId=${profile.user_id}&fromLikes=true`);
                            }}
                        >
                             <div className="aspect-[3/4] relative">
                                 <SmartImage 
                                     src={profile.photos?.[0]} 
                                     className="w-full h-full" 
                                     alt={profile.name}
                                     priority={true}
                                 />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-3">
                                    <h3 className="text-white font-bold text-lg">{profile.name}, {profile.age}</h3>
                                    <p className="text-white/80 text-xs">{profile.location}</p>
                                </div>
                             </div>
                             {/* Blur effect if not premium? Na, let's show them. */}
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}