
import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Info, Dog, Cat, PawPrint, Home, X } from "lucide-react";

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
                        <span className="font-bold text-white text-base">{religionText[profile.religion]}</span>
                    </div>
                    <div className="bg-white/15 backdrop-blur-sm p-4 rounded-xl">
                        <span className="text-white/70 block text-sm mb-1">וייב</span>
                        <span className="font-bold text-white text-base">{vibeText[profile.vibe_level - 1]}</span>
                    </div>
                    <div className="bg-white/15 backdrop-blur-sm p-4 rounded-xl">
                        <span className="text-white/70 block text-sm mb-1">כשרות</span>
                        <span className="font-bold text-white text-base">{preferenceText[profile.kosher_preference]}</span>
                    </div>
                    <div className="bg-white/15 backdrop-blur-sm p-4 rounded-xl">
                        <span className="text-white/70 block text-sm mb-1">שבת</span>
                        <span className="font-bold text-white text-base">{preferenceText[profile.shabbat_preference]}</span>
                    </div>
                </div>

                {profile.current_status === 'has_apartment' && (
                    <div className="bg-gradient-to-r from-[--theme-orange] to-[--theme-orange-dark] backdrop-blur-sm p-5 rounded-2xl">
                        <h4 className="font-bold text-white mb-3 flex items-center text-lg">
                            <Home className="w-6 h-6 ml-2" />
                            יש לי כבר דירה!
                        </h4>
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
    const [dragStartX, setDragStartX] = useState(0);
    const [dragStartY, setDragStartY] = useState(0);
    const [dragCurrentX, setDragCurrentX] = useState(0);
    const [dragCurrentY, setDragCurrentY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartTime, setDragStartTime] = useState(0);
    const cardRef = useRef(null);

    const regularPhotos = profile.photos?.filter(p => p) || [];
    const apartmentPhotos = profile.current_status === 'has_apartment' && profile.apartment_photos?.filter(p => p) ? profile.apartment_photos.filter(p => p) : [];
    const allPhotos = [...regularPhotos, ...apartmentPhotos];
    const photos = allPhotos.length > 0 ? allPhotos : ["https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=800&fit=crop&crop=face"];

    const handleCardTouchStart = (e) => {
        if (!isActive) return;
        const touch = e.touches[0];
        setDragStartX(touch.clientX);
        setDragStartY(touch.clientY);
        setDragCurrentX(touch.clientX);
        setDragCurrentY(touch.clientY);
        setDragStartTime(Date.now());
        setIsDragging(false); // Assume it's a tap initially
    };

    const handleCardTouchMove = (e) => {
        if (!isActive) return;
        const touch = e.touches[0];
        setDragCurrentX(touch.clientX);
        setDragCurrentY(touch.clientY);
        
        const deltaX = touch.clientX - dragStartX;
        const deltaY = touch.clientY - dragStartY;
        
        // If moved more than 10px in either direction, consider it a drag
        if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
            setIsDragging(true);
        }
    };

    const handleCardTouchEnd = () => {
        if (!isActive) return;
        
        const deltaX = dragCurrentX - dragStartX;
        // const deltaY = dragCurrentY - dragStartY; // Not used for swipe direction
        // const duration = Date.now() - dragStartTime; // Not explicitly used for current logic
        
        // If it was a drag (not a quick tap)
        if (isDragging) {
            const threshold = 100;
            
            if (Math.abs(deltaX) > threshold) {
                if (deltaX > 0) {
                    onSwipe("like");
                } else {
                    onSwipe("dislike");
                }
            }
        } else {
            // It was a tap, handle photo navigation
            const cardWidth = cardRef.current?.offsetWidth || 0;
            const rect = cardRef.current?.getBoundingClientRect();
            const relativeX = dragCurrentX - (rect?.left || 0); // Use dragCurrentX for tap position

            // Prevent photo navigation if info button was tapped (it has its own onClick)
            // A more robust solution might involve checking if the tap occurred on the info button area
            // but for simplicity, we assume this logic runs if it's not a drag or info button tap.

            if (relativeX < cardWidth / 3) {
                // Tapped on left third - previous photo
                setCurrentPhotoIndex(prev => (prev - 1 + photos.length) % photos.length);
            } else if (relativeX > (cardWidth * 2 / 3)) {
                // Tapped on right third - next photo
                setCurrentPhotoIndex(prev => (prev + 1) % photos.length);
            }
        }
        
        // Reset state
        setIsDragging(false);
        setDragStartX(0);
        setDragStartY(0);
        setDragCurrentX(0);
        setDragCurrentY(0);
    };

    const vibeText = ["שקט", "רגוע", "מאוזן", "חברותי", "תוסס"];

    const offsetX = isDragging ? dragCurrentX - dragStartX : 0;
    const offsetY = isDragging ? dragCurrentY - dragStartY : 0;
    const rotate = offsetX * 0.05;
    const opacity = 1 - Math.abs(offsetX) / 500;
    const likeOpacity = Math.max(0, Math.min(1, offsetX / 100));
    const dislikeOpacity = Math.max(0, Math.min(1, -offsetX / 100));

    const getPhotoContent = (index) => {
        // This function is only for the content overlays, not the image itself
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
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-5 pb-8">
                            <h2 className="text-4xl font-bold text-white mb-2">{profile.name}</h2>
                            <div className="flex items-center text-white/90 text-base mb-3">
                                <MapPin className="w-5 h-5 ml-1" />
                                <span>{profile.location} • {profile.search_area}</span>
                            </div>
                            {profile.current_status === 'has_apartment' && (
                                <div className="inline-flex items-center bg-[--theme-orange] px-3 py-2 rounded-full text-white text-sm font-bold">
                                    <Home className="w-4 h-4 ml-1" />
                                    יש לי דירה
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
                        {profile.about_me && (
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-5 pb-8">
                                <h3 className="text-xl font-bold text-white mb-2">קצת עליי</h3>
                                <p className="text-white/95 text-base leading-relaxed">{profile.about_me}</p>
                            </div>
                        )}
                    </>
                );
            } else if (index === 2 && profile.looking_for_description) {
                return (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-5 pb-8">
                        <h3 className="text-xl font-bold text-white mb-2">מה אני מחפש/ת</h3>
                        <p className="text-white/95 text-base leading-relaxed">{profile.looking_for_description}</p>
                    </div>
                );
            } else if (index === 3) {
                return (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-5 pb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-white mb-1">תקציב חודשי</h3>
                                <p className="text-[--theme-orange] text-2xl font-bold">₪{profile.budget_max?.toLocaleString()}</p>
                            </div>
                            {profile.pet_type !== 'none' && (
                                <div className="flex items-center text-white bg-black/50 rounded-full px-4 py-2">
                                    {profile.pet_type === 'dog' && <Dog className="w-5 h-5 ml-2" />}
                                    {profile.pet_type === 'cat' && <Cat className="w-5 h-5 ml-2" />}
                                    {profile.pet_type === 'other' && <PawPrint className="w-5 h-5 ml-2" />}
                                    <span className="text-sm font-semibold">
                                        {profile.pet_type === 'other' ? profile.pet_other_description : profile.pet_type === 'dog' ? 'כלב' : 'חתול'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            }
        } else { // Apartment photos
            // This condition is for any photo after the regular ones, implicitly for apartment
            // The outline specifically mentions an overlay for apartment photos if current_status is 'has_apartment'
            if (profile.current_status === 'has_apartment' && actualPhotoIndex >= 0) { // Check if it's an apartment photo
                return (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-5 pb-8">
                        <div className="inline-flex items-center bg-[--theme-orange] px-4 py-2 rounded-full text-white font-bold">
                            <Home className="w-5 h-5 ml-2" />
                            תמונת הדירה שלי
                        </div>
                    </div>
                );
            }
        }
        
        return null;
    };
    
    return (
        <>
            <div
                ref={cardRef}
                onTouchStart={handleCardTouchStart}
                onTouchMove={handleCardTouchMove}
                onTouchEnd={handleCardTouchEnd}
                className="absolute w-full h-full max-w-md px-2"
                style={{ 
                    top: 0,
                    left: '50%',
                    marginLeft: '-50%',
                    transform: `translateX(${offsetX}px) translateY(${offsetY * 0.3}px) rotate(${rotate}deg) scale(${isActive ? 1 : 0.95})`,
                    opacity: isActive ? opacity : 1,
                    transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
                    touchAction: 'none', // Disable default touch actions like scrolling
                    userSelect: 'none', // Prevent text selection during drag
                    WebkitUserSelect: 'none' // For webkit browsers
                }}
            >
                <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl">
                    <img
                        key={currentPhotoIndex}
                        src={photos[currentPhotoIndex]}
                        alt={profile.name}
                        className="absolute w-full h-full object-cover pointer-events-none"
                        draggable={false}
                    />

                    {/* These divs no longer handle photo navigation explicitly,
                        navigation is handled by the overall card touch events for taps.
                        They remain for layout/visual purposes if needed, but pointer-events are set to none. */}
                    <div className="absolute inset-0 flex z-10 pointer-events-none">
                        <div className="w-1/3 h-full" />
                        <div className="w-1/3 h-full" />
                        <div className="w-1/3 h-full" />
                    </div>

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
                        className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg z-20"
                    >
                        <Info className="w-5 h-5 text-[--theme-orange]" />
                    </button>

                    {getPhotoContent(currentPhotoIndex)}

                    <div 
                        className="absolute top-1/3 right-10 pointer-events-none z-20"
                        style={{ opacity: likeOpacity }}
                    >
                        <div className="bg-green-500 text-white px-6 py-3 rounded-2xl font-black text-3xl transform rotate-12 shadow-2xl border-4 border-white">
                            LIKE
                        </div>
                    </div>
                    
                    <div 
                        className="absolute top-1/3 left-10 pointer-events-none z-20"
                        style={{ opacity: dislikeOpacity }}
                    >
                        <div className="bg-red-500 text-white px-6 py-3 rounded-2xl font-black text-3xl transform -rotate-12 shadow-2xl border-4 border-white">
                            NOPE
                        </div>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <ProfileDetail profile={profile} onClose={() => setIsExpanded(false)} />
                )}
            </AnimatePresence>
        </>
    );
}
