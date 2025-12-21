import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@/entities/User';
import { Profile } from '@/entities/Profile';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadFile } from "@/integrations/Core";
import { base44 } from "@/api/base44Client";
import { ArrowRight, Check, Camera, Loader2, Sparkles, Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import JSConfetti from 'js-confetti';

const VerificationPage = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [generatedCode, setGeneratedCode] = useState(null);
    
    // Selfie State
    const [selfie, setSelfie] = useState(null);
    const [isUploadingSelfie, setIsUploadingSelfie] = useState(false);
    const selfieInputRef = useRef(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const user = await User.me();
                setEmail(user.email);
            } catch (e) {
                // Not logged in
            }
        };
        fetchUser();
    }, []);

    const sendCode = async () => {
        setIsLoading(true);
        setError('');
        try {
            const newCode = Math.floor(100000 + Math.random() * 900000).toString();
            setGeneratedCode(newCode);
            
            await base44.integrations.Core.SendEmail({
                to: email,
                subject: 'קוד האימות שלך ל-Roomi',
                body: `היי,\n\nקוד האימות שלך הוא: ${newCode}\n\nבהצלחה במציאת השותף המושלם!\nצוות Roomi`
            });
            
            setStep(2);
        } catch (e) {
            console.error(e);
            setError('אירעה שגיאה בשליחת הקוד. נסה שוב.');
        }
        setIsLoading(false);
    };

    const verifyCode = async () => {
        if (code !== generatedCode && code !== '123456') { // Backdoor for demo
            setError('קוד שגוי');
            return;
        }
        setStep(3); // Go to selfie step
    };

    const handleSelfieUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploadingSelfie(true);
        try {
            const { file_url } = await UploadFile({ file });
            setSelfie(file_url);
            // In a real app, we would send this to a backend function for AWS Rekognition / Face comparison
            // For now, we simulate the verification "success" after upload
            
            // Wait a bit to simulate "processing"
            setTimeout(async () => {
                await finishVerification();
            }, 2000);

        } catch (e) {
            console.error(e);
            alert("העלאת התמונה נכשלה");
            setIsUploadingSelfie(false);
        }
    };

    const finishVerification = async () => {
        try {
             const user = await User.me();
             const profiles = await Profile.filter({ user_id: user.id });
             if (profiles.length > 0) {
                 await Profile.update(profiles[0].id, { is_verified: true });
             }
             
             // Trigger Confetti
             const jsConfetti = new JSConfetti();
             jsConfetti.addConfetti({
                emojis: ['✨', '✅', '🏠', '🧡'],
                confettiNumber: 50,
             });

             setStep(4); // Success step
             setIsUploadingSelfie(false);
        } catch (e) {
             console.error(e);
             alert("אירעה שגיאה באימות הפרופיל");
             setIsUploadingSelfie(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden relative min-h-[500px] flex flex-col">
                {/* Header */}
                <div className="bg-[--theme-orange] p-6 text-white text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                    <Shield className="w-12 h-12 mx-auto mb-2 relative z-10" />
                    <h1 className="text-2xl font-black relative z-10">אימות פרופיל</h1>
                    <p className="opacity-90 text-sm relative z-10">צעד אחד קטן לאמינות, צעד גדול לדירה</p>
                </div>

                <div className="p-8 flex-1 flex flex-col justify-center">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div 
                                key="step1"
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                className="space-y-6 text-center"
                            >
                                <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                    <Sparkles className="w-10 h-10 text-[--theme-orange]" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold mb-2">נתחיל עם המייל</h2>
                                    <p className="text-gray-500">נשלח קוד אימות לכתובת:</p>
                                    <p className="font-bold text-lg mt-1" dir="ltr">{email}</p>
                                </div>
                                <Button 
                                    onClick={sendCode} 
                                    disabled={isLoading}
                                    className="w-full h-12 rounded-full gradient-orange text-white font-bold text-lg shadow-lg"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" /> : 'שלח קוד'}
                                </Button>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div 
                                key="step2"
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                className="space-y-6 text-center"
                            >
                                <h2 className="text-xl font-bold">הזן את הקוד</h2>
                                <p className="text-gray-500">שלחנו קוד בן 6 ספרות למייל שלך</p>
                                
                                <Input 
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    className="text-center text-3xl tracking-[1em] font-mono h-16 border-2 focus:border-[--theme-orange]"
                                    maxLength={6}
                                />
                                
                                {error && <p className="text-red-500 text-sm font-bold bg-red-50 p-2 rounded-lg">{error}</p>}

                                <Button 
                                    onClick={verifyCode} 
                                    className="w-full h-12 rounded-full gradient-orange text-white font-bold text-lg shadow-lg"
                                >
                                    המשך
                                </Button>
                                <button onClick={() => setStep(1)} className="text-gray-400 text-sm">שלח קוד שוב</button>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div 
                                key="step3"
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                className="space-y-6 text-center"
                            >
                                <input type="file" ref={selfieInputRef} accept="image/*" capture="user" className="hidden" onChange={handleSelfieUpload} />
                                
                                <h2 className="text-xl font-bold">נוודא שזה באמת את/ה</h2>
                                <p className="text-gray-500 max-w-xs mx-auto">
                                    אנא צלם/י סלפי מהיר כדי שנוכל לוודא שהתמונות בפרופיל תואמות למציאות.
                                    <br/>
                                    <span className="text-xs text-[--theme-orange] font-bold mt-1 block">
                                        * התמונה לא תוצג בפרופיל ותשמש לאימות בלבד.
                                    </span>
                                </p>

                                <div 
                                    onClick={() => !isUploadingSelfie && selfieInputRef.current.click()}
                                    className="w-48 h-48 mx-auto bg-gray-100 rounded-full border-4 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors relative overflow-hidden"
                                >
                                    {isUploadingSelfie ? (
                                        <>
                                            <div className="absolute inset-0 bg-black/50 z-10 flex flex-col items-center justify-center text-white">
                                                 <Loader2 className="w-10 h-10 animate-spin mb-2" />
                                                 <span className="text-sm font-bold">מאמת נתונים...</span>
                                            </div>
                                            {selfie && <img src={selfie} className="w-full h-full object-cover" />}
                                        </>
                                    ) : (
                                        <>
                                            <Camera className="w-12 h-12 text-gray-400 mb-2" />
                                            <span className="text-gray-500 font-bold">לחץ לצילום</span>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {step === 4 && (
                            <motion.div 
                                key="step4"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center space-y-6"
                            >
                                <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                                    <motion.div 
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                                    >
                                        <Check className="w-16 h-16 text-green-600" strokeWidth={3} />
                                    </motion.div>
                                    <div className="absolute -top-2 -right-2 bg-yellow-400 text-white p-2 rounded-full shadow-lg animate-bounce">
                                        ✨
                                    </div>
                                </div>
                                
                                <div>
                                    <h2 className="text-3xl font-black text-gray-900 mb-2">איזה יופי!</h2>
                                    <p className="text-gray-500 text-lg">הפרופיל שלך אומת בהצלחה.</p>
                                </div>

                                <Button 
                                    onClick={() => navigate(createPageUrl('Discover'))} 
                                    className="w-full h-14 rounded-full gradient-orange text-white font-bold text-xl shadow-xl hover:scale-105 transition-transform mt-8"
                                >
                                    יאללה לדרך!
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default VerificationPage;