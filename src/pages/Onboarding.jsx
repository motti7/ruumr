import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@/entities/User';
import { Profile } from '@/entities/Profile';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadFile } from "@/integrations/Core";
import { base44 } from "@/api/base44Client";
import { ArrowRight, Check, Camera, Dog, Cat, X, Plus, Loader2, PawPrint, Home, Search, MapPin, DollarSign, Music, Coffee, Beer, Book, Instagram, Sparkles, Facebook, Linkedin, Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import CitySelect from '@/components/shared/CitySelect';
import ImageLightbox from '@/components/shared/ImageLightbox';

const TOTAL_STEPS = 10; 

const Step = ({ children, step, currentStep, title }) => (
  <AnimatePresence mode="wait">
    {currentStep === step && (
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.4, type: "spring", bounce: 0.2 }}
        className="w-full flex flex-col h-full"
      >
        {title && <h2 className="text-3xl font-black text-center mb-2 text-gray-800">{title}</h2>}
        <div className="flex-1 overflow-y-auto px-1 py-4 custom-scrollbar">
            {children}
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

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
    // Song Info
    spotify_track_id: '',
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
        // Check if user is logged in
        const userData = await User.me();
        setFormData(prev => ({ ...prev, name: userData.full_name.split(' ')[0], user_id: userData.id }));

        // Check if user already has a profile - if so, redirect to Discover
        const userProfiles = await Profile.filter({ user_id: userData.id });
        if (userProfiles.length > 0) {
            navigate(createPageUrl('Discover'));
        }
      } catch (e) {
        // If user is not logged in, redirect to login page then back here
        base44.auth.redirectToLogin(window.location.href);
      }
    };
    fetchUser();
  }, [navigate]);
  
  const canProceed = () => {
    switch(step) {
      case 1: // Basic Info
        return formData.name.trim() && formData.age >= 18 && formData.gender;
      case 2: // Status
        return formData.current_status !== '';
      case 3: // Location & Budget (was 4)
        return formData.search_cities.length > 0 && formData.budget_max > 0;
      case 4: // Vibe (was 5)
        return formData.vibe_level;
      case 5: // Pets (was 6)
        return formData.pet_type && (formData.pet_type !== 'other' || formData.pet_other_description.trim());
      case 6: // Preferences (was 8)
        return formData.looking_for_gender && formData.religion && formData.kosher_preference && formData.shabbat_preference;
      case 7: // Apartment Details (was 9) - Conditional
        if (formData.current_status === 'has_apartment') {
            const apartmentPhotoCount = formData.apartment_photos?.filter(p => p).length || 0;
            return apartmentPhotoCount >= 3 && formData.existing_roommates >= 0 && formData.apartment_total_budget > 0;
        }
        return true; // Should ideally skip if seeking
      case 8: // About
        return formData.about_me.trim() && formData.looking_for_description.trim();
      case 9: // Spotify
        return true; // Optional
      case 10: // Photos
        return formData.photos.filter(p => p).length >= 2;
      default:
        return true;
      }
  };

  const nextStep = () => {
    if (step === 2 && formData.current_status === 'seeking_apartment') {
         setStep(s => s + 1);
    } else if (step === 6 && formData.current_status === 'seeking_apartment') {
         setStep(8); // Skip apartment details
    } else {
         setStep(s => Math.min(s + 1, TOTAL_STEPS + 1));
    }
  };

  const isHasApartment = formData.current_status === 'has_apartment';
  let displayStep = step;
  if (!isHasApartment && step > 6) displayStep = step - 1;
  const displayTotal = isHasApartment ? 11 : 10;
  
  const prevStep = () => {
    if (step === 8 && formData.current_status === 'seeking_apartment') {
        setStep(6);
    } else {
        setStep(s => Math.max(s - 1, 1));
    }
  };

  const handleFinish = async (shouldVerify = false) => {
    if (uploadingPhotos.size > 0 || uploadingApartmentPhotos.size > 0) {
        alert("אנא המתן לסיום העלאת התמונות");
        return;
    }
    
    const hasBlobPhotos = formData.photos.some(p => p && p.startsWith('blob:'));
    const hasBlobApartment = formData.apartment_photos && formData.apartment_photos.some(p => p && p.startsWith('blob:'));
    
    if (hasBlobPhotos || hasBlobApartment) {
        alert("עדיין מעלה תמונות... נסה שוב בעוד רגע");
        return;
    }

    setIsSubmitting(true);
    try {
      const finalData = { 
          ...formData, 
          photos: formData.photos.filter(p => p),
          apartment_photos: formData.apartment_photos ? formData.apartment_photos.filter(p => p) : [],
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
    setFormData(prev => ({ ...prev, [field]: value }));
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
          if (img.width <= maxWidth && file.size < 300000) { resolve(file); return; }
          const scaleSize = maxWidth / img.width;
          canvas.width = maxWidth;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          ctx.canvas.toBlob((blob) => {
            if (!blob) { resolve(file); return; }
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
        setUploadingApartmentPhotos(prev => new Set(prev).add(index));
    } else {
        setUploadingPhotos(prev => new Set(prev).add(index));
    }

    try {
      // Optimistic preview
      const objectUrl = URL.createObjectURL(file);
      setFormData(prev => {
        const key = isApartment ? 'apartment_photos' : 'photos';
        const newPhotos = [...(prev[key] || [])];
        newPhotos[index] = objectUrl; 
        return { ...prev, [key]: newPhotos };
      });

      // Compress and upload
      const compressedFile = await compressImage(file);
      const { file_url } = await UploadFile({ file: compressedFile });
      
      // Update with REAL URL
      setFormData(prev => {
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
      setFormData(prev => {
        const key = isApartment ? 'apartment_photos' : 'photos';
        const newPhotos = [...(prev[key] || [])];
        newPhotos[index] = null;
        return { ...prev, [key]: newPhotos };
      });
      alert("העלאת התמונה נכשלה. אנא נסה שנית.");
    } finally {
      // Untrack upload
      if (isApartment) {
          setUploadingApartmentPhotos(prev => {
              const next = new Set(prev);
              next.delete(index);
              return next;
          });
      } else {
          setUploadingPhotos(prev => {
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
              const tracks = data.results.map(item => ({
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
       setFormData(prev => ({
          ...prev,
          spotify_track_id: track.spotify_id,
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
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6" dir="rtl">
      <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" />
      <input type="file" ref={apartmentFileInputRef} className="hidden" accept="image/*" />

      <div className="w-full max-w-md flex flex-col h-[85vh]">
        {/* Progress Bar */}
        <div className="mb-6">
             <div className="flex justify-between items-center mb-2">
                 {step > 1 ? (
                   <Button variant="ghost" size="icon" onClick={prevStep} className="hover:bg-orange-50 text-gray-500">
                     <ArrowRight className="h-6 w-6" />
                   </Button>
                 ) : <div className="w-10"/>}
                 <span className="font-bold text-[--theme-orange]">שלב {displayStep} מתוך {displayTotal}</span>
                 <div className="w-10"/>
             </div>
             <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                 <motion.div 
                    className="h-full gradient-orange"
                    initial={{ width: 0 }}
                    animate={{ width: `${(displayStep / displayTotal) * 100}%` }}
                    transition={{ duration: 0.5 }}
                 />
             </div>
        </div>

        <div className="flex-1 relative">
            <Step step={1} currentStep={step} title="נעים להכיר!">
                <p className="text-center text-gray-500 mb-8">ספר/י לנו קצת על עצמך בשביל ההתחלה</p>
                <div className="space-y-6">
                    <div className="space-y-2 text-right">
                        <label className="text-sm font-bold text-gray-700">שם פרטי</label>
                        <Input value={formData.name} onChange={(e) => setFormField('name', e.target.value)} className="h-12 text-lg bg-gray-50 border-gray-200 focus:border-[--theme-orange] focus:ring-[--theme-orange]" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 text-right">
                            <label className="text-sm font-bold text-gray-700">גיל</label>
                            <Input 
                                type="number" 
                                value={formData.age || ''} 
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setFormField('age', val === '' ? '' : parseInt(val));
                                }} 
                                className="h-12 text-lg bg-gray-50 border-gray-200 focus:border-[--theme-orange] focus:ring-[--theme-orange]" 
                            />
                        </div>
                        <div className="space-y-2 text-right">
                            <label className="text-sm font-bold text-gray-700">מגדר</label>
                            <Select value={formData.gender} onValueChange={(v) => setFormField('gender', v)}>
                                <SelectTrigger className="h-12 text-lg bg-gray-50 border-gray-200 text-right" dir="rtl"><SelectValue/></SelectTrigger>
                                <SelectContent className="text-right" align="end">
                                    <SelectItem value="male">זכר</SelectItem>
                                    <SelectItem value="female">נקבה</SelectItem>
                                    <SelectItem value="other">אחר</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </Step>

            <Step step={2} currentStep={step} title="מה הסטטוס?">
                <div className="space-y-4 mt-4">
                    <button type="button" onClick={() => { setFormField('current_status', 'seeking_apartment'); nextStep(); }} className={`w-full p-6 border-2 rounded-2xl text-right transition-all transform hover:scale-[1.02] ${formData.current_status === 'seeking_apartment' ? 'border-[--theme-orange] bg-orange-50 shadow-lg' : 'border-gray-100 bg-white shadow-sm'}`}>
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-xl font-black text-gray-800">מחפש/ת דירה</h3>
                            <Search className={`w-6 h-6 ${formData.current_status === 'seeking_apartment' ? 'text-[--theme-orange]' : 'text-gray-300'}`} />
                        </div>
                        <p className="text-gray-500">אין לי עדיין דירה, מחפש/ת להצטרף או למצוא יחד.</p>
                    </button>

                    <button type="button" onClick={() => { setFormField('current_status', 'has_apartment'); nextStep(); }} className={`w-full p-6 border-2 rounded-2xl text-right transition-all transform hover:scale-[1.02] ${formData.current_status === 'has_apartment' ? 'border-[--theme-orange] bg-orange-50 shadow-lg' : 'border-gray-100 bg-white shadow-sm'}`}>
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-xl font-black text-gray-800">יש לי דירה</h3>
                            <Home className={`w-6 h-6 ${formData.current_status === 'has_apartment' ? 'text-[--theme-orange]' : 'text-gray-300'}`} />
                        </div>
                        <p className="text-gray-500">יש לי דירה ואני מחפש/ת שותף/ה שיצטרפו.</p>
                    </button>
                </div>
            </Step>
            
            <Step step={3} currentStep={step} title="לוקיישן ותקציב">
                <div className="space-y-8 text-right">
                    <div className="space-y-2">
                        <label className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <MapPin className="text-[--theme-orange]"/>
                            איפה נחפש?
                        </label>
                        <p className="text-sm text-gray-500 mb-2">אפשר לבחור מספר ערים</p>
                        <CitySelect selectedCities={formData.search_cities} onChange={(cities) => setFormField('search_cities', cities)} />
                    </div>
                    
                    <div className="space-y-4">
                        <label className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <DollarSign className="text-[--theme-orange]"/>
                            מה התקציב שלך?
                        </label>
                        <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 text-center">
                            <span className="text-4xl font-black text-[--theme-orange]">₪{formData.budget_max}</span>
                            <span className="text-sm text-gray-500 mr-2">לחודש</span>
                        </div>
                        <Slider 
                            value={[formData.budget_max]} 
                            min={1000} 
                            max={10000} 
                            step={100} 
                            onValueChange={(v) => setFormField('budget_max', v[0])}
                            className="py-4"
                        />
                    </div>
                </div>
            </Step>

            <Step step={4} currentStep={step} title="מה הוייב שלך?">
                 <div className="flex flex-col items-center justify-center h-full space-y-8">
                      <VibeIcon level={formData.vibe_level} />
                      
                      <div className="w-full px-4">
                          <Slider dir="ltr" value={[formData.vibe_level]} onValueChange={(v) => setFormField('vibe_level', v[0])} max={5} min={1} step={1} className="py-4" />
                          <div className="flex justify-between text-sm font-bold text-gray-600 mt-4 w-full">
                              <span className="text-red-500">תוסס ומסיבתי</span>
                              <span className="text-yellow-500">מאוזן</span>
                              <span className="text-blue-500">שקט וביתי</span>
                          </div>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-xl text-center">
                          <p className="text-lg font-medium text-gray-700">
                            {formData.vibe_level <= 1 && "אני מעדיף/ה את השקט שלי, בית זה המבצר."}
                            {formData.vibe_level === 2 && "אוהב/ת שקט אבל גם לארח מדי פעם."}
                            {formData.vibe_level === 3 && "מאוזן/ת - לפעמים שקט ולפעמים אקשן."}
                            {formData.vibe_level === 4 && "חברותי/ת מאוד, הבית תמיד פתוח."}
                            {formData.vibe_level >= 5 && "מסיבות, חברים, רעש ושמחה!"}
                          </p>
                      </div>
                  </div>
            </Step>

            <Step step={5} currentStep={step} title="חיות מחמד">
                 <div className="space-y-8 text-right">
                      <div>
                          <label className="font-bold text-lg block text-center mb-6 text-gray-600">יש לך חיית מחמד שמצטרפת?</label>
                          <div className="grid grid-cols-2 gap-4">
                              {['none', 'dog', 'cat', 'other'].map(type => (
                                  <button type="button" key={type} onClick={() => setFormField('pet_type', type)} className={`p-6 border-2 rounded-2xl flex flex-col items-center justify-center transition-all ${formData.pet_type === type ? 'border-[--theme-orange] bg-orange-50 text-[--theme-orange] scale-105 shadow-md' : 'border-gray-100 bg-gray-50 text-gray-400'}`}>
                                      {type === 'none' && <X className="w-10 h-10 mb-3" />}
                                      {type === 'dog' && <Dog className="w-10 h-10 mb-3" />}
                                      {type === 'cat' && <Cat className="w-10 h-10 mb-3" />}
                                      {type === 'other' && <PawPrint className="w-10 h-10 mb-3" />}
                                      <span className="font-bold text-lg">{
                                          {'none': 'אין', 'dog': 'כלב', 'cat': 'חתול', 'other': 'אחר'}[type]
                                      }</span>
                                  </button>
                              ))}
                          </div>
                           {formData.pet_type === 'other' && (
                              <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="mt-6">
                                  <Input value={formData.pet_other_description} onChange={(e) => setFormField('pet_other_description', e.target.value)} placeholder="איזו חיה?" className="text-center h-12 text-lg bg-gray-50 border-gray-200"/>
                              </motion.div>
                           )}
                      </div>
                  </div>
            </Step>

            <Step step={6} currentStep={step} title="העדפות ודת">
                <div className="space-y-6 text-right">
                    <div className="space-y-2">
                        <label className="font-bold block mb-1">אני מחפש/ת</label>
                        <div className="flex bg-gray-100 p-1 rounded-xl">
                            {[
                                {v: 'male', l: 'שותף'}, 
                                {v: 'female', l: 'שותפה'}, 
                                {v: 'any', l: 'לא משנה'}
                            ].map(opt => (
                                <button
                                    key={opt.v}
                                    onClick={() => setFormField('looking_for_gender', opt.v)}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${formData.looking_for_gender === opt.v ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}
                                >
                                    {opt.l}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="font-bold block mb-1">זיקה לדת</label>
                        <Select value={formData.religion} onValueChange={(v) => setFormField('religion', v)}>
                            <SelectTrigger className="h-12 bg-gray-50 border-gray-200 text-right" dir="rtl"><SelectValue/></SelectTrigger>
                            <SelectContent align="end">
                                <SelectItem value="secular">חילוני/ת</SelectItem>
                                <SelectItem value="traditional">מסורתי/ת</SelectItem>
                                <SelectItem value="national_religious">דתי/ה לאומי/ת</SelectItem>
                                <SelectItem value="religious">דתי/ה</SelectItem>
                                <SelectItem value="haredi">חרדי/ת</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="font-bold block mb-1 text-sm">כשרות</label>
                            <Select value={formData.kosher_preference} onValueChange={(v) => setFormField('kosher_preference', v)}>
                                <SelectTrigger className="h-10 bg-gray-50 border-gray-200 text-right" dir="rtl"><SelectValue/></SelectTrigger>
                                <SelectContent align="end">
                                    <SelectItem value="for">בעד</SelectItem>
                                    <SelectItem value="against">נגד</SelectItem>
                                    <SelectItem value="flow">זורם</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="font-bold block mb-1 text-sm">שבת</label>
                            <Select value={formData.shabbat_preference} onValueChange={(v) => setFormField('shabbat_preference', v)}>
                                <SelectTrigger className="h-10 bg-gray-50 border-gray-200 text-right" dir="rtl"><SelectValue/></SelectTrigger>
                                <SelectContent align="end">
                                    <SelectItem value="for">בעד</SelectItem>
                                    <SelectItem value="against">נגד</SelectItem>
                                    <SelectItem value="flow">זורם</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </Step>

            <Step step={7} currentStep={step} title="פרטי הדירה">
                <div className="space-y-6 text-right">
                    <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                        <h3 className="font-bold text-[--theme-orange] mb-4 flex items-center gap-2">
                            <Home className="w-5 h-5"/>
                            הדירה שלך
                        </h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-1 block">שותפים קיימים</label>
                                <Input type="number" value={formData.existing_roommates} onChange={e => setFormField('existing_roommates', parseInt(e.target.value) || 0)} className="bg-white border-orange-200"/>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-1 block">שכירות (סה"כ)</label>
                                <Input type="number" value={formData.apartment_total_budget} onChange={e => setFormField('apartment_total_budget', parseInt(e.target.value) || 0)} className="bg-white border-orange-200"/>
                            </div>
                        </div>
                        
                        <label className="text-sm font-bold text-gray-700 mb-3 block">תמונות (מינימום 3)</label>
                        <div className="grid grid-cols-3 gap-2">
                            {formData.apartment_photos.map((_, i) => (
                                <div 
                                    key={i} 
                                    className="aspect-square bg-white rounded-xl flex items-center justify-center cursor-pointer border border-dashed border-orange-200 overflow-hidden relative"
                                    onClick={() => triggerFileInput(i, true)}
                                >
                                    {formData.apartment_photos?.[i] ? (
                                        <img src={formData.apartment_photos[i]} alt={`דירה ${i+1}`} className="w-full h-full object-cover" />
                                    ) : (
                                        uploadingApartmentPhotos.has(i) ? 
                                            <Loader2 className="w-5 h-5 animate-spin text-[--theme-orange]" /> :
                                            <Plus className="w-5 h-5 text-orange-300" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Step>

            <Step step={8} currentStep={step} title="ספר/י על עצמך">
                <div className="space-y-6 text-right">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">קצת עליי (עד 500 תווים)</label>
                        <Textarea maxLength={500} value={formData.about_me} onChange={(e) => setFormField('about_me', e.target.value)} placeholder="תחביבים, עיסוק, מה חשוב לך בשותפות..." className="bg-gray-50 border-gray-200 focus:ring-[--theme-orange] min-h-[120px] text-lg"/>
                    </div>
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                            קישור לרשת חברתית
                        </label>
                        <div className="flex gap-4 justify-center text-gray-400 mb-2">
                             <Instagram className="w-6 h-6 text-[#E1306C]" />
                             <Facebook className="w-6 h-6 text-[#1877F2]" />
                             <Twitter className="w-6 h-6 text-black" />
                             <Linkedin className="w-6 h-6 text-[#0A66C2]" />
                        </div>
                        <Input 
                            value={formData.social_link} 
                            onChange={(e) => setFormField('social_link', e.target.value)} 
                            placeholder="הדבק כאן קישור לפרופיל" 
                            className="bg-gray-50 border-gray-200 focus:ring-[--theme-orange] text-lg text-center"
                            dir="ltr"
                        />
                        <p className="text-xs text-center text-gray-400">אינסטגרם, פייסבוק, לינקדאין או כל רשת אחרת</p>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">מה אני מחפש/ת (עד 500 תווים)</label>
                        <Textarea maxLength={500} value={formData.looking_for_description} onChange={(e) => setFormField('looking_for_description', e.target.value)} placeholder="איזה סוג של שותף/ה את/ה מחפש/ת?" className="bg-gray-50 border-gray-200 focus:ring-[--theme-orange] min-h-[120px] text-lg"/>
                    </div>
                </div>
            </Step>

            <Step step={9} currentStep={step} title="הפסקול שלך">
                <div className="flex flex-col items-center justify-center h-full space-y-6 text-center w-full">
                    <div className="w-24 h-24 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-2 shadow-lg animate-pulse">
                        <Music className="w-12 h-12 text-white" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900">איזה שיר הוא אתה?</h2>
                    <p className="text-gray-500 max-w-xs">
                        מוזיקה טובה היא הדרך הכי טובה להתחבר.
                    </p>

                    <div className="w-full max-w-sm space-y-4">
                        <div className="relative group">
                            <Input 
                                value={spotifySearch} 
                                onChange={(e) => setSpotifySearch(e.target.value)} 
                                placeholder="חפש שיר או אמן..." 
                                className="h-14 text-lg pr-12 rounded-2xl border-2 border-gray-100 focus:border-[--theme-orange] focus:ring-[--theme-orange] transition-all bg-gray-50 focus:bg-white shadow-sm"
                                onKeyDown={(e) => e.key === 'Enter' && searchSong()}
                            />
                            <Button 
                                onClick={searchSong} 
                                disabled={isSearchingSong || !spotifySearch.trim()} 
                                size="icon" 
                                className="absolute top-2 right-2 h-10 w-10 rounded-xl gradient-orange hover:brightness-110 shadow-md transition-transform active:scale-95"
                            >
                                {isSearchingSong ? <Loader2 className="animate-spin w-5 h-5 text-white"/> : <Search className="w-5 h-5 text-white"/>}
                            </Button>
                        </div>

                        {/* Search Results List */}
                        {searchResults.length > 0 && !formData.song_name && (
                            <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto px-1">
                                {searchResults.map((track) => (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        key={track.spotify_id}
                                        onClick={() => selectSong(track)}
                                        className="p-3 bg-white rounded-xl border border-gray-100 flex items-center gap-3 hover:border-[--theme-orange] hover:shadow-md cursor-pointer text-right transition-all"
                                    >
                                        <img src={track.image_url} className="w-12 h-12 rounded-lg object-cover shadow-sm" />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-gray-900 truncate">{track.name}</div>
                                            <div className="text-xs text-gray-500 truncate">{track.artist}</div>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center">
                                            <Plus className="w-4 h-4 text-[--theme-orange]" />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        {formData.song_name && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-black p-4 rounded-3xl shadow-2xl border border-gray-800 relative text-white text-right flex items-center gap-4 overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-900/50 to-orange-900/50"></div>
                                
                                <div className="relative z-10 w-16 h-16 rounded-full border-2 border-gray-700 overflow-hidden animate-[spin_8s_linear_infinite]">
                                    <img src={formData.song_image} className="w-full h-full object-cover opacity-80" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-4 h-4 bg-black rounded-full border border-gray-700"></div>
                                    </div>
                                </div>
                                
                                <div className="flex-1 relative z-10">
                                    <div className="font-bold text-lg leading-tight">{formData.song_name}</div>
                                    <div className="text-sm text-gray-400">{formData.song_artist}</div>
                                    <div className="flex gap-0.5 h-3 items-end mt-2">
                                        {[1,2,3,4,5].map(i => (
                                            <div key={i} className="w-1 bg-[--theme-orange] rounded-full animate-pulse" style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 0.1}s` }}></div>
                                        ))}
                                    </div>
                                </div>
                                
                                <button 
                                    onClick={() => setFormData(prev => ({...prev, spotify_track_id: '', song_name: '', song_preview_url: null, song_artist: '', song_image: '' }))}
                                    className="absolute top-2 left-2 bg-white/10 hover:bg-white/20 text-white p-1.5 rounded-full transition-colors z-20"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </motion.div>
                        )}
                        
                        {!formData.spotify_track_id && !formData.song_name && searchResults.length === 0 && (
                            <div className="text-center mt-8 opacity-50">
                                <Music className="w-16 h-16 mx-auto mb-2 text-gray-300" />
                            </div>
                        )}
                    </div>
                </div>
            </Step>

            <Step step={10} currentStep={step} title="התמונות שלי">
                <p className="text-center text-gray-500 mb-6">תמונה אחת שווה אלף מילים (ו-2 תמונות שוות התאמה!)</p>
                <div className="grid grid-cols-3 gap-3">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="aspect-[3/4] rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden relative shadow-sm hover:shadow-md transition-all bg-gray-50 group">
                             {formData.photos[i] ? (
                                 <>
                                    <img 
                                        src={formData.photos[i]} 
                                        alt={`Uploaded ${i+1}`} 
                                        className="w-full h-full object-cover cursor-pointer" 
                                        onClick={() => setLightboxSrc(formData.photos[i])}
                                        loading="eager"
                                        decoding="sync"
                                    />
                                    <button 
                                        className="absolute top-1 right-1 bg-white/80 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => { e.stopPropagation(); triggerFileInput(i); }}
                                    >
                                        <Camera className="w-4 h-4 text-gray-600"/>
                                    </button>
                                 </>
                             ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => triggerFileInput(i)}>
                                    {uploadingPhotos.has(i) ? <Loader2 className="w-8 h-8 animate-spin text-[--theme-orange]"/> : <Plus className="w-8 h-8 text-gray-300"/>}
                                </div>
                             )}
                        </div>
                    ))}
                </div>
            </Step>

            <Step step={11} currentStep={step} title="אימות פרופיל">
                <div className="flex flex-col items-center justify-center h-full text-center space-y-8">
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
                            className="w-full h-14 rounded-full text-lg font-bold shadow-lg gradient-orange text-white hover:brightness-110"
                        >
                            אמת עכשיו (מומלץ)
                        </Button>
                        <button 
                            onClick={() => handleFinish(false)}
                            className="text-gray-400 font-medium hover:text-gray-600 transition-colors"
                        >
                            אולי אחר כך
                        </button>
                    </div>
                </div>
            </Step>
        </div>

        {/* Action Button */}
        {step < 11 && (
            <div className="mt-6">
                <Button 
                    onClick={nextStep} 
                    className={`w-full h-14 rounded-full text-lg font-bold shadow-lg transition-all transform active:scale-95 ${canProceed() ? 'gradient-orange text-white hover:brightness-110' : 'bg-gray-200 text-gray-400'}`} 
                    disabled={!canProceed() || isSubmitting}
                >
                    {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin"/> : 'המשך'}
                </Button>
            </div>
        )}
      </div>
    </div>
  );
}