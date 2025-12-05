
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@/entities/User';
import { Profile } from '@/entities/Profile';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadFile } from "@/integrations/Core";
import { ArrowLeft, Camera, Dog, Cat, X, Plus, Loader2, PawPrint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';

const TOTAL_STEPS = 7; // Now 7 content steps, the last one being the "status" step before finishing.

const Step = ({ children, step, currentStep }) => (
  <AnimatePresence mode="wait">
    {currentStep === step && (
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.3 }}
        className="w-full"
      >
        {children}
      </motion.div>
    )}
  </AnimatePresence>
);

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    age: 25,
    gender: 'male',
    about_me: '',
    looking_for_description: '',
    photos: Array(6).fill(null),
    location: '', // Changed from 'תל אביב' to ''
    search_area: 'מרכז', // Added
    // budget_min removed
    budget_max: 3500,
    vibe_level: 3,
    pet_type: 'none',
    pet_other_description: '',
    looking_for_gender: 'any',
    religion: 'secular',
    kosher_preference: 'flow',
    shabbat_preference: 'flow',
    current_status: 'seeking_apartment',
    // Kept apartment related fields as they are used in the last step's UI and validation
    apartment_photos: [],
    existing_roommates: 0,
    apartment_total_budget: 5000,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef(null);
  const [uploadingIndex, setUploadingIndex] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await User.me();
        setUser(userData);
        // Pre-fill name with first name only
        setFormData(prev => ({ ...prev, name: userData.full_name.split(' ')[0], user_id: userData.id }));
      } catch (e) {
        navigate(createPageUrl('Home'));
      }
    };
    fetchUser();
  }, [navigate]);
  
  const canProceed = () => {
    switch(step) {
      case 1:
        return formData.name.trim() && formData.age >= 18 && formData.gender;
      case 2:
        return formData.about_me.trim() && formData.looking_for_description.trim();
      case 3:
        return formData.photos.filter(p => p).length >= 2;
      case 4:
        return formData.search_area.trim() !== '';
      case 5:
        return formData.vibe_level && formData.pet_type && (formData.pet_type !== 'other' || formData.pet_other_description.trim());
      case 6:
        return formData.looking_for_gender && formData.religion && formData.kosher_preference && formData.shabbat_preference;
      case 7:
        // אם יש דירה, חייב לפחות 3 תמונות דירה
        if (formData.current_status === 'has_apartment') {
          const apartmentPhotoCount = formData.apartment_photos?.filter(p => p).length || 0;
          return apartmentPhotoCount >= 3 && formData.existing_roommates >= 0 && formData.apartment_total_budget > 0;
        }
        return formData.current_status !== '';
      default:
        return true;
    }
  };

  const nextStep = () => setStep(s => Math.min(s + 1, TOTAL_STEPS));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      const finalData = { ...formData, photos: formData.photos.filter(p => p) };
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

  const handleImageUpload = async (e, index) => {
    const file = e.target.files[0];
    if (!file) {
      setUploadingIndex(null);
      return;
    }

    setUploadingIndex(index);
    try {
      const { file_url } = await UploadFile({ file });
      setFormData(prev => {
        const newPhotos = [...prev.photos];
        newPhotos[index] = file_url;
        return { ...prev, photos: newPhotos };
      });
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setUploadingIndex(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const triggerFileInput = (index) => {
    fileInputRef.current.onchange = (e) => handleImageUpload(e, index);
    fileInputRef.current.click();
  };

  const handleApartmentImageUpload = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const { file_url } = await UploadFile({ file });
      setFormData(prev => {
        const newPhotos = [...(prev.apartment_photos || [])];
        newPhotos[index] = file_url;
        return { ...prev, apartment_photos: newPhotos };
      });
    } catch (error) {
      console.error("Upload failed", error);
    }
  };
  
  const triggerApartmentFileInput = (index) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => handleApartmentImageUpload(e, index);
    input.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          {step > 1 ? (
            <Button variant="ghost" size="icon" onClick={prevStep}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          ) : (
            <div className="w-10"></div>
          )}
          <div className="flex-grow text-center text-sm text-gray-500">
            שלב {step} מתוך {TOTAL_STEPS}
          </div>
          <div className="w-10"></div>
        </div>
        <Progress value={(step / TOTAL_STEPS) * 100} className="w-full mb-8 h-2" />
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" />

        <div className="flex items-center justify-center min-h-[50vh]">
            <Step step={1} currentStep={step}>
                <h2 className="text-2xl font-bold text-center mb-6">ברוך הבא ל-Roomi!</h2>
                <p className="text-center text-gray-600 mb-8">בוא ניצור את הפרופיל שלך. זה ייקח רק כמה דקות.</p>
                <div className="space-y-4">
                    <div>
                        <label className="font-medium">שם פרטי</label>
                        <Input value={formData.name} onChange={(e) => setFormField('name', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="font-medium">מגדר</label>
                            <Select value={formData.gender} onValueChange={(v) => setFormField('gender', v)}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="male">זכר</SelectItem>
                                    <SelectItem value="female">נקבה</SelectItem>
                                    <SelectItem value="other">אחר</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                         <div>
                            <label className="font-medium">גיל</label>
                            <Input type="number" value={formData.age} onChange={(e) => setFormField('age', parseInt(e.target.value) || 0)} />
                        </div>
                    </div>
                </div>
            </Step>
            
            <Step step={2} currentStep={step}>
                <h2 className="text-2xl font-bold text-center mb-6">ספר/י על עצמך</h2>
                <div className="space-y-4">
                    <div>
                        <label className="font-medium">קצת עליי (עד 500 תווים)</label>
                        <Textarea maxLength={500} value={formData.about_me} onChange={(e) => setFormField('about_me', e.target.value)} placeholder="תחביבים, עיסוק, מה חשוב לך בשותפות..."/>
                    </div>
                    <div>
                        <label className="font-medium">מה אני מחפש/ת (עד 500 תווים)</label>
                        <Textarea maxLength={500} value={formData.looking_for_description} onChange={(e) => setFormField('looking_for_description', e.target.value)} placeholder="איזה סוג של שותף/ה את/ה מחפש/ת?"/>
                    </div>
                </div>
            </Step>

            <Step step={3} currentStep={step}>
                <h2 className="text-2xl font-bold text-center mb-6">העלה/י את התמונות שלך</h2>
                <p className="text-center text-gray-500 mb-6">צריך לפחות 2 תמונות. תמונה טובה שווה אלף מילים!</p>
                <div className="grid grid-cols-3 gap-3">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="aspect-square rounded-2xl border-2 border-dashed border-gray-300 overflow-hidden" onClick={() => triggerFileInput(i)}>
                             {formData.photos[i] ? (
                                 <img src={formData.photos[i]} alt={`Uploaded ${i+1}`} className="w-full h-full object-cover" />
                             ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-100 cursor-pointer">
                                    {uploadingIndex === i ? <Loader2 className="w-6 h-6 animate-spin text-gray-400"/> : <Plus className="w-6 h-6 text-gray-400"/>}
                                </div>
                             )}
                        </div>
                    ))}
                </div>
            </Step>
            
            <Step step={4} currentStep={step}>
                <h2 className="text-2xl font-bold text-center mb-6">איפה נחפש?</h2>
                 <div className="space-y-4">
                    <div>
                        <label className="font-medium">אזור חיפוש מועדף</label>
                        <Select value={formData.search_area} onValueChange={(v) => setFormField('search_area', v)}>
                            <SelectTrigger className="bg-white"><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="צפון">צפון</SelectItem>
                                <SelectItem value="מרכז">מרכז</SelectItem>
                                <SelectItem value="דרום">דרום</SelectItem>
                                <SelectItem value="שפלה">שפלה</SelectItem>
                                <SelectItem value="ירושלים">ירושלים והסביבה</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <label className="font-medium">עיר (אופציונלי)</label>
                        <Input value={formData.location} onChange={(e) => setFormField('location', e.target.value)} placeholder="לדוגמה: תל אביב"/>
                    </div>
                </div>
            </Step>

            <Step step={5} currentStep={step}>
                <h2 className="text-2xl font-bold text-center mb-6">סגנון חיים</h2>
                <div className="space-y-8">
                     <div>
                        <label className="font-medium block text-center mb-2">איפה את/ה על הסקאלה?</label>
                        <Slider dir="ltr" value={[formData.vibe_level]} onValueChange={(v) => setFormField('vibe_level', v[0])} max={5} min={1} step={1} />
                        <div className="flex justify-between text-sm text-gray-500 mt-2">
                            <span>שקט וביתי</span>
                            <span>חברותי ופעיל</span>
                            <span>תוסס ומסיבתי</span>
                        </div>
                    </div>
                    <div>
                        <label className="font-medium block text-center mb-4">יש לך חיית מחמד?</label>
                        <div className="grid grid-cols-2 gap-3">
                            {['none', 'dog', 'cat', 'other'].map(type => (
                                <button type="button" key={type} onClick={() => setFormField('pet_type', type)} className={`p-4 border-2 rounded-lg flex flex-col items-center justify-center transition-colors ${formData.pet_type === type ? 'border-[--theme-orange] bg-orange-50' : 'border-gray-200'}`}>
                                    {type === 'none' && <X className="w-8 h-8 mb-2" />}
                                    {type === 'dog' && <Dog className="w-8 h-8 mb-2" />}
                                    {type === 'cat' && <Cat className="w-8 h-8 mb-2" />}
                                    {type === 'other' && <PawPrint className="w-8 h-8 mb-2" />}
                                    <span className="font-semibold">{
                                        {'none': 'אין', 'dog': 'כלב', 'cat': 'חתול', 'other': 'אחר'}[type]
                                    }</span>
                                </button>
                            ))}
                        </div>
                         {formData.pet_type === 'other' && (
                            <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="mt-4">
                                <label className="font-medium">איזו חיה?</label>
                                <Input value={formData.pet_other_description} onChange={(e) => setFormField('pet_other_description', e.target.value)} placeholder="לדוגמה: תוכי, ארנב..."/>
                            </motion.div>
                         )}
                    </div>
                </div>
            </Step>
            
            <Step step={6} currentStep={step}>
                <h2 className="text-2xl font-bold text-center mb-6">העדפות ודת</h2>
                 <div className="space-y-4">
                    <div>
                        <label className="font-medium">אני מחפש/ת</label>
                        <Select value={formData.looking_for_gender} onValueChange={(v) => setFormField('looking_for_gender', v)}>
                            <SelectTrigger className="bg-white"><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="male">שותף</SelectItem>
                                <SelectItem value="female">שותפה</SelectItem>
                                <SelectItem value="any">לא משנה</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div>
                        <label className="font-medium">זיקה לדת</label>
                        <Select value={formData.religion} onValueChange={(v) => setFormField('religion', v)}>
                            <SelectTrigger className="bg-white"><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="secular">חילוני/ת</SelectItem>
                                <SelectItem value="traditional">מסורתי/ת</SelectItem>
                                <SelectItem value="national_religious">דתי/ה לאומי/ת</SelectItem>
                                <SelectItem value="religious">דתי/ה</SelectItem>
                                <SelectItem value="haredi">חרדי/ת</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div>
                        <label className="font-medium">כשרות במטבח</label>
                        <Select value={formData.kosher_preference} onValueChange={(v) => setFormField('kosher_preference', v)}>
                            <SelectTrigger className="bg-white"><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="for">בעד</SelectItem>
                                <SelectItem value="against">נגד</SelectItem>
                                <SelectItem value="flow">יכול/ה לזרום</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                      <div>
                        <label className="font-medium">שבת במרחב הציבורי</label>
                        <Select value={formData.shabbat_preference} onValueChange={(v) => setFormField('shabbat_preference', v)}>
                            <SelectTrigger className="bg-white"><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="for">בעד שמירה</SelectItem>
                                <SelectItem value="against">נגד שמירה</SelectItem>
                                <SelectItem value="flow">יכול/ה לזרום</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                 </div>
            </Step>

            <Step step={7} currentStep={step}>
                <h2 className="text-2xl font-bold text-center mb-6">מה הסטטוס שלך?</h2>
                <div className="space-y-4">
                    <button type="button" onClick={() => setFormField('current_status', 'seeking_apartment')} className={`w-full p-4 border-2 rounded-lg text-right transition-colors ${formData.current_status === 'seeking_apartment' ? 'border-[--theme-orange] bg-orange-50' : 'border-gray-200'}`}>
                        <h3 className="font-bold">מחפש/ת דירה ושותפים</h3>
                        <p className="text-sm text-gray-500">אין לי עדיין דירה, מחפש/ת להצטרף או למצוא יחד.</p>
                    </button>
                    <button type="button" onClick={() => setFormField('current_status', 'has_apartment')} className={`w-full p-4 border-2 rounded-lg text-right transition-colors ${formData.current_status === 'has_apartment' ? 'border-[--theme-orange] bg-orange-50' : 'border-gray-200'}`}>
                        <h3 className="font-bold">יש לי כבר דירה</h3>
                        <p className="text-sm text-gray-500">אני מחפש/ת שותף/ה שיצטרף/תצטרף לדירה קיימת.</p>
                    </button>
                </div>
                <AnimatePresence>
                {formData.current_status === 'has_apartment' && (
                    <motion.div initial={{opacity: 0, height: 0}} animate={{opacity: 1, height: 'auto'}} exit={{opacity: 0, height: 0}} className="mt-6 space-y-4">
                        <div>
                            <label className="font-medium">מספר שותפים נוכחי</label>
                            <Input type="number" value={formData.existing_roommates} onChange={e => setFormField('existing_roommates', parseInt(e.target.value) || 0)} />
                        </div>
                        <div>
                            <label className="font-medium">שכירות חודשית כוללת לדירה</label>
                            <Input type="number" value={formData.apartment_total_budget} onChange={e => setFormField('apartment_total_budget', parseInt(e.target.value) || 0)} />
                        </div>
                        <div>
                            <h3 className="font-semibold pt-2 mb-2">תמונות הדירה (לפחות 3 תמונות)</h3>
                            <div className="grid grid-cols-3 gap-3">
                                {[...Array(4)].map((_, i) => (
                                    <div 
                                        key={i} 
                                        className="aspect-square bg-gray-100 rounded-2xl flex items-center justify-center cursor-pointer border-2 border-dashed border-gray-300 overflow-hidden"
                                        onClick={() => triggerApartmentFileInput(i)}
                                    >
                                        {formData.apartment_photos?.[i] ? (
                                            <img src={formData.apartment_photos[i]} alt={`דירה ${i+1}`} className="w-full h-full object-cover" />
                                        ) : (
                                            <Camera className="w-6 h-6 text-gray-400" />
                                        )}
                                    </div>
                                ))}
                            </div>
                            {formData.apartment_photos?.filter(p => p).length < 3 && (
                                <p className="text-red-500 text-sm mt-2">יש להעלות לפחות 3 תמונות של הדירה</p>
                            )}
                        </div>
                    </motion.div>
                )}
                </AnimatePresence>
            </Step>
        </div>

        <div className="mt-8">
          {step < TOTAL_STEPS ? (
            <Button onClick={nextStep} className="w-full gradient-orange text-white" disabled={!canProceed()}>המשך</Button>
          ) : (
            <Button onClick={handleFinish} className="w-full bg-green-500 hover:bg-green-600" disabled={isSubmitting || !canProceed()}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : 'יאללה, נתחיל!'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
