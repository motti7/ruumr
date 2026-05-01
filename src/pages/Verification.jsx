import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Profile } from "@/entities/Profile";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowRight, RefreshCw, Sparkles, Award } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { syncCurrentProfileToRuumrPlus } from "@/api/ruumrPlus";

export default function VerificationPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email Input, 2: Code Input, 3: Success
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState(null);
  
  // Load user email on mount
  useEffect(() => {
      const loadUser = async () => {
          try {
              const u = await User.me();
              if (u && u.email) setEmail(u.email);
          } catch(e) {}
      };
      loadUser();
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

  const verifyCode = async () => {
    setIsLoading(true);
    const inputCode = code.join("");
    
    if (inputCode === generatedCode || inputCode === "11111") { // Backdoor for testing
      try {
        const user = await User.me();
        const profiles = await Profile.filter({ user_id: user.id });
        if (profiles.length > 0) {
            await Profile.update(profiles[0].id, { is_verified: true });
        }
        try {
          await syncCurrentProfileToRuumrPlus();
        } catch (syncError) {
          console.error("Failed to sync verification update to Ruumr Plus:", syncError);
        }
        setStep(3);
        setTimeout(() => {
            navigate(createPageUrl("Discover"));
        }, 2000);
      } catch (error) {
        console.error(error);
      }
    } else {
      alert("קוד שגוי");
    }
    setIsLoading(false);
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
                    animate={{ width: step === 1 ? "33%" : step === 2 ? "66%" : "100%" }}
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
                            <motion.div 
                                className="relative w-32 h-32"
                                animate={{ 
                                    rotate: [0, 5, -5, 0],
                                    y: [0, -10, 0]
                                }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            >
                                {/* Main envelope */}
                                <div className="w-full h-full bg-gradient-to-br from-[--theme-orange] via-orange-500 to-red-500 rounded-3xl shadow-2xl flex items-center justify-center relative overflow-hidden">
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.3)_0%,transparent_60%)]"></div>
                                    <Mail className="w-14 h-14 text-white relative z-10" strokeWidth={2.5} />
                                    
                                    {/* Shine effect */}
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-tr from-transparent via-white to-transparent opacity-20"
                                        animate={{ x: ['-200%', '200%'] }}
                                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                                    />
                                </div>
                                
                                {/* Flying sparkles */}
                                {[0, 1, 2].map((i) => (
                                    <motion.div
                                        key={i}
                                        className="absolute"
                                        initial={{ 
                                            x: 64, 
                                            y: 64,
                                            scale: 0,
                                            opacity: 0
                                        }}
                                        animate={{
                                            x: [64, 64 + Math.cos((i * 120 * Math.PI) / 180) * 60],
                                            y: [64, 64 + Math.sin((i * 120 * Math.PI) / 180) * 60],
                                            scale: [0, 1, 0],
                                            opacity: [0, 1, 0]
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            delay: i * 0.4,
                                            ease: "easeOut"
                                        }}
                                    >
                                        <Sparkles className="w-5 h-5 text-yellow-400" />
                                    </motion.div>
                                ))}
                                
                                {/* Pulse ring */}
                                <motion.div 
                                    className="absolute inset-0 border-4 border-[--theme-orange] rounded-3xl"
                                    animate={{ 
                                        opacity: [0.3, 0], 
                                        scale: [1, 1.2] 
                                    }}
                                    transition={{ 
                                        duration: 1.5, 
                                        repeat: Infinity,
                                        ease: "easeOut"
                                    }}
                                />
                            </motion.div>
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
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-full text-center flex flex-col items-center justify-center pt-10"
                    >
                         <div className="relative w-32 h-32 mb-6">
                            {/* Main Badge */}
                            <motion.div 
                                initial={{ scale: 0, rotate: -180 }} 
                                animate={{ scale: 1, rotate: 0 }} 
                                transition={{ type: "spring", stiffness: 150, delay: 0.1 }}
                                className="w-full h-full bg-gradient-to-br from-[--theme-orange] via-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.3)_0%,transparent_60%)]"></div>
                                <Award className="w-16 h-16 text-white relative z-10" strokeWidth={2.5} />
                                
                                {/* Shine effect */}
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-tr from-transparent via-white to-transparent opacity-20"
                                    animate={{ x: ['-200%', '200%'] }}
                                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                                />
                            </motion.div>
                            
                            {/* Orbiting particles */}
                            {[0, 1, 2].map((i) => (
                                <motion.div
                                    key={i}
                                    className="absolute w-3 h-3 bg-yellow-400 rounded-full"
                                    style={{
                                        top: '50%',
                                        left: '50%',
                                        marginTop: '-6px',
                                        marginLeft: '-6px'
                                    }}
                                    animate={{
                                        x: [0, Math.cos((i * 120 * Math.PI) / 180) * 70],
                                        y: [0, Math.sin((i * 120 * Math.PI) / 180) * 70],
                                        scale: [0, 1, 0],
                                        opacity: [0, 1, 0]
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        delay: i * 0.3,
                                        ease: "easeOut"
                                    }}
                                />
                            ))}
                            
                            {/* Pulse rings */}
                            <motion.div 
                                className="absolute inset-0 border-4 border-[--theme-orange] rounded-full"
                                animate={{ opacity: [0.5, 0], scale: [1, 1.4] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                            />
                            <motion.div 
                                className="absolute inset-0 border-4 border-pink-500 rounded-full"
                                animate={{ opacity: [0.5, 0], scale: [1, 1.4] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.75 }}
                            />
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 mb-2">החשבון אומת!</h1>
                        <p className="text-gray-500 text-lg">ברוכים הבאים לקהילה הרשמית.</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    </div>
  );
}
