import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { createPageUrl } from '@/utils';

export default function LandingPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [showDesktopMessage, setShowDesktopMessage] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleAction = () => {
      if (isMobile) {
        // כאן הקסם: הפניה לדף ה-Onboarding הקיים שלך
        window.location.href = createPageUrl('OnboardingPage');
      } else {
        setShowDesktopMessage(true);
      }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 overflow-x-hidden" dir="rtl">
      
      {/* מודל למחשב */}
      <AnimatePresence>
        {showDesktopMessage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowDesktopMessage(false)}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl relative"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Smartphone className="w-8 h-8 text-[--theme-orange]" />
              </div>
              <h3 className="text-2xl font-black mb-2">ההרשמה דרך הנייד בלבד</h3>
              <p className="text-gray-500 mb-8 leading-relaxed text-lg">
                כדי להבטיח חוויית שימוש מושלמת, תהליך ההרשמה והשימוש באפליקציה זמינים כרגע דרך הטלפון הנייד בלבד.
                <br/><br/>
                מוזמנים להיכנס ל-<strong>Roomi.me</strong> דרך הנייד!
              </p>
              <Button onClick={() => setShowDesktopMessage(false)} className="w-full rounded-full gradient-orange text-white font-bold h-12">
                הבנתי, תודה
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
             <h1 className="text-3xl font-black text-[--theme-orange] font-[Pacifico]">Roomi</h1>
          </div>
          <nav className="hidden md:flex gap-8 font-medium text-gray-600">
            <button onClick={() => scrollToSection('about')} className="hover:text-[--theme-orange] transition-colors">הסיפור שלנו</button>
            <button onClick={() => scrollToSection('how-it-works')} className="hover:text-[--theme-orange] transition-colors">איך זה עובד</button>
          </nav>
          <Button onClick={handleAction} className="rounded-full gradient-orange text-white font-bold px-6 shadow-lg hover:shadow-orange-200 hover:scale-105 transition-all">
            {isMobile ? "כניסה / הרשמה" : "התחברות מהנייד"}
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <div className="pt-20 pb-10 text-center px-4">
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-6">
            למצוא שותפים <span className="text-[--theme-orange]">בדיוק</span> כמוך
          </h1>
          <p className="text-xl text-gray-500 mb-8 max-w-2xl mx-auto">
            האפליקציה החכמה למציאת שותפים לדירה.
          </p>
          <Button onClick={handleAction} className="h-14 px-8 rounded-full text-xl gradient-orange text-white font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all">
            {isMobile ? "בואו נתחיל!" : "סרוק כדי להוריד"}
          </Button>
      </div>
    </div>
  );
}