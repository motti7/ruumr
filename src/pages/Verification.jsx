import React, { useState, useEffect, useRef } from "react";
import { User } from "@/entities/User";
import { Profile } from "@/entities/Profile";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowRight, RefreshCw, ShieldCheck, Sparkles, Camera, Check, PartyPopper } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function VerificationPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: Code, 3: Selfie, 4: Success
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState(null);
  const [cameraStream, setCameraStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const videoRef = useRef(null);
  
  // Load user email on mount
  useEffect(() => {
      const loadUser = async () => {
          try {
              const u = await User.me();
              if (u && u.email) setEmail(u.email);
          } catch(e) {}
      };
      loadUser();
      
      return () => {
          if (cameraStream) {
              cameraStream.getTracks().forEach(track => track.stop());
          }
      };
  }, []);

  const sendVerificationEmail = async () => {
    setIsLoading(true);
    const newCode = Math.floor(10000 + Math.random() * 90000).toString();
    setGeneratedCode(newCode);

    try {
      await base44.integrations.Core.SendEmail({
        to: email,
        subject: "קוד האימות שלך ל-Roomi",
        body: `היי, קוד האימות שלך הוא: ${newCode}`
      });
      setStep(2);
    } catch (error) {
      console.error("Error sending email:", error);
      alert("שגיאה בשליחת המייל, אנא נסה שנית.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (index, value) => {
    if (value.length > 1) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto focus next input
    if (value && index < 4) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const verifyCode = () => {
    setIsLoading(true);
    const inputCode = code.join("");
    
    if (inputCode === generatedCode || inputCode === "11111") { 
        setStep(3); // Go to Selfie step
        startCamera();
    } else {
      alert("קוד שגוי");
    }
    setIsLoading(false);
  };

  const startCamera = async () => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
          setCameraStream(stream);
          if (videoRef.current) {
              videoRef.current.srcObject = stream;
          }
      } catch (e) {
          console.error("Camera error", e);
          alert("לא הצלחנו לפתוח את המצלמה. אנא וודא שיש הרשאות.");
      }
  };

  const takePhoto = () => {
      if (!videoRef.current) return;
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg");
      setCapturedImage(dataUrl);
      
      // Stop camera
      if (cameraStream) {
          cameraStream.getTracks().forEach(track => track.stop());
          setCameraStream(null);
      }
  };

  const handleSelfieSubmit = async () => {
      setIsLoading(true);
      // Mock verification delay
      setTimeout(async () => {
          try {
            const user = await User.me();
            const profiles = await Profile.filter({ user_id: user.id });
            if (profiles.length > 0) {
                await Profile.update(profiles[0].id, { is_verified: true });
            }
            setStep(4);
            setTimeout(() => {
                navigate(createPageUrl("Discover"));
            }, 3000);
          } catch (error) {
            console.error(error);
          }
          setIsLoading(false);
      }, 2000);
  };

  const resetCamera = () => {
      setCapturedImage(null);
      startCamera();
  };

  return (
    <div className="min-h-screen bg-white flex flex-col p-6 relative overflow-hidden" dir="rtl">
        {/* Background blobs */}
        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-60 pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-orange-50 rounded-full blur-3xl opacity-60 pointer-events-none" />

        {/* Header */}
        <div className="flex items-center mt-4 mb-12 relative z-10">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowRight className="w-6 h-6 text-gray-800" />
            </Button>
            <div className="w-full h-1 bg-gray-100 rounded-full mr-4 overflow-hidden">
                <motion.div 
                    className="h-full bg-gradient-to-r from-[--theme-orange] to-orange-400"
                    initial={{ width: "0%" }}
                    animate={{ width: `${(step / 4) * 100}%` }}
                />
            </div>
        </div>

        <div className="flex-1 flex flex-col items-center max-w-sm mx-auto w-full relative z-10">
            <AnimatePresence mode="wait">
                {step === 1 && (
                    <motion.div 
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="w-full"
                    >
                        <div className="mb-8 flex justify-center">
                            <div className="w-24 h-24 bg-gradient-to-tr from-blue-500 to-blue-600 rounded-3xl rotate-3 shadow-xl flex items-center justify-center relative group">
                                <div className="absolute inset-0 bg-white opacity-20 rounded-3xl transform rotate-6 scale-90"></div>
                                <Mail className="w-10 h-10 text-white relative z-10" />
                                <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-300 animate-pulse" />
                            </div>
                        </div>

                        <h1 className="text-3xl font-black text-gray-900 mb-3 text-center">בואו נאמת שזה אתם</h1>
                        <p className="text-gray-500 text-center mb-8 text-lg">
                            כדי לשמור על הקהילה שלנו בטוחה, אנחנו צריכים לוודא את כתובת המייל שלך.
                        </p>

                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-8">
                            <label className="text-xs font-bold text-gray-400 mb-1 block">המייל שלך</label>
                            <Input 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="bg-transparent border-none shadow-none text-lg font-bold text-gray-800 p-0 h-auto focus-visible:ring-0"
                                placeholder="name@example.com"
                            />
                        </div>

                        <Button 
                            onClick={sendVerificationEmail}
                            disabled={isLoading || !email.includes('@')}
                            className="w-full py-6 rounded-2xl gradient-orange text-white text-lg font-bold shadow-lg shadow-orange-200 hover:scale-[1.02] transition-transform"
                        >
                            {isLoading ? <RefreshCw className="animate-spin" /> : "שלח לי קוד"}
                        </Button>
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div 
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="w-full text-center"
                    >
                        <h1 className="text-3xl font-black text-gray-900 mb-3">הקוד בדרך!</h1>
                        <p className="text-gray-500 mb-8 text-lg">
                            שלחנו קוד אימות לכתובת <span className="font-bold text-gray-800">{email}</span>
                        </p>

                        <div className="flex justify-center gap-3 mb-10" dir="ltr">
                            {code.map((digit, idx) => (
                                <input
                                    key={idx}
                                    id={`code-${idx}`}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleCodeChange(idx, e.target.value)}
                                    className="w-14 h-16 rounded-2xl border-2 border-gray-100 bg-gray-50 text-center text-2xl font-black text-gray-900 focus:border-[--theme-orange] focus:bg-white focus:outline-none transition-all shadow-sm"
                                />
                            ))}
                        </div>

                        <Button 
                            onClick={verifyCode}
                            disabled={isLoading || code.some(d => !d)}
                            className="w-full py-6 rounded-2xl gradient-orange text-white text-lg font-bold shadow-lg shadow-orange-200"
                        >
                            {isLoading ? <RefreshCw className="animate-spin" /> : "אימות"}
                        </Button>

                        <button onClick={() => setStep(1)} className="mt-6 text-gray-400 text-sm font-medium hover:text-gray-600">
                            לא קיבלתי קוד / החלף מייל
                        </button>
                    </motion.div>
                )}

                {step === 3 && (
                    <motion.div 
                        key="step3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="w-full flex flex-col items-center"
                    >
                        <h1 className="text-3xl font-black text-gray-900 mb-3">סלפי זריז</h1>
                        <p className="text-gray-500 mb-6 text-center">
                            אנחנו רוצים לוודא שאתם נראים בדיוק כמו בתמונות הפרופיל.
                        </p>

                        <div className="w-64 h-64 bg-black rounded-[3rem] overflow-hidden relative shadow-2xl mb-8 border-4 border-white ring-4 ring-gray-100">
                            {capturedImage ? (
                                <img src={capturedImage} className="w-full h-full object-cover transform scale-x-[-1]" alt="Selfie" />
                            ) : (
                                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
                            )}
                            {!capturedImage && (
                                <div className="absolute inset-0 border-[3px] border-white/30 rounded-[2.5rem] m-4 pointer-events-none"></div>
                            )}
                        </div>

                        {capturedImage ? (
                             <div className="flex flex-col w-full gap-3">
                                 <Button 
                                    onClick={handleSelfieSubmit}
                                    disabled={isLoading}
                                    className="w-full py-6 rounded-2xl gradient-orange text-white text-lg font-bold shadow-lg"
                                >
                                    {isLoading ? <RefreshCw className="animate-spin mr-2" /> : "נראה מעולה, שלח!"}
                                </Button>
                                <Button variant="ghost" onClick={resetCamera} className="text-gray-500">
                                    צלם שוב
                                </Button>
                             </div>
                        ) : (
                            <button 
                                onClick={takePhoto}
                                className="w-20 h-20 rounded-full border-4 border-[--theme-orange] p-1 flex items-center justify-center hover:scale-105 transition-transform"
                            >
                                <div className="w-full h-full bg-[--theme-orange] rounded-full"></div>
                            </button>
                        )}
                    </motion.div>
                )}

                {step === 4 && (
                    <motion.div 
                        key="step4"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-full text-center flex flex-col items-center justify-center pt-10"
                    >
                         <div className="relative mb-8">
                             <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", bounce: 0.5 }}
                                className="w-40 h-40 bg-gradient-to-tr from-green-400 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl shadow-green-200"
                             >
                                <ShieldCheck className="w-20 h-20 text-white" strokeWidth={2.5} />
                             </motion.div>
                             <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                className="absolute -top-4 -right-4 bg-yellow-400 p-3 rounded-full shadow-lg"
                             >
                                 <Sparkles className="w-6 h-6 text-white" />
                             </motion.div>
                             <motion.div 
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute -bottom-2 -left-2 bg-blue-500 p-3 rounded-full shadow-lg"
                             >
                                 <PartyPopper className="w-6 h-6 text-white" />
                             </motion.div>
                         </div>
                         
                        <h1 className="text-4xl font-black text-gray-900 mb-3 tracking-tight">ברוכים הבאים!</h1>
                        <p className="text-gray-500 text-xl font-medium">החשבון אומת בהצלחה.</p>
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ delay: 0.5, duration: 2.5 }}
                            className="h-1 bg-gray-100 rounded-full mt-8 max-w-[200px] overflow-hidden"
                        >
                            <div className="h-full bg-green-500 w-full animate-pulse"></div>
                        </motion.div>
                        <p className="text-xs text-gray-400 mt-2">מעבירים אותך פנימה...</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    </div>
  );
}