import React, { useState, useEffect } from "react";
import { Profile, Swipe } from "@/entities/all";
import { User } from "@/entities/User";
import { Loader2, ArrowRight, ThumbsUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import SmartImage from '@/components/shared/SmartImage';

export default function LikesSentPage() {
    const [profiles, setProfiles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const loadSentLikes = async () => {
            setIsLoading(true);
            try {
                const user = await User.me();
                // Find swipes where swiper_id is me and action is like
                const myLikes = await Swipe.filter({ swiper_id: user.id, action: "like" });
                const swipedIds = myLikes.map(l => l.swiped_id);
                
                if (swipedIds.length > 0) {
                    const profilesData = await Promise.all(
                        swipedIds.map(id => Profile.filter({ user_id: id }).then(res => res[0]))
                    );
                    setProfiles(profilesData.filter(p => p));
                }
            } catch (e) {
                console.error(e);
            }
            setIsLoading(false);
        };
        loadSentLikes();
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
                <h1 className="text-2xl font-black text-gray-900">לייקים ששלחתי</h1>
            </div>

            <div className="p-4 grid grid-cols-2 gap-4">
                {profiles.length === 0 ? (
                    <div className="col-span-2 text-center py-20">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ThumbsUp className="w-10 h-10 text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-700 mb-2">לא שלחת לייקים עדיין</h3>
                        <p className="text-gray-500">כנס לעמוד הגילוי והתחל להחליק!</p>
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
                                navigate(createPageUrl(`ProfileView?userId=${profile.user_id}`));
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
                    ))
                )}
            </div>
        </div>
    );
}