import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@/entities/User';
import { Profile } from '@/entities/Profile';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadFile } from "@/integrations/Core";
import { ArrowRight, Check, Camera, Dog, Cat, X, Plus, Loader2, PawPrint, Home, Search, MapPin, DollarSign, Music, Coffee, Beer, Book } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import CitySelect from '@/components/shared/CitySelect';
import ImageLightbox from '@/components/shared/ImageLightbox';

const TOTAL_STEPS = 9; 

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
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState(null);

  const fileInputRef = useRef(null);
  const apartmentFileInputRef = useRef(null);
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const [uploadingApartmentIndex, setUploadingApartmentIndex] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await User.me();
        setFormData(prev => ({ ...prev, name: userData.full_name.split(' ')[0], user_id: userData.id }));
      } catch (e) {
        navigate(createPageUrl('Home'));
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
      case 3: // Photos
        return formData.photos.filter(p => p).length >= 2;
      case 4: // Location & Budget
        return formData.search_cities.length > 0 && formData.budget_max > 0;
      case 5: // Vibe
        return formData.vibe_level;
      case 6: // Pets
        return formData.pet_type && (formData.pet_type !== 'other' || formData.pet_other_description.trim());
      case 7: // About
        return formData.about_me.trim() && formData.looking_for_description.trim();
      case 8: // Preferences
        return formData.looking_for_gender && formData.religion && formData.kosher_preference && formData.shabbat_preference;
      case 9: // Apartment Details
        if (formData.current_status === 'has_apartment') {
            const apartmentPhotoCount = formData.apartment_photos?.filter(p => p).length || 0;
            return apartmentPhotoCount >= 3 && formData.existing_roommates >= 0 && formData.apartment_total_budget > 0;
        }
        return true;
      default:
        return true;
      }
  };

  const nextStep = () => {
    if (step === 8 && formData.current_status === 'seeking_apartment') {
        // Skip apartment details if seeking (step 9)
        handleFinish();
    } else {
        setStep(s => Math.min(s + 1, TOTAL_STEPS));
    }
  };
  
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      const finalData = { 
          ...formData, 
          photos: formData.photos.filter(p => p),
          apartment_photos: formData.apartment_photos ? formData.apartment_photos.filter(p => p) : [],
          location: formData.search_cities[0] || '',
          is_visible: true
      };
      await Profile.create(finalData);
      navigate(createPageUrl('Discover'));
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
          const maxWidth = 1200;
          if (img.width <= maxWidth) { resolve(file); return; }
          const scaleSize = maxWidth / img.width;
          canvas.width = maxWidth;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          ctx.canvas.toBlob((blob) => {
            if (!blob) { resolve(file); return; }
            const newFile = new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() });
            resolve(newFile);
          }, 'image/jpeg', 0.8);
        };
        img.onerror = () => resolve(file);
      };
      reader.onerror = () => resolve(file);
    });
  };

  const handleImageUpload = async (e, index, isApartment = false) => {
    let file = e.target.files[0];
    if (!file) return;

    if (isApartment) setUploadingApartmentIndex(index);
    else setUploadingIndex(index);

    try {
      // Optimistic preview (use original file for speed)
      const objectUrl = URL.createObjectURL(file);
      setFormData(prev => {
        const key = isApartment ? 'apartment_photos' : 'photos';
        const newPhotos = [...(prev[key] || [])];
        newPhotos[index] = objectUrl; 
        return { ...prev, [key]: newPhotos };
      });

      // Compress before upload
      const compressedFile = await compressImage(file);
      const { file_url } = await UploadFile({ file: compressedFile });
      
      setFormData(prev => {
        const key = isApartment ? 'apartment_photos' : 'photos';
        const newPhotos = [...(prev[key] || [])];
        newPhotos[index] = file_url; // Replace with real URL
        
        if (isApartment && index === newPhotos.length - 1 && newPhotos.length < 12) {
             newPhotos.push(null, null);
        }
        
        return { ...prev, [key]: newPhotos };
      });
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setUploadingIndex(null);
      setUploadingApartmentIndex(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (apartmentFileInputRef.current) apartmentFileInputRef.current.value = '';
    }
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
                 <span className="font-bold text-[--theme-orange]">שלב {step}</span>
                 <div className="w-10"/>
             </div>
             <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                 <motion.div 
                    className="h-full gradient-orange"
                    initial={{ width: 0 }}
                    animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
                    transition={{ duration: 0.5 }}
                 />
             </div>
        </div>

        <div className="flex-1 relative">
            <Step step={1} currentStep={step} title="נעים להכיר!">
                <p className="text-center text-gray-500 mb-8">ספר לנו קצת על עצמך בשביל ההתחלה</p>
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
            
            <Step step={3} currentStep={step} title="התמונות שלי">
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
                                    {uploadingIndex === i ? <Loader2 className="w-8 h-8 animate-spin text-[--theme-orange]"/> : <Plus className="w-8 h-8 text-gray-300"/>}
                                </div>
                             )}
                        </div>
                    ))}
                </div>
            </Step>

            <Step step={4} currentStep={step} title="לוקיישן ותקציב">
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

            <Step step={5} currentStep={step} title="מה הוייב שלך?">
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

            <Step step={6} currentStep={step} title="חיות מחמד">
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

            <Step step={7} currentStep={step} title="ספר/י על עצמך">
                <div className="space-y-6 text-right">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">קצת עליי (עד 500 תווים)</label>
                        <Textarea maxLength={500} value={formData.about_me} onChange={(e) => setFormField('about_me', e.target.value)} placeholder="תחביבים, עיסוק, מה חשוב לך בשותפות..." className="bg-gray-50 border-gray-200 focus:ring-[--theme-orange] min-h-[120px] text-lg"/>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">מה אני מחפש/ת (עד 500 תווים)</label>
                        <Textarea maxLength={500} value={formData.looking_for_description} onChange={(e) => setFormField('looking_for_description', e.target.value)} placeholder="איזה סוג של שותף/ה את/ה מחפש/ת?" className="bg-gray-50 border-gray-200 focus:ring-[--theme-orange] min-h-[120px] text-lg"/>
                    </div>
                </div>
            </Step>

            <Step step={8} currentStep={step} title="העדפות ודת">
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

            <Step step={9} currentStep={step} title="פרטי הדירה">
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
                                        uploadingApartmentIndex === i ? 
                                            <Loader2 className="w-5 h-5 animate-spin text-[--theme-orange]" /> :
                                            <Plus className="w-5 h-5 text-orange-300" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Step>
        </div>

        {/* Action Button */}
        <div className="mt-6">
            <Button 
                onClick={step === TOTAL_STEPS || (step === 8 && formData.current_status === 'seeking_apartment') ? handleFinish : nextStep} 
                className={`w-full h-14 rounded-full text-lg font-bold shadow-lg transition-all transform active:scale-95 ${canProceed() ? 'gradient-orange text-white hover:brightness-110' : 'bg-gray-200 text-gray-400'}`} 
                disabled={!canProceed() || isSubmitting}
            >
                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin"/> : 
                 (step === TOTAL_STEPS || (step === 8 && formData.current_status === 'seeking_apartment') ? 'סיימנו! בוא נתחיל' : 'המשך')}
            </Button>
        </div>
      </div>
    </div>
  );
}