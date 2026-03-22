import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { User } from "@/entities/User";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function GroupTrackerPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [matches, setMatches] = useState([]);
  const [targetCount, setTargetCount] = useState(() => {
    return parseInt(localStorage.getItem('ruumr_target_count') || '3');
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const userData = await User.me();
        setUser(userData);

        const profiles = await base44.entities.Profile.filter({ user_id: userData.id });
        if (profiles.length === 0) {
          navigate(createPageUrl('Onboarding'));
          return;
        }
        setProfile(profiles[0]);

        const m1 = await base44.entities.Match.filter({ user1_id: userData.id, status: 'active' });
        const m2 = await base44.entities.Match.filter({ user2_id: userData.id, status: 'active' });
        const allMatches = [...m1, ...m2];

        const matchesWithPhotos = await Promise.all(allMatches.map(async (match) => {
          const partnerId = match.user1_id === userData.id ? match.user2_id : match.user1_id;
          const partnerName = match.user1_id === userData.id ? match.user2_name : match.user1_name;
          const partnerProfiles = await base44.entities.Profile.filter({ user_id: partnerId });
          return {
            id: match.id,
            partnerId,
            name: partnerName,
            photo: partnerProfiles[0]?.photos?.[0] || null,
          };
        }));
        setMatches(matchesWithPhotos);
      } catch (e) {
        console.error(e);
      }
      setIsLoading(false);
    };
    load();
  }, []);

  const handleTargetChange = (val) => {
    setTargetCount(val);
    localStorage.setItem('ruumr_target_count', String(val));
  };

  const currentCount = 1 + matches.length; // me + matches
  const remaining = Math.max(0, targetCount - currentCount);
  const progressPercent = Math.min(100, (currentCount / targetCount) * 100);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="w-8 h-8 border-4 border-orange-200 border-t-[--theme-orange] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28" dir="rtl">
      <div className="bg-white px-4 pt-6 pb-4 border-b border-gray-100">
        <h1 className="text-3xl font-black text-gray-900">הצוות שלי</h1>
        <p className="text-gray-500 text-sm mt-1">מעקב אחר תהליך מציאת השותפים</p>
      </div>

      <div className="p-4 space-y-4">

        {/* Target Selector */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="font-bold text-gray-700 mb-3 text-right">מחפש/ת דירה לכמה אנשים?</p>
          <div className="flex gap-2 justify-center">
            {[2, 3, 4, 5, 6].map(n => (
              <button
                key={n}
                onClick={() => handleTargetChange(n)}
                className={`w-12 h-12 rounded-full font-black text-lg transition-all ${
                  targetCount === n
                    ? 'gradient-orange text-white shadow-md scale-110'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="text-right">
              <p className="text-4xl font-black text-[--theme-orange]">{currentCount}<span className="text-2xl text-gray-300">/{targetCount}</span></p>
              <p className="text-sm text-gray-500 mt-0.5">
                {remaining === 0 ? '🎉 הצוות מלא!' : `חסרים עוד ${remaining} ${remaining === 1 ? 'אדם' : 'אנשים'}`}
              </p>
            </div>
            <div className="text-4xl">
              {remaining === 0 ? '🏠' : currentCount === 1 ? '🙋' : '👥'}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full gradient-orange rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>רק אני</span>
            <span>הצוות מלא</span>
          </div>
        </div>

        {/* People Visual */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="font-bold text-gray-700 mb-4 text-right">מקומות בדירה</p>
          <div className="flex flex-wrap gap-3 justify-center">
            {/* Me */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-14 h-14 rounded-full overflow-hidden border-3 border-[--theme-orange] shadow-md ring-2 ring-orange-200">
                {profile?.photos?.[0] ? (
                  <img src={profile.photos[0]} className="w-full h-full object-cover" alt="אני" />
                ) : (
                  <div className="w-full h-full gradient-orange flex items-center justify-center text-white font-black text-xl">
                    {user?.full_name?.[0] || '?'}
                  </div>
                )}
              </div>
              <span className="text-xs font-bold text-[--theme-orange]">אני</span>
            </div>

            {/* Matches */}
            {matches.map((match, i) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center gap-1 cursor-pointer"
                onClick={() => navigate(createPageUrl('Chat') + `?matchId=${match.id}`)}
              >
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-green-400 shadow-md ring-2 ring-green-100">
                  {match.photo ? (
                    <img src={match.photo} className="w-full h-full object-cover" alt={match.name} />
                  ) : (
                    <div className="w-full h-full bg-green-100 flex items-center justify-center text-green-600 font-black text-xl">
                      {match.name?.[0] || '?'}
                    </div>
                  )}
                </div>
                <span className="text-xs font-medium text-gray-600 max-w-[56px] truncate text-center">{match.name?.split(' ')[0]}</span>
              </motion.div>
            ))}

            {/* Empty Slots */}
            {Array.from({ length: remaining }).map((_, i) => (
              <motion.div
                key={`empty-${i}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: (matches.length + i) * 0.1 }}
                className="flex flex-col items-center gap-1"
                onClick={() => navigate(createPageUrl('Discover'))}
              >
                <div className="w-14 h-14 rounded-full border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center cursor-pointer hover:border-[--theme-orange] hover:bg-orange-50 transition-colors">
                  <span className="text-2xl text-gray-300">+</span>
                </div>
                <span className="text-xs text-gray-400">פנוי</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        {remaining > 0 && (
          <button
            onClick={() => navigate(createPageUrl('Discover'))}
            className="w-full py-4 rounded-2xl gradient-orange text-white font-black text-lg shadow-lg active:scale-95 transition-transform"
          >
            {matches.length === 0 ? 'התחל לחפש שותפים' : `מצא עוד ${remaining} ${remaining === 1 ? 'שותף/ה' : 'שותפים'}`}
          </button>
        )}

        {remaining === 0 && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
            <p className="text-2xl mb-1">🎉</p>
            <p className="font-black text-green-700 text-lg">הצוות מלא!</p>
            <p className="text-green-600 text-sm">מצאת את כל השותפים שרצית</p>
          </div>
        )}
      </div>
    </div>
  );
}