import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { User } from "@/entities/User";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Puzzle, CheckCircle2, Clock, Users, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PremiumCard,
  PremiumPageFrame,
  PremiumPill,
} from "@/components/shared/PremiumPageFrame";

const CHARTER_QUESTIONS = [
  { id: "q_smoking", title: "עישון בדירה", emoji: "🚬", option_a: "בכיף, חופשי בסלון", option_b: "רק בחוץ/במרפסת", compromise: "מעשנים רק במרפסת (עם דלת סגורה!)" },
  { id: "q_partners", title: "בני/בנות זוג", emoji: "😍", option_a: "בית פתוח – שיישנו פה חופשי", option_b: "גג פעמיים בשבוע", compromise: "עד 3 לילות בשבוע. מעבר לזה? משתתפים בחשבונות." },
  { id: "q_pets", title: "בעלי חיים", emoji: "🐶", option_a: "מת על חיות, תביאו הכל", option_b: "אלרגי / לא מתחבר", compromise: "חייבים להסכים מראש – אין פשרה." },
  { id: "q_cleaning_strictness", title: "ניקיון – עד כמה מקפידים?", emoji: "🧹", option_a: "חייב להיות מצוחצח תמיד", option_b: "מנקים כשרואים לכלוך", compromise: "ניקיון יסודי פעם בשבוע, שאר הזמן – סביר." },
  { id: "q_shopping", title: "קניות לבית", emoji: "🛒", option_a: "שותפות מלאה – קונים יחד", option_b: "הפרדה – כל אחד לעצמו", compromise: "קופה משותפת לדברים בסיסיים, אוכל בנפרד." },
  { id: "q_dishes", title: "כלים בכיור", emoji: "🍽️", option_a: "שוטפים מיד אחרי האוכל!", option_b: "שוטפים כשמצטבר", compromise: "חוק ה-24 שעות: הכיור ריק לפני השינה." },
  { id: "q_ac", title: "מלחמות המזגן", emoji: "❄️", option_a: "מקפיא! 18 מעלות", option_b: "חסכוני – 24 מעלות", compromise: "23 מעלות ביום, בלילה כל אחד בחדרו מחליט." },
  { id: "q_hosting", title: "חברים ומסיבות", emoji: "🎉", option_a: "תמיד שמח, הבית פתוח", option_b: "צריך שקט, לתאם מראש", compromise: "מותר לארח, אבל אחרי 23:00 שקט בסלון." },
];

function CompatibilityRing({ percent, size = 80 }) {
  const r = (size / 2) - 8;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  const color = percent >= 75 ? "#22c55e" : percent >= 50 ? "#f97316" : "#ef4444";

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={6} />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />
    </svg>
  );
}

