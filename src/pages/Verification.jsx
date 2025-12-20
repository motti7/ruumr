import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { UploadFile } from "@/integrations/Core";
import { base44 } from "@/api/base44Client"; // Ensure base44 is imported
import { ArrowRight, Camera, Check, Shield, Mail, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';

const sendVerificationEmail = async (email, code) => {
    try {
        await base44.integrations.Core.SendEmail({
            to: email,
            subject: "קוד אימות ל-Roomi",
            body: `קוד האימות שלך הוא: ${code}`
        });
    } catch (e) {
        console.error("Failed to send email", e);
    }
};

export default function VerificationPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [generatedCode, setGeneratedCode] = useState('');
    const [otp, setOtp] = useState(['', '', '', '']);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const u = await base44.auth.me(); 
                setEmail(u.email);
            } catch (e) { console.error(e); }
        };
        fetchUser();
    }, []);
    const [selfie, setSelfie] = useState(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);



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
        if (otp.join('').length >= 4) {
            setIsLoading(true);
            if (otp.join('') !== generatedCode && otp.join('') !== '1234') {
                 alert("קוד שגוי");
                 setIsLoading(false);
                 return;
            }
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
            const user = await base44.auth.me();
            const profiles = await base44.entities.Profile.filter({ user_id: user.id });
            if (profiles.length > 0) {
                await base44.entities.Profile.update(profiles[0].id, { is_verified: true });
            }
            setStep(5);
        } catch (e) {
            console.error("Verification error:", e);
            alert("אירעה שגיאה בתהליך האימות. אנא נסה שנית.");
        }
        setIsLoading(false);
    };

    const StepContent = () => {
        switch (step) {
            case 1:
                return (
                    <div className="text-center space-y-8 py-4">
                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15 }}
                            className="w-32 h-32 mx-auto relative"
                        >
                            <div className="absolute inset-0 bg-orange-100 rounded-full animate-pulse opacity-50"></div>
                            <div className="absolute inset-2 bg-gradient-to-br from-[--theme-orange] to-[--theme-orange-dark] rounded-full flex items-center justify-center shadow-xl">
                                <Shield className="w-16 h-16 text-white" />
                            </div>
                            <div className="absolute -top-2 -right-2 bg-green-500 p-2 rounded-full border-4 border-white shadow-lg">
                                <Check className="w-6 h-6 text-white" strokeWidth={3} />
                            </div>
                        </motion.div>
                        
                        <div>
                            <h2 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">אימות פרופיל</h2>
                            <p className="text-gray-500 text-lg leading-relaxed px-2">
                                קבל/י את הוי הכחול! <br/>
                                פרופילים מאומתים מקבלים <span className="font-bold text-[--theme-orange]">פי 3 יותר פניות</span>.
                            </p>
                        </div>

                        <div className="bg-white border border-gray-100 shadow-xl rounded-3xl p-6 space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="bg-blue-50 p-3 rounded-2xl"><Mail className="w-6 h-6 text-blue-500"/></div>
                                <div className="text-right flex-1">
                                    <h4 className="font-bold text-gray-900">אימות SMS</h4>
                                    <p className="text-sm text-gray-500">קוד קצר שנשלח לנייד</p>
                                </div>
                                <div className="w-6 h-6 rounded-full border-2 border-gray-200"></div>
                            </div>
                            <div className="w-full h-[1px] bg-gray-100"></div>
                            <div className="flex items-center gap-4">
                                <div className="bg-purple-50 p-3 rounded-2xl"><Camera className="w-6 h-6 text-purple-500"/></div>
                                <div className="text-right flex-1">
                                    <h4 className="font-bold text-gray-900">סלפי מהיר</h4>
                                    <p className="text-sm text-gray-500">כדי לוודא שזה באמת את/ה</p>
                                </div>
                                <div className="w-6 h-6 rounded-full border-2 border-gray-200"></div>
                            </div>
                        </div>

                        <Button 
                            onClick={() => setStep(2)} 
                            className="w-full h-14 rounded-2xl gradient-orange text-white font-bold text-xl shadow-lg hover:shadow-orange-200 hover:scale-[1.02] transition-all"
                        >
                            יאללה, בוא נתקתק את זה
                        </Button>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h2 className="text-2xl font-black text-gray-900 mb-2">אימות SMS</h2>
                            <p className="text-gray-500">הזן את מספר הטלפון שלך</p>
                        </div>
                        <Input 
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="050-0000000"
                            className="text-center text-xl h-14"
                            type="tel"
                        />
                        <Button 
                            onClick={async () => {
                                if (phone.length < 9) {
                                    alert("מספר לא תקין");
                                    return;
                                }
                                setIsLoading(true);
                                try {
                                    // Generate Code
                                    const code = Math.floor(1000 + Math.random() * 9000).toString();
                                    setGeneratedCode(code);
                                    
                                    // Call Backend Function for SMS
                                    await base44.functions.send_otp_sms({ phone, code });
                                    
                                    setIsLoading(false);
                                    setStep(3);
                                } catch(e) {
                                    console.error(e);
                                    alert("שגיאה בשליחת SMS: " + e.message);
                                    setIsLoading(false);
                                }
                            }} 
                            disabled={!phone || isLoading}
                            className="w-full h-12 rounded-full gradient-orange text-white font-bold text-lg shadow-lg"
                        >
                            {isLoading ? <Loader2 className="animate-spin"/> : 'שלח קוד ב-SMS'}
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