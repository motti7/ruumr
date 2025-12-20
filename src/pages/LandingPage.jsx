import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Zap, Heart, Smartphone, Globe, CheckCircle2, ChevronDown, Play } from 'lucide-react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLogin = () => {
    base44.auth.redirectToLogin();
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900" dir="rtl">
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
             <h1 className="text-3xl font-black text-[--theme-orange] font-[Pacifico]">Roomi</h1>
          </div>
          <nav className="hidden md:flex gap-8 font-medium text-gray-600">
            <button onClick={() => scrollToSection('about')} className="hover:text-[--theme-orange] transition-colors">הסיפור שלנו</button>
            <button onClick={() => scrollToSection('how-it-works')} className="hover:text-[--theme-orange] transition-colors">איך זה עובד</button>
            <button onClick={() => scrollToSection('why-roomi')} className="hover:text-[--theme-orange] transition-colors">למה רומי?</button>
          </nav>
          <Button onClick={handleLogin} className="rounded-full gradient-orange text-white font-bold px-6 shadow-lg hover:shadow-orange-200 hover:scale-105 transition-all">
            כניסה / הרשמה
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <motion.h1 
              initial="hidden" animate="visible" variants={fadeInUp}
              className="text-5xl md:text-7xl font-black text-gray-900 leading-tight mb-6"
            >
              למצוא שותפים <span className="text-[--theme-orange]">בכיף.</span>
            </motion.h1>
            <motion.p 
              initial="hidden" animate="visible" variants={fadeInUp} transition={{ delay: 0.1 }}
              className="text-xl md:text-2xl text-gray-500 mb-10 leading-relaxed"
            >
              האפליקציה שפותחה על ידי סטודנטים בשביל סטודנטים. 
              בלי בלאגן, בלי בזבוז זמן, ועם התאמה מדויקת לוייב שלכם.
            </motion.p>
            <motion.div 
              initial="hidden" animate="visible" variants={fadeInUp} transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button onClick={handleLogin} className="h-14 px-8 rounded-full gradient-orange text-white text-lg font-bold shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all">
                בואו נתחיל <ArrowLeft className="mr-2 w-5 h-5" />
              </Button>
              <Button onClick={() => scrollToSection('how-it-works')} variant="outline" className="h-14 px-8 rounded-full border-2 text-lg font-bold hover:bg-gray-50">
                איך זה עובד?
              </Button>
            </motion.div>
          </div>
        </div>
        
        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none opacity-30">
            <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-orange-200 rounded-full blur-3xl opacity-50"></div>
            <div className="absolute bottom-[10%] left-[-10%] w-[500px] h-[500px] bg-blue-100 rounded-full blur-3xl opacity-50"></div>
        </div>
      </section>

      {/* Bento Grid - Why Roomi */}
      <section id="why-roomi" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">למה דווקא רומי?</h2>
            <p className="text-xl text-gray-500">בנינו את הפלטפורמה שתמיד רצינו שתהיה לנו.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
            {/* Feature 1 - Large */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="md:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col justify-between overflow-hidden relative group"
            >
              <div className="relative z-10">
                <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center mb-4">
                  <Heart className="w-6 h-6 text-[--theme-orange]" />
                </div>
                <h3 className="text-2xl font-bold mb-2">התאמה על בסיס וייב וסגנון חיים</h3>
                <p className="text-gray-500 max-w-md">
                  אנחנו לא מסתכלים רק על התקציב. האלגוריתם שלנו מחבר ביניכם על בסיס הרגלים, שמירת שבת, כשרות, אהבה לחיות מחמד ורמת הניקיון.
                </p>
              </div>
              <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-gradient-to-tr from-orange-50 to-white rounded-full z-0 group-hover:scale-110 transition-transform duration-500"></div>
            </motion.div>

            {/* Feature 2 */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-gray-900 text-white rounded-3xl p-8 shadow-sm flex flex-col justify-between relative overflow-hidden"
            >
              <div className="relative z-10">
                <Users className="w-10 h-10 mb-4 text-orange-400" />
                <h3 className="text-2xl font-bold mb-2">צעירים לצעירים</h3>
                <p className="text-gray-300">
                  קהילה איכותית של סטודנטים וצעירים שמחפשים בדיוק את מה שאתם מחפשים.
                </p>
              </div>
              <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-gray-800 to-gray-900 -z-10"></div>
            </motion.div>

            {/* Feature 3 */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="text-2xl font-bold mb-2">ממשק מהיר ואינטואיטיבי</h3>
                <p className="text-gray-500">
                  בלי רשימות משעממות. סווייפ ימינה, סווייפ שמאלה, צ'אט, וסגרתם דירה.
                </p>
              </div>
            </motion.div>

            {/* Feature 4 - Large */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="md:col-span-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-8 shadow-sm text-white flex flex-col justify-center relative overflow-hidden"
            >
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                 <div className="flex-1">
                    <h3 className="text-3xl font-black mb-4">טכנולוגיית Web App מתקדמת</h3>
                    <p className="text-orange-50 text-lg mb-6">
                      בנינו את רומי כאפליקציית ווב (PWA). זה אומר שלא צריך להוריד עדכונים כבדים, היא עובדת מכל מכשיר, ואפשר להתקין אותה בשנייה על מסך הבית.
                    </p>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm">
                            <Smartphone className="w-5 h-5" />
                            <span className="font-bold text-sm">התקנה ב-Tap</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm">
                            <Globe className="w-5 h-5" />
                            <span className="font-bold text-sm">זמין מכל מקום</span>
                        </div>
                    </div>
                 </div>
                 {/* Mock Phone Element */}
                 <div className="hidden md:block w-48 h-64 bg-white/10 rounded-2xl border-4 border-white/20 backdrop-blur-md rotate-6"></div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section id="about" className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-orange-50 rounded-[3rem] p-10 md:p-16 text-center relative">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded-full shadow-lg">
                 <div className="w-16 h-16 bg-[--theme-orange] rounded-full flex items-center justify-center text-white font-bold text-2xl">R</div>
             </div>
             
             <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-8 mt-6">קצת עלינו</h2>
             <div className="prose prose-lg mx-auto text-gray-600 leading-relaxed">
                <p className="mb-6">
                  היי, אנחנו קבוצה של סטודנטים מהאוניברסיטה. כמו כולכם, גם אנחנו חווינו את הסיוט של חיפוש שותפים. 
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
             
             <div className="mt-10 flex justify-center gap-4">
                 <div className="bg-white px-4 py-2 rounded-full shadow-sm text-sm font-bold text-gray-500">#סטודנטים</div>
                 <div className="bg-white px-4 py-2 rounded-full shadow-sm text-sm font-bold text-gray-500">#תל_אביב</div>
                 <div className="bg-white px-4 py-2 rounded-full shadow-sm text-sm font-bold text-gray-500">#טכנולוגיה</div>
             </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-24 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-black mb-12">איך זה עובד?</h2>
          
          <div className="max-w-4xl mx-auto">
             {/* Video Placeholder */}
             <div className="aspect-video bg-gray-800 rounded-3xl overflow-hidden shadow-2xl relative group cursor-pointer border border-gray-700">
                 <div className="absolute inset-0 flex items-center justify-center">
                     <div className="w-20 h-20 bg-[--theme-orange] rounded-full flex items-center justify-center pl-1 shadow-xl group-hover:scale-110 transition-transform">
                         <Play className="w-8 h-8 text-white fill-current" />
                     </div>
                 </div>
                 <div className="absolute bottom-0 w-full p-8 bg-gradient-to-t from-black/80 to-transparent text-right">
                     <h3 className="text-xl font-bold">המדריך המלא לשימוש באפליקציה</h3>
                     <p className="text-gray-300 text-sm mt-1">איך נרשמים, איך יוצרים פרופיל, ואיך מתקינים את האפליקציה לנייד.</p>
                 </div>
                 {/* Suggestion for user to upload video later */}
                 {/* <video src="..." poster="..." className="w-full h-full object-cover" controls /> */}
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
                 {[
                     { step: 1, title: "נרשמים בקלות", desc: "הרשמה מהירה דרך גוגל ומילוי פרופיל קצר." },
                     { step: 2, title: "מגדירים העדפות", desc: "ספרו לנו מה אתם מחפשים ומה הוייב שלכם." },
                     { step: 3, title: "מתחילים לסרוק", desc: "סווייפ ימינה למי שאהבתם, וצ'אט ברגע שיש התאמה." }
                 ].map((item) => (
                     <div key={item.step} className="text-center">
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
            <h2 className="text-5xl font-black text-gray-900 mb-8">מוכנים למצוא את השותף המושלם?</h2>
            <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
                הצטרפו לאלפי משתמשים שכבר מצאו בית ושותפים לחיים. ההרשמה חינם ולוקחת בדיוק דקה.
            </p>
            <Button onClick={handleLogin} className="h-16 px-12 rounded-full gradient-orange text-white text-xl font-bold shadow-2xl hover:scale-105 transition-transform">
                יאללה, תרשמו אותי!
            </Button>
        </div>
        
        {/* Decorative Circles */}
        <div className="absolute left-[-10%] bottom-[-50%] w-[600px] h-[600px] bg-orange-50 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse"></div>
        <div className="absolute right-[-10%] top-[-50%] w-[600px] h-[600px] bg-blue-50 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse" style={{animationDelay: '2s'}}></div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 py-12 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
                <h2 className="text-2xl font-black text-[--theme-orange] font-[Pacifico] mb-2">Roomi</h2>
                <p className="text-gray-400 text-sm">© 2024 Roomi. כל הזכויות שמורות.</p>
            </div>
            <div className="flex gap-6 text-sm font-medium text-gray-500">
                <a href="#" className="hover:text-[--theme-orange]">תנאי שימוש</a>
                <a href="#" className="hover:text-[--theme-orange]">מדיניות פרטיות</a>
                <a href="#" className="hover:text-[--theme-orange]">צור קשר</a>
            </div>
        </div>
      </footer>
    </div>
  );
}