function BreakdownPanel({ myMap, theirMap, memberName }) {
  const [open, setOpen] = useState(false);

  const agrees = [];
  const disagrees = [];

  CHARTER_QUESTIONS.forEach((q) => {
    const mine = myMap[q.id];
    const theirs = theirMap[q.id];
    if (!mine || !theirs) return;
    if (mine === theirs) {
      agrees.push(q);
    } else {
      disagrees.push(q);
    }
  });

  return (
    <div className="mt-4 border-t border-slate-100 pt-4">
      <button
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between text-xs font-bold text-slate-500 hover:text-slate-700"
      >
        <span>פירוט הסכמות / חוסר הסכמות</span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-3">
              {agrees.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[11px] font-bold text-emerald-600">✅ מסכימים ({agrees.length})</p>
                  <div className="space-y-1">
                    {agrees.map((q) => (
                      <div key={q.id} className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2">
                        <span className="text-base">{q.emoji}</span>
                        <span className="text-xs font-medium text-slate-700">{q.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {disagrees.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[11px] font-bold text-rose-500">❌ לא מסכימים ({disagrees.length})</p>
                  <div className="space-y-2">
                    {disagrees.map((q) => (
                      <div key={q.id} className="rounded-xl bg-rose-50 px-3 py-2">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="text-base">{q.emoji}</span>
                          <span className="text-xs font-bold text-slate-700">{q.title}</span>
                        </div>
                        <div className="mb-1 flex flex-wrap gap-2 text-[10px] text-slate-500">
                          <span className="rounded-full bg-orange-50 px-2 py-0.5 font-medium text-[--theme-orange]">
                            אני: {myMap[q.id] === "a" ? q.option_a : q.option_b}
                          </span>
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 font-medium text-blue-700">
                            {memberName}: {theirMap[q.id] === "a" ? q.option_a : q.option_b}
                          </span>
                        </div>
                        <p className="text-[10px] font-medium text-slate-500">💡 פשרה: {q.compromise}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
        if (profiles.length === 0) {
          navigate(createPageUrl("GroupTracker"));
          return;
        }

        const prof = profiles[0];
        setMyProfile(prof);

        const savedTeam = prof.team_members || [];
        if (savedTeam.length === 0) {
          setIsLoading(false);
          return;
        }

        setTeamMembers(savedTeam);

        const compatibilityMap = {};
        await Promise.all(
          savedTeam.map(async (member) => {
            const matchId = member.match_id;
            if (!matchId) return;

            const [myAnswers, allAnswers] = await Promise.all([
              base44.entities.CharterAnswer.filter({ match_id: matchId, user_id: userData.id }),
              base44.entities.CharterAnswer.filter({ match_id: matchId }),
            ]);

            const theirAnswers = allAnswers.filter((answer) => answer.user_id !== userData.id);

            const myMap = {};
            myAnswers.forEach((answer) => {
              myMap[answer.question_id] = answer.answer;
            });

            const theirMap = {};
            theirAnswers.forEach((answer) => {
              theirMap[answer.question_id] = answer.answer;
            });

            let matches = 0;
            let compared = 0;
            CHARTER_QUESTIONS.forEach((question) => {
              if (myMap[question.id] && theirMap[question.id]) {
                compared += 1;
                if (myMap[question.id] === theirMap[question.id]) {
                  matches += 1;
                }
              }
            });

            compatibilityMap[matchId] = {
              myAnswered: Object.keys(myMap).length,
              theirAnswered: Object.keys(theirMap).length,
              percent: compared > 0 ? Math.round((matches / compared) * 100) : null,
              compared,
              myMap,
              theirMap,
            };
          })
        );

        setCompatibility(compatibilityMap);
      } catch (error) {
        console.error(error);
      }
      setIsLoading(false);
    };

    load();
  }, [navigate]);

  const getStatusLabel = (compat) => {
    if (!compat) return { text: "טרם התחיל", color: "text-slate-400", icon: Clock };
    if (compat.myAnswered < 8) return { text: "ממתין לתשובות שלך", color: "text-orange-500", icon: Clock };
    if (compat.theirAnswered < 8) return { text: "ממתין לשותף/ה", color: "text-blue-500", icon: Clock };
    if (compat.percent >= 75) return { text: "התאמה מעולה! 🔥", color: "text-emerald-600", icon: CheckCircle2 };
    if (compat.percent >= 50) return { text: "התאמה סבירה", color: "text-orange-500", icon: CheckCircle2 };
    return { text: "יש הבדלים משמעותיים", color: "text-rose-500", icon: CheckCircle2 };
  };

  const overallScore = (() => {
    const scores = Object.values(compatibility).filter((item) => item.percent !== null);
    if (scores.length === 0) return null;
    return Math.round(scores.reduce((sum, item) => sum + item.percent, 0) / scores.length);
  })();

  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[linear-gradient(180deg,#fffaf6_0%,#fff_100%)]" dir="rtl">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}>
          <Puzzle className="h-10 w-10 text-[--theme-orange]" />
        </motion.div>
      </div>
    );
  }

  return (
    <PremiumPageFrame
      icon={Puzzle}
      eyebrow="קשרי צוות"
      title="Group Vibe Check"
      subtitle="בדיקה מהירה של ההתאמה בין כל חברי הצוות, עם פירוט איפה זורם ואיפה צריך שיחה קצרה."
      backTo={createPageUrl("GroupTracker")}
      backLabel="חזרה לצוות"
      badge={<PremiumPill tone="orange">{overallScore !== null ? `${overallScore}% ממוצע` : "אין ציון עדיין"}</PremiumPill>}
      actions={<PremiumPill tone="neutral">{teamMembers.length} חברי צוות</PremiumPill>}
    >
      {overallScore !== null && (
        <PremiumCard>
          <div className="flex items-center justify-between gap-4">
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-[--theme-orange]">Score</p>
              <h2 className="mt-2 text-4xl font-black text-slate-950">{overallScore}%</h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                {overallScore >= 75
                  ? "הצוות הזה יתחבר מעולה."
                  : overallScore >= 50
                    ? "יש כאן פוטנציאל, רק צריך לכוון ציפיות."
                    : "כדאי לשוחח לעומק לפני שסוגרים."}
              </p>
            </div>
            <div className="relative flex items-center justify-center">
              <CompatibilityRing percent={overallScore} size={84} />
              <span className="absolute text-lg font-black text-slate-800">{overallScore}%</span>
            </div>
          </div>
        </PremiumCard>
      )}

      {teamMembers.length > 0 ? (
        <PremiumCard>
          <div className="flex items-center justify-between gap-3">
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-[--theme-orange]">Members</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">חברי הצוות</h2>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="flex flex-col items-center gap-1">
              <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-[--theme-orange] shadow">
                {myProfile?.photos?.[0] ? (
                  <img src={myProfile.photos[0]} className="h-full w-full object-cover" alt="אני" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#ff8a4c_0%,#ff5f2f_100%)] text-lg font-black text-white">
                    {user?.full_name?.[0]}
                  </div>
                )}
              </div>
              <span className="text-[10px] font-bold text-[--theme-orange]">אני</span>
            </div>
            {teamMembers.map((member, index) => (
              <div key={index} className="flex flex-col items-center gap-1">
                <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-slate-200 shadow">
                  {member.photo ? (
                    <img src={member.photo} className="h-full w-full object-cover" alt={member.name} />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-100 font-black text-slate-500">
                      {member.name?.[0]}
                    </div>
                  )}
                </div>
                <span className="max-w-[56px] truncate text-center text-[10px] font-medium text-slate-500">
                  {member.name?.split(" ")[0]}
                </span>
              </div>
            ))}
          </div>
        </PremiumCard>
      ) : (
        <PremiumCard>
          <div className="text-center">
            <Users className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-3 text-xl font-black text-slate-700">עוד אין חברי צוות</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">הוסף/י שותפים מהצוות שלך כדי לבדוק התאמה אמיתית.</p>
            <Button
              onClick={() => navigate(createPageUrl("GroupTracker"))}
              className="mt-4 rounded-[18px] bg-[linear-gradient(135deg,#ff8a4c_0%,#ff5f2f_100%)] text-white shadow-[0_18px_40px_rgba(255,122,69,0.28)]"
            >
              לבניית הצוות
            </Button>
          </div>
        </PremiumCard>
      )}

      {teamMembers.map((member, index) => {
        const compat = compatibility[member.match_id];
        const status = getStatusLabel(compat);
        const StatusIcon = status.icon;
        const myDone = compat ? compat.myAnswered >= 8 : false;
        const theirDone = compat ? compat.theirAnswered >= 8 : false;
        const bothDone = myDone && theirDone;

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
          >
            <PremiumCard>
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-full border-2 border-slate-200">
                  {member.photo ? (
                    <img src={member.photo} className="h-full w-full object-cover" alt={member.name} />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-100 font-black text-xl text-slate-400">
                      {member.name?.[0]}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1 text-right">
                  <p className="font-bold text-slate-950">{member.name?.split(" ")[0]}</p>
                  <div className={`mt-1 flex items-center justify-end gap-1 text-xs font-medium ${status.color}`}>
                    {status.text}
                    <StatusIcon className="h-3 w-3" />
                  </div>

                  {!bothDone && (
                    <div className="mt-2 flex flex-wrap justify-end gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ${myDone ? "bg-emerald-50 text-emerald-700 ring-emerald-100" : "bg-orange-50 text-[--theme-orange] ring-orange-100"}`}>
                        {myDone ? "✓ מילאתי" : "⏳ לא מילאתי"}
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ${theirDone ? "bg-emerald-50 text-emerald-700 ring-emerald-100" : "bg-blue-50 text-blue-700 ring-blue-100"}`}>
                        {theirDone ? `✓ ${member.name?.split(" ")[0]} מילא/ה` : `⏳ ${member.name?.split(" ")[0]} טרם מילא/ה`}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex-shrink-0">
                  {bothDone && compat?.percent !== null ? (
                    <div className="relative flex items-center justify-center">
                      <CompatibilityRing percent={compat.percent} size={64} />
                      <span className="absolute text-sm font-black text-slate-800">{compat.percent}%</span>
                    </div>
                  ) : (
                    !myDone && (
                      <Button
                        onClick={() => navigate(createPageUrl("Charter") + `?matchId=${member.match_id}`)}
                        className="rounded-full bg-[linear-gradient(135deg,#ff8a4c_0%,#ff5f2f_100%)] text-white shadow-[0_18px_40px_rgba(255,122,69,0.22)]"
                      >
                        <Puzzle className="h-3 w-3" />
                        <span className="mr-1">{compat?.myAnswered > 0 ? "המשך" : "התחל"}</span>
                      </Button>
                    )
                  )}
                </div>
              </div>

              {bothDone && compat?.myMap && compat?.theirMap && (
                <BreakdownPanel
                  myMap={compat.myMap}
                  theirMap={compat.theirMap}
                  memberName={member.name?.split(" ")[0]}
                />
              )}
            </PremiumCard>
          </motion.div>
        );
      })}

      {teamMembers.length > 0 && (
        <PremiumCard>
          <p className="text-center text-sm leading-6 text-slate-500">
            כדי לראות תוצאות, גם אתה/ת וגם השותפים צריכים למלא את השאלון.
          </p>
        </PremiumCard>
      )}
    </PremiumPageFrame>
  );
}
