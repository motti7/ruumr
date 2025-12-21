import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Smartphone, Music, Heart, MapPin, Camera, Coffee, Sparkles, Zap, Users, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [showDesktopModal, setShowDesktopModal] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: "smooth" });
  };

  const handleStart = () => {
    if (isMobile) {
      // On mobile: Go directly to Onboarding (which will trigger login if needed)
      window.location.href = createPageUrl('Onboarding');
    } else {
      // On desktop: Show QR code
      setShowDesktopModal(true);
    }
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-orange-100" dir="rtl">
      
      {/* Desktop Modal for QR Code */}
      {showDesktopModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowDesktopModal(false)}>
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowDesktopModal(false)} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors">
                <ArrowLeft className="w-6 h-6 text-gray-500" />
            </button>
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Smartphone className="w-8 h-8 text-[--theme-orange]" />
            </div>
            <h3 className="text-2xl font-black mb-2 text-gray-800">החוויה המלאה בנייד</h3>
            <p className="text-gray-500 mb-8 leading-relaxed">
              סרקו את הקוד כדי להירשם ולהתחיל למצוא שותפים ב-Roomi
            </p>
            <div className="bg-gray-50 p-4 rounded-2xl border-2 border-dashed border-gray-200 inline-block mb-4">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(window.location.origin + createPageUrl('Onboarding'))}`} 
                alt="Scan to start" 
                className="w-40 h-40 mix-blend-multiply"
              />
            </div>
            <p className="text-sm font-bold text-[--theme-orange] animate-pulse">סרוק אותי!</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2" onClick={() => window.location.reload()}>
             <div className="w-10 h-10 bg-[--theme-orange] rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
                <span className="text-white font-black text-xl">R</span>
             </div>
             <span className="text-2xl font-black tracking-tight text-gray-900">Roomi</span>
          </div>
          
          <div className="flex items-center gap-6">
             <nav className="hidden md:flex items-center gap-8 font-medium text-gray-500">
                <button onClick={() => scrollToSection('features')} className="hover:text-[--theme-orange] transition-colors">איך זה עובד</button>
                <button onClick={() => scrollToSection('story')} className="hover:text-[--theme-orange] transition-colors">הסיפור שלנו</button>
             </nav>
             <Button 
                onClick={handleStart}
                className="rounded-full px-6 py-5 font-bold shadow-lg shadow-orange-100 gradient-orange text-white hover:brightness-110 transition-all"
             >
                הרשמה
             </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-100 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 opacity-60"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-100 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 opacity-60"></div>

        <div className="container mx-auto px-6 relative z-10 text-center">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 border border-orange-100 text-[--theme-orange] font-bold text-sm mb-8"
            >
                <Sparkles className="w-4 h-4" />
                <span>הדרך החדשה למצוא שותפים</span>
            </motion.div>
            
            <motion.h1 
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              className="text-5xl md:text-7xl font-black text-gray-900 mb-8 leading-[1.1] tracking-tight"
            >
              למצוא שותפים<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[--theme-orange] to-orange-500">שפשוט כיף איתם</span>
            </motion.h1>

            <motion.p 
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.2 }}
              className="text-xl md:text-2xl text-gray-500 mb-12 max-w-2xl mx-auto leading-relaxed"
            >
              חיבור פשוט וטבעי מבוסס על הווייב, סגנון החיים, דת, גיל ומיקום.
              <br/>
              פשוט תהיו אתם - זה הכי טוב.
            </motion.p>

            <motion.div 
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
                <Button 
                  onClick={handleStart}
                  className="w-full sm:w-auto px-10 py-7 text-xl rounded-full font-black shadow-xl shadow-orange-200 gradient-orange text-white hover:scale-105 transition-transform"
                >
                  בואו נתחיל
                  <ArrowLeft className="mr-2 w-6 h-6" />
                </Button>
            </motion.div>

            {/* Floating Avatars Animation */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="mt-20 flex justify-center -space-x-4 space-x-reverse"
            >
                {[1,2,3,4,5].map((i) => (
                    <div key={i} className="w-14 h-14 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-200">
                        <img src={`https://i.pravatar.cc/150?img=${10+i}`} alt="User" className="w-full h-full object-cover" />
                    </div>
                ))}
                <div className="w-14 h-14 rounded-full border-4 border-white shadow-lg bg-gray-900 text-white flex items-center justify-center font-bold text-sm z-10">
                    +2K
                </div>
            </motion.div>
            <p className="mt-4 text-gray-400 font-medium">הצטרפו לאלפי שותפים שכבר מצאו בית</p>
        </div>
      </section>

      {/* Features Grid (Bento Box) */}
      <section id="features" className="py-24 bg-gray-50/50">
          <div className="container mx-auto px-6">
              <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-5xl font-black mb-4">בדיוק מה שחשוב</h2>
                  <p className="text-gray-500 text-xl max-w-xl mx-auto">בלי שאלונים מתישים. אנחנו מתמקדים במה שבאמת משפיע על החיים המשותפים.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                  {/* 1. Vibe - Large */}
                  <div className="md:col-span-2 bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-gray-100/50 flex flex-col md:flex-row items-center gap-8 overflow-hidden relative group hover:border-[--theme-orange] transition-colors">
                      <div className="relative z-10 flex-1 text-center md:text-right">
                          <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-6 mx-auto md:mx-0">
                              <Zap className="w-7 h-7 text-purple-600" />
                          </div>
                          <h3 className="text-2xl font-black mb-3">הווייב שלך</h3>
                          <p className="text-gray-500 text-lg leading-relaxed">
                              שקט וביתי או מסיבות ורעש? אנחנו מחברים ביניכם לפי האנרגיה בבית.
                          </p>
                      </div>
                      <div className="flex-1 relative h-48 w-full">
                           <div className="absolute inset-0 bg-gradient-to-tr from-purple-500 to-indigo-500 rounded-2xl rotate-3 opacity-90 group-hover:rotate-6 transition-transform duration-500 flex items-center justify-center">
                                <span className="text-white font-black text-2xl">VIBE CHECK</span>
                           </div>
                      </div>
                  </div>

                  {/* 2. Lifestyle */}
                  <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-gray-100/50 hover:border-[--theme-orange] transition-colors">
                      <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
                          <Coffee className="w-7 h-7 text-green-600" />
                      </div>
                      <h3 className="text-2xl font-black mb-3">לייף סטייל</h3>
                      <p className="text-gray-500">
                          כשרות, שבת, ניקיון וחיות מחמד. כל הדברים הקטנים שעושים בית.
                      </p>
                  </div>

                  {/* 3. Photos */}
                  <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-gray-100/50 hover:border-[--theme-orange] transition-colors">
                      <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                          <Camera className="w-7 h-7 text-blue-600" />
                      </div>
                      <h3 className="text-2xl font-black mb-3">תמונות ומיקום</h3>
                      <p className="text-gray-500">
                          לראות את הבנאדם, לראות את הדירה. הכי פשוט, הכי ברור.
                      </p>
                  </div>

                  {/* 4. Music - Large */}
                  <div className="md:col-span-2 bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-gray-100/50 flex flex-col md:flex-row-reverse items-center gap-8 overflow-hidden relative group hover:border-[--theme-orange] transition-colors">
                      <div className="relative z-10 flex-1 text-center md:text-right">
                          <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mb-6 mx-auto md:mx-0">
                              <Music className="w-7 h-7 text-red-600" />
                          </div>
                          <h3 className="text-2xl font-black mb-3">הפסקול של הבית</h3>
                          <p className="text-gray-500 text-lg leading-relaxed">
                              שתפו את השיר שהכי מגדיר אתכם. כי אין כמו מוזיקה טובה כדי לשבור את הקרח.
                          </p>
                      </div>
                      <div className="flex-1 relative flex justify-center">
                           <div className="w-40 h-40 bg-gray-900 rounded-full border-4 border-gray-800 shadow-2xl flex items-center justify-center animate-[spin_10s_linear_infinite]">
                                <div className="w-16 h-16 bg-red-500 rounded-full border-4 border-red-400"></div>
                           </div>
                           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white font-bold text-xs bg-black/50 px-2 py-1 rounded backdrop-blur-sm">
                               Now Playing
                           </div>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="container mx-auto px-6 text-center">
           <div className="w-12 h-12 bg-[--theme-orange] rounded-xl flex items-center justify-center shadow-lg shadow-orange-200 mx-auto mb-6">
              <span className="text-white font-black text-2xl">R</span>
           </div>
           <p className="text-gray-400 text-sm mb-8">© 2024 Roomi. כל הזכויות שמורות.</p>
           <div className="flex justify-center gap-6 text-sm font-medium text-gray-500">
             <Link to={createPageUrl("Terms")} className="hover:text-[--theme-orange]">תנאי שימוש</Link>
             <Link to={createPageUrl("Privacy")} className="hover:text-[--theme-orange]">פרטיות</Link>
             <a href="mailto:support@roomi.me" className="hover:text-[--theme-orange]">צור קשר</a>
           </div>
        </div>
      </footer>
    </div>
  );
}