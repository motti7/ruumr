import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Users, Zap, Heart, Smartphone, Globe, Play, QrCode, MessageCircle, CheckCircle, Music } from 'lucide-react';
import { base44 } from "@/api/base44Client";
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
      // Redirect to Onboarding
      window.location.href = createPageUrl('Onboarding');
    } else {
      setShowDesktopMessage(true);
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 overflow-x-hidden" dir="rtl">
      
      {/* Desktop Message Modal */}
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
              <h3 className="text-2xl font-black mb-2">Roomi מותאמת לנייד!</h3>
              <p className="text-gray-500 mb-6 leading-relaxed">
                כדי ליהנות מהחוויה המלאה, אנחנו ממליצים לפתוח את האפליקציה מהטלפון הנייד.
              </p>
              
              <div className="bg-gray-100 p-4 rounded-xl mb-6 inline-block">
                 <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.origin)}`} alt="QR" className="w-32 h-32 mix-blend-multiply" />
              </div>
              <p className="text-sm font-bold text-gray-400 mb-6">סרוק כדי לפתוח בנייד</p>

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
            <button onClick={() => scrollToSection('why-roomi')} className="hover:text-[--theme-orange] transition-colors">למה רומי?</button>
          </nav>
          <Button onClick={handleAction} className="rounded-full gradient-orange text-white font-bold px-6 shadow-lg hover:shadow-orange-200 hover:scale-105 transition-all">
            {isMobile ? "כניסה / הרשמה" : "הורד לנייד"}
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-28 md:pb-40 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <motion.h1 
              initial="hidden" animate="visible" variants={fadeInUp}
              className="text-4xl md:text-7xl font-black text-gray-900 leading-[1.1] mb-6 tracking-tight"
            >
              למצוא שותפים <span className="text-[--theme-orange]">בכיף.</span>
            </motion.h1>
            <motion.p 
              initial="hidden" animate="visible" variants={fadeInUp} transition={{ delay: 0.1 }}
              className="text-lg md:text-2xl text-gray-500 mb-8 md:mb-12 leading-relaxed px-4 max-w-2xl mx-auto"
            >
              האפליקציה שפותחה על ידי צעירים בשביל צעירים. 
              בלי בלאגן, בלי בזבוז זמן, ועם התאמה מדויקת לוייב שלכם.
            </motion.p>
            <motion.div 
              initial="hidden" animate="visible" variants={fadeInUp} transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center px-4 w-full sm:w-auto"
            >
              <Button onClick={handleAction} className="h-14 px-8 rounded-full gradient-orange text-white text-lg font-bold shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all w-full sm:w-auto">
                {isMobile ? "בואו נתחיל" : "פתח בנייד"} <ArrowLeft className="mr-2 w-5 h-5" />
              </Button>
              <Button onClick={() => scrollToSection('how-it-works')} variant="outline" className="h-14 px-8 rounded-full border-2 text-lg font-bold hover:bg-gray-50 w-full sm:w-auto">
                איך זה עובד?
              </Button>
            </motion.div>
          </div>
        </div>
        
        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none opacity-30">
            <div className="absolute top-[-10%] right-[-5%] w-72 h-72 md:w-96 md:h-96 bg-orange-200 rounded-full blur-3xl opacity-50"></div>
            <div className="absolute bottom-[10%] left-[-10%] w-80 h-80 md:w-[500px] md:h-[500px] bg-blue-100 rounded-full blur-3xl opacity-50"></div>
        </div>
      </section>

      {/* Bento Grid - Why Roomi */}
      <section id="why-roomi" className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">למה דווקא רומי?</h2>
            <p className="text-lg md:text-xl text-gray-500">בנינו את הפלטפורמה שתמיד רצינו שתהיה לנו.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-auto">
            {/* Feature 1 - Large - Vibe */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="md:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col justify-between overflow-hidden relative group min-h-[320px]"
            >
              <div className="relative z-10">
                <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center mb-4">
                  <Heart className="w-6 h-6 text-[--theme-orange]" />
                </div>
                <h3 className="text-2xl font-bold mb-3">התאמה על בסיס וייב וסגנון חיים</h3>
                <p className="text-gray-500 max-w-lg leading-relaxed text-lg">
                  בלי שאלונים חופרים ובלי אלגוריתמים מסובכים. החיבור ברומי פשוט וטבעי - הוא מבוסס על הוייב שלכם, סגנון החיים שלכם, הגיל, וכמובן המיקום. פשוט תהיו אתם.
                </p>
                
                <div className="flex flex-wrap gap-2 mt-6">
                   <span className="bg-orange-50 text-[--theme-orange] px-3 py-1 rounded-full text-sm font-bold">✨ וייב</span>
                   <span className="bg-orange-50 text-[--theme-orange] px-3 py-1 rounded-full text-sm font-bold">🕶️ לייף סטייל</span>
                   <span className="bg-orange-50 text-[--theme-orange] px-3 py-1 rounded-full text-sm font-bold">📸 תמונות</span>
                   <span className="bg-orange-50 text-[--theme-orange] px-3 py-1 rounded-full text-sm font-bold">🎵 מוזיקה</span>
                </div>
              </div>
              <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-gradient-to-tr from-orange-50 to-white rounded-full z-0 group-hover:scale-110 transition-transform duration-500"></div>
            </motion.div>

            {/* Feature 2 - Young People */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-gray-900 text-white rounded-3xl p-8 shadow-sm flex flex-col justify-between relative overflow-hidden min-h-[320px]"
            >
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md">
                   <Users className="w-6 h-6 text-orange-400" />
                </div>
                <h3 className="text-2xl font-bold mb-3">צעירים לצעירים</h3>
                <p className="text-gray-300 leading-relaxed">
                  קהילה איכותית של חבר'ה צעירים, סטודנטים, חיילים משוחררים וכל מי שבראש טוב, שמחפשים בדיוק את מה שאתם מחפשים.
                </p>
              </div>
              <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-gray-800 to-gray-900 -z-10"></div>
            </motion.div>

            {/* Feature 3 - Fast Interface */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col justify-between min-h-[300px]"
            >
              <div>
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="text-2xl font-bold mb-3">ממשק מהיר ואינטואיטיבי</h3>
                <p className="text-gray-500 leading-relaxed">
                  בלי רשימות משעממות. סווייפ ימינה, סווייפ שמאלה, צ'אט, וסגרתם דירה. הכל עובד חלק ומהיר.
                </p>
              </div>
            </motion.div>
            
            {/* Feature 4 - Music */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col justify-between min-h-[300px]"
            >
              <div>
                <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
                  <Music className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold mb-3">תשמיעו את הקול שלכם</h3>
                <p className="text-gray-500 leading-relaxed">
                  הוסיפו שיר לפרופיל שלכם שמתנגן אוטומטית. כי אין כמו מוזיקה טובה כדי לשבור את הקרח ולהבין את הוייב.
                </p>
              </div>
            </motion.div>

            {/* Feature 5 - Large - Web App */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="md:col-span-1 lg:col-span-1 bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-8 shadow-sm text-white flex flex-col justify-center relative overflow-hidden min-h-[300px]"
            >
              <div className="relative z-10">
                    <h3 className="text-2xl font-black mb-4">פשוט וקל</h3>
                    <p className="text-orange-50 text-lg mb-6 leading-relaxed">
                       עובד מכל מכשיר, בלי הורדה. פשוט נכנסים ומתחילים לחפש.
                    </p>
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm w-fit">
                            <Smartphone className="w-4 h-4" />
                            <span className="font-bold text-sm">התקנה ב-Tap</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm w-fit">
                            <Globe className="w-4 h-4" />
                            <span className="font-bold text-sm">ללא הורדה</span>
                        </div>
                    </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section id="about" className="py-16 md:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-orange-50 rounded-[2.5rem] p-8 md:p-16 text-center relative">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded-full shadow-lg">
                 <div className="w-16 h-16 bg-[--theme-orange] rounded-full flex items-center justify-center text-white font-bold text-2xl">R</div>
             </div>
             
             <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-8 mt-6">קצת עלינו</h2>
             <div className="prose prose-lg mx-auto text-gray-600 leading-relaxed text-sm md:text-lg">
                <p className="mb-6">
                  היי, אנחנו קבוצה של סטודנטים באוניברסיטה. כמו כולכם, גם אנחנו חווינו את הסיוט של חיפוש שותפים.
                  קבוצות פייסבוק מוצפות, הודעות בוואטסאפ שלא נענות, ודייטים מביכים בדירות שפשוט לא התאימו.
                </p>
                <p className="mb-6">
                  החלטנו לקחת את העניינים לידיים ולפתח את הפתרון שהיינו צריכים בעצמנו. 
                  <span className="font-bold text-[--theme-orange]"> Roomi </span> 
                  נולדה מתוך הבנה שהעולם היום הוא דינמי, ושמגורים משותפים הם לא רק "קורת גג", אלא חוויה חברתית.
                </p>
                <p>
                  המטרה שלנו היא ליצור חיבורים אמיתיים, להפוך את תהליך החיפוש לאינטואיטיבי (ואפילו כיפי!), 
                  ולעזור לכם למצוא את הבית הבא שלכם עם אנשים שבאמת מתאימים לכם.
                </p>
             </div>
             
             <div className="mt-10 flex flex-wrap justify-center gap-2 md:gap-4">
                 <div className="bg-white px-4 py-2 rounded-full shadow-sm text-sm font-bold text-gray-500">#צעירים</div>
                 <div className="bg-white px-4 py-2 rounded-full shadow-sm text-sm font-bold text-gray-500">#תל_אביב</div>
                 <div className="bg-white px-4 py-2 rounded-full shadow-sm text-sm font-bold text-gray-500">#שותפים</div>
                 <div className="bg-white px-4 py-2 rounded-full shadow-sm text-sm font-bold text-gray-500">#וייב</div>
             </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-16 md:py-24 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-black mb-12">איך זה עובד?</h2>
          
          <div className="max-w-4xl mx-auto">
             {/* Video Container */}
             <div className="aspect-[9/16] md:aspect-video w-full max-w-sm md:max-w-none mx-auto bg-gray-800 rounded-3xl overflow-hidden shadow-2xl relative border border-gray-700">
                 <iframe 
                    width="100%" 
                    height="100%" 
                    src="https://www.youtube.com/embed/856KE7mJ_c8?rel=0&modestbranding=1" 
                    title="Roomi App Demo" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                    className="absolute inset-0"
                 ></iframe>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
                 {[
                     { step: 1, title: "נרשמים בקלות", desc: "הרשמה מהירה ומילוי פרופיל קצר שמתמקד במה שחשוב." },
                     { step: 2, title: "מגדירים וייב", desc: "בוחרים שיר, מעלים תמונות ומספרים קצת על עצמכם." },
                     { step: 3, title: "מתחילים לסרוק", desc: "סווייפ ימינה למי שאהבתם, וצ'אט ברגע שיש התאמה." }
                 ].map((item) => (
                     <div key={item.step} className="text-center p-4">
                         <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 font-black text-[--theme-orange] text-xl border border-gray-700">
                             {item.step}
                         </div>
                         <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                         <p className="text-gray-400">{item.desc}</p>
                     </div>
                 ))}
             </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-8">מוכנים למצוא את השותף המושלם?</h2>
            <p className="text-lg md:text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
                הצטרפו לאלפי משתמשים שכבר מצאו בית ושותפים לחיים. ההרשמה חינם ולוקחת בדיוק דקה.
            </p>
            <Button onClick={handleAction} className="h-16 px-12 rounded-full gradient-orange text-white text-xl font-bold shadow-2xl hover:scale-105 transition-transform w-full sm:w-auto">
                {isMobile ? "יאללה, תרשמו אותי!" : "פתח בנייד"}
            </Button>
        </div>
        
        {/* Decorative Circles */}
        <div className="absolute left-[-10%] bottom-[-50%] w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-orange-50 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse"></div>
        <div className="absolute right-[-10%] top-[-50%] w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-blue-50 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse" style={{animationDelay: '2s'}}></div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 py-12 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-right">
                <h2 className="text-2xl font-black text-[--theme-orange] font-[Pacifico] mb-2">Roomi</h2>
                <p className="text-gray-400 text-sm">© 2024 Roomi. כל הזכויות שמורות.</p>
            </div>
            <div className="flex gap-6 text-sm font-medium text-gray-500">
                <a href={createPageUrl('Terms')} className="hover:text-[--theme-orange]">תנאי שימוש</a>
                <a href={createPageUrl('Privacy')} className="hover:text-[--theme-orange]">מדיניות פרטיות</a>
                <a href="https://wa.me/972548523140" target="_blank" rel="noopener noreferrer" className="hover:text-[--theme-orange]">צור קשר</a>
            </div>
        </div>
      </footer>
    </div>
  );
}