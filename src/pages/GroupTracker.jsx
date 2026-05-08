import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { User } from "@/entities/User";
import { Profile } from "@/entities/Profile";
import { syncCurrentProfileToRuumrPlus } from "@/api/ruumrPlus";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, X, UserPlus, Search, Puzzle, UsersRound, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PremiumCard,
  PremiumPageFrame,
  PremiumPill,
  PremiumStat,
} from "@/components/shared/PremiumPageFrame";

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
      <div className="flex min-h-[100dvh] items-center justify-center bg-[linear-gradient(180deg,#fffaf6_0%,#fff_100%)]" dir="rtl">
        <div className="flex flex-col items-center gap-4">
          <motion.div
            className="flex h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ff8a4c_0%,#ff5f2f_100%)] text-white shadow-[0_18px_40px_rgba(255,122,69,0.28)]"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <UsersRound className="h-8 w-8" />
          </motion.div>
          <p className="text-sm font-medium text-slate-500">טוען את הצוות שלך...</p>
        </div>
      </div>
    );
  }

  return (
    <PremiumPageFrame
      icon={UsersRound}
      eyebrow="צוות ושיתוף"
      title="הצוות שלי"
      subtitle="כאן מחזיקים את תהליך חיפוש השותפים במקום אחד, עם יעד ברור, התקדמות ודרך קלה להוסיף עוד אנשים."
      badge={<PremiumPill tone="orange">{currentCount}/{targetCount} בצוות</PremiumPill>}
      actions={<PremiumPill tone={remaining === 0 ? "emerald" : "blue"}>{remaining === 0 ? "צוות מלא" : `נשארו ${remaining}`}</PremiumPill>}
    >
      <PremiumCard>
        <div className="grid gap-3 sm:grid-cols-3">
          <PremiumStat label="נוכחי" value={currentCount} tone="orange" />
          <PremiumStat label="חסרים" value={remaining} tone="blue" />
          <PremiumStat label="יעד" value={targetCount} tone="emerald" />
        </div>
        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-[--theme-orange]">Progress</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {remaining === 0 ? "הצוות מלא ומוכן להתקדם." : `נשארו עוד ${remaining} ${remaining === 1 ? "אדם" : "אנשים"} כדי לסגור את הקבוצה.`}
            </p>
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ff8a4c_0%,#ff5f2f_100%)] text-white shadow-[0_18px_40px_rgba(255,122,69,0.28)]">
            {remaining === 0 ? (
              <img
                src="https://media.base44.com/images/public/68c919adff6ac6fafb51bed6/2509c2cb9_home1.png"
                className="h-8 w-8 object-contain brightness-0 invert"
                alt=""
              />
            ) : (
              <UsersRound className="h-8 w-8" />
            )}
          </div>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
          <motion.div
            className="h-full rounded-full bg-[linear-gradient(135deg,#ff8a4c_0%,#ff5f2f_100%)]"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </PremiumCard>

      <PremiumCard>
        <div className="flex items-center justify-between gap-3">
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-[--theme-orange]">Target</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">כמה שותפים יש בדירה?</h2>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {[2, 3, 4, 5, 6].map((n) => (
            <button
              key={n}
              onClick={() => handleTargetChange(n)}
              className={`h-12 min-w-12 rounded-full px-4 font-black transition-all ${
                targetCount === n
                  ? "bg-[linear-gradient(135deg,#ff8a4c_0%,#ff5f2f_100%)] text-white shadow-[0_18px_40px_rgba(255,122,69,0.28)]"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </PremiumCard>

      <PremiumCard>
        <div className="flex items-center justify-between gap-3">
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-[--theme-orange]">Roster</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">מי כבר בצוות?</h2>
          </div>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-500">
            {teamMembers.length} חברים
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-start justify-center gap-3">
          <div className="flex flex-col items-center gap-1">
            <div className="h-14 w-14 overflow-hidden rounded-full border-2 border-[--theme-orange] shadow-md ring-2 ring-orange-100">
              {myProfile?.photos?.[0] ? (
                <img src={myProfile.photos[0]} className="h-full w-full object-cover" alt="אני" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#ff8a4c_0%,#ff5f2f_100%)] text-lg font-black text-white">
                  {user?.full_name?.[0] || "?"}
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
                  <div className="h-14 w-14 overflow-hidden rounded-full border-2 border-emerald-400 shadow-md ring-2 ring-emerald-100">
                    {match.photo ? (
                      <img src={match.photo} className="h-full w-full object-cover" alt={match.name} />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-emerald-50 text-lg font-black text-emerald-700">
                        {match.name?.[0] || "?"}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => removeFromTeam(match.id)}
                    className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 shadow-sm"
                  >
                    <X className="h-3 w-3 text-white" />
                  </button>
                </div>
                <span className="max-w-[64px] truncate text-center text-xs font-medium text-slate-600">
                  {match.name?.split(" ")[0]}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>

          {Array.from({ length: remaining }).map((_, i) => (
            <div key={`empty-${i}`} className="flex flex-col items-center gap-1">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-slate-200 bg-slate-50">
                <span className="text-xl text-slate-300">?</span>
              </div>
              <span className="text-xs text-slate-400">פנוי</span>
            </div>
          ))}
        </div>

        {availableToAdd.length > 0 && remaining > 0 && (
          <div className="mt-5 border-t border-slate-100 pt-5">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowAddPanel(!showAddPanel)}
              className="mx-auto flex rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <UserPlus className="ml-2 h-4 w-4" />
              הוסף/י מההתאמות שלי
            </Button>

            <AnimatePresence>
              {showAddPanel && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 space-y-2">
                    {availableToAdd.map((match) => (
                      <div key={match.id} className="flex items-center gap-3 rounded-[1.35rem] bg-slate-50 px-3 py-2.5">
                        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border border-slate-200">
                          {match.photo ? (
                            <img src={match.photo} className="h-full w-full object-cover" alt={match.name} />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-slate-200 font-bold text-slate-500">
                              {match.name?.[0]}
                            </div>
                          )}
                        </div>
                        <span className="flex-1 text-right font-medium text-slate-800">{match.name?.split(" ")[0]}</span>
                        <Button
                          onClick={() => addToTeam(match.id)}
                          className="rounded-full bg-[linear-gradient(135deg,#ff8a4c_0%,#ff5f2f_100%)] text-white shadow-[0_18px_40px_rgba(255,122,69,0.22)]"
                        >
                          <Plus className="ml-1 h-3 w-3" />
                          הוסף
                        </Button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </PremiumCard>

      {remaining === 0 ? (
        <PremiumCard>
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[1.35rem] bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
              <img
                src="https://media.base44.com/images/public/68c919adff6ac6fafb51bed6/2509c2cb9_home1.png"
                className="h-8 w-8 object-contain brightness-0 invert"
                alt=""
              />
            </div>
            <p className="mt-4 text-2xl font-black text-slate-950">הצוות מוכן 😎</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">מצאת את כל השותפים שרצית. זמן להתקדם לשלב הבא.</p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Button
              onClick={() => navigate(createPageUrl("GroupChat"))}
              className="w-full rounded-[18px] bg-[linear-gradient(135deg,#ff8a4c_0%,#ff5f2f_100%)] text-white shadow-[0_18px_40px_rgba(255,122,69,0.28)]"
            >
              <MessageCircle className="ml-2 h-4 w-4" />
              צ'אט צוות
            </Button>
            <Button
              onClick={() => navigate(createPageUrl("GroupCompatibility"))}
              variant="ghost"
              className="w-full rounded-[18px] border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <Puzzle className="ml-2 h-4 w-4" />
              Vibe Check
            </Button>
          </div>
        </PremiumCard>
      ) : (
        <PremiumCard>
          <Button
            onClick={() => navigate(createPageUrl("Discover"))}
            className="w-full rounded-[18px] bg-[linear-gradient(135deg,#ff8a4c_0%,#ff5f2f_100%)] text-white shadow-[0_18px_40px_rgba(255,122,69,0.28)]"
          >
            <Search className="ml-2 h-4 w-4" />
            חפש/י שותפים נוספים
          </Button>
        </PremiumCard>
      )}
    </PremiumPageFrame>
  );
}
