import React from 'react';
import { motion } from 'framer-motion';
import { Download, Heart, Home as HomeIcon, Users, Shield, Sparkles } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50" dir="rtl">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-orange-100 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-3xl logo-font text-[--theme-orange]">ruumr</h1>
          <div className="flex gap-3">
            <a
              href="https://apps.apple.com/app/ruumr"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-full border-2 border-[--theme-orange] text-[--theme-orange] font-bold hover:bg-[--theme-orange] hover:text-white transition-all"
            >
              iOS
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=com.ruumr.app"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-full gradient-orange text-white font-bold hover:scale-105 transition-transform shadow-lg"
            >
              Android
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-5xl md:text-7xl font-black text-gray-900 mb-6 leading-tight">
              למצוא שותפים<br />
              <span className="text-[--theme-orange]">בכיף</span>
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              האפליקציה החכמה למציאת שותפים לדירה בישראל. 
              התאמה על בסיס וייב, תקציב ואורח חיים משותפים.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <a
                href="https://apps.apple.com/app/ruumr"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto px-8 py-4 rounded-full gradient-orange text-white font-bold text-lg shadow-2xl flex items-center justify-center gap-3"
                >
                  <Download className="w-6 h-6" />
                  הורד ל-iOS
                </motion.button>
              </a>
              <a
                href="https://play.google.com/store/apps/details?id=com.ruumr.app"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto px-8 py-4 rounded-full border-2 border-[--theme-orange] text-[--theme-orange] font-bold text-lg flex items-center justify-center gap-3 hover:bg-[--theme-orange] hover:text-white transition-all"
                >
                  <Download className="w-6 h-6" />
                  הורד ל-Android
                </motion.button>
              </a>
            </div>

            {/* App Screenshot Mockup */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="relative max-w-sm mx-auto"
            >
              <div className="relative rounded-[3rem] overflow-hidden shadow-2xl border-8 border-gray-800">
                <div className="aspect-[9/19] bg-white">
                  <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68c919adff6ac6fafb51bed6/bf6c854ca_Screenshot_2026-02-07-20-32-17-71_40deb401b9ffe8e1df2f1cc5ba480b12.jpg"
                    alt="Ruumr App Screenshot"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              {/* Peeking Orange Monsters */}
              <motion.div
                animate={{ x: [0, -5, 0], y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-0 -right-20 w-40 h-40 z-0 overflow-hidden"
              >
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68c919adff6ac6fafb51bed6/2f9bf59c1_1767350127370.jpg"
                  alt="Ruumr Monster"
                  className="w-full h-full object-cover scale-150"
                  style={{ objectPosition: 'left center' }}
                />
              </motion.div>
              <motion.div
                animate={{ x: [0, 5, 0], y: [0, 8, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute bottom-8 -left-20 w-40 h-40 z-0 overflow-hidden"
              >
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68c919adff6ac6fafb51bed6/2f9bf59c1_1767350127370.jpg"
                  alt="Ruumr Monster"
                  className="w-full h-full object-cover scale-150"
                  style={{ objectPosition: 'right center' }}
                />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-4xl font-black text-center text-gray-900 mb-16">למה Ruumr?</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center p-8 rounded-2xl bg-orange-50 hover:shadow-lg transition-shadow"
            >
              <div className="w-16 h-16 bg-[--theme-orange] rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-3">התאמה חכמה</h4>
              <p className="text-gray-600 leading-relaxed">
                אלגוריתם התאמה מתקדם שמתחשב בוייב, תקציב, העדפות דתיות ואורח חיים
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center p-8 rounded-2xl bg-orange-50 hover:shadow-lg transition-shadow"
            >
              <div className="w-16 h-16 bg-[--theme-orange] rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-3">בטוח ומאומת</h4>
              <p className="text-gray-600 leading-relaxed">
                כל המשתמשים עוברים אימות טלפון וניתן להוסיף אימות זהות מלא
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-center p-8 rounded-2xl bg-orange-50 hover:shadow-lg transition-shadow"
            >
              <div className="w-16 h-16 bg-[--theme-orange] rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-3">קהילה איכותית</h4>
              <p className="text-gray-600 leading-relaxed">
                אלפי סטודנטים וצעירים שמחפשים שותפים איכותיים ברחבי הארץ
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-[#FF6B47] via-[#FF5722] to-[#FF7043] relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68c919adff6ac6fafb51bed6/c4156cb77_file_0000000026d071f49a3529fad81e60e4.png"
            alt="Happy user"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-[#FF5722]/40 to-[#FF5722]/30"></div>
        </div>

        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            {/* Stars */}
            <div className="flex justify-center gap-2 mb-8">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <svg className="w-10 h-10 text-white fill-current" viewBox="0 0 24 24">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                  </svg>
                </motion.div>
              ))}
            </div>

            {/* Quote */}
            <h3 className="text-3xl md:text-4xl font-black text-white mb-6 leading-tight px-4 drop-shadow-lg">
              "ממש כמו טיינדר, רק לשותפים!<br />
              מצאתי את השותפה המושלמת תוך<br />
              יומיים. זה שינה לי את החיים."
            </h3>
            
            <p className="text-white text-lg mb-10 drop-shadow-md">
              אפליקצית Ruumr למציאת שותפים
            </p>

            {/* Download Button with Smart Detection */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const userAgent = navigator.userAgent || navigator.vendor || window.opera;
                if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
                  window.open('https://apps.apple.com/app/ruumr', '_blank');
                } else if (/android/i.test(userAgent)) {
                  window.open('https://play.google.com/store/apps/details?id=com.ruumr.app', '_blank');
                } else {
                  // Desktop - default to iOS
                  window.open('https://apps.apple.com/app/ruumr', '_blank');
                }
              }}
              className="inline-flex items-center gap-3 px-10 py-5 rounded-full bg-white text-[--theme-orange] font-black text-xl shadow-2xl"
            >
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 12c0-1.103-.897-2-2-2h-1V7c0-2.757-2.243-5-5-5S7 4.243 7 7v3H6c-1.103 0-2 .897-2 2v8c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-8zM9 7c0-1.654 1.346-3 3-3s3 1.346 3 3v3H9V7z"/>
              </svg>
              להורדה עכשיו
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-[--theme-orange] to-orange-600">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h3 className="text-4xl md:text-5xl font-black text-white mb-6">
              מוכנים למצוא את השותף המושלם?
            </h3>
            <p className="text-xl text-white/90 mb-10">
              הורידו עכשיו והתחילו את המסע שלכם למציאת דירה עם שותפים מעולים
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://apps.apple.com/app/ruumr"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-[--theme-orange] font-bold text-lg shadow-2xl flex items-center justify-center gap-3"
                >
                  <Download className="w-6 h-6" />
                  הורד עכשיו
                </motion.button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-3xl logo-font text-[--theme-orange] mb-4">ruumr</h1>
          <p className="text-gray-400 mb-6">למצוא שותפים בכיף 🏠</p>
          <div className="flex justify-center gap-6 text-sm text-gray-400">
            <a href="#" className="hover:text-white transition-colors">תנאי שימוש</a>
            <a href="#" className="hover:text-white transition-colors">מדיניות פרטיות</a>
            <a href="#" className="hover:text-white transition-colors">צור קשר</a>
          </div>
          <p className="text-gray-500 text-sm mt-6">© 2026 Ruumr. כל הזכויות שמורות.</p>
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Pacifico&display=swap');
        .logo-font {
          font-family: 'Pacifico', cursive;
        }
        :root {
          --theme-orange: #FF5722;
          --theme-orange-dark: #E64A19;
        }
        .gradient-orange {
          background: linear-gradient(135deg, var(--theme-orange) 0%, var(--theme-orange-dark) 100%);
        }
      `}</style>
    </div>
  );
}