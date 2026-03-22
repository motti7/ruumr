import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Profile, Swipe, Match, Message } from "@/entities/all";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Bell, Shield, HelpCircle, LogOut, Lock, Trash2, Heart, MessageCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import TinderSwitch from "../components/shared/TinderSwitch";

const SettingsItem = ({ icon, title, action, isLink, to, href, target, rel, onClick }) => {
  const content = (
    <div className="flex items-center justify-between w-full py-4">
      <div className="flex items-center gap-4">
        {icon}
        <p className="font-semibold text-gray-800 text-md">{title}</p>
      </div>
      {action}
    </div>
  );

  if (href) {
    return <a href={href} target={target} rel={rel} className="block">{content}</a>
  }
  if (isLink) {
    return <Link to={to} className="block">{content}</Link>;
  }
  return <div onClick={onClick} className="block cursor-pointer">{content}</div>;
};


export default function SettingsPage() {
  const [notifyLikes, setNotifyLikes] = useState(true);
  const [notifyMatches, setNotifyMatches] = useState(true);

  useEffect(() => {
    const load = async () => {
      const userData = await User.me();
      setNotifyLikes(userData.notify_likes !== false);
      setNotifyMatches(userData.notify_matches !== false);
    };
    load();
  }, []);

  const handleNotifyLikesChange = async (val) => {
    setNotifyLikes(val);
    await base44.auth.updateMe({ notify_likes: val });
  };

  const handleNotifyMatchesChange = async (val) => {
    setNotifyMatches(val);
    await base44.auth.updateMe({ notify_matches: val });
  };

  const handleLogout = async () => {
    await User.logout();
    window.location.href = createPageUrl('Home');
  };
  
  const handleDeleteAccount = async () => {
    if (confirm("האם את/ה בטוח/ה שברצונך למחוק את החשבון? פעולה זו בלתי הפיכה.")) {
      try {
        await base44.functions.deleteAccount();
        alert("החשבון והמידע שלך נמחקו בהצלחה.");
        await handleLogout();
      } catch (e) {
        console.error("Delete account error:", e);
        alert("אירעה שגיאה במחיקת הנתונים. אנא נסה שנית או צור קשר עם התמיכה.");
      }
    }
  };



  return (
    <div className="p-4 pb-24 bg-gray-50 min-h-screen" dir="rtl">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-gray-800">הגדרות</h1>
      </div>

      <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200">
              <p className="font-bold text-lg mb-2 text-gray-800">התראות</p>
              <div className="divide-y divide-gray-100">
                <SettingsItem 
                  icon={<Heart className="w-5 h-5 text-[--theme-orange]"/>} 
                  title="לייקים חדשים" 
                  action={<TinderSwitch defaultChecked={notifyLikes} onChange={handleNotifyLikesChange} />} 
                />
                <SettingsItem 
                  icon={<Bell className="w-5 h-5 text-[--theme-orange]"/>} 
                  title="התאמות והודעות חדשות" 
                  action={<TinderSwitch defaultChecked={notifyMatches} onChange={handleNotifyMatchesChange} />} 
                />
              </div>
          </div>
        
          <div className="bg-white p-4 rounded-xl border border-gray-200">
              <p className="font-bold text-lg mb-2 text-gray-800">חשבון</p>
              <div className="divide-y divide-gray-100">
                <SettingsItem icon={<Lock className="w-5 h-5 text-gray-500"/>} title="ניהול הרשאות" action={<ChevronLeft className="text-gray-400"/>} isLink to={createPageUrl("Permissions")} />
              </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200">
              <p className="font-bold text-lg mb-2 text-gray-800">תמיכה</p>
               <div className="divide-y divide-gray-100">
                <SettingsItem icon={<HelpCircle className="w-5 h-5 text-gray-500"/>} title="מרכז עזרה" action={<ChevronLeft className="text-gray-400"/>} isLink to={createPageUrl("HelpCenter")} />
                <SettingsItem icon={<Shield className="w-5 h-5 text-gray-500"/>} title="תנאי שימוש" action={<ChevronLeft className="text-gray-400"/>} isLink to={createPageUrl("Terms")} />
                <SettingsItem icon={<img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" className="w-6 h-6"/>} title="צור קשר" action={<ChevronLeft className="text-gray-400"/>} href="https://wa.me/972548523140" target="_blank" rel="noopener noreferrer" />
              </div>
          </div>
        
        <div className="pt-6 space-y-4">
             <Button onClick={handleDeleteAccount} variant="ghost" className="w-full text-center text-red-500 font-bold text-lg">
                <Trash2 className="w-5 h-5 ml-2" />
                מחק חשבון
            </Button>
            

            <Button onClick={() => window.location.href = createPageUrl('AdminUsers')} variant="outline" className="w-full mt-2 border-dashed border-gray-300 text-gray-400 text-xs">
                <Shield className="w-3 h-3 ml-2" />
                Admin: User Management
            </Button>
        </div>
      </div>
    </div>
  );
}