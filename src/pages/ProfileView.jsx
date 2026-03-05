import React, { useState, useEffect, useRef } from "react";
import { Profile, Swipe, Match } from "@/entities/all";
import { User } from "@/entities/User";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowRight, MapPin, Dog, Cat, PawPrint, Home, Loader2, Instagram, Link as LinkIcon, Facebook, Linkedin, Twitter, Volume2, VolumeX, Music, Heart, X, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SmartImage from '@/components/shared/SmartImage';
import MatchAnimation from '../components/discover/MatchAnimation';
import ReviewsSection from '../components/reviews/ReviewsSection';
import WriteReviewModal from '../components/reviews/WriteReviewModal';

// Custom Audio Player Component with Fade In
const AudioPlayer = ({ src }) => {
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        audio.volume = 0; // Start at 0
        
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                setIsPlaying(true);
                // Fade In
                let vol = 0;
                const interval = setInterval(() => {
                    if (vol < 0.8) { // Max volume 0.8
                        vol += 0.05;
                        audio.volume = vol;
                    } else {
                        clearInterval(interval);
                    }
                }, 200); // Gradual fade in over ~3 seconds
            }).catch(error => {
                console.log("Auto-play prevented");
                setIsPlaying(false);
            });
        }

        return () => {
            if (audio) {
                audio.pause();
                audio.src = "";
            }
        };
    }, [src]);

    const toggleMute = () => {
        if (audioRef.current) {
            audioRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    return (
        <div className="flex items-center">
            <audio ref={audioRef} src={src} loop />
            <button 
                onClick={toggleMute}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
        </div>
    );
};

export default function ProfileViewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [matchData, setMatchData] = useState(null);
  const [actionFeedback, setActionFeedback] = useState(null);
  const [showActions, setShowActions] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isExMatch, setIsExMatch] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [location.search]); // Reload when URL changes

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      // Use location.search from the hook for reliability in SPA
      const urlParams = new URLSearchParams(location.search);
      const userId = urlParams.get("userId");
      const fromLikes = urlParams.get("fromLikes");

      if (!userId) {
        console.error("No userId in URL");
        navigate(createPageUrl("Matches"));
        return;
      }

      const profiles = await Profile.filter({ user_id: userId });
      if (!profiles || profiles.length === 0) {
        console.error("Profile not found");
        // Don't auto-navigate away immediately to avoid loops, just show error
        setIsLoading(false);
        return;
      }

      setProfile(profiles[0]);
      
      // Load current user data if coming from likes page
      if (fromLikes === 'true') {
        const user = await User.me();
        const myProfiles = await Profile.filter({ user_id: user.id });
        setCurrentUser(user);
        setUserProfile(myProfiles[0]);
        setShowActions(true);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
    setIsLoading(false);
  };
  
  const handleSwipe = async (action) => {
    if (!currentUser || !userProfile || !profile) return;
    
    setActionFeedback(action);
    setTimeout(() => setActionFeedback(null), 600);

    try {
      // Create swipe
      const swipeData = {
        swiper_id: userProfile.user_id,
        swiper_name: userProfile.name,
        swiped_id: profile.user_id,
        swiped_name: profile.name,
        action
      };
      
      await Swipe.create(swipeData);
      console.log("✅ Swipe saved successfully:", swipeData);

      // Check for match if liked
      if (action === 'like') {
        try {
          console.log(`🔍 Checking if ${profile.name} liked me back...`);

          const reverseSwipes = await Swipe.filter({ 
            swiper_id: profile.user_id, 
            swiped_id: userProfile.user_id, 
            action: 'like' 
          });

          console.log(`📊 Found ${reverseSwipes?.length || 0} reverse swipes`);

          if (reverseSwipes && reverseSwipes.length > 0) {
            console.log(`💕 IT'S A MATCH!`);

            const existingMatches = await Match.filter({
              $or: [
                { user1_id: userProfile.user_id, user2_id: profile.user_id },
                { user1_id: profile.user_id, user2_id: userProfile.user_id }
              ]
            });

            if (existingMatches.length === 0) {
              await Match.create({
                user1_id: userProfile.user_id,
                user2_id: profile.user_id,
                user1_name: userProfile.name,
                user2_name: profile.name,
                status: 'active'
              });
              console.log(`✅ Match created successfully!`);
            }

            setMatchData({ profile1: userProfile, profile2: profile });

            // Try to call backend function for emails
            try {
              const { base44 } = require('@/api/base44Client');
              if (base44.functions?.handleSwipe) {
                await base44.functions.handleSwipe({
                  swiper_id: userProfile.user_id, 
                  swiped_id: profile.user_id, 
                  action,
                  origin: window.location.origin
                });
              }
            } catch (e) {
              console.log("📧 Email notification skipped");
            }
          }
        } catch (matchError) {
          console.error("❌ Error in match detection:", matchError);
        }
      }
      
      // Navigate back after action
      setTimeout(() => {
        navigate(createPageUrl('LikesYou'));
      }, action === 'like' && matchData ? 4000 : 1000);
      
    } catch (error) { 
      console.error("❌ Swipe save failed:", error); 
      alert("שגיאה בשמירת הסווייפ. אנא נסה שוב.");
    }
  };

  const religionText = { secular: "חילוני/ת", traditional: "מסורתי/ת", national_religious: "דתי/ה לאומי/ת", religious: "דתי/ה", haredi: "חרדי/ת" };
  const preferenceText = { for: "בעד", against: "נגד", flow: "זורם/ת" };
  const vibeText = ["שקט", "רגוע", "מאוזן", "חברותי", "תוסס"];

  // Calculate media safely (profile might be null)
  const regularPhotos = profile?.photos?.filter(p => p) || [];
  const apartmentPhotos = (profile?.current_status === 'has_apartment' && profile?.apartment_photos?.filter(p => p)) ? profile.apartment_photos.filter(p => p) : [];
  
  const isVideoUrl = (url) => typeof url === 'string' && /\.(mp4|mov|webm|ogg)$/i.test(url);

  let allMedia = [...regularPhotos].map(item => {
      if (typeof item === 'string') {
          return isVideoUrl(item) ? { type: 'video', url: item } : { type: 'image', url: item };
      }
      return item;
  });

  if (profile?.video_url) {
      allMedia.splice(1, 0, { type: 'video', url: profile.video_url });
  }
  
  allMedia = [...allMedia, ...apartmentPhotos.map(p => ({ type: 'image', url: p }))];
  
  const media = allMedia.length > 0 ? allMedia : [{ type: 'image', url: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png" }];

  // Prefetch next and prev photos
  useEffect(() => {
    if (!media || media.length === 0) return;
    
    // Preload next
    if (currentPhotoIndex < media.length - 1 && media[currentPhotoIndex + 1].type === 'image') {
        const img = new Image();
        img.src = media[currentPhotoIndex + 1].url;
    }
    // Preload prev
    if (currentPhotoIndex > 0 && media[currentPhotoIndex - 1].type === 'image') {
        const img = new Image();
        img.src = media[currentPhotoIndex - 1].url;
    }
  }, [currentPhotoIndex, media]);

  const getSocialIcon = (link) => {
      if (!link) return null;
      const l = link.toLowerCase();
      // Only return icon, color handled by parent
      if (l.includes('facebook')) return <Facebook className="w-5 h-5" />;
      if (l.includes('instagram')) return <Instagram className="w-5 h-5" />;
      if (l.includes('twitter') || l.includes('x.com')) return <Twitter className="w-5 h-5" />;
      if (l.includes('linkedin')) return <Linkedin className="w-5 h-5" />;
      return <LinkIcon className="w-5 h-5" />;
  };

  const ensureProtocol = (url) => {
      if (!url) return '';
      if (!/^https?:\/\//i.test(url)) {
          return `https://${url}`;
      }
      return url;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-[--theme-orange]" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <p>לא נמצא פרופיל</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20" dir="rtl">
      <AnimatePresence>
        {matchData && <MatchAnimation {...matchData} onDismiss={() => setMatchData(null)} />}
      </AnimatePresence>

      <AnimatePresence>
        {actionFeedback && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[150]"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5 }}
              className={`w-32 h-32 rounded-full flex items-center justify-center shadow-2xl ${
                actionFeedback === 'like' 
                  ? 'bg-red-500' 
                  : 'bg-black'
              }`}
            >
              {actionFeedback === 'like' ? (
                <Heart className="w-16 h-16 text-white" fill="white" />
              ) : (
                <X className="w-16 h-16 text-white" strokeWidth={4} />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2">
          <ArrowRight className="w-6 h-6 text-gray-600" />
        </button>
        <h2 className="font-bold text-gray-900 text-lg">{profile.name}</h2>
      </div>

      <div className="relative">
        <div className="aspect-[3/4] bg-gray-200 relative">
          {media[currentPhotoIndex].type === 'video' ? (
              <video
                  key={currentPhotoIndex}
                  src={media[currentPhotoIndex].url}
                  className="w-full h-full object-cover"
                  controls
                  playsInline
              />
          ) : (
              <SmartImage
                key={currentPhotoIndex}
                src={media[currentPhotoIndex].url}
                alt={profile.name}
                className="w-full h-full"
                priority={true}
              />
          )}
          
          {currentPhotoIndex === 0 && profile.social_link && (
             <a 
                 href={ensureProtocol(profile.social_link)}
                 target="_blank"
                 rel="noopener noreferrer"
                 onClick={(e) => e.stopPropagation()}
                 className="absolute bottom-24 left-4 z-20 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform text-[--theme-orange]"
             >
                 {getSocialIcon(profile.social_link)}
             </a>
          )}
          <div className="absolute top-4 left-4 right-4 flex gap-1.5 z-10 pointer-events-none">
            {media.map((_, i) => (
              <div key={i} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-300 ${i === currentPhotoIndex ? 'bg-white w-full' : 'w-0'}`} />
              </div>
            ))}
          </div>
          <div className="absolute inset-0 flex z-0">
            <div className="w-1/6 h-full cursor-w-resize z-10" onClick={() => setCurrentPhotoIndex(prev => (prev - 1 + media.length) % media.length)} />
            <div className="w-4/6 h-full" /> 
            <div className="w-1/6 h-full cursor-e-resize z-10" onClick={() => setCurrentPhotoIndex(prev => (prev + 1) % media.length)} />
          </div>
        </div>
      </div>
      
      <div className="p-4 space-y-4">
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <h3 className="text-2xl font-bold mb-2">{profile.name}, {profile.age}</h3>
          <div className="flex items-start text-gray-600 mb-3">
            <MapPin className="w-4 h-4 ml-1 mt-1 flex-shrink-0" />
            <div className="flex flex-col">
                 {profile.current_status !== 'has_apartment' && profile.search_cities && profile.search_cities.length > 0 ? (
                    <>
                        <span>{profile.search_cities[0]}</span>
                        {profile.search_cities[1] && <span>{profile.search_cities[1]}</span>}
                        {profile.search_cities.length > 2 && <span className="text-xs text-gray-500">ועוד...</span>}
                    </>
                 ) : (
                    <span>{profile.location}</span>
                 )}
                 <span className="text-sm text-gray-500 mt-0.5">• {profile.search_area}</span>
            </div>
          </div>
          {profile.current_status === 'has_apartment' && (
            <div className="inline-flex items-center bg-[--theme-orange] px-3 py-2 rounded-full text-white text-sm font-bold">
              <Home className="w-4 h-4 ml-1" />
              יש לי דירה
            </div>
          )}
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm">
          <h4 className="font-bold text-lg mb-2">קצת עליי</h4>
          <p className="text-gray-700 leading-relaxed mb-4">{profile.about_me}</p>

          {/* Custom Audio Player with Fade In */}
          {profile.song_preview_url ? (
              <div className="mb-4 bg-gray-900 rounded-xl p-3 flex items-center gap-3 shadow-md">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={profile.song_image || "https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg"} alt="Album" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <div className="bar-loader"></div>
                      </div>
                  </div>
                  <div className="flex-1 min-w-0">
                      <div className="text-white font-bold truncate text-sm">{profile.song_name}</div>
                      <div className="text-gray-400 text-xs truncate">{profile.song_artist}</div>
                  </div>
                  <AudioPlayer src={profile.song_preview_url} />
              </div>
          ) : profile.spotify_track_id && (
              <div className="mb-4 rounded-xl overflow-hidden shadow-sm border border-gray-100">
                  <iframe 
                      src={`https://open.spotify.com/embed/track/${profile.spotify_track_id}?utm_source=generator&theme=0`} 
                      width="100%" 
                      height="80" 
                      frameBorder="0" 
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                      loading="lazy"
                  ></iframe>
              </div>
          )}

          {profile.social_link && (
            <a 
              href={ensureProtocol(profile.social_link)} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-white font-bold bg-[--theme-orange] px-4 py-2 rounded-full hover:brightness-110 transition-colors shadow-sm"
            >
              {React.cloneElement(getSocialIcon(profile.social_link), { className: "w-5 h-5" })}
              בואו להכיר אותי
            </a>
          )}
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm">
          <h4 className="font-bold text-lg mb-2">מה אני מחפש/ת</h4>
          <p className="text-gray-700 leading-relaxed">{profile.looking_for_description}</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm">
          <h4 className="font-bold text-lg mb-3">פרטים נוספים</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-gray-500 text-sm block mb-1">דת</span>
              <span className="font-semibold text-gray-900">{profile.religion ? religionText[profile.religion] : '-'}</span>
            </div>
            <div>
              <span className="text-gray-500 text-sm block mb-1">וייב</span>
              <span className="font-semibold text-gray-900">{profile.vibe_level ? vibeText[profile.vibe_level - 1] : '-'}</span>
            </div>
            <div>
              <span className="text-gray-500 text-sm block mb-1">כשרות</span>
              <span className="font-semibold text-gray-900">{profile.kosher_preference ? preferenceText[profile.kosher_preference] : '-'}</span>
            </div>
            <div>
              <span className="text-gray-500 text-sm block mb-1">שבת</span>
              <span className="font-semibold text-gray-900">{profile.shabbat_preference ? preferenceText[profile.shabbat_preference] : '-'}</span>
            </div>
            <div>
              <span className="text-gray-500 text-sm block mb-1">תקציב</span>
              <span className="font-semibold text-[--theme-orange]">₪{profile.budget_max?.toLocaleString()}</span>
            </div>
            {profile.pet_type !== 'none' && (
              <div>
                <span className="text-gray-500 text-sm block mb-1">חיית מחמד</span>
                <div className="flex items-center">
                  {profile.pet_type === 'dog' && <Dog className="w-4 h-4 ml-1" />}
                  {profile.pet_type === 'cat' && <Cat className="w-4 h-4 ml-1" />}
                  {profile.pet_type === 'other' && <PawPrint className="w-4 h-4 ml-1" />}
                  <span className="font-semibold text-gray-900">
                    {profile.pet_type === 'other' ? profile.pet_other_description : profile.pet_type === 'dog' ? 'כלב' : 'חתול'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {showActions && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50">
          <div className="max-w-md mx-auto flex items-center justify-center gap-6">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSwipe('dislike')}
              className="w-16 h-16 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center shadow-lg hover:border-gray-400 transition-colors"
            >
              <X className="w-8 h-8 text-gray-600" strokeWidth={3} />
            </motion.button>
            
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSwipe('like')}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center shadow-xl hover:shadow-2xl transition-shadow"
            >
              <Heart className="w-10 h-10 text-white" fill="white" />
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}