import React, { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useTransform, useAnimation } from "framer-motion";
import { MapPin, Info, Dog, Cat, PawPrint, Home, X, CheckCircle2, Instagram, Link as LinkIcon, Facebook, Linkedin, Twitter, Volume2, VolumeX, Music } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import SmartImage from '@/components/shared/SmartImage';

const ProfileDetail = ({ profile, onClose }) => {
    const religionText = { secular: "חילוני/ת", traditional: "מסורתי/ת", national_religious: "דתי/ה לאומי/ת", religious: "דתי/ה", haredi: "חרדי/ת" };
    const preferenceText = { for: "בעד", against: "נגד", flow: "זורם/ת" };
    const vibeText = ["שקט", "רגוע", "מאוזן", "חברותי", "תוסס"];

    const ensureProtocol = (url) => {
        if (!url) return '';
        if (!/^https?:\/\//i.test(url)) return `https://${url}`;
        return url;
    };

    const getSocialIcon = (link) => {
        if (!link) return null;
        const l = String(link).toLowerCase();
        if (l.includes('facebook')) return <Facebook className="w-5 h-5 text-white" />;
        if (l.includes('instagram')) return <Instagram className="w-5 h-5 text-white" />;
        if (l.includes('twitter') || l.includes('x.com')) return <Twitter className="w-5 h-5 text-white" />;
        if (l.includes('linkedin')) return <Linkedin className="w-5 h-5 text-white" />;
        return <LinkIcon className="w-5 h-5 text-white" />;
    };

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
                        <div className="flex flex-col items-center">
                             {profile.current_status !== 'has_apartment' && profile.search_cities && profile.search_cities.length > 0 ? (
                                <div className="flex flex-wrap justify-center gap-1">
                                    <span>{profile.search_cities[0]}</span>
                                    {profile.search_cities[1] && <span>• {profile.search_cities[1]}</span>}
                                    {profile.search_cities.length > 2 && <span className="text-white/70">• ועוד...</span>}
                                </div>
                             ) : (
                                <span>{profile.location}</span>
                             )}
                             <span className="text-sm opacity-80">{profile.search_area}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl">
                    <h4 className="font-bold mb-2 text-white text-lg">קצת עליי</h4>
                    <p className="text-base text-white/95 leading-relaxed mb-3">{profile.about_me}</p>
                    {profile.social_link && (
                        <a 
                          href={ensureProtocol(profile.social_link)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-white font-bold bg-[--theme-orange] px-6 py-3 rounded-full hover:brightness-110 transition-colors shadow-lg mt-2"
                        >
                          {getSocialIcon(profile.social_link)}
                          בואו להכיר אותי
                        </a>
                    )}
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
                                    <div key={i} className="w-full aspect-square rounded-lg overflow-hidden">
                                        <SmartImage src={photo} alt="דירה" className="w-full h-full" priority={false} />
                                    </div>
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
    const [isMuted, setIsMuted] = useState(false);
    const audioRef = useRef(null);
    
    useEffect(() => {
        if (!audioRef.current || !profile.song_preview_url) return;

        const audio = audioRef.current;

        // Handle visibility change
        const handleVisibilityChange = () => {
            if (document.hidden) {
                audio.pause();
            } else if (isActive && !audio.paused) {
                audio.play().catch(() => {});
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Play when active (don't stop on photo change or expanded state)
        if (isActive && !document.hidden) {
            if (audio.paused) {
                audio.volume = 0;
                
                // Handle autoplay restrictions in browsers
                const playPromise = audio.play();

                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        // Fade in
                        let vol = 0;
                        const interval = setInterval(() => {
                            if (vol < 0.8) {
                                vol += 0.05;
                                audio.volume = Math.min(vol, 0.8);
                            } else {
                                clearInterval(interval);
                            }
                        }, 200);
                    }).catch(error => {
                        console.log("Audio autoplay blocked by browser - user interaction required:", error);
                        // Mute by default if autoplay fails
                        setIsMuted(true);
                    });
                }
            }
        } else {
            // Only pause if not active or tab hidden
            audio.pause();
            audio.currentTime = 0;
        }

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (!isActive) {
                audio.pause();
            }
        };
    }, [isActive, profile.song_preview_url]);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.muted = isMuted;
        }
    }, [isMuted]);

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
    
    // Combine arrays. Handle mixed content in regularPhotos.
    // We treat strings ending in video extensions as videos.
    const isVideoUrl = (url) => typeof url === 'string' && /\.(mp4|mov|webm|ogg)$/i.test(url);

    let allMedia = [...regularPhotos].map(item => {
        if (typeof item === 'string') {
            return isVideoUrl(item) ? { type: 'video', url: item } : { type: 'image', url: item };
        }
        return item; // already object?
    });

    // If legacy video_url exists (from before we removed the section), insert it (maybe at start or index 1?)
    // Let's prepend it or insert at 1 to match previous behavior if data exists
    if (profile.video_url) {
        allMedia.splice(1, 0, { type: 'video', url: profile.video_url });
    }

    // Add apartment photos (always images)
    allMedia = [...allMedia, ...apartmentPhotos.map(p => ({ type: 'image', url: p }))];
    
    const media = allMedia.length > 0 ? allMedia : []; // No fallback images

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
            setCurrentPhotoIndex(prev => (prev - 1 + media.length) % media.length);
        } else {
            setCurrentPhotoIndex(prev => (prev + 1) % media.length);
        }
    };

    const vibeText = ["שקט", "רגוע", "מאוזן", "חברותי", "תוסס"];

    const getPhotoContent = (index) => {
        const isVideo = media[index].type === 'video';
        
        if (isVideo) {
             return null; 
        }

        let logicalPhotoIndex = index;
        let isRegular = true;

        if (profile.video_url) {
            if (index > 0) logicalPhotoIndex = index - 1;
        }

        if (logicalPhotoIndex >= regularPhotos.length) {
            isRegular = false;
        }

        if (isRegular) {
            if (index === 0) {
                return (
                    <>
                        <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
                            <div className="bg-black/70 backdrop-blur-sm px-3 py-2 rounded-full text-white text-sm font-bold">
                                גיל: {profile.age}
                            </div>
                        </div>

                        {profile.social_link && (
                            <a 
                                href={profile.social_link.startsWith('http') ? profile.social_link : `https://${profile.social_link}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="absolute bottom-24 left-4 z-20 bg-[--theme-orange] p-3 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
                            >
                                {(() => {
                                    const l = String(profile.social_link).toLowerCase();
                                    if (l.includes('facebook')) return <Facebook className="w-5 h-5 text-white" />;
                                    if (l.includes('instagram')) return <Instagram className="w-5 h-5 text-white" />;
                                    if (l.includes('twitter') || l.includes('x.com')) return <Twitter className="w-5 h-5 text-white" />;
                                    if (l.includes('linkedin')) return <Linkedin className="w-5 h-5 text-white" />;
                                    return <LinkIcon className="w-5 h-5 text-white" />;
                                })()}
                            </a>
                        )}
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
                                <div className="flex items-start text-white/90 text-base mb-3">
                                    <MapPin className="w-5 h-5 ml-1 mt-1 flex-shrink-0" />
                                    <div className="flex flex-col">
                                        {profile.search_cities && profile.search_cities.length > 0 ? (
                                            <>
                                                <span>{profile.search_cities[0]}</span>
                                                {profile.search_cities[1] && <span>{profile.search_cities[1]}</span>}
                                                {profile.search_cities.length > 2 && <span className="text-xs opacity-90">ועוד...</span>}
                                            </>
                                        ) : (
                                            <span>{profile.location}</span>
                                        )}
                                        <span className="text-sm opacity-80 mt-1">• {profile.search_area}</span>
                                    </div>
                                </div>
                            )}
                            {profile.current_status === 'has_apartment' && (
                                <div className="inline-flex items-center bg-[--theme-orange] px-3 py-2 rounded-full text-white text-sm font-bold">
                                    <Home className="w-4 h-4 ml-1" />
                                    יש לי דירה!
                                </div>
                            )}
                        </div>
                    </>
                );
            } 
            
            if (logicalPhotoIndex === 1) {
                return (
                    <>
                        <div className="absolute top-4 right-4 z-10">
                            <div className="bg-black/70 backdrop-blur-sm px-3 py-2 rounded-full text-white text-sm font-bold">
                                וייב: {vibeText[profile.vibe_level - 1] || 'לא צוין'}
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
            } 
            
            if (logicalPhotoIndex === 2) {
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
                    <div className="absolute inset-0 bg-gray-100">
                        {media.length > 0 ? (
                            media[currentPhotoIndex].type === 'video' ? (
                                <video
                                    key={currentPhotoIndex}
                                    src={media[currentPhotoIndex].url}
                                    className="w-full h-full object-cover pointer-events-none"
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                />
                            ) : (
                                <div className="w-full h-full pointer-events-none">
                                    <SmartImage
                                        key={currentPhotoIndex}
                                        src={media[currentPhotoIndex].url}
                                        alt={profile.name}
                                        className="w-full h-full"
                                        priority={true}
                                    />
                                </div>
                            )
                        ) : (
                            // Empty State - White pages with just overlay (modified per request)
                            <div className="w-full h-full bg-white relative">
                                {/* Two "pages" effect could be subtle borders or shadow, but user asked for "white pages like that" without circle */}
                                <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-gray-50 opacity-50"></div>
                            </div>
                        )}
                    </div>

                    {media.length > 0 && (
                        <div className="absolute top-4 left-4 right-4 flex gap-1.5 z-10 pointer-events-none">
                            {media.map((_, i) => (
                                <div key={i} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-300 ${i === currentPhotoIndex ? 'bg-white w-full' : 'w-0'}`} />
                                </div>
                            ))}
                        </div>
                    )}

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsExpanded(true);
                        }}
                        className="absolute top-16 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg z-20 hover:bg-white transition-colors group active:scale-95 touch-manipulation"
                        aria-label="View Profile Info"
                    >
                        <Info className="w-5 h-5 text-[--theme-orange]" />
                    </button>

                    {media.length > 0 ? getPhotoContent(currentPhotoIndex) : (
                         // Fallback content when no media
                         <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-5 pb-8 pointer-events-none">
                              <h2 className="text-4xl font-bold text-white mb-1">{profile.name}</h2>
                              <div className="text-white/90 text-base mb-3 font-medium">
                                  {profile.age} • {profile.location}
                              </div>
                         </div>
                    )}

                    {/* Music Player */}
                    {profile.song_preview_url && profile.song_name && isActive && (
                        <div className="absolute top-10 left-2 z-20 flex items-center gap-3 bg-black/60 backdrop-blur-md p-2 pl-4 rounded-full border border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                             <div className="relative w-10 h-10 bg-gray-900 rounded-full overflow-hidden border border-gray-700 animate-[spin_4s_linear_infinite]">
                                  {profile.song_image ? (
                                      <img src={profile.song_image} className="w-full h-full object-cover" />
                                  ) : (
                                      <div className="w-full h-full bg-gray-800 flex items-center justify-center"><Music className="w-4 h-4 text-white"/></div>
                                  )}
                             </div>
                             <div className="flex flex-col max-w-[120px]">
                                  <span className="text-white text-xs font-bold truncate">{profile.song_name}</span>
                                  <span className="text-white/60 text-[10px] truncate">{profile.song_artist}</span>
                             </div>
                             <button 
                                onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
                                className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                             >
                                 {isMuted ? <VolumeX className="w-4 h-4 text-white"/> : <Volume2 className="w-4 h-4 text-[--theme-orange]"/>}
                             </button>
                             <audio ref={audioRef} src={profile.song_preview_url} loop className="hidden" />
                        </div>
                    )}

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