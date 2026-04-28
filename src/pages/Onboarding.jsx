import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@/entities/User';
import { Profile } from '@/entities/Profile';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadFile } from "@/integrations/Core";
import { base44 } from "@/api/base44Client";
import { ArrowRight, Check, Camera, X, Plus, Loader2, Home, Search, Music, Coffee, Beer, Book, Instagram, Facebook, Dog, Cat, Dumbbell, Activity, Gamepad2, Box, Palette, BookOpen, UtensilsCrossed, Briefcase, Lightbulb, Leaf, Mountain, Zap, Target, Trophy, User as UserIcon, Smile, Car, Mic, EyeOff, ChefHat, Sprout } from 'lucide-react';
import { SiTiktok } from "react-icons/si";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import BottomSheetSelect from '@/components/shared/BottomSheetSelect';
import { Slider } from '@/components/ui/slider';
import CitySelect from '@/components/shared/CitySelect';
import ImageLightbox from '@/components/shared/ImageLightbox';

const TOTAL_STEPS = 7;

const INTERESTS_LIST = [
{ id: 'gym', label: 'חדר כושר', Icon: Dumbbell },
{ id: 'tennis', label: 'טניס', Icon: Activity },
{ id: 'pilates', label: 'פילאטיס', Icon: UserIcon },
{ id: 'yoga', label: 'יוגה', Icon: EyeOff },
{ id: 'soccer_basketball', label: 'כדורגל / כדורסל', Icon: Trophy },
{ id: 'motorcycles', label: 'אופנועים', Icon: Zap },
{ id: 'gaming', label: 'גיימינג', Icon: Gamepad2 },
{ id: 'lego', label: 'לגו', Icon: Box },
{ id: 'photography', label: 'צילום', Icon: Camera },
{ id: 'painting', label: 'ציור', Icon: Palette },
{ id: 'reading', label: 'קריאה', Icon: BookOpen },
{ id: 'cooking', label: 'בישול ואפייה', Icon: ChefHat },
{ id: 'concerts', label: 'הופעות', Icon: Mic },
{ id: 'business', label: 'עסקים', Icon: Briefcase },
{ id: 'entrepreneurship', label: 'יזמות', Icon: Lightbulb },
{ id: 'plants', label: 'צמחייה', Icon: Sprout },
{ id: 'nature', label: 'טיולים בטבע', Icon: Leaf }
];


const Step = ({ children, step, currentStep, title }) =>
<AnimatePresence mode="wait">
    {currentStep === step &&
  <motion.div
    key={step}
    initial={{ opacity: 0, x: 50 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -50 }}
    transition={{ duration: 0.4, type: "spring", bounce: 0.2 }}
    className="w-full flex flex-col h-full">
    
        {title && <h2 className="mb-2 text-3xl text-center" style={{ color: '#FA3803', fontFamily: "'Google Sans', 'Inter', sans-serif", fontWeight: 'bold' }}>{title}</h2>}
        <div className="flex-1 overflow-y-auto px-1 py-4 custom-scrollbar">
            {children}
        </div>
      </motion.div>
  }
  </AnimatePresence>;


