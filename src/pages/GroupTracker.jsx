import React, { useState, useEffect, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { User } from "@/entities/User";
import { Profile } from "@/entities/Profile";
import { syncCurrentProfileToRuumrPlus } from "@/api/ruumrPlus";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, X, UserPlus, Search, Puzzle, UsersRound, MessageCircle, Clock, Mail, ChevronLeft } from "lucide-react";
import { listIncomingTeamInvites, respondToTeamInvite, requestTeamMember, removeTeamMember, reconcileMyTeam } from "@/api/teamInvites";
import { useToast } from "@/components/ui/use-toast";
import InviteByEmail from "@/components/team/InviteByEmail";
import TeamRequestCard from "@/components/team/TeamRequestCard";

export default function GroupTrackerPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [allMatches, setAllMatches] = useState([]);
  const [teamIds, setTeamIds] = useState([]);
  const [targetCount, setTargetCount] = useState(3);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState(null); // null = chooser, 'matches', 'email'
  const [isSaving, setIsSaving] = useState(false);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [pendingMembers, setPendingMembers] = useState([]);

  const loadData = useCallback(async () => {
    try {
      const userData = await User.me();
      setUser(userData);

      const profiles = await base44.entities.Profile.filter({ user_id: userData.id });
      if (profiles.length === 0) { navigate(createPageUrl('Discover')); return; }
      const prof = profiles[0];
      setMyProfile(prof);
      setTargetCount(prof.team_target || 3);

      // Load saved team from profile
      const savedTeamIds = (prof.team_members || []).map(m => m.match_id).filter(Boolean);
      setTeamIds(savedTeamIds);

      // Pending invited friends (added by email, awaiting approval/signup)
      setPendingMembers((prof.team_members || []).filter(m => m.pending && m.invite_id));

      // Incoming requests this user must approve
      try {
        setIncomingRequests(await listIncomingTeamInvites(userData.id));
      } catch (reqErr) { console.error(reqErr); }

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
  }, [navigate]);

  const reconciledRef = useRef(false);
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      // Heal legacy one-sided team membership so the roster is symmetric (once per visit).
      if (!reconciledRef.current) {
        reconciledRef.current = true;
        try { await reconcileMyTeam(); } catch (e) { console.error(e); }
      }
      await loadData();
      setIsLoading(false);
    })();
  }, [loadData]);

  const cancelPendingInvite = async (inviteId) => {
    setPendingMembers(prev => prev.filter(m => m.invite_id !== inviteId));
    try {
      await respondToTeamInvite(inviteId, 'cancel');
    } catch (e) { console.error(e); }
    await loadData();
  };

  const handleRequestResolved = async () => {
    await loadData();
  };

  // team_target is the only membership-adjacent value still written from the client;
  // the shared roster (team_members) is owned by the backend roster-sync functions.
  const saveTarget = async (newTarget) => {
    if (!myProfile) return;
    setIsSaving(true);
    await Profile.update(myProfile.id, { team_target: newTarget });
    try {
      await syncCurrentProfileToRuumrPlus();
    } catch (syncError) {
      console.error("Failed to sync team updates to Ruumr Plus:", syncError);
    }
    setIsSaving(false);
  };

  const openAddModal = () => {
    setAddMode(null);
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setAddMode(null);
  };

  // Adding a teammate sends an approval request (they aren't added until they confirm).
  // Removing goes through the backend so every member's roster stays in sync.
  const addToTeam = async (partnerUserId, partnerName) => {
    setIsSaving(true);
    try {
      const res = await requestTeamMember(partnerUserId, partnerName);
      if (res?.status === 'already_member') {
        toast({ title: `${partnerName || 'השותף/ה'} כבר בצוות שלך` });
      } else if (res?.status === 'already_pending') {
        toast({ title: 'כבר שלחת בקשה — ממתינים לאישור' });
      } else {
        toast({ title: `נשלחה בקשה ל${partnerName || 'שותף/ה'} 🤝 — יתווסף/ה לצוות לאחר אישור`, duration: 3500 });
      }
    } catch (e) { console.error(e); }
    setIsSaving(false);
    closeAddModal();
  };

  const removeFromTeam = async (partnerUserId) => {
    setIsSaving(true);
    try {
      await removeTeamMember(partnerUserId);
    } catch (e) { console.error(e); }
    await loadData();
    setIsSaving(false);
  };

  const handleTargetChange = async (val) => {
    setTargetCount(val);
    await saveTarget(val);
  };

  const teamMembers = allMatches.filter(m => teamIds.includes(m.id));
  const availableToAdd = allMatches.filter(m => !teamIds.includes(m.id));
  const currentCount = 1 + teamMembers.length + pendingMembers.length;
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

        {/* Incoming team requests */}
        {incomingRequests.length > 0 && (
          <div className="space-y-2">
            <p className="font-bold text-gray-700 text-right text-sm">בקשות הצטרפות לצוות</p>
            <AnimatePresence>
              {incomingRequests.map((invite) => (
                <TeamRequestCard key={invite.id} invite={invite} onResolved={handleRequestResolved} />
              ))}
            </AnimatePresence>
          </div>
        )}

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
                      onClick={() => removeFromTeam(match.partnerId)}
                      className="absolute -top-1 -left-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-sm"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                  <span className="text-xs font-medium text-gray-600 max-w-[56px] truncate text-center">{match.name?.split(' ')[0]}</span>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Pending invited friends (by email) */}
            <AnimatePresence>
              {pendingMembers.map((member) => (
                <motion.div
                  key={member.invite_id}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="flex flex-col items-center gap-1 relative"
                >
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-dashed border-orange-300 bg-orange-50 flex items-center justify-center">
                      <span className="text-orange-500 font-bold text-xl">{member.name?.[0] || '?'}</span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-orange-400 rounded-full flex items-center justify-center shadow-sm">
                      <Clock className="w-3 h-3 text-white" />
                    </div>
                    <button
                      onClick={() => cancelPendingInvite(member.invite_id)}
                      className="absolute -top-1 -left-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-sm"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                  <span className="text-xs font-medium text-orange-500 max-w-[56px] truncate text-center">
                    {member.name?.split(' ')[0]}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Empty slots — the first open slot is the "add member" button */}
            {Array.from({ length: remaining }).map((_, i) => (
              i === 0 ? (
                <button
                  key="add-slot"
                  onClick={openAddModal}
                  className="flex flex-col items-center gap-1"
                >
                  <div className="w-14 h-14 rounded-full border-2 border-dashed border-[--theme-orange] bg-orange-50 flex items-center justify-center active:scale-95 transition-transform">
                    <Plus className="w-6 h-6 text-[--theme-orange]" />
                  </div>
                  <span className="text-xs font-bold text-[--theme-orange]">הוסף</span>
                </button>
              ) : (
                <div key={`empty-${i}`} className="flex flex-col items-center gap-1">
                  <div className="w-14 h-14 rounded-full border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center">
                    <span className="text-xl text-gray-300">?</span>
                  </div>
                  <span className="text-xs text-gray-400">פנוי</span>
                </div>
              )
            ))}
          </div>

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

      {/* Add member modal: choose between matches and email invite */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-end justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeAddModal} />
            <motion.div
              className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh]"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)' }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 320 }}
              dir="rtl"
            >
              {/* Grab handle */}
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-10 h-1.5 rounded-full bg-gray-200" />
              </div>

              {/* Header */}
              <div className="flex items-center gap-2 px-5 pt-2 pb-4 flex-shrink-0">
                {addMode !== null && (
                  <button
                    onClick={() => setAddMode(null)}
                    aria-label="חזרה"
                    className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:scale-95 transition-transform"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600 -scale-x-100" />
                  </button>
                )}
                <h3 className="flex-1 text-xl font-bold text-gray-900 text-right">
                  {addMode === 'matches' ? 'מההתאמות שלי' : addMode === 'email' ? 'הזמנה במייל' : 'הוספת שותף/ה לצוות'}
                </h3>
                <button
                  onClick={closeAddModal}
                  aria-label="סגור"
                  className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:scale-95 transition-transform"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              <div className="px-5 overflow-y-auto flex-1 min-h-0">
                {/* Chooser */}
                {addMode === null && (
                  <div className="space-y-3 pb-1">
                    <button
                      onClick={() => setAddMode('matches')}
                      className="w-full flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-orange-50 to-white border border-orange-100 shadow-sm active:scale-[0.98] transition-transform"
                    >
                      <div className="w-12 h-12 rounded-2xl gradient-orange flex items-center justify-center flex-shrink-0 shadow-md shadow-orange-200">
                        <UserPlus className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-right flex-1">
                        <p className="font-bold text-gray-900">מההתאמות שלי</p>
                        <p className="text-xs text-gray-500 mt-0.5">הוסף/י מישהו שכבר עשית איתו מאץ'</p>
                      </div>
                      <ChevronLeft className="w-5 h-5 text-orange-300 flex-shrink-0" />
                    </button>
                    <button
                      onClick={() => setAddMode('email')}
                      className="w-full flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 shadow-sm active:scale-[0.98] transition-transform"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-gray-800 flex items-center justify-center flex-shrink-0 shadow-md shadow-gray-200">
                        <Mail className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-right flex-1">
                        <p className="font-bold text-gray-900">הזמנה במייל</p>
                        <p className="text-xs text-gray-500 mt-0.5">יש לך חבר/ה שכבר בצוות? הזמן/י אותם</p>
                      </div>
                      <ChevronLeft className="w-5 h-5 text-gray-300 flex-shrink-0" />
                    </button>
                  </div>
                )}

                {/* Add from matches */}
                {addMode === 'matches' && (
                  <div className="space-y-2 pb-1">
                    {availableToAdd.length === 0 ? (
                      <div className="text-center py-10">
                        <UsersRound className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">אין התאמות זמינות להוספה</p>
                      </div>
                    ) : (
                      availableToAdd.map(match => (
                        <div key={match.id} className="flex items-center gap-3 p-2.5 rounded-2xl bg-gray-50 border border-gray-100">
                          <div className="w-11 h-11 rounded-full overflow-hidden border border-gray-200 flex-shrink-0">
                            {match.photo ? (
                              <img src={match.photo} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center font-bold text-gray-500">
                                {match.name?.[0]}
                              </div>
                            )}
                          </div>
                          <span className="flex-1 font-bold text-gray-800">{match.name?.split(' ')[0]}</span>
                          <button
                            onClick={() => addToTeam(match.partnerId, match.name)}
                            disabled={isSaving}
                            className="flex items-center gap-1 gradient-orange text-white text-xs font-bold px-4 py-2 rounded-full shadow-sm active:scale-95 transition-transform disabled:opacity-60"
                          >
                            <Plus className="w-3.5 h-3.5" /> הוסף
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Invite by email */}
                {addMode === 'email' && (
                  <InviteByEmail compact onInvited={loadData} />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
