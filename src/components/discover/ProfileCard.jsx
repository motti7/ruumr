import React, { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useTransform, useAnimation } from "framer-motion";
import { MapPin, Info, Dog, Cat, PawPrint, Home, X, CheckCircle2 } from "lucide-react";
import { AnimatePresence } from "framer-motion";

const ProfileDetail = ({ profile, onClose }) => {
    const religionText = { secular: "חילוני/ת", traditional: "מסורתי/ת", national_religious: "דתי/ה לאומי/ת", religious: "דתי/ה", haredi: "חרדי/ת" };
    const preferenceText = { for: "בעד", against: "נגד", flow: "זורם/ת" };
    const vibeText = ["שקט", "רגוע", "מאוזן", "חברותי", "תוסס"];

    return (
        <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-gradient-to-b from-black/50 to-black/80 backdrop-blur-md overflow-y-auto z-[200] pb-24"
            onClick={onClose}
        >
            <button 
                onClick={onClose} 
                className="fixed top-20 left-6 z-[300] p-4 rounded-full bg-white shadow-2xl hover:bg-gray-100 transition-colors"
            >
                <X className="text-gray-800 w-7 h-7" />
            </button>
            
            <div className="p-6 pt-24 text-white space-y-6" onClick={(e) => e.stopPropagation()}>
                <div className="text-center">
                    <h3 className="text-3xl font-bold">{profile.name}, {profile.age}</h3>
                    <div className="flex items-center justify-center text-white/90 mt-3 text-base">
                        <MapPin className="w-5 h-5 ml-1" />
                        <span className="font-medium">{profile.location} • {profile.search_area}</span>
                    </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl">
                    <h4 className="font-bold mb-2 text-white text-lg">קצת עליי</h4>
                    <p className="text-base text-white/95 leading-relaxed">{profile.about_me}</p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl">
                    <h4 className="font-bold mb-2 text-white text-lg">מה אני מחפש/ת</h4>
                    <p className="text-base text-white/95 leading-relaxed">{profile.looking_for_description}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/15 backdrop-blur-sm p-4 rounded-xl">
                        <span className="text-white/70 block text-sm mb-1">דת</span>
                        <span className="font-bold text-white text-base">{religionText[profile.religion] || '-'}</span>
                    </div>
                    <div className="bg-white/15 backdrop-blur-sm p-4 rounded-xl">
                        <span className="text-white/70 block text-sm mb-1">וייב</span>
                        <span className="font-bold text-white text-base">{vibeText[profile.vibe_level - 1] || '-'}</span>
                    </div>
                    <div className="bg-white/15 backdrop-blur-sm p-4 rounded-xl">
                        <span className="text-white/70 block text-sm mb-1">כשרות</span>
                        <span className="font-bold text-white text-base">{preferenceText[profile.kosher_preference] || '-'}</span>
                    </div>
                    <div className="bg-white/15 backdrop-blur-sm p-4 rounded-xl">
                        <span className="text-white/70 block text-sm mb-1">שבת</span>
                        <span className="font-bold text-white text-base">{preferenceText[profile.shabbat_preference] || '-'}</span>
                    </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl flex items-center justify-between">
                     <div>
                        <h4 className="font-bold text-white text-lg mb-1">בעלי חיים</h4>
                        <span className="text-white/90">
                            {{'none': 'אין', 'dog': 'כלב', 'cat': 'חתול', 'other': profile.pet_other_description || 'אחר'}[profile.pet_type] || 'לא צוין'}
                        </span>
                     </div>
                     <div className="bg-white/20 p-2 rounded-full">
                        {profile.pet_type === 'dog' && <Dog className="w-6 h-6 text-white"/>}
                        {profile.pet_type === 'cat' && <Cat className="w-6 h-6 text-white"/>}
                        {profile.pet_type === 'other' && <PawPrint className="w-6 h-6 text-white"/>}
                        {profile.pet_type === 'none' && <div className="w-6 h-6 text-white/50 text-xs flex items-center justify-center">אין</div>}
                     </div>
                </div>

                {profile.current_status === 'has_apartment' && (
                    <div className="bg-gradient-to-r from-[--theme-orange] to-[--theme-orange-dark] backdrop-blur-sm p-5 rounded-2xl">
                        <h4 className="font-bold text-white mb-3 flex items-center text-lg">
                            <Home className="w-6 h-6 ml-2" />
                            יש לי כבר דירה!
                        </h4>
                        {profile.apartment_photos && profile.apartment_photos.length > 0 && (
                            <div className="grid grid-cols-3 gap-2 mt-3">
                                {profile.apartment_photos.filter(p=>p).map((photo, i) => (
                                    <img key={i} src={photo} alt="דירה" className="w-full aspect-square object-cover rounded-lg" />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="pb-10"></div>
            </div>
        </motion.div>
    );
};

export default function ProfileCard({ profile, onSwipe, isActive }) {
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Motion values for drag animation
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-15, 15]);
    const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
    
    // Badge opacities
    const likeOpacity = useTransform(x, [20, 150], [0, 1]);
    const nopeOpacity = useTransform(x, [-20, -150], [0, 1]);
    
    const controls = useAnimation();

    const regularPhotos = profile.photos?.filter(p => p) || [];
    const apartmentPhotos = profile.current_status === 'has_apartment' && profile.apartment_photos?.filter(p => p) ? profile.apartment_photos.filter(p => p) : [];
    const allPhotos = [...regularPhotos, ...apartmentPhotos];
    const photos = allPhotos.length > 0 ? allPhotos : ["https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=800&fit=crop&crop=face"];

    const handleDragEnd = async (event, info) => {
        const offset = info.offset.x;
        const velocity = info.velocity.x;

        if (offset > 100 || velocity > 500) {
            await controls.start({ x: 500, opacity: 0 });
            onSwipe("like");
        } else if (offset < -100 || velocity < -500) {
            await controls.start({ x: -500, opacity: 0 });
            onSwipe("dislike");
        } else {
            controls.start({ x: 0 });
        }
    };

    const handleTap = (e) => {
        // Ignore tap if expanded or not active
        if (!isActive || isExpanded) return;

        const rect = e.target.getBoundingClientRect();
        const tapX = e.clientX - rect.left;
        const width = rect.width;

        // If tapped on info button area (approx top left), don't change photo
        if (tapX < 60 && e.clientY - rect.top < 60) return;

        if (tapX < width / 2) {
            setCurrentPhotoIndex(prev => (prev - 1 + photos.length) % photos.length);
        } else {
            setCurrentPhotoIndex(prev => (prev + 1) % photos.length);
        }
    };

    const vibeText = ["שקט", "רגוע", "מאוזן", "חברותי", "תוסס"];

    const getPhotoContent = (index) => {
        const currentPhotoIsRegular = index < regularPhotos.length;
        const actualPhotoIndex = currentPhotoIsRegular ? index : index - regularPhotos.length;

        if (currentPhotoIsRegular) {
            if (index === 0) {
                return (
                    <>
                        <div className="absolute top-4 right-4 z-10">
                            <div className="bg-black/70 backdrop-blur-sm px-3 py-2 rounded-full text-white text-sm font-bold">
                                גיל: {profile.age}
                            </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-5 pb-8 pointer-events-none">
                            <div className="flex items-center gap-2 mb-2">
                                <h2 className="text-4xl font-bold text-white">{profile.name}</h2>
                                {profile.is_verified && (
                                    <div className="bg-blue-500/90 p-1 rounded-full shadow-lg" title="מאומת">
                                        <CheckCircle2 className="w-5 h-5 text-white" strokeWidth={3} />
                                    </div>
                                )}
                            </div>
                            {profile.current_status === 'has_apartment' ? (
                                <div className="text-white/90 text-base mb-3 font-medium">
                                    ₪{profile.apartment_total_budget?.toLocaleString()} • {profile.existing_roommates} שותפים
                                </div>
                            ) : (
                                <div className="flex items-center text-white/90 text-base mb-3">
                                    <MapPin className="w-5 h-5 ml-1" />
                                    <span>{profile.location} • {profile.search_area}</span>
                                </div>
                            )}
                            {profile.current_status === 'has_apartment' && (
                                <div className="inline-flex items-center bg-[--theme-orange] px-3 py-2 rounded-full text-white text-sm font-bold">
                                    <Home className="w-4 h-4 ml-1" />
                                    {profile.location}
                                </div>
                            )}
                        </div>
                    </>
                );
            } else if (index === 1) {
                return (
                    <>
                        <div className="absolute top-4 right-4 z-10">
                            <div className="bg-black/70 backdrop-blur-sm px-3 py-2 rounded-full text-white text-sm font-bold">
                                וייב: {vibeText[profile.vibe_level - 1]}
                            </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-5 pb-8 pointer-events-none">
                            <h3 className="text-xl font-bold text-white mb-2">התקציב שלי</h3>
                            <div className="text-white/95 text-4xl font-black">
                                ₪{profile.budget_max?.toLocaleString()}
                                <span className="text-lg font-normal opacity-80 mr-2">לחודש</span>
                            </div>
                        </div>
                    </>
                );
            } else if (index === 2) {
                return (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-5 pb-8 pointer-events-none">
                        <h3 className="text-xl font-bold text-white mb-2">מה אני מחפש/ת</h3>
                        <p className="text-white/95 text-base leading-relaxed line-clamp-3">{profile.looking_for_description}</p>
                    </div>
                );
            }
        } else if (profile.current_status === 'has_apartment') {
             return (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-5 pb-8 pointer-events-none">
                    <div className="inline-flex items-center bg-[--theme-orange] px-4 py-2 rounded-full text-white font-bold">
                        <Home className="w-5 h-5 ml-2" />
                        תמונת הדירה שלי
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <>
            <motion.div
                drag={isActive ? "x" : false}
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                dragElastic={0.7}
                onDragEnd={handleDragEnd}
                animate={controls}
                style={{ x, rotate, opacity }}
                whileTap={{ scale: 1.02 }}
                className={`absolute w-full h-full max-w-md px-2 cursor-grab active:cursor-grabbing z-10`}
            >
                <div 
                    className={`relative w-full h-full rounded-3xl overflow-hidden shadow-2xl bg-white ${profile.current_status === 'has_apartment' ? 'border-2 border-[--theme-orange]' : ''}`}
                    onClick={handleTap}
                >
                    <img
                        key={currentPhotoIndex}
                        src={photos[currentPhotoIndex]}
                        alt={profile.name}
                        className="absolute w-full h-full object-cover pointer-events-none"
                        draggable={false}
                        loading="eager"
                        decoding="async"
                    />

                    <div className="absolute top-4 left-4 right-4 flex gap-1.5 z-10 pointer-events-none">
                        {photos.map((_, i) => (
                            <div key={i} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-300 ${i === currentPhotoIndex ? 'bg-white w-full' : 'w-0'}`} />
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsExpanded(true);
                        }}
                        className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg z-20 hover:bg-white transition-colors"
                    >
                        <Info className="w-5 h-5 text-[--theme-orange]" />
                    </button>

                    {getPhotoContent(currentPhotoIndex)}

                    {/* Like / Nope Badges */}
                    <motion.div 
                        style={{ opacity: likeOpacity }}
                        className="absolute top-10 right-10 pointer-events-none z-30 transform rotate-12"
                    >
                        <div className="border-4 border-red-500 text-red-500 text-4xl font-black px-4 py-2 rounded-xl bg-black/20 backdrop-blur-sm">
                            LIKE
                        </div>
                    </motion.div>

                    <motion.div 
                        style={{ opacity: nopeOpacity }}
                        className="absolute top-10 left-10 pointer-events-none z-30 transform -rotate-12"
                    >
                        <div className="border-4 border-black text-black text-4xl font-black px-4 py-2 rounded-xl bg-white/40 backdrop-blur-sm">
                            NOPE
                        </div>
                    </motion.div>
                </div>
            </motion.div>

            <AnimatePresence>
                {isExpanded && (
                    <ProfileDetail profile={profile} onClose={() => setIsExpanded(false)} />
                )}
            </AnimatePresence>
        </>
    );
}