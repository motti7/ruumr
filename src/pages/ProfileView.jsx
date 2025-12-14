import React, { useState, useEffect } from "react";
import { Profile } from "@/entities/all";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowRight, MapPin, Dog, Cat, PawPrint, Home, Loader2, Instagram, Link as LinkIcon, Facebook, Linkedin, Twitter } from "lucide-react";
import { motion } from "framer-motion";
import SmartImage from '@/components/shared/SmartImage';

export default function ProfileViewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const userId = urlParams.get("userId");

      if (!userId) {
        navigate(createPageUrl("Matches"));
        return;
      }

      const profiles = await Profile.filter({ user_id: userId });
      if (profiles.length === 0) {
        navigate(createPageUrl("Matches"));
        return;
      }

      setProfile(profiles[0]);
    } catch (error) {
      console.error("Error loading profile:", error);
      navigate(createPageUrl("Matches"));
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

  // Prefetch next and prev photos
  useEffect(() => {
    if (!photos || photos.length === 0) return;
    
    // Preload next
    if (currentPhotoIndex < photos.length - 1) {
        const img = new Image();
        img.src = photos[currentPhotoIndex + 1];
    }
    // Preload prev (if navigating back)
    if (currentPhotoIndex > 0) {
        const img = new Image();
        img.src = photos[currentPhotoIndex - 1];
    }
  }, [currentPhotoIndex, photos]);

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <p>לא נמצא פרופיל</p>
      </div>
    );
  }

  const religionText = { secular: "חילוני/ת", traditional: "מסורתי/ת", national_religious: "דתי/ה לאומי/ת", religious: "דתי/ה", haredi: "חרדי/ת" };
  const preferenceText = { for: "בעד", against: "נגד", flow: "זורם/ת" };
  const vibeText = ["שקט", "רגוע", "מאוזן", "חברותי", "תוסס"];

  const regularPhotos = profile.photos?.filter(p => p) || [];
  const apartmentPhotos = profile.current_status === 'has_apartment' && profile.apartment_photos?.filter(p => p) ? profile.apartment_photos.filter(p => p) : [];
  // Deduplicate photos to prevent "seeing the same photo twice"
  const allPhotos = Array.from(new Set([...regularPhotos, ...apartmentPhotos]));
  const photos = allPhotos.length > 0 ? allPhotos : ["https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=800&fit=crop&crop=face"];

  const getSocialIcon = (link) => {
      if (!link) return null;
      const l = link.toLowerCase();
      if (l.includes('facebook')) return <Facebook className="w-4 h-4 text-white" />;
      if (l.includes('instagram')) return <Instagram className="w-4 h-4 text-white" />;
      if (l.includes('twitter') || l.includes('x.com')) return <Twitter className="w-4 h-4 text-white" />;
      if (l.includes('linkedin')) return <Linkedin className="w-4 h-4 text-white" />;
      return <LinkIcon className="w-4 h-4 text-white" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20" dir="rtl">
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2">
          <ArrowRight className="w-6 h-6 text-gray-600" />
        </button>
        <h2 className="font-bold text-gray-900 text-lg">{profile.name}</h2>
      </div>

      <div className="relative">
        <div className="aspect-[3/4] bg-gray-200 relative">
          <SmartImage
            key={photos[currentPhotoIndex]}
            src={photos[currentPhotoIndex]}
            alt={profile.name}
            className="w-full h-full"
            priority={true}
          />
          {currentPhotoIndex === 0 && profile.social_link && (
             <a 
                 href={profile.social_link}
                 target="_blank"
                 rel="noopener noreferrer"
                 onClick={(e) => e.stopPropagation()}
                 className="absolute top-8 left-4 z-20 bg-[--theme-orange] p-2 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
             >
                 {getSocialIcon(profile.social_link)}
             </a>
          )}
          <div className="absolute top-4 left-4 right-4 flex gap-1.5 z-10">
            {photos.map((_, i) => (
              <div key={i} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-300 ${i === currentPhotoIndex ? 'bg-white w-full' : 'w-0'}`} />
              </div>
            ))}
          </div>
          <div className="absolute inset-0 flex z-0">
            <div className="w-1/2 h-full cursor-w-resize" onClick={() => setCurrentPhotoIndex(prev => (prev - 1 + photos.length) % photos.length)} />
            <div className="w-1/2 h-full cursor-e-resize" onClick={() => setCurrentPhotoIndex(prev => (prev + 1) % photos.length)} />
          </div>
        </div>
      </div>
      
      {/* Lightbox for full size viewing */}
      {/* (Optional: could add ImageLightbox here too if requested, but user asked for it in Onboarding specifically. Adding it here is a bonus) */}

      <div className="p-4 space-y-4">
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <h3 className="text-2xl font-bold mb-2">{profile.name}, {profile.age}</h3>
          <div className="flex items-center text-gray-600 mb-3">
            <MapPin className="w-4 h-4 ml-1" />
            <span>{profile.location} • {profile.search_area}</span>
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
          {profile.social_link && (
            <a 
              href={profile.social_link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[--theme-orange] font-bold bg-orange-50 px-4 py-2 rounded-full hover:bg-orange-100 transition-colors"
            >
              {profile.social_link.includes('instagram') ? <Instagram className="w-5 h-5"/> : <LinkIcon className="w-5 h-5"/>}
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
              <span className="font-semibold text-gray-900">{religionText[profile.religion]}</span>
            </div>
            <div>
              <span className="text-gray-500 text-sm block mb-1">וייב</span>
              <span className="font-semibold text-gray-900">{vibeText[profile.vibe_level - 1]}</span>
            </div>
            <div>
              <span className="text-gray-500 text-sm block mb-1">כשרות</span>
              <span className="font-semibold text-gray-900">{preferenceText[profile.kosher_preference]}</span>
            </div>
            <div>
              <span className="text-gray-500 text-sm block mb-1">שבת</span>
              <span className="font-semibold text-gray-900">{preferenceText[profile.shabbat_preference]}</span>
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
    </div>
  );
}