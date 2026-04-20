import React, { useState, useEffect } from "react";
import { Profile, Swipe } from "@/entities/all";
import { User } from "@/entities/User";
import { Loader2, ThumbsUp, ArrowRight, AlertCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import SmartImage from '@/components/shared/SmartImage';
import PullToRefresh from '@/components/shared/PullToRefresh';

export default function LikesYouPage() {
    const [profiles, setProfiles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [seenLikeIds, setSeenLikeIds] = useState(() => {
      try { return JSON.parse(localStorage.getItem('roomi_seen_like_ids') || '[]'); } catch { return []; }
    });
    const navigate = useNavigate();

    const loadLikes = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const user = await User.me();

            // Fetch all profiles ever created by this user (covers account migrations/old IDs)
            const { base44: b44 } = await import('@/api/base44Client');
            const allMyProfiles = await b44.entities.Profile.filter({ created_by: user.email });
            const allMyUserIds = new Set([user.id]);
            allMyProfiles.forEach(p => { if (p.user_id) allMyUserIds.add(p.user_id); });

            // Fetch likes for all known IDs in parallel
            const likesArrays = await Promise.all(
                [...allMyUserIds].map(id => Swipe.filter({ swiped_id: id, action: "like" }))
            );
            const allLikes = likesArrays.flat();

            // Deduplicate by swiper_id
            const seen = new Set();
            const uniqueLikes = allLikes.filter(l => {
                if (seen.has(l.swiper_id)) return false;
                seen.add(l.swiper_id);
                return true;
            });

            const swiperIds = uniqueLikes.map(l => l.swiper_id);

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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 flex flex-col" dir="rtl">
            <div className="sticky top-0 bg-gray-50 dark:bg-gray-900 z-10 p-4 pb-2">
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

            <PullToRefresh onRefresh={handleRefresh}>
                <div className="px-4 py-4">
                    {profiles.length === 0 ? (
                        <div className="col-span-2 text-center py-20 px-4">
                            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ThumbsUp className="w-10 h-10 text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-700 dark:text-white mb-2">עדיין אין לייקים</h3>
                            <p className="text-gray-500 dark:text-gray-400">המשך/י להחליק ולעדכן את הפרופיל שלך</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            {profiles.map((profile, index) => (
                                <motion.div
                                    key={profile.id || profile.user_id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer"
                                    onClick={() => {
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
                                            priority={false}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-3">
                                            <h3 className="text-white font-bold text-lg">{profile.name}, {profile.age}</h3>
                                            <p className="text-white/80 text-xs">{profile.location}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </PullToRefresh>
        </div>
    );
}