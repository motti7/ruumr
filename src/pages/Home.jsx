import React, { useState, useEffect } from 'react';
import { User } from '@/entities/User';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const SecurityNotice = ({ onAccept }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
  >
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-white rounded-2xl p-6 max-w-md w-full"
      dir="rtl"
    >
      <div className="text-center mb-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">האבטחה שלך חשובה לנו</h2>
      </div>
      <div className="text-sm text-gray-600 space-y-3 mb-6">
        <p>🔒 <strong>הצפנה מלאה:</strong> כל המידע שלך מוצפן ומוגן</p>
        <p>🛡️ <strong>תשתית מאובטחת:</strong> שרתים בסטנדרט הגבוה ביותר</p>
        <p>👤 <strong>פרטיות מובטחת:</strong> אף אחד לא יכול לגשת למידע שלך</p>
        <p>✅ <strong>התחברות מאובטחת:</strong> דרך גוגל, ללא שמירת סיסמאות</p>
      </div>
      <button
        onClick={onAccept}
        className="w-full gradient-orange text-white font-bold py-3 rounded-full"
      >
        הבנתי, בוא נתחיל
      </button>
    </motion.div>
  </motion.div>
);

export default function HomePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showSecurityNotice, setShowSecurityNotice] = useState(false);

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        await User.me();
        navigate(createPageUrl('Discover'));
      } catch (error) {
        setLoading(false);
      }
    };
    checkUserStatus();
  }, [navigate]);

  const handleLogin = async () => {
    const hasSeenNotice = localStorage.getItem('roomi_security_notice_seen');
    if (!hasSeenNotice) {
      setShowSecurityNotice(true);
    } else {
      setLoading(true);
      await User.login();
    }
  };

  const handleSecurityNoticeAccept = async () => {
    localStorage.setItem('roomi_security_notice_seen', 'true');
    setShowSecurityNotice(false);
    setLoading(true);
    await User.login();
  };
  
  if (loading) {
      return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-white">
              <Loader2 className="h-8 w-8 animate-spin text-[--theme-orange]" />
          </div>
      );
  }

  return (
    <>
      {showSecurityNotice && <SecurityNotice onAccept={handleSecurityNoticeAccept} />}
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4 text-center">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-5xl font-black text-[--theme-orange] mb-4 logo-font">
            Roomi
          </h1>
          <p className="text-gray-500 text-lg mb-12">הדרך שלך לדירה הבאה.</p>
        </motion.div>
        
        <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            onClick={handleLogin}
            className="w-full max-w-xs gradient-orange text-white font-bold py-4 px-8 rounded-full shadow-lg transition-transform transform hover:scale-105"
          >
            התחברות / הרשמה
        </motion.button>

        <p className="text-xs text-gray-400 mt-8 max-w-xs">
            בלחיצה על התחברות, הנך מאשר/ת את <a href="#" className="underline">תנאי השימוש</a> שלנו.
        </p>
      </div>
    </>
  );
}