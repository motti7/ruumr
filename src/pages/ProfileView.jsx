import React, { useState, useEffect, useRef } from "react";
import { Profile } from "@/entities/all";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowRight, MapPin, Dog, Cat, PawPrint, Home, Loader2, Instagram, Link as LinkIcon, Facebook, Linkedin, Twitter, Volume2, VolumeX } from "lucide-react";
import SmartImage from '@/components/shared/SmartImage';

// Custom Audio Player Component
const AudioPlayer = ({ src, trackId }) => {
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !src) return;

        audio.volume = 0; 
        
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                setIsPlaying(true);
                // Fade In
                let vol = 0;
                const interval = setInterval(() => {
                    if (vol < 0.8) { 
                        vol += 0.05;
                        audio.volume = vol;
                    } else {
                        clearInterval(interval);
                    }
                }, 200);
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

    if (error || !src) {
        // Fallback to Spotify Embed if audio fails or no preview
        if (trackId) {
            return (
                <iframe 
                    src={`https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0`} 
                    width="100%" 
                    height="80" 
                    frameBorder="0" 
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                    loading="lazy"
                    className="rounded-xl"
                />
            );
        }
        return null;
    }

    return (
        <div className="flex items-center gap-2">
            <audio 
                ref={audioRef} 
                src={src} 
                loop 
                onError={() => setError(true)}
            />
            <button 
                onClick={toggleMute}
                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-colors shadow-sm"
            >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
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

  // Parse userId from query string safely
  const getUserId = () => {
      try {
          const params = new URLSearchParams(location.search);
          return params.get("userId");
      } catch (e) {
          return null;
      }
  };

  const userId = getUserId();

  useEffect(() => {
    loadProfile();
  }, [userId]); 

  const loadProfile = async () => {
    if (!userId) {
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    try {
      const profiles = await Profile.filter({ user_id: userId });
      if (profiles && profiles.length > 0) {
        setProfile(profiles[0]);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-[--theme-orange]" />
      </div>
    );
  }

  if (!profile || !userId) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-6 text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-2">הפרופיל לא נמצא</h2>
        <p className="text-gray-500 mb-6">יתכן שהמשתמש מחק את הפרופיל שלו או שהקישור שבור.</p>
        <button 
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-[--theme-orange] text-white rounded-full font-bold shadow-lg"
        >
            חזור אחורה
        </button>
      </div>
    );
  }

  const religionText = { secular: "חילוני/ת", traditional: "מסורתי/ת", national_religious: "דתי/ה לאומי/ת", religious: "דתי/ה", haredi: "חרדי/ת" };
  const preferenceText = { for: "בעד", against: "נגד", flow: "זורם/ת" };
  const vibeText = ["שקט", "רגוע", "מאוזן", "חברותי", "תוסס"];

  const regularPhotos = profile.photos?.filter(p => p) || [];
  const apartmentPhotos = profile.current_status === 'has_apartment' && profile.apartment_photos?.filter(p => p) ? profile.apartment_photos.filter(p => p) : [];
  
  let photos = [...regularPhotos, ...apartmentPhotos];
  if (photos.length === 0) {
      photos = ["https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"];
  }

  const getSocialIcon = (link) => {
      if (!link) return null;
      const l = link.toLowerCase();
      if (l.includes('facebook')) return <Facebook className="w-5 h-5" />;
      if (l.includes('instagram')) return <Instagram className="w-5 h-5" />;
      if (l.includes('twitter') || l.includes('x.com')) return <Twitter className="w-5 h-5" />;
      if (l.includes('linkedin')) return <Linkedin className="w-5 h-5" />;
      return <LinkIcon className="w-5 h-5" />;
  };

  const ensureProtocol = (url) => {
      if (!url) return '';
      if (!/^https?:\/\//i.test(url)) return `https://${url}`;
      return url;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20" dir="rtl">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-3 flex items-center gap-4 sticky top-0 z-50">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowRight className="w-6 h-6 text-gray-800" />
        </button>
        <h2 className="font-bold text-gray-900 text-lg">{profile.name}</h2>
      </div>

      {/* Hero Image */}
      <div className="relative aspect-[3/4] bg-gray-200">
        <SmartImage
          key={photos[currentPhotoIndex]}
          src={photos[currentPhotoIndex]}
          alt={profile.name}
          className="w-full h-full object-cover"
          priority={true}
        />
        
        {/* Navigation Overlay */}
        <div className="absolute inset-0 flex z-10">
            <div className="w-1/2 h-full cursor-pointer" onClick={() => setCurrentPhotoIndex(prev => (prev - 1 + photos.length) % photos.length)} />
            <div className="w-1/2 h-full cursor-pointer" onClick={() => setCurrentPhotoIndex(prev => (prev + 1) % photos.length)} />
        </div>

        {/* Indicators */}
        <div className="absolute top-4 left-4 right-4 flex gap-1.5 z-20">
          {photos.map((_, i) => (
            <div key={i} className="flex-1 h-1 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
              <div className={`h-full rounded-full transition-all duration-300 ${i === currentPhotoIndex ? 'bg-white w-full' : 'w-0'}`} />
            </div>
          ))}
        </div>

        {/* Social Link Bubble */}
        {currentPhotoIndex === 0 && profile.social_link && (
            <a 
                href={ensureProtocol(profile.social_link)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="absolute bottom-6 left-6 z-30 bg-white p-3 rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-transform text-[--theme-orange]"
            >
                {getSocialIcon(profile.social_link)}
            </a>
        )}
      </div>

      <div className="p-5 space-y-4 -mt-6 relative z-30">
        {/* Main Card */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-2">
              <div>
                  <h3 className="text-3xl font-black text-gray-900 mb-1">{profile.name}, {profile.age}</h3>
                  <div className="flex items-center text-gray-500">
                    <MapPin className="w-4 h-4 ml-1" />
                    <span>{profile.location}</span>
                  </div>
              </div>
              
              {/* Song Player in Header */}
              {(profile.song_preview_url || profile.spotify_track_id) && (
                  <div className="relative">
                       {profile.song_image && (
                           <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-lg animate-[spin_10s_linear_infinite]">
                               <img src={profile.song_image} className="w-full h-full object-cover" />
                           </div>
                       )}
                       <div className="absolute -bottom-1 -right-1">
                           <AudioPlayer src={profile.song_preview_url} trackId={profile.spotify_track_id} />
                       </div>
                  </div>
              )}
          </div>

          {profile.current_status === 'has_apartment' && (
            <div className="mt-4 inline-flex items-center bg-orange-50 text-[--theme-orange] px-3 py-1.5 rounded-full text-sm font-bold border border-orange-100">
              <Home className="w-4 h-4 ml-1.5" />
              יש לי דירה
            </div>
          )}
        </div>

        {/* Song Card (Full) */}
        {(profile.song_name || profile.spotify_track_id) && !profile.song_preview_url && (
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex items-center gap-2 mb-3">
                    <div className="bg-green-100 p-1.5 rounded-full"><Volume2 className="w-4 h-4 text-green-600"/></div>
                    <h4 className="font-bold text-gray-900">השיר שלי</h4>
                </div>
                <iframe 
                    src={`https://open.spotify.com/embed/track/${profile.spotify_track_id}?utm_source=generator&theme=0`} 
                    width="100%" 
                    height="80" 
                    frameBorder="0" 
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                    loading="lazy"
                    className="rounded-xl"
                />
            </div>
        )}

        {/* About Me */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h4 className="font-bold text-lg mb-3 text-gray-900">קצת עליי</h4>
          <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{profile.about_me}</p>
        </div>

        {/* Looking For */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h4 className="font-bold text-lg mb-3 text-gray-900">מה אני מחפש/ת</h4>
          <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{profile.looking_for_description}</p>
        </div>

        {/* Details Grid */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h4 className="font-bold text-lg mb-4 text-gray-900">פרטים נוספים</h4>
          <div className="grid grid-cols-2 gap-y-6 gap-x-4">
            <DetailItem label="דת" value={profile.religion ? religionText[profile.religion] : '-'} />
            <DetailItem label="וייב" value={profile.vibe_level ? vibeText[profile.vibe_level - 1] : '-'} />
            <DetailItem label="כשרות" value={profile.kosher_preference ? preferenceText[profile.kosher_preference] : '-'} />
            <DetailItem label="שבת" value={profile.shabbat_preference ? preferenceText[profile.shabbat_preference] : '-'} />
            <DetailItem label="תקציב" value={`₪${profile.budget_max?.toLocaleString()}`} highlight />
            
            {profile.pet_type !== 'none' && (
               <div>
                  <span className="text-gray-400 text-xs font-bold block mb-1">חיית מחמד</span>
                  <div className="flex items-center font-bold text-gray-800">
                    {profile.pet_type === 'dog' && <Dog className="w-4 h-4 ml-1 text-[--theme-orange]" />}
                    {profile.pet_type === 'cat' && <Cat className="w-4 h-4 ml-1 text-[--theme-orange]" />}
                    {profile.pet_type === 'other' && <PawPrint className="w-4 h-4 ml-1 text-[--theme-orange]" />}
                    {profile.pet_type === 'other' ? profile.pet_other_description : profile.pet_type === 'dog' ? 'כלב' : 'חתול'}
                  </div>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const DetailItem = ({ label, value, highlight }) => (
    <div>
        <span className="text-gray-400 text-xs font-bold block mb-1">{label}</span>
        <span className={`font-bold text-md ${highlight ? 'text-[--theme-orange]' : 'text-gray-800'}`}>{value}</span>
    </div>
);