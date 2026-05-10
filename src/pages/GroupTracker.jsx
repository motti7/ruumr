import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { User } from "@/entities/User";
import { Profile } from "@/entities/Profile";
import { syncCurrentProfileToRuumrPlus } from "@/api/ruumrPlus";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, X, UserPlus, Search, Puzzle, UsersRound, MessageCircle } from "lucide-react";

export default function GroupTrackerPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [allMatches, setAllMatches] = useState([]);
  const [teamIds, setTeamIds] = useState([]);
  const [targetCount, setTargetCount] = useState(3);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const userData = await User.me();
        setUser(userData);

        const profiles = await base44.entities.Profile.filter({ user_id: userData.id });
        if (profiles.length === 0) { navigate(createPageUrl('Onboarding')); return; }
        const prof = profiles[0];
        setMyProfile(prof);
        setTargetCount(prof.team_target || 3);

        // Load saved team from profile
        const savedTeamIds = (prof.team_members || []).map(m => m.match_id).filter(Boolean);
        setTeamIds(savedTeamIds);

        const m1 = await base44.entities.Match.filter({ user1_id: userData.id, status: 'active' });
        const m2 = await base44.entities.Match.filter({ user2_id: userData.id, status: 'active' });

        const withPhotos = await Promise.all([...m1, ...m2].map(async (match) => {
          const partnerId = match.user1_id === userData.id ? match.user2_id : match.user1_id;
          const partnerName = match.user1_id === userData.id ? match.user2_name : match.user1_name;
          const partnerProfiles = await base44.entities.Profile.filter({ user_id: partnerId });
          return { id: match.id, partnerId, name: partnerName, photo: partnerProfiles[0]?.photos?.[0] || null };
        }));
        setAllMatches(withPhotos);
      } catch (e) { console.error(e); }
      setIsLoading(false);
    };
    load();
  }, []);

  const saveToProfile = async (newTeamIds, newTarget) => {
    if (!myProfile) return;
    setIsSaving(true);
    const teamMembers = allMatches
      .filter(m => newTeamIds.includes(m.id))
      .map(m => ({ match_id: m.id, name: m.name, photo: m.photo }));
    await Profile.update(myProfile.id, { team_members: teamMembers, team_target: newTarget });
    try {
      await syncCurrentProfileToRuumrPlus();
    } catch (syncError) {
      console.error("Failed to sync team updates to Ruumr Plus:", syncError);
    }
    setIsSaving(false);
  };

  const addToTeam = async (matchId) => {
    const next = [...teamIds, matchId];
    setTeamIds(next);
    await saveToProfile(next, targetCount);
  };

  const removeFromTeam = async (matchId) => {
    const next = teamIds.filter(id => id !== matchId);
    setTeamIds(next);
    await saveToProfile(next, targetCount);
  };

  const handleTargetChange = async (val) => {
    setTargetCount(val);
    await saveToProfile(teamIds, val);
  };

  const teamMembers = allMatches.filter(m => teamIds.includes(m.id));
  const availableToAdd = allMatches.filter(m => !teamIds.includes(m.id));
  const currentCount = 1 + teamMembers.length;
  const remaining = Math.max(0, targetCount - currentCount);
  const progressPercent = Math.min(100, (currentCount / targetCount) * 100);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-orange-50">
        <div className="relative w-20 h-20 mb-6">
          {/* Outer rotating ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-3 border-transparent border-t-[--theme-orange] border-r-[--theme-orange]"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          {/* Inner pulsing circle */}
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-[--theme-orange] to-red-400 flex items-center justify-center animate-pulse">
            <UsersRound className="w-8 h-8 text-white" />
          </div>
        </div>
        <p className="text-gray-600 font-bold text-lg">טוען את הצוות שלך...</p>
        <p className="text-gray-400 text-xs mt-2">זה יקח רק שנייה</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28" dir="rtl">
      <div className="bg-white px-4 pt-6 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">הצוות שלי</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(createPageUrl('GroupChat'))}
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white font-bold px-3 py-2 rounded-full text-sm shadow-md active:scale-95 transition-transform"
            >
              <MessageCircle className="w-4 h-4" />
              צ'אט
            </button>
            <button
              onClick={() => navigate(createPageUrl('GroupCompatibility'))}
              className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-white font-bold px-3 py-2 rounded-full text-sm shadow-md active:scale-95 transition-transform"
            >
              <Puzzle className="w-4 h-4" />
              Vibe Check
            </button>
          </div>
        </div>
        <p className="text-gray-500 text-sm mt-1">מעקב אחר תהליך מציאת השותפים</p>
      </div>

      <div className="p-4 space-y-4">

        {/* Target Selector */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="font-bold text-gray-700 mb-3 text-right">כמה שותפים יש בדירה?</p>
          <div className="flex gap-2 justify-center">
            {[2, 3, 4, 5, 6].map(n => (
              <button
                key={n}
                onClick={() => handleTargetChange(n)}
                className={`w-12 h-12 rounded-full font-bold text-lg transition-all ${
                  targetCount === n ? 'gradient-orange text-white shadow-md scale-110' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="text-right">
              <p className="text-4xl font-bold text-[--theme-orange]">
                {currentCount}<span className="text-2xl text-gray-300">/{targetCount}</span>
              </p>
              <p className="text-sm text-gray-500 mt-0.5">
                {remaining === 0 ? '🎉 הצוות מלא!' : `חסרים עוד ${remaining} ${remaining === 1 ? 'אדם' : 'אנשים'}`}
              </p>
            </div>
            <div className="text-5xl flex items-center justify-center">
              {remaining === 0 ? (
                <img src="https://media.base44.com/images/public/68c919adff6ac6fafb51bed6/2509c2cb9_home1.png" className="w-12 h-12 object-contain" style={{ filter: 'invert(40%) sepia(90%) saturate(500%) hue-rotate(340deg) brightness(90%)' }} />
              ) : currentCount === 1 ? '🙋' : <UsersRound className="w-12 h-12 text-yellow-400" fill="#facc15" />}
            </div>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full gradient-orange rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>

        </div>

        {/* Team Members */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="font-bold text-gray-700 mb-4 text-right">ה Team</p>
          <div className="flex flex-wrap gap-3 justify-center">
            {/* Me */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-14 h-14 rounded-full overflow-hidden border-3 border-[--theme-orange] shadow-md ring-2 ring-orange-200">
                {myProfile?.photos?.[0] ? (
                  <img src={myProfile.photos[0]} className="w-full h-full object-cover" alt="אני" />
                ) : (
                  <div className="w-full h-full gradient-orange flex items-center justify-center text-white font-bold text-xl">
                    {user?.full_name?.[0] || '?'}
                  </div>
                )}
              </div>
              <span className="text-xs font-bold text-[--theme-orange]">אני</span>
            </div>

            <AnimatePresence>
              {teamMembers.map((match) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="flex flex-col items-center gap-1 relative"
                >
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-green-400 shadow-md ring-2 ring-green-100">
                      {match.photo ? (
                        <img src={match.photo} className="w-full h-full object-cover" alt={match.name} />
                      ) : (
                        <div className="w-full h-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-xl">
                          {match.name?.[0] || '?'}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeFromTeam(match.id)}
                      className="absolute -top-1 -left-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-sm"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                  <span className="text-xs font-medium text-gray-600 max-w-[56px] truncate text-center">{match.name?.split(' ')[0]}</span>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Empty slots */}
            {Array.from({ length: remaining }).map((_, i) => (
              <div key={`empty-${i}`} className="flex flex-col items-center gap-1">
                <div className="w-14 h-14 rounded-full border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center">
                  <span className="text-xl text-gray-300">?</span>
                </div>
                <span className="text-xs text-gray-400">פנוי</span>
              </div>
            ))}
          </div>

          {/* Add from matches */}
          {availableToAdd.length > 0 && remaining > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => setShowAddPanel(!showAddPanel)}
                className="flex items-center gap-2 text-[--theme-orange] font-bold text-sm mx-auto"
              >
                <UserPlus className="w-4 h-4" />
                הוסף מההתאמות שלי
              </button>

              <AnimatePresence>
                {showAddPanel && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 space-y-2">
                      {availableToAdd.map(match => (
                        <div key={match.id} className="flex items-center gap-3 p-2 rounded-xl bg-gray-50">
                          <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 flex-shrink-0">
                            {match.photo ? (
                              <img src={match.photo} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center font-bold text-gray-500">
                                {match.name?.[0]}
                              </div>
                            )}
                          </div>
                          <span className="flex-1 font-medium text-gray-800">{match.name?.split(' ')[0]}</span>
                          <button
                            onClick={() => addToTeam(match.id)}
                            className="flex items-center gap-1 bg-[--theme-orange] text-white text-xs font-bold px-3 py-1.5 rounded-full"
                          >
                            <Plus className="w-3 h-3" /> הוסף
                          </button>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Full team celebration */}
        {remaining === 0 && (
          <div className="gradient-orange rounded-2xl p-5 text-center">
            <div className="flex justify-center mb-2">
              <img src="https://media.base44.com/images/public/68c919adff6ac6fafb51bed6/2509c2cb9_home1.png" className="w-14 h-14 object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
            </div>
            <p className="font-bold text-white text-xl">ה Team מוכן 😎</p>
            <p className="text-white/80 text-sm mt-1">מצאת את כל השותפים שרצית. זמן לחפש דירה ביחד!</p>
          </div>
        )}

        {/* CTA - find more partners */}
        {remaining > 0 && (
          <button
            onClick={() => navigate(createPageUrl('Discover'))}
            className="w-full py-4 rounded-2xl gradient-orange text-white font-bold text-lg shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <Search className="w-5 h-5" />
            {`חפש שותפים`}
          </button>
        )}
      </div>
    </div>
  );
}
