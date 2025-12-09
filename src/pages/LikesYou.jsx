import React, { useState, useEffect } from "react";
import { Profile, Swipe } from "@/entities/all";
import { User } from "@/entities/User";
import { Loader2, ThumbsUp, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

export default function LikesYouPage() {
    const [profiles, setProfiles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const loadLikes = async () => {
            setIsLoading(true);
            try {
                const user = await User.me();
                // Find swipes where swiped_id is me and action is like
                const likes = await Swipe.filter({ swiped_id: user.id, action: "like" });
                const swiperIds = likes.map(l => l.swiper_id);
                
                if (swiperIds.length > 0) {
                    // Fetch profiles for these users
                    // We can't use 'in' operator easily with current SDK maybe? 
                    // Let's try Promise.all or filter if supported. 
                    // SDK filter usually supports exact match. 
                    // I'll fetch all profiles and filter in memory if list is small, or fetch one by one.
                    // Given the constraints, fetching one by one is safer for specific IDs.
                    const profilesData = await Promise.all(
                        swiperIds.map(id => Profile.filter({ user_id: id }).then(res => res[0]))
                    );
                    setProfiles(profilesData.filter(p => p));
                }
            } catch (e) {
                console.error(e);
            }
            setIsLoading(false);
        };
        loadLikes();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-[--theme-orange]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24" dir="rtl">
            <div className="sticky top-0 bg-white shadow-sm z-10 p-4 flex items-center gap-3">
                 <button onClick={() => navigate(-1)}>
                    <ArrowRight className="w-6 h-6 text-gray-600" />
                </button>
                <h1 className="text-2xl font-black text-gray-900">לייקים שקיבלתי</h1>
            </div>

            <div className="p-4 grid grid-cols-2 gap-4">
                {profiles.length === 0 ? (
                    <div className="col-span-2 text-center py-20">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ThumbsUp className="w-10 h-10 text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-700 mb-2">עדיין אין לייקים</h3>
                        <p className="text-gray-500">המשך/י להחליק ולעדכן את הפרופיל שלך</p>
                    </div>
                ) : (
                    profiles.map((profile, i) => (
                        <motion.div 
                            key={profile.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 relative group cursor-pointer"
                            onClick={() => {
                                // Navigate to a profile view or show modal. 
                                // For now, let's go to profile view if it exists or just show basic info
                                // We can use the existing ProfileView page logic if we had one exposed, 
                                // but ProfileView is in "file summaries" as pages/ProfileView.
                                window.location.href = createPageUrl(`ProfileView?userId=${profile.user_id}`);
                            }}
                        >
                             <div className="aspect-[3/4] relative">
                                <img 
                                    src={profile.photos?.[0] || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop"} 
                                    className="w-full h-full object-cover" 
                                    alt={profile.name}
                                    loading="lazy"
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