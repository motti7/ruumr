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

      {/* Bento Grid - Why Roomi - REVAMPED */}
      <section id="why-roomi" className="py-20 bg-gray-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 relative">
            <span className="text-[--theme-orange] font-bold tracking-wider text-sm uppercase bg-orange-50 px-4 py-1 rounded-full mb-4 inline-block">למה דווקא אנחנו</span>
            <h2 className="text-4xl md:text-6xl font-black text-gray-900 mb-6">למה דווקא רומי?</h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto italic">"בנינו את הפלטפורמה שתמיד רצינו שתהיה לנו."</p>
            
            <div className="absolute top-10 left-10 w-20 h-20 bg-blue-500/10 rounded-full blur-2xl hidden md:block"></div>
            <div className="absolute bottom-0 right-10 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl hidden md:block"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Card 1: Vibe & Lifestyle (Large) */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="md:col-span-7 bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-gray-100/50 relative overflow-hidden group min-h-[400px] flex flex-col justify-between"
            >
              <div className="relative z-10">
                 <div className="inline-flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-full mb-6">
                    <Heart className="w-5 h-5 text-[--theme-orange]" fill="currentColor" />
                    <span className="text-[--theme-orange] font-bold">הלב של המערכת</span>
                 </div>
                 <h3 className="text-3xl md:text-5xl font-black text-gray-900 mb-6 leading-tight">
                    התאמה על בסיס<br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[--theme-orange] to-pink-500">וייב אמיתי.</span>
                 </h3>
                 <p className="text-gray-500 text-lg md:text-xl leading-relaxed max-w-lg">
                    החיבור ברומי מבוסס על מה שבאמת משנה: המוזיקה שאתם שומעים, הטיולים, הלייף סטייל והתחושה. לא עוד טבלאות אקסל משעממות.
                 </p>
              </div>
              
              <div className="mt-8 flex gap-3 flex-wrap relative z-10">
                 {['🎵 מוזיקה', '🕶️ סטייל', '✨ אווירה', '🤝 כימיה'].map(tag => (
                   <span key={tag} className="px-5 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl text-gray-700 font-bold hover:bg-white hover:shadow-md transition-all cursor-default">
                      {tag}
                   </span>
                 ))}
              </div>

              {/* Decorative background */}
              <div className="absolute right-[-20%] bottom-[-20%] w-[80%] h-[80%] bg-gradient-to-t from-orange-50 to-transparent rounded-full opacity-50 group-hover:scale-110 transition-transform duration-700"></div>
            </motion.div>

            {/* Card 2: Community (Tall) */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="md:col-span-5 bg-gray-900 rounded-[2.5rem] p-8 md:p-12 shadow-xl relative overflow-hidden min-h-[400px] text-white flex flex-col"
            >
               <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
               <div className="absolute bottom-0 left-0 w-full h-2/3 bg-gradient-to-t from-black to-transparent z-0"></div>
               
               <div className="relative z-10">
                  <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
                     <Users className="w-7 h-7 text-orange-400" />
                  </div>
                  <h3 className="text-3xl font-black mb-4">קהילה של<br/>צעירים בלבד</h3>
                  <p className="text-gray-400 text-lg leading-relaxed">
                     סטודנטים, חיילים משוחררים, אמנים ואנשי העולם הגדול. אנחנו מסננים את הרעש כדי שאתם תמצאו בדיוק את מי שאתם מחפשים.
                  </p>
               </div>
               
               <div className="mt-auto relative z-10 flex -space-x-4 space-x-reverse pt-8">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-12 h-12 rounded-full border-4 border-gray-900 bg-gray-700 flex items-center justify-center text-xs font-bold">
                       {/* Placeholder avatars */}
                       <span className="opacity-50">User</span>
                    </div>
                  ))}
                  <div className="w-12 h-12 rounded-full border-4 border-gray-900 bg-[--theme-orange] flex items-center justify-center font-bold text-sm">
                    +2K
                  </div>
               </div>
            </motion.div>

            {/* Card 3: Install PWA (Important) */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="md:col-span-12 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-blue-900/20 relative overflow-hidden text-white"
            >
               <div className="grid md:grid-cols-2 gap-8 items-center relative z-10">
                  <div>
                      <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full mb-6 border border-white/20">
                          <Smartphone className="w-5 h-5" />
                          <span className="font-bold">החוויה המושלמת</span>
                      </div>
                      <h3 className="text-3xl md:text-5xl font-black mb-6">
                         לא צריך חנות אפליקציות.<br/>
                         פשוט מתקינים ונהנים.
                      </h3>
                      <p className="text-blue-100 text-xl leading-relaxed mb-8 max-w-xl">
                         Roomi עובדת בטכנולוגיית PWA מתקדמת. זה אומר שאתם מקבלים חווית אפליקציה מלאה, מהירה וחלקה - ישירות מהדפדפן שלכם, בלי להוריד כלום.
                      </p>
                      
                      <div className="flex flex-col sm:flex-row gap-4">
                          <div className="flex items-center gap-3 bg-black/30 px-6 py-4 rounded-2xl border border-white/10">
                              <div className="text-2xl">🍎</div>
                              <div className="text-left">
                                  <div className="text-xs text-blue-200">באייפון</div>
                                  <div className="font-bold">שתף {'>'} הוסף למסך הבית</div>
                              </div>
                          </div>
                          <div className="flex items-center gap-3 bg-black/30 px-6 py-4 rounded-2xl border border-white/10">
                              <div className="text-2xl">🤖</div>
                              <div className="text-left">
                                  <div className="text-xs text-blue-200">באנדרואיד</div>
                                  <div className="font-bold">תפריט {'>'} התקן אפליקציה</div>
                              </div>
                          </div>
                      </div>
                  </div>
                  
                  <div className="hidden md:flex justify-center items-center relative">
                      <div className="absolute inset-0 bg-blue-500/30 blur-3xl rounded-full"></div>
                      <div className="relative z-10 bg-white p-2 rounded-[3rem] shadow-2xl rotate-[-6deg] hover:rotate-0 transition-transform duration-500 w-64">
                          <div className="bg-gray-900 rounded-[2.5rem] overflow-hidden aspect-[9/19] border-4 border-gray-900 relative">
                               <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                                   <div className="w-16 h-16 bg-[--theme-orange] rounded-2xl mb-4 shadow-lg flex items-center justify-center">
                                       <span className="font-[Pacifico] text-white text-xl">R</span>
                                   </div>
                                   <h4 className="text-white font-bold text-xl mb-2">Roomi</h4>
                                   <p className="text-gray-400 text-sm mb-6">למצוא שותפים בכיף</p>
                                   <div className="w-full bg-blue-600 h-10 rounded-full animate-pulse"></div>
                               </div>
                          </div>
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
                  היי, אנחנו קבוצה של חבר'ה צעירים. כמו כולכם, גם אנחנו חווינו את הסיוט של חיפוש שותפים. 
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