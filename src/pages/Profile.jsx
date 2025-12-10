import React, { useState, useEffect, useRef } from "react";
import { Profile as ProfileEntity } from "@/entities/all";
import { User } from "@/entities/User";
import { UploadFile } from "@/integrations/Core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Edit, Plus, Loader2, X, Home, ShieldCheck, AlertCircle } from "lucide-react";
import { createPageUrl } from '@/utils';
import { AnimatePresence, motion } from 'framer-motion';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApartmentPhoto, setSelectedApartmentPhoto] = useState(null);
  const fileInputRef = useRef(null);
  const apartmentFileInputRef = useRef(null);
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const [uploadingApartmentIndex, setUploadingApartmentIndex] = useState(null);

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const userData = await User.me();
      const userProfiles = await ProfileEntity.filter({ user_id: userData.id });
      if (userProfiles.length > 0) {
        setProfile(userProfiles[0]);
        setFormData(userProfiles[0]);
      } else {
        window.location.href = createPageUrl('Onboarding');
      }
    } catch (error) { console.error("Error loading profile:", error); }
    setIsLoading(false);
  };

  const handleSave = async () => {
    try {
      if (profile) {
        const dataToSave = {...formData};
        if(!dataToSave.budget_min) dataToSave.budget_min = 0;
        await ProfileEntity.update(profile.id, dataToSave);
      }
      await loadProfile();
      setIsEditing(false);
    } catch (error) { console.error("Error saving profile:", error); }
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

  const handleImageUpload = async (e, index) => {
    let file = e.target.files[0];
    if (!file) return;
    setUploadingIndex(index);
    try {
        file = await compressImage(file);
        const { file_url } = await UploadFile({ file });
        const newPhotos = [...(formData.photos || Array(6).fill(null))];
        newPhotos[index] = file_url;
        setFormData(prev => ({...prev, photos: newPhotos}));
    } catch (error) { console.error("Upload failed", error); }
    setUploadingIndex(null);
  };

  const handleApartmentImageUpload = async (e, index) => {
    let file = e.target.files[0];
    if (!file) return;
    setUploadingApartmentIndex(index);
    try {
        file = await compressImage(file);
        const { file_url } = await UploadFile({ file });
        const newPhotos = [...(formData.apartment_photos || Array(4).fill(null))];
        newPhotos[index] = file_url;
        setFormData(prev => ({...prev, apartment_photos: newPhotos}));
    } catch (error) { console.error("Upload failed", error); }
    setUploadingApartmentIndex(null);
  };
  
  const triggerFileInput = (index) => {
    if (!isEditing) return;
    fileInputRef.current.onchange = (e) => handleImageUpload(e, index);
    fileInputRef.current.click();
  };

  const triggerApartmentFileInput = (index) => {
    if (!isEditing) return;
    apartmentFileInputRef.current.onchange = (e) => handleApartmentImageUpload(e, index);
    apartmentFileInputRef.current.click();
  };

  const setFormField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const vibeText = ["שקט", "רגוע", "מאוזן", "חברותי", "תוסס"];

  if (isLoading) return <div className="flex items-center justify-center h-96"><Loader2 className="w-12 h-12 animate-spin text-[--theme-orange]" /></div>;
  if (!profile) return <div className="p-4 text-center">לא נמצא פרופיל.</div>;

  return (
    <div className="bg-gray-50 min-h-screen pb-24" dir="rtl">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" />
      <input type="file" ref={apartmentFileInputRef} className="hidden" accept="image/*" />
      
      <AnimatePresence>
        {selectedApartmentPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-[100] flex items-center justify-center"
            onClick={() => setSelectedApartmentPhoto(null)}
          >
            <button
              onClick={() => setSelectedApartmentPhoto(null)}
              className="absolute top-4 right-4 p-2 bg-white/20 rounded-full"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <img src={selectedApartmentPhoto} className="max-w-full max-h-full object-contain" alt="דירה" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white">
        <div className="flex justify-between items-center py-3 px-4 border-b border-gray-200">
          <h1 className="text-2xl font-black text-gray-800">הפרופיל שלי</h1>
          <Button onClick={() => isEditing ? handleSave() : setIsEditing(true)} className="rounded-full gradient-orange text-white shadow-lg">
              {isEditing ? <><Save className="w-4 h-4 ml-2"/> שמור</> : <><Edit className="w-4 h-4 ml-2"/> ערוך</>}
          </Button>
        </div>

        {!profile.is_verified && (
            <div className="px-4 mt-2">
                <div 
                    onClick={() => window.location.href = createPageUrl('Verification')}
                    className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-center justify-between cursor-pointer active:scale-95 transition-transform"
                >
                    <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-full">
                            <AlertCircle className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 text-sm">הפרופיל לא מאומת</p>
                            <p className="text-xs text-gray-500">אמת את זהותך כדי לקבל יותר פניות</p>
                        </div>
                    </div>
                    <div className="bg-[--theme-orange] text-white text-xs font-bold px-4 py-2 rounded-full whitespace-nowrap min-w-fit">
                        אמת עכשיו
                    </div>
                </div>
            </div>
        )}

        {profile.is_verified && (
            <div className="px-4 mt-2">
                 <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-green-600" />
                    <p className="font-bold text-green-700 text-sm">פרופיל מאומת</p>
                 </div>
            </div>
        )}
        
        <div className="px-2 pt-2 pb-2">
          <div className="grid grid-cols-3 gap-1">
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`aspect-square rounded-lg overflow-hidden relative ${isEditing ? 'cursor-pointer border-2 border-gray-200 hover:border-[--theme-orange]' : ''} transition-all`} onClick={() => triggerFileInput(i)}>
                {(formData.photos?.length > i && formData.photos[i]) ? (
                  <img 
                    src={formData.photos[i]} 
                    alt={`תמונה ${i+1}`} 
                    className="w-full h-full object-cover" 
                    loading="eager" 
                    decoding="sync"
                    fetchPriority={i === 0 ? "high" : "auto"}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    {isEditing && <Plus className="w-6 h-6 text-gray-400"/>}
                  </div>
                )}
                {/* Click handler for Lightbox when NOT editing */}
                {!isEditing && formData.photos?.[i] && (
                  <div 
                    className="absolute inset-0 z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedApartmentPhoto(formData.photos[i]);
                    }}
                  />
                )}
                {uploadingIndex === i && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="animate-spin text-white"/></div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="grid grid-cols-2 gap-4">
                <div className="text-right">
                  <label className="block text-sm font-medium text-gray-500 mb-1">גיל</label>
                  <p className="text-lg font-bold text-[--theme-orange]">{profile.age}</p>
                </div>
                <div className="text-right">
                  <label className="block text-sm font-medium text-gray-500 mb-1">מגדר</label>
                  {isEditing ? (
                    <Select value={formData.gender} onValueChange={(v) => setFormField('gender', v)}>
                      <SelectTrigger className="w-full text-right bg-white" dir="rtl"><SelectValue/></SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="male" className="bg-white hover:bg-gray-100 focus:bg-gray-100">זכר</SelectItem>
                        <SelectItem value="female" className="bg-white hover:bg-gray-100 focus:bg-gray-100">נקבה</SelectItem>
                        <SelectItem value="other" className="bg-white hover:bg-gray-100 focus:bg-gray-100">אחר</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                     <p className="text-lg font-bold text-[--theme-orange]">{formData.gender === 'male' ? 'זכר' : 'נקבה'}</p>
                  )}
                </div>
            </div>
        </div>
        
        <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-3 text-right">בעלי חיים</h3>
              <div className="space-y-3 mb-4">
                  <div className="grid grid-cols-2 gap-3">
                      {['none', 'dog', 'cat', 'other'].map(type => (
                          <button 
                              key={type} 
                              disabled={!isEditing}
                              onClick={() => setFormField('pet_type', type)} 
                              className={`p-2 border rounded-lg flex flex-col items-center justify-center transition-colors ${formData.pet_type === type ? 'border-[--theme-orange] bg-orange-50 text-[--theme-orange]' : 'border-gray-200 text-gray-600'} ${!isEditing && formData.pet_type !== type ? 'opacity-50' : ''}`}
                          >
                              <span className="text-sm font-medium">{
                                  {'none': 'אין', 'dog': 'כלב', 'cat': 'חתול', 'other': 'אחר'}[type]
                              }</span>
                          </button>
                      ))}
                  </div>
                  {formData.pet_type === 'other' && (
                       <Input 
                          disabled={!isEditing} 
                          value={formData.pet_other_description || ''} 
                          onChange={(e) => setFormField('pet_other_description', e.target.value)} 
                          placeholder="איזו חיה?" 
                          className="bg-white border-gray-300 text-right" 
                          dir="rtl"
                       />
                  )}
              </div>

              <h3 className="font-bold text-gray-800 mb-3 text-right">העדפות דת ומסורת</h3>
              <div className="space-y-3">
                  <div>
                      <label className="block text-right text-sm font-medium text-gray-600 mb-1">זיקה לדת</label>
                      <Select disabled={!isEditing} value={formData.religion} onValueChange={(v) => setFormField('religion', v)}>
                          <SelectTrigger className="w-full bg-white border-gray-300 text-right" dir="rtl"><SelectValue placeholder="בחר..."/></SelectTrigger>
                          <SelectContent className="bg-white">
                              <SelectItem value="secular">חילוני/ת</SelectItem>
                              <SelectItem value="traditional">מסורתי/ת</SelectItem>
                              <SelectItem value="national_religious">דתי/ה לאומי/ת</SelectItem>
                              <SelectItem value="religious">דתי/ה</SelectItem>
                              <SelectItem value="haredi">חרדי/ת</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                      <div>
                          <label className="block text-right text-sm font-medium text-gray-600 mb-1">כשרות</label>
                          <Select disabled={!isEditing} value={formData.kosher_preference} onValueChange={(v) => setFormField('kosher_preference', v)}>
                              <SelectTrigger className="w-full bg-white border-gray-300 text-right" dir="rtl"><SelectValue placeholder="בחר..."/></SelectTrigger>
                              <SelectContent className="bg-white">
                                  <SelectItem value="for">בעד</SelectItem>
                                  <SelectItem value="against">נגד</SelectItem>
                                  <SelectItem value="flow">זורם/ת</SelectItem>
                              </SelectContent>
                          </Select>
                      </div>
                      <div>
                          <label className="block text-right text-sm font-medium text-gray-600 mb-1">שמירת שבת</label>
                          <Select disabled={!isEditing} value={formData.shabbat_preference} onValueChange={(v) => setFormField('shabbat_preference', v)}>
                              <SelectTrigger className="w-full bg-white border-gray-300 text-right" dir="rtl"><SelectValue placeholder="בחר..."/></SelectTrigger>
                              <SelectContent className="bg-white">
                                  <SelectItem value="for">בעד</SelectItem>
                                  <SelectItem value="against">נגד</SelectItem>
                                  <SelectItem value="flow">זורם/ת</SelectItem>
                              </SelectContent>
                          </Select>
                      </div>
                  </div>
              </div>
            </div>

            <div>
              <label className="block text-right font-bold text-gray-700 mb-2">קצת עליי</label>
              <Textarea disabled={!isEditing} value={formData.about_me || ""} onChange={(e) => setFormField('about_me', e.target.value)} className="mt-1 bg-white focus:ring-[--theme-orange] focus:border-[--theme-orange] border-gray-300 text-right" dir="rtl" />
            </div>
            <div>
              <label className="block text-right font-bold text-gray-700 mb-2">מה אני מחפש/ת</label>
              <Textarea disabled={!isEditing} value={formData.looking_for_description || ""} onChange={(e) => setFormField('looking_for_description', e.target.value)} className="mt-1 bg-white focus:ring-[--theme-orange] focus:border-[--theme-orange] border-gray-300 text-right" dir="rtl" />
            </div>
        </div>
        
        <div className="space-y-4">
            <div className="text-right">
                <label className="block text-right font-bold text-gray-700 mb-2">
                  מחפש/ת
                </label>
                <Select disabled={!isEditing} value={formData.looking_for_gender} onValueChange={(v) => setFormField('looking_for_gender', v)}>
                    <SelectTrigger className="w-full bg-white mt-1 border-gray-300 text-right" dir="rtl"><SelectValue/></SelectTrigger>
                    <SelectContent className="bg-white">
                        <SelectItem value="male" className="text-gray-900">שותף</SelectItem>
                        <SelectItem value="female" className="text-gray-900">שותפה</SelectItem>
                        <SelectItem value="any" className="text-gray-900">לא משנה</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div>
                <label className="block text-right font-bold text-gray-700 mb-3">
                  וייב: <span className="text-[--theme-orange] font-black text-lg">{vibeText[formData.vibe_level-1] || 'מאוזן'}</span>
                </label>
                <div className="px-2">
                  <div className="relative">
                    <input
                      type="range"
                      dir="ltr"
                      disabled={!isEditing}
                      value={formData.vibe_level}
                      onChange={(e) => setFormField('vibe_level', parseInt(e.target.value))}
                      min="1"
                      max="5"
                      step="1"
                      className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #FF5722 0%, #FF5722 ${((formData.vibe_level - 1) / 4) * 100}%, #e5e7eb ${((formData.vibe_level - 1) / 4) * 100}%, #e5e7eb 100%)`
                      }}
                    />
                    <style>{`
                      input[type="range"]::-webkit-slider-thumb {
                        appearance: none;
                        width: 24px;
                        height: 24px;
                        border-radius: 50%;
                        background: #FF5722;
                        cursor: pointer;
                        border: 3px solid white;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                      }
                      input[type="range"]::-moz-range-thumb {
                        width: 24px;
                        height: 24px;
                        border-radius: 50%;
                        background: #FF5722;
                        cursor: pointer;
                        border: 3px solid white;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                      }
                    `}</style>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600 mt-3 px-1 font-medium">
                    <span>תוסס</span>
                    <span>חברותי</span>
                    <span>מאוזן</span>
                    <span>רגוע</span>
                    <span>שקט</span>
                  </div>
                </div>
            </div>
        </div>

        <div className="space-y-4">
            <div className="text-right">
                <label className="block text-right font-bold text-gray-700 mb-2">
                  סטטוס דירה
                </label>
                <Select disabled={!isEditing} value={formData.current_status} onValueChange={(v) => setFormField('current_status', v)}>
                    <SelectTrigger className="w-full bg-white mt-1 border-gray-300 text-right" dir="rtl"><SelectValue/></SelectTrigger>
                    <SelectContent className="bg-white">
                        <SelectItem value="seeking_apartment" className="text-gray-900">מחפש/ת דירה</SelectItem>
                        <SelectItem value="has_apartment" className="text-gray-900">יש לי דירה</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {formData.current_status === 'has_apartment' && (
            <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
            <div className="flex items-center mb-3">
                <div className="p-2 bg-[--theme-orange] rounded-full text-white ml-2">
                     <Home className="w-4 h-4" />
                </div>
                <label className="block text-lg font-bold text-gray-800">
                    הדירה שלי
                </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {[...Array(4)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`aspect-[4/3] rounded-xl border-2 border-dashed ${isEditing ? 'border-[--theme-orange]/50 cursor-pointer hover:bg-orange-100' : 'border-gray-200'} bg-white overflow-hidden relative transition-all shadow-sm`} 
                      onClick={(e) => {
                        if (isEditing) {
                          triggerApartmentFileInput(i);
                        } else if (formData.apartment_photos?.[i]) {
                          setSelectedApartmentPhoto(formData.apartment_photos[i]);
                        }
                      }}
                    >
                        {(formData.apartment_photos?.length > i && formData.apartment_photos[i]) ? (
                            <img src={formData.apartment_photos[i]} alt={`דירה ${i+1}`} className="w-full h-full object-cover" loading="eager" decoding="sync"/>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                              {isEditing ? (
                                  <>
                                      <Plus className="w-8 h-8 mb-1 text-[--theme-orange]"/>
                                      <span className="text-xs text-[--theme-orange]">הוסף תמונה</span>
                                  </>
                              ) : (
                                  <Home className="w-6 h-6 opacity-20"/>
                              )}
                            </div>
                        )}
                        {uploadingApartmentIndex === i && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="animate-spin text-white"/></div>}
                    </div>
                ))}
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
                {isEditing ? 'יש להעלות תמונות ברורות של החללים המשותפים והחדר הפנוי' : 'לחץ על תמונה להגדלה'}
            </p>
            </div>
            )}

            <div>
                <label className="block text-right text-sm font-bold text-gray-700 mb-1">תקציב חודשי לשכירות</label>
                <Input disabled={!isEditing} type="number" placeholder="לדוגמה: 3500" value={formData.budget_max} onChange={e => setFormField('budget_max', parseInt(e.target.value) || 0)} className="bg-white border-gray-300 text-right" dir="rtl" />
            </div>
            
            <div>
                <label className="block text-right text-sm font-bold text-gray-700 mb-2">איזור חיפוש מועדף</label>
                <Select disabled={!isEditing} value={formData.search_area} onValueChange={(v) => setFormField('search_area', v)}>
                    <SelectTrigger className="w-full bg-white border-gray-300 text-right" dir="rtl"><SelectValue/></SelectTrigger>
                    <SelectContent className="bg-white">
                        <SelectItem value="צפון" className="text-gray-900">צפון</SelectItem>
                        <SelectItem value="מרכז" className="text-gray-900">מרכז</SelectItem>
                        <SelectItem value="דרום" className="text-gray-900">דרום</SelectItem>
                        <SelectItem value="שפלה" className="text-gray-900">שפלה</SelectItem>
                        <SelectItem value="ירושלים" className="text-gray-900">ירושלים והסביבה</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            
            <div>
                <label className="block text-right text-sm font-bold text-gray-700 mb-1">עיר מועדפת (אופציונלי)</label>
                <Input disabled={!isEditing} value={formData.location} onChange={e => setFormField('location', e.target.value)} placeholder="לדוגמה: תל אביב" className="bg-white border-gray-300 text-right" dir="rtl" />
            </div>
        </div>
      </div>
    </div>
  );
}