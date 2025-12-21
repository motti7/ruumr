import React, { useState, useEffect, useRef } from "react";
import { User } from "@/entities/User";
import { Profile } from "@/entities/Profile";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowRight, Check, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";

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
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-full text-center flex flex-col items-center justify-center pt-10"
                    >
                         <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center mb-6 relative">
                            <motion.div 
                                initial={{ scale: 0 }} 
                                animate={{ scale: 1 }} 
                                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                            >
                                <ShieldCheck className="w-16 h-16 text-green-500" />
                            </motion.div>
                            <motion.div 
                                className="absolute inset-0 border-4 border-green-500 rounded-full"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: [0, 1, 0], scale: 1.2 }}
                                transition={{ duration: 1.5, repeat: Infinity }}
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