export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    age: 25,
    gender: 'male',
    about_me: '',
    social_link: '',
    looking_for_description: '',
    photos: Array(6).fill(null),
    location: '',
    search_cities: [],
    search_area: 'מרכז',
    budget_max: 3500,
    vibe_level: 3,
    pet_type: 'none',
    pet_other_description: '',
    looking_for_gender: 'any',
    religion: 'secular',
    kosher_preference: 'flow',
    shabbat_preference: 'flow',
    current_status: '',
    apartment_photos: Array(6).fill(null),
    existing_roommates: 0,
    apartment_total_budget: 5000,
    interests: [],
    // Song Info
    itunes_track_id: '',
    song_preview_url: null,
    song_name: '',
    song_artist: '',
    song_image: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState(null);

  const fileInputRef = useRef(null);
  const apartmentFileInputRef = useRef(null);
  // Use Sets to track multiple concurrent uploads
  const [uploadingPhotos, setUploadingPhotos] = useState(new Set());
  const [uploadingApartmentPhotos, setUploadingApartmentPhotos] = useState(new Set());
  const [spotifySearch, setSpotifySearch] = useState("");
  const [isSearchingSong, setIsSearchingSong] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await User.me();
        setFormData((prev) => ({ ...prev, name: userData.full_name.split(' ')[0], user_id: userData.id }));
      } catch (e) {
        // If user is not logged in, redirect to login page then back here
        base44.auth.redirectToLogin(window.location.href);
      }
    };
    fetchUser();
  }, [navigate]);

  useEffect(() => {
    const trackStep = async () => {
      try {
        const user = await User.me();
        const { PageView } = await import('@/entities/PageView');
        await PageView.create({
          page_name: `Onboarding - Step ${step}`,
          user_id: user.id
        });
      } catch (e) {
        console.error("Failed to track onboarding step:", e);
      }
    };
    trackStep();
  }, [step]);

  const canProceed = () => {
  switch (step) {
    case 1: // Basic Info + Vibe
      return formData.name.trim() && formData.age >= 18 && formData.gender && formData.vibe_level;
    case 2: // Status + Location + Budget (combined)
      return formData.current_status !== '' && formData.search_cities.length > 0 && formData.budget_max > 0;
    case 3: // Preferences + Pets (merged)
      return formData.looking_for_gender && formData.religion && formData.kosher_preference && formData.shabbat_preference &&
        formData.pet_type && (formData.pet_type !== 'other' || formData.pet_other_description.trim());
    case 4: // Apartment Details - Conditional
      if (formData.current_status === 'has_apartment') {
        const apartmentPhotoCount = formData.apartment_photos?.filter((p) => p).length || 0;
        return apartmentPhotoCount >= 3 && formData.existing_roommates >= 0 && formData.apartment_total_budget > 0;
      }
      return true;
    case 5: // Interests + About + Looking For
      return formData.about_me.trim() && formData.looking_for_description.trim();
    case 6: // Photos
      return formData.photos.filter((p) => p).length >= 2;
    case 7: // Final step
      return true;
    default:
      return true;
  }
  };

  const nextStep = () => {
  if (step === 3 && formData.current_status === 'seeking_apartment') {
    setStep(5); // Skip apartment details
  } else if (step === 5) {
    setStep(6); // Go to photos
  } else {
    setStep((s) => Math.min(s + 1, TOTAL_STEPS + 1));
  }
  };

  const isHasApartment = formData.current_status === 'has_apartment';
  let displayStep = step;
  if (!isHasApartment && step > 3) displayStep = step - 1;
  const displayTotal = isHasApartment ? 8 : 7;

  const prevStep = () => {
  if (step === 5 && formData.current_status === 'seeking_apartment') {
    setStep(3);
  } else {
    setStep((s) => Math.max(s - 1, 1));
  }
  };

  const handleFinish = async (shouldVerify = false) => {
    if (uploadingPhotos.size > 0 || uploadingApartmentPhotos.size > 0) {
      alert("אנא המתן לסיום העלאת התמונות");
      return;
    }

    const hasBlobPhotos = formData.photos.some((p) => p && p.startsWith('blob:'));
    const hasBlobApartment = formData.apartment_photos && formData.apartment_photos.some((p) => p && p.startsWith('blob:'));

    if (hasBlobPhotos || hasBlobApartment) {
      alert("עדיין מעלה תמונות... נסה שוב בעוד רגע");
      return;
    }

    setIsSubmitting(true);
    try {
      const finalData = {
        ...formData,
        photos: formData.photos.filter((p) => p),
        apartment_photos: formData.apartment_photos ? formData.apartment_photos.filter((p) => p) : [],
        location: formData.search_cities[0] || '',
        is_visible: true,
        // Ensure nulls are handled
        song_preview_url: formData.song_preview_url || null,
        song_name: formData.song_name || null,
        song_artist: formData.song_artist || null,
        song_image: formData.song_image || null
      };
      await Profile.create(finalData);
      if (shouldVerify) {
        navigate(createPageUrl('Verification'));
      } else {
        navigate(createPageUrl('Discover'));
      }
    } catch (error) {
      console.error("Failed to create profile:", error);
      setIsSubmitting(false);
    }
  };

  const setFormField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Image compression utility
  const compressImage = async (file) => {
    if (file.size < 1024 * 1024) return file; // Skip if smaller than 1MB
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxWidth = 800;
          if (img.width <= maxWidth && file.size < 300000) {resolve(file);return;}
          const scaleSize = maxWidth / img.width;
          canvas.width = maxWidth;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          ctx.canvas.toBlob((blob) => {
            if (!blob) {resolve(file);return;}
            const newFile = new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() });
            resolve(newFile);
          }, 'image/jpeg', 0.6);
        };
        img.onerror = () => resolve(file);
      };
      reader.onerror = () => resolve(file);
    });
  };

  const handleImageUpload = async (e, index, isApartment = false) => {
    let file = e.target.files[0];
    if (!file) return;

    // Track upload
    if (isApartment) {
      setUploadingApartmentPhotos((prev) => new Set(prev).add(index));
    } else {
      setUploadingPhotos((prev) => new Set(prev).add(index));
    }

    try {
      // Optimistic preview
      const objectUrl = URL.createObjectURL(file);
      setFormData((prev) => {
        const key = isApartment ? 'apartment_photos' : 'photos';
        const newPhotos = [...(prev[key] || [])];
        newPhotos[index] = objectUrl;
        return { ...prev, [key]: newPhotos };
      });

      // Compress and upload
      const compressedFile = await compressImage(file);
      const { file_url } = await UploadFile({ file: compressedFile });

      // Update with REAL URL
      setFormData((prev) => {
        const key = isApartment ? 'apartment_photos' : 'photos';
        const newPhotos = [...(prev[key] || [])];
        newPhotos[index] = file_url;

        if (isApartment && index === newPhotos.length - 1 && newPhotos.length < 12) {
          newPhotos.push(null, null);
        }

        return { ...prev, [key]: newPhotos };
      });
    } catch (error) {
      console.error("Upload failed", error);
      // Revert if failed
      setFormData((prev) => {
        const key = isApartment ? 'apartment_photos' : 'photos';
        const newPhotos = [...(prev[key] || [])];
        newPhotos[index] = null;
        return { ...prev, [key]: newPhotos };
      });
      alert("העלאת התמונה נכשלה. אנא נסה שנית.");
    } finally {
      // Untrack upload
      if (isApartment) {
        setUploadingApartmentPhotos((prev) => {
          const next = new Set(prev);
          next.delete(index);
          return next;
        });
      } else {
        setUploadingPhotos((prev) => {
          const next = new Set(prev);
          next.delete(index);
          return next;
        });
      }

      if (fileInputRef.current) fileInputRef.current.value = '';
      if (apartmentFileInputRef.current) apartmentFileInputRef.current.value = '';
    }
  };

  const searchSong = async () => {
    if (!spotifySearch.trim()) return;
    setIsSearchingSong(true);
    setSearchResults([]);
    try {
      const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(spotifySearch)}&media=music&limit=8&entity=song`);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const tracks = data.results.map((item) => ({
          spotify_id: String(item.trackId),
          name: item.trackName,
          artist: item.artistName,
          image_url: item.artworkUrl100?.replace('100x100', '300x300'),
          preview_url: item.previewUrl
        }));
        setSearchResults(tracks);
      }
    } catch (e) {
      console.error(e);
    }
    setIsSearchingSong(false);
  };

  const selectSong = (track) => {
    setFormData((prev) => ({
      ...prev,
      itunes_track_id: track.spotify_id,
      song_preview_url: track.preview_url,
      song_name: track.name,
      song_artist: track.artist,
      song_image: track.image_url
    }));
    setSearchResults([]); // Clear search after selection
    setSpotifySearch("");
  };

  const triggerFileInput = (index, isApartment = false) => {
    if (isApartment) {
      apartmentFileInputRef.current.onclick = () => {
        apartmentFileInputRef.current.onchange = (e) => handleImageUpload(e, index, true);
      };
      apartmentFileInputRef.current.click();
    } else {
      fileInputRef.current.onclick = () => {
        fileInputRef.current.onchange = (e) => handleImageUpload(e, index, false);
      };
      fileInputRef.current.click();
    }
  };

  const VibeIcon = ({ level }) => {
    if (level <= 1) return <Book className="w-16 h-16 text-blue-500 mb-4" />;
    if (level === 2) return <Coffee className="w-16 h-16 text-green-500 mb-4" />;
    if (level === 3) return <Music className="w-16 h-16 text-yellow-500 mb-4" />;
    if (level >= 4) return <Beer className="w-16 h-16 text-red-500 mb-4" />;
    return <Music className="w-16 h-16 text-gray-500 mb-4" />;
  };

  return (
    <div id="onboarding-root" className="min-h-screen bg-white flex flex-col items-center justify-center p-6" dir="rtl" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap'); #onboarding-root, #onboarding-root * { font-family: 'Inter', sans-serif !important; }
        #onboarding-root input[type=number]::-webkit-inner-spin-button,
        #onboarding-root input[type=number]::-webkit-outer-spin-button {
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        #onboarding-root input[type=number]:hover::-webkit-inner-spin-button,
        #onboarding-root input[type=number]:hover::-webkit-outer-spin-button,
        #onboarding-root input[type=number]:focus::-webkit-inner-spin-button,
        #onboarding-root input[type=number]:focus::-webkit-outer-spin-button {
          opacity: 1;
        }
      `}</style>
      <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" />
      <input type="file" ref={apartmentFileInputRef} className="hidden" accept="image/*" />

      <div className="w-full max-w-md flex flex-col h-[85vh]">
        {/* Progress Bar - Hidden on Final Step */}
        {step !== 7 && (
        <div className="mb-6">
             <div className="flex justify-between items-center mb-2">
                 <Button variant="ghost" size="icon" onClick={() => step > 1 ? prevStep() : window.location.href = createPageUrl('')} className="hover:bg-orange-50 text-gray-500">
                     <ArrowRight className="h-6 w-6" />
                 </Button>
                 
                 <div className="w-10" />
             </div>
             <div className="flex gap-1.5">
                 {Array.from({ length: 5 }).map((_, i) => (
                   <div
                     key={i}
                     className="h-2 flex-1 rounded-full"
                     style={{
                       backgroundColor: i < Math.round((displayStep / displayTotal) * 5) ? '#FA3803' : '#FFE8E2'
                     }}
                   />
                 ))}
             </div>
        </div>
        )}

        <div className="flex-1 relative">
            <Step step={1} currentStep={step} title="בואו נכיר!">
                <p className="text-center mb-4" style={{ color: '#FFB29D' }}>ספר/י לנו קצת על עצמך</p>
                <div className="space-y-4">
                    <div className="space-y-1 text-right">
                        <label className="text-sm font-bold" style={{ color: '#FA3803' }}>שם פרטי</label>
                        <Input value={formData.name} onChange={(e) => setFormField('name', e.target.value)} className="h-11 text-base bg-gray-50 border-gray-200 focus:border-[--theme-orange] focus:ring-[--theme-orange]" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1 text-right">
                            <label className="text-sm font-bold" style={{ color: '#FA3803' }}>גיל</label>
                            <Input
                                type="number"
                                value={formData.age || ''}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setFormField('age', val === '' ? '' : parseInt(val));
                                }}
                                className="h-11 text-base bg-gray-50 border-gray-200 focus:border-[--theme-orange] focus:ring-[--theme-orange]" />
                        </div>
                        <div className="space-y-1 text-right">
                            <label className="text-sm font-bold" style={{ color: '#FA3803' }}>מגדר</label>
                            <BottomSheetSelect
                                value={formData.gender}
                                onValueChange={(v) => setFormField('gender', v)}
                                label="מגדר"
                                options={[
                                    { value: "male", label: "זכר" },
                                    { value: "female", label: "נקבה" },
                                    { value: "other", label: "אחר" }
                                ]} />
                        </div>
                    </div>

                    {/* Vibe Section */}
                    <div className="pt-1 text-right">
                        <label className="text-sm font-bold block mb-2" style={{ color: '#FA3803' }}>מה הוויב שלך?</label>
                        <Slider
                            dir="ltr"
                            value={[formData.vibe_level]}
                            onValueChange={(v) => setFormField('vibe_level', v[0])}
                            max={5}
                            min={1}
                            step={1}
                            className="py-2" />
                        <div className="flex justify-between text-xs font-medium mt-1" style={{ color: '#B9BFC8' }}>
                            <span>תוסס ומסיבתי</span>
                            <span>מאוזן</span>
                            <span>שקט וביתי</span>
                        </div>
                    </div>
                </div>
            </Step>

            <Step step={2} currentStep={step} title="">
                <div className="space-y-5 mt-1">
                    {/* Status Cards */}
                    <button type="button" onClick={() => setFormField('current_status', 'seeking_apartment')} className={`w-full px-4 py-3 border-2 rounded-2xl text-right transition-all ${formData.current_status === 'seeking_apartment' ? 'border-[--theme-orange] bg-orange-50 shadow-sm' : 'border-gray-100 bg-white shadow-sm'}`}>
                        <div className="flex justify-between items-center mb-1">
                            <h3 className="text-base font-bold text-gray-800">מחפש/ת דירה</h3>
                            <Search className={`w-5 h-5 ${formData.current_status === 'seeking_apartment' ? 'text-[--theme-orange]' : 'text-gray-300'}`} />
                        </div>
                        <p className="text-gray-500" style={{ fontSize: '13px' }}>אין לי עדיין דירה, מחפש/ת להצטרף או למצוא יחד</p>
                    </button>

                    <button type="button" onClick={() => setFormField('current_status', 'has_apartment')} className={`w-full px-4 py-3 border-2 rounded-2xl text-right transition-all ${formData.current_status === 'has_apartment' ? 'border-[--theme-orange] bg-orange-50 shadow-sm' : 'border-gray-100 bg-white shadow-sm'}`}>
                        <div className="flex justify-between items-center mb-1">
                            <h3 className="text-base font-bold text-gray-800">יש לי דירה</h3>
                            <Home className={`w-5 h-5 ${formData.current_status === 'has_apartment' ? 'text-[--theme-orange]' : 'text-gray-300'}`} />
                        </div>
                        <p className="text-gray-500" style={{ fontSize: '13px' }}>יש לי דירה ואני מחפש/ת שותף/ה שיצטרפו</p>
                    </button>

                    {/* Location */}
                    <div className="space-y-1 pt-2 text-right">
                        <h3 className="text-base font-bold" style={{ color: '#FA3803' }}>איפה?</h3>
                        <p className="text-xs mb-1" style={{ color: '#FFB29D' }}>ניתן לבחור מספר ערים</p>
                        <CitySelect selectedCities={formData.search_cities} onChange={(cities) => setFormField('search_cities', cities)} />
                    </div>

                    {/* Budget */}
                    <div className="pt-2 text-right">
                        <h3 className="text-base font-bold mb-2" style={{ color: '#FA3803' }}>תקציב לשותף</h3>
                        {/* Thumb value label */}
                        <div className="relative w-full mb-1">
                            <div
                                className="absolute text-sm font-bold text-black"
                                style={{
                                    left: `calc(${((formData.budget_max - 1000) / (10000 - 1000)) * 100}% - 20px)`,
                                    top: 0,
                                    minWidth: '40px',
                                    textAlign: 'center'
                                }}
                            >
                                {formData.budget_max.toLocaleString()}
                            </div>
                            <div className="h-4" />
                        </div>
                        <Slider
                            value={[formData.budget_max]}
                            min={1000}
                            max={10000}
                            step={100}
                            onValueChange={(v) => setFormField('budget_max', v[0])}
                            className="py-0" />
                        {/* Min / Max labels inline with bar */}
                        <div className="flex justify-between text-xs text-gray-400 mt-1 px-0">
                            <span>min 10,000</span>
                            <span>max 1,000</span>
                        </div>
                    </div>
                </div>
            </Step>
            
            <Step step={3} currentStep={step} title="העדפות">
                <div className="space-y-3 text-right">
                    {/* אני מחפש/ת */}
                    <div>
                        <label className="text-sm font-bold block mb-1.5" style={{ color: '#FA3803' }}>אני מחפש/ת</label>
                        <div className="flex bg-gray-100 p-1 rounded-xl">
                            {[{ v: 'male', l: 'שותף' }, { v: 'female', l: 'שותפה' }, { v: 'any', l: 'לא משנה' }].map((opt) =>
                                <button key={opt.v} onClick={() => setFormField('looking_for_gender', opt.v)}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${formData.looking_for_gender === opt.v ? 'bg-white shadow-sm text-black' : 'text-gray-400'}`}>
                                    {opt.l}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* כשרות + שבת */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-bold block mb-1" style={{ color: '#FA3803' }}>כשרות</label>
                            <BottomSheetSelect value={formData.kosher_preference} onValueChange={(v) => setFormField('kosher_preference', v)} label="כשרות"
                                options={[{ value: "for", label: "בעד" }, { value: "against", label: "נגד" }, { value: "flow", label: "זורם/ת" }]} />
                        </div>
                        <div>
                            <label className="text-sm font-bold block mb-1" style={{ color: '#FA3803' }}>שומר שבת</label>
                            <BottomSheetSelect value={formData.shabbat_preference} onValueChange={(v) => setFormField('shabbat_preference', v)} label="שמירת שבת"
                                options={[{ value: "for", label: "בעד" }, { value: "against", label: "נגד" }, { value: "flow", label: "זורם/ת" }]} />
                        </div>
                    </div>

                    {/* זיקה לדת */}
                    <div>
                        <label className="text-sm font-bold block mb-1" style={{ color: '#FA3803' }}>זיקה לדת</label>
                        <BottomSheetSelect value={formData.religion} onValueChange={(v) => setFormField('religion', v)} label="זיקה לדת"
                            options={[
                                { value: "secular", label: "חילוני/ת" },
                                { value: "traditional", label: "מסורתי/ת" },
                                { value: "national_religious", label: "דתי/ה לאומי/ת" },
                                { value: "religious", label: "דתי/ה" },
                                { value: "haredi", label: "חרדי/ת" }
                            ]} />
                    </div>

                    {/* חיית מחמד */}
                    <div>
                        <label className="text-sm font-bold block mb-1.5" style={{ color: '#FA3803' }}>חיית מחמד שמצטרפת?</label>
                        <div className="flex gap-2 flex-wrap">
                            {[
                                { type: 'none', label: 'אין ✕', icon: null },
                                { type: 'dog', label: 'כלב', icon: <Dog className="w-[1em] h-[1em] stroke-black stroke-[1.5]" style={{ fill: 'none' }} /> },
                                { type: 'cat', label: 'חתול', icon: <Cat className="w-[1em] h-[1em] stroke-black stroke-[1.5]" style={{ fill: 'none' }} /> },
                                { type: 'other', label: 'אחר', icon: null }
                            ].map(({ type, label, icon }) =>
                                <button key={type} type="button" onClick={() => setFormField('pet_type', type)}
                                    className={`px-4 py-1.5 rounded-full border text-sm font-semibold transition-all flex items-center gap-1 ${formData.pet_type === type ? 'border-[--theme-orange] bg-orange-50 text-black' : 'border-gray-300 bg-white text-gray-500'}`}>
                                    {label}{icon}
                                </button>
                            )}
                        </div>
                        {formData.pet_type === 'other' &&
                            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-2">
                                <Input value={formData.pet_other_description} onChange={(e) => setFormField('pet_other_description', e.target.value)} placeholder="איזו חיה?" className="h-9 text-sm bg-gray-50 border-gray-200" />
                            </motion.div>
                        }
                    </div>
                </div>
            </Step>

            <Step step={4} currentStep={step} title="פרטי הדירה">
                <div className="space-y-6 text-right">
                    <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                        <h3 className="font-bold text-[--theme-orange] mb-4 flex items-center gap-2">
                            <Home className="w-5 h-5" />
                            הדירה שלך
                        </h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-1 block">שותפים קיימים</label>
                                <Input type="number" value={formData.existing_roommates} onChange={(e) => setFormField('existing_roommates', parseInt(e.target.value) || 0)} className="bg-white border-orange-200" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-1 block">שכירות (סה"כ)</label>
                                <Input type="number" value={formData.apartment_total_budget} onChange={(e) => setFormField('apartment_total_budget', parseInt(e.target.value) || 0)} className="bg-white border-orange-200" />
                            </div>
                        </div>
                        
                        <label className="text-sm font-bold mb-3 block" style={{ color: '#FA3803' }}>תמונות (מינימום 3)</label>
                        <div className="grid grid-cols-3 gap-2">
                            {formData.apartment_photos.map((_, i) =>
                  <div
                    key={i}
                    className="aspect-square bg-white rounded-xl flex items-center justify-center cursor-pointer border border-dashed border-orange-200 overflow-hidden relative"
                    onClick={() => triggerFileInput(i, true)}>
                    
                                    {formData.apartment_photos?.[i] ?
                    <img src={formData.apartment_photos[i]} alt={`דירה ${i + 1}`} className="w-full h-full object-cover" /> :

                    uploadingApartmentPhotos.has(i) ?
                    <Loader2 className="w-5 h-5 animate-spin text-[--theme-orange]" /> :
                    <Plus className="w-5 h-5 text-orange-300" />
                    }
                                </div>
                  )}
                        </div>
                    </div>
                </div>
            </Step>



            <Step step={5} currentStep={step} title="תחומי עניין">
                <div className="flex flex-col h-full text-right">
                    <p className="text-center text-xs mb-3 -mt-1" style={{ color: '#FFB29D' }}>בחר/י מה שמעניין אותך</p>
                    <div className="flex flex-wrap gap-3 justify-center mb-1.5 px-0 overflow-hidden">
                        {INTERESTS_LIST.map((interest) => {
                    const selected = (formData.interests || []).includes(interest.id);
                    const Icon = interest.Icon;
                    return (
                      <button
                        key={interest.id}
                        type="button"
                        onClick={() => {
                          const current = formData.interests || [];
                          setFormField('interests', selected ?
                          current.filter((i) => i !== interest.id) :
                          [...current, interest.id]
                          );
                        }}
                        className={`px-1 py-0.5 rounded-full text-xs font-medium border border-solid transition-all flex items-center gap-0.5 ${
                        selected ?
                        'bg-[#FA3803] text-white border-[#FA3803]' :
                        'bg-white text-black border-[#B9BFC8]'}`
                        }>
                        {interest.label}
                        <Icon className={`w-4 h-4 flex-shrink-0 stroke-current`} strokeWidth={2} fill="none" />
                            </button>);
                  })}
                    </div>

                    <div className="flex flex-col gap-6 pt-4">
                        {/* קצת עליי */}
                        <div className="flex flex-col">
                            <label className="text-xs font-bold block mb-0.5" style={{ color: '#FA3803' }}>קצת עליי</label>
                            <Textarea maxLength={200} value={formData.about_me} onChange={(e) => setFormField('about_me', e.target.value)} placeholder="תחביבים, עיסוק..." className="bg-gray-50 border text-sm resize-none h-8 min-h-[32px]" style={{ borderColor: '#B9BFC8' }} />
                        </div>

                        {/* מה אני מחפש/ת */}
                        <div className="flex flex-col">
                            <label className="text-xs font-bold block mb-0.5" style={{ color: '#FA3803' }}>מה אני מחפש/ת</label>
                            <Textarea maxLength={200} value={formData.looking_for_description} onChange={(e) => setFormField('looking_for_description', e.target.value)} placeholder="איזה סוג של שותף/ה..." className="bg-gray-50 border text-sm resize-none h-8 min-h-[32px]" style={{ borderColor: '#B9BFC8' }} />
                        </div>
                    </div>
                </div>
            </Step>

            <Step step={6} currentStep={step} title="התמונות שלי">
                <p className="text-center text-gray-500 mb-6">תמונה אחת שווה אלף מילים (ו-2 תמונות שוות התאמה!)</p>
                <div className="grid grid-cols-3 gap-3">
                    {[...Array(6)].map((_, i) =>
              <div key={i} className="aspect-[3/4] rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden relative shadow-sm hover:shadow-md transition-all bg-gray-50 group">
                             {formData.photos[i] ?
                <>
                                    <img
                    src={formData.photos[i]}
                    alt={`Uploaded ${i + 1}`}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setLightboxSrc(formData.photos[i])}
                    loading="eager"
                    decoding="sync" />
                  
                                    <button
                    className="absolute top-1 right-1 bg-white/80 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {e.stopPropagation();triggerFileInput(i);}}>
                    
                                        <Camera className="w-4 h-4 text-gray-600" />
                                    </button>
                                    <button
                    className="absolute top-1 left-1 bg-white/80 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {e.stopPropagation();setFormData((prev) => {const newPhotos = [...prev.photos];newPhotos[i] = null;return {...prev, photos: newPhotos};});}}>
                    
                                        <X className="w-4 h-4 text-gray-600" />
                                    </button>
                                 </> :

                <div className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => triggerFileInput(i)}>
                                    {uploadingPhotos.has(i) ? <Loader2 className="w-8 h-8 animate-spin text-[--theme-orange]" /> : <Plus className="w-8 h-8 text-gray-300" />}
                                </div>
                }
                        </div>
              )}
                </div>
            </Step>

            <Step step={7} currentStep={step} title="">
                <div className="flex flex-col items-center justify-center h-full text-center space-y-8">
                    <h2 className="text-3xl font-bold" style={{ color: '#FA3803' }}>הפרופיל שלך מוכן!</h2>
                    <div className="w-32 h-32 bg-blue-50 rounded-full flex items-center justify-center mb-4 relative">
                        <div className="absolute inset-0 border-4 border-blue-100 rounded-full animate-pulse"></div>
                        <Check className="w-16 h-16 text-blue-500" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold mb-2">אמת/י את הפרופיל שלך</h3>
                        <p className="text-gray-500 max-w-xs mx-auto">
                            פרופילים מאומתים מקבלים פי 3 יותר פניות! התהליך לוקח פחות מ-2 דקות.
                        </p>
                    </div>
                    
                    <div className="w-full space-y-4">
                         <Button
                  onClick={() => handleFinish(true)}
                  className="w-full h-14 rounded-full text-lg font-bold shadow-lg gradient-orange text-white hover:brightness-110">
                  
                            אמת עכשיו (מומלץ)
                        </Button>
                        <button
                  onClick={() => handleFinish(false)}
                  className="text-gray-400 font-medium hover:text-gray-600 transition-colors">
                  
                            אולי אחר כך
                        </button>
                    </div>
                </div>
            </Step>
        </div>

        {/* Action Button */}
        {step < 7 &&
        <div className="mt-6">
                <Button
            onClick={nextStep}
            className={`w-full h-14 rounded-full text-lg font-bold shadow-lg transition-all transform active:scale-95 ${canProceed() ? 'gradient-orange text-white hover:brightness-110' : 'bg-gray-200 text-gray-400'}`}
            disabled={!canProceed() || isSubmitting}>
            
                    {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'המשך'}
                </Button>
            </div>
        }
      </div>
      
      <button
        onClick={() => window.location.href = createPageUrl('AdminAnalytics')}
        className="fixed bottom-4 left-4 text-[10px] text-gray-300 hover:text-gray-500 transition-colors">
        
        Admin
      </button>
    </div>);

}