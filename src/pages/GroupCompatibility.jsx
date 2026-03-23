import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { User } from "@/entities/User";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowRight, Puzzle, CheckCircle2, Clock, ChevronRight, Users } from "lucide-react";

const CHARTER_DATA_QUESTIONS = [
  { id: "q_smoking" }, { id: "q_partners" }, { id: "q_pets" },
  { id: "q_cleaning_strictness" }, { id: "q_shopping" },
  { id: "q_dishes" }, { id: "q_ac" }, { id: "q_hosting" }
];
const TOTAL_Q = CHARTER_DATA_QUESTIONS.length;

function CompatibilityRing({ percent, size = 80 }) {
  const r = (size / 2) - 8;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  const color = percent >= 75 ? "#22c55e" : percent >= 50 ? "#f97316" : "#ef4444";

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={6} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />
    </svg>
  );
}

export default function GroupCompatibilityPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [compatibility, setCompatibility] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const userData = await User.me();
        setUser(userData);

        const profiles = await base44.entities.Profile.filter({ user_id: userData.id });
        if (profiles.length === 0) { navigate(createPageUrl('GroupTracker')); return; }
        const prof = profiles[0];
        setMyProfile(prof);

        const savedTeam = prof.team_members || [];
        if (savedTeam.length === 0) {
          setIsLoading(false);
          return;
        }

        setTeamMembers(savedTeam);

        // For each team member, load charter answers for both sides
        const compatibilityMap = {};
        await Promise.all(savedTeam.map(async (member) => {
          const matchId = member.match_id;
          if (!matchId) return;

          const [myAnswers, theirAnswers] = await Promise.all([
            base44.entities.CharterAnswer.filter({ match_id: matchId, user_id: userData.id }),
            base44.entities.CharterAnswer.filter({ match_id: matchId })
              .then(all => all.filter(a => a.user_id !== userData.id))
          ]);

          const myMap = {};
          myAnswers.forEach(a => { myMap[a.question_id] = a.answer; });

          const theirMap = {};
          theirAnswers.forEach(a => { theirMap[a.question_id] = a.answer; });

          const myCount = Object.keys(myMap).length;
          const theirCount = Object.keys(theirMap).length;

          let matches = 0;
          let compared = 0;
          CHARTER_DATA_QUESTIONS.forEach(q => {
            if (myMap[q.id] && theirMap[q.id]) {
              compared++;
              if (myMap[q.id] === theirMap[q.id]) matches++;
            }
          });

          compatibilityMap[matchId] = {
            myAnswered: myCount,
            theirAnswered: theirCount,
            percent: compared > 0 ? Math.round((matches / compared) * 100) : null,
            compared
          };
        }));

        setCompatibility(compatibilityMap);
      } catch (e) {
        console.error(e);
      }
      setIsLoading(false);
    };
    load();
  }, []);

  const getStatusLabel = (compat) => {
    if (!compat) return { text: "טרם התחיל", color: "text-gray-400", icon: Clock };
    if (compat.myAnswered < TOTAL_Q) return { text: "ממתין לתשובות שלך", color: "text-orange-500", icon: Clock };
    if (compat.theirAnswered < TOTAL_Q) return { text: "ממתין לשותף/ה", color: "text-blue-500", icon: Clock };
    if (compat.percent >= 75) return { text: "התאמה מעולה! 🔥", color: "text-green-500", icon: CheckCircle2 };
    if (compat.percent >= 50) return { text: "התאמה סבירה", color: "text-orange-500", icon: CheckCircle2 };
    return { text: "יש הבדלים משמעותיים", color: "text-red-500", icon: CheckCircle2 };
  };

  const overallScore = (() => {
    const scores = Object.values(compatibility).filter(c => c.percent !== null);
    if (scores.length === 0) return null;
    return Math.round(scores.reduce((s, c) => s + c.percent, 0) / scores.length);
  })();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}>
          <Puzzle className="w-10 h-10 text-[--theme-orange]" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28" dir="rtl">
      {/* Header */}
      <div className="bg-white px-4 pt-6 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => navigate(createPageUrl('GroupTracker'))} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowRight className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Puzzle className="w-6 h-6 text-[--theme-orange]" />
            Group Vibe Check
          </h1>
        </div>
        <p className="text-gray-500 text-sm mr-10">בדיקת התאמה בין כל חברי הצוות</p>
      </div>

      <div className="p-4 space-y-4">

        {/* Overall Score */}
        {overallScore !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-400 rounded-2xl p-5 text-center text-white"
          >
            <p className="text-white/80 text-sm font-bold mb-1">ציון הצוות הכולל</p>
            <p className="text-6xl font-black">{overallScore}%</p>
            <p className="text-white/80 text-sm mt-1">
              {overallScore >= 75 ? "הצוות הזה יתחבר מעולה! 🔥" : overallScore >= 50 ? "יש פוטנציאל, כדאי לדבר על ההבדלים" : "כדאי לבדוק טוב טוב לפני שסוגרים"}
            </p>
          </motion.div>
        )}

        {/* Team avatars row */}
        {teamMembers.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-sm font-bold text-gray-500 mb-3">חברי הצוות</p>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[--theme-orange] shadow">
                  {myProfile?.photos?.[0] ? (
                    <img src={myProfile.photos[0]} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full gradient-orange flex items-center justify-center text-white font-black">
                      {user?.full_name?.[0]}
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-bold text-[--theme-orange]">אני</span>
              </div>
              {teamMembers.map((m, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200 shadow">
                    {m.photo ? (
                      <img src={m.photo} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center font-black text-gray-500">
                        {m.name?.[0]}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-medium text-gray-500 max-w-[48px] truncate text-center">{m.name?.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No team members */}
        {teamMembers.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-bold text-gray-600 mb-1">עוד אין חברי צוות</p>
            <p className="text-gray-400 text-sm mb-4">הוסף שותפים מהצוות שלך כדי לבדוק התאמה</p>
            <button
              onClick={() => navigate(createPageUrl('GroupTracker'))}
              className="gradient-orange text-white font-bold px-6 py-2.5 rounded-full text-sm"
            >
              לבניית הצוות
            </button>
          </div>
        )}

        {/* Compatibility Cards */}
        {teamMembers.map((member, i) => {
          const compat = compatibility[member.match_id];
          const status = getStatusLabel(compat);
          const StatusIcon = status.icon;
          const myDone = compat ? compat.myAnswered >= TOTAL_Q : false;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-gray-200 flex-shrink-0">
                  {member.photo ? (
                    <img src={member.photo} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center font-black text-gray-400 text-xl">
                      {member.name?.[0]}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <p className="font-bold text-gray-900">{member.name?.split(' ')[0]}</p>
                  <div className={`flex items-center gap-1 text-xs font-medium mt-0.5 ${status.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {status.text}
                  </div>

                </div>

                {/* Score ring or CTA */}
                <div className="flex-shrink-0 flex flex-col items-center gap-1">
                  {compat?.percent !== null && compat?.percent !== undefined ? (
                    <div className="relative flex items-center justify-center">
                      <CompatibilityRing percent={compat.percent} size={64} />
                      <span className="absolute text-sm font-black text-gray-800">{compat.percent}%</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => navigate(createPageUrl('Charter') + `?matchId=${member.match_id}`)}
                      className="gradient-orange text-white text-xs font-bold px-3 py-2 rounded-full flex items-center gap-1 shadow"
                    >
                      <Puzzle className="w-3 h-3" />
                      התחל
                    </button>
                  )}
                  {!myDone && compat?.myAnswered < TOTAL_Q && (
                    <button
                      onClick={() => navigate(createPageUrl('Charter') + `?matchId=${member.match_id}`)}
                      className="text-[10px] font-bold text-[--theme-orange] mt-1 underline"
                    >
                      {compat?.myAnswered > 0 ? "המשך שאלון" : "מלא שאלון"}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Tip */}
        {teamMembers.length > 0 && (
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 text-center">
            <p className="text-orange-700 text-sm font-medium">
              💡 כדי לראות תוצאות, גם אתה/ת וגם השותפים צריכים למלא את השאלון
            </p>
          </div>
        )}
      </div>
    </div>
  );
}