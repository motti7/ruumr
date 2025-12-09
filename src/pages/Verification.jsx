import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Profile } from '@/entities/Profile';
import { User } from '@/entities/User';
import { createPageUrl } from '@/utils';
import { UploadFile } from "@/integrations/Core";
import { ArrowRight, Camera, Check, Shield, Smartphone, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';

// Mock SMS sending (In real app, use integration)
const sendMockSMS = async (phone) => {
    return new Promise(resolve => setTimeout(resolve, 1500));
};

export default function VerificationPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Intro, 2: Phone, 3: OTP, 4: Selfie, 5: Success
    const [isLoading, setIsLoading] = useState(false);
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState(['', '', '', '']);
    const [selfie, setSelfie] = useState(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);

    const handlePhoneSubmit = async () => {
        if (phone.length < 9) return;
        setIsLoading(true);
        await sendMockSMS(phone);
        setIsLoading(false);
        setStep(3);
    };

    const handleOtpChange = (index, value) => {
        if (value.length > 1) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        if (value && index < 3) {
            document.getElementById(`otp-${index + 1}`).focus();
        }
    };

    const handleOtpSubmit = () => {
        if (otp.join('').length === 4) {
            setIsLoading(true);
            setTimeout(() => {
                setIsLoading(false);
                setStep(4);
            }, 1000);
        }
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsCameraOpen(true);
            }
        } catch (err) {
            console.error("Error accessing camera", err);
            alert("לא ניתן לגשת למצלמה");
        }
    };

    const takePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            context.drawImage(videoRef.current, 0, 0, 300, 300);
            const dataUrl = canvasRef.current.toDataURL('image/jpeg');
            setSelfie(dataUrl);
            
            // Stop camera
            const stream = videoRef.current.srcObject;
            const tracks = stream.getTracks();
            tracks.forEach(track => track.stop());
            setIsCameraOpen(false);
        }
    };

    const handleFinalSubmit = async () => {
        setIsLoading(true);
        try {
            // Upload selfie logic here if needed, for now just update verification status
            const user = await User.me();
            const profiles = await Profile.filter({ user_id: user.id });
            if (profiles.length > 0) {
                await Profile.update(profiles[0].id, { is_verified: true });
            }
            setStep(5);
        } catch (e) {
            console.error(e);
        }
        setIsLoading(false);
    };

    const StepContent = () => {
        switch (step) {
            case 1:
                return (
                    <div className="text-center space-y-6">
                        <div className="bg-orange-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto">
                            <Shield className="w-12 h-12 text-[--theme-orange]" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 mb-2">בוא נאמת את הפרופיל שלך</h2>
                            <p className="text-gray-500 px-4">
                                קהילה בטוחה היא קהילה טובה. אמת את הפרופיל שלך כדי לקבל תג "מאומת" ולהגדיל את הסיכויים שלך למצוא שותפים.
                            </p>
                        </div>
                        <ul className="text-right space-y-4 bg-gray-50 p-6 rounded-2xl">
                            <li className="flex items-center gap-3">
                                <div className="bg-white p-2 rounded-full shadow-sm"><Smartphone className="w-5 h-5 text-gray-700"/></div>
                                <span className="font-bold text-gray-700">אימות מספר טלפון</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="bg-white p-2 rounded-full shadow-sm"><Camera className="w-5 h-5 text-gray-700"/></div>
                                <span className="font-bold text-gray-700">אימות פנים (סלפי)</span>
                            </li>
                        </ul>
                        <Button onClick={() => setStep(2)} className="w-full h-12 rounded-full gradient-orange text-white font-bold text-lg shadow-lg">
                            מתחילים
                        </Button>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h2 className="text-2xl font-black text-gray-900 mb-2">מה הטלפון שלך?</h2>
                            <p className="text-gray-500">נשלח לך קוד אימות ב-SMS</p>
                        </div>
                        <Input 
                            value={phone} 
                            onChange={(e) => setPhone(e.target.value)} 
                            placeholder="050-0000000" 
                            className="text-center text-2xl h-16 tracking-widest bg-gray-50 border-gray-200"
                            autoFocus
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]*"
                        />
                        <Button 
                            onClick={handlePhoneSubmit} 
                            disabled={phone.length < 9 || isLoading}
                            className="w-full h-12 rounded-full gradient-orange text-white font-bold text-lg shadow-lg"
                        >
                            {isLoading ? <Loader2 className="animate-spin"/> : 'שלח קוד'}
                        </Button>
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h2 className="text-2xl font-black text-gray-900 mb-2">הזן את הקוד</h2>
                            <p className="text-gray-500">שלחנו קוד ל-{phone}</p>
                        </div>
                        <div className="flex justify-center gap-4" dir="ltr">
                            {otp.map((digit, i) => (
                                <Input
                                    key={i}
                                    id={`otp-${i}`}
                                    value={digit}
                                    onChange={(e) => handleOtpChange(i, e.target.value)}
                                    className="w-14 h-16 text-center text-2xl font-bold bg-gray-50 border-gray-200"
                                    maxLength={1}
                                    type="tel"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                />
                            ))}
                        </div>
                        <Button 
                            onClick={handleOtpSubmit} 
                            disabled={otp.join('').length !== 4 || isLoading}
                            className="w-full h-12 rounded-full gradient-orange text-white font-bold text-lg shadow-lg"
                        >
                            {isLoading ? <Loader2 className="animate-spin"/> : 'אמת'}
                        </Button>
                    </div>
                );
            case 4:
                return (
                    <div className="space-y-6 text-center">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 mb-2">רק מוודאים שזה את/ה</h2>
                            <p className="text-gray-500">צלם/י סלפי קצר כדי שנשווה לתמונות הפרופיל</p>
                        </div>

                        <div className="relative w-64 h-64 mx-auto bg-gray-100 rounded-full overflow-hidden border-4 border-[--theme-orange]">
                            {selfie ? (
                                <img src={selfie} alt="Selfie" className="w-full h-full object-cover transform scale-x-[-1]" />
                            ) : isCameraOpen ? (
                                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Camera className="w-16 h-16 text-gray-300" />
                                </div>
                            )}
                            <canvas ref={canvasRef} width="300" height="300" className="hidden" />
                        </div>

                        {!isCameraOpen && !selfie && (
                             <Button onClick={startCamera} className="w-full h-12 rounded-full bg-gray-900 text-white font-bold">
                                פתח מצלמה
                             </Button>
                        )}
                        
                        {isCameraOpen && (
                             <Button onClick={takePhoto} className="w-full h-12 rounded-full gradient-orange text-white font-bold">
                                צלם
                             </Button>
                        )}

                        {selfie && (
                            <div className="space-y-3">
                                 <Button onClick={handleFinalSubmit} disabled={isLoading} className="w-full h-12 rounded-full gradient-orange text-white font-bold shadow-lg">
                                    {isLoading ? <Loader2 className="animate-spin"/> : 'זה אני, סיים אימות'}
                                 </Button>
                                 <Button variant="ghost" onClick={() => { setSelfie(null); setIsCameraOpen(false); }} className="text-gray-500">
                                     צלם שוב
                                 </Button>
                            </div>
                        )}
                    </div>
                );
            case 5:
                return (
                    <div className="text-center space-y-6 pt-10">
                         <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                             <Check className="w-12 h-12 text-green-600" />
                         </div>
                         <h2 className="text-3xl font-black text-gray-900">הפרופיל אומת!</h2>
                         <p className="text-gray-500">תודה ששמרת על הקהילה שלנו בטוחה.</p>
                         <Button onClick={() => navigate(createPageUrl('Profile'))} className="w-full h-12 rounded-full gradient-orange text-white font-bold shadow-lg mt-8">
                             חזרה לפרופיל
                         </Button>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-white p-6 pb-24" dir="rtl">
            <div className="flex items-center mb-8">
                {step > 1 && step < 5 && (
                    <button onClick={() => setStep(step - 1)}>
                        <ArrowRight className="w-6 h-6 text-gray-600" />
                    </button>
                )}
                {step === 1 && (
                     <button onClick={() => navigate(createPageUrl('Profile'))}>
                        <ArrowRight className="w-6 h-6 text-gray-600" />
                    </button>
                )}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="max-w-md mx-auto"
                >
                    <StepContent />
                </motion.div>
            </AnimatePresence>
        </div>
    );
}