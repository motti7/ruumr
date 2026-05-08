import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Users, CheckSquare, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { User } from "@/entities/User";
import {
  PremiumCard,
  PremiumPageFrame,
  PremiumPill,
  PremiumStat,
} from "@/components/shared/PremiumPageFrame";

const QUESTIONS = {
  q_smoking: "עישון בדירה",
  q_partners: "בני/בנות זוג",
  q_pets: "בעלי חיים",
  q_cleaning_strictness: "עד כמה מקפידים?",
  q_shopping: "קניות לבית",
  q_dishes: "כלים בכיור",
  q_ac: "מלחמות המזגן",
  q_hosting: "חברים ומסיבות",
};

export default function AdminCharterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const me = await User.me();
        if (me.role !== "admin") {
          navigate(createPageUrl("Discover"), { replace: true });
          return;
        }

        const [allAnswers, allUsers, allProfiles] = await Promise.all([
          base44.entities.CharterAnswer.list(),
          base44.entities.User.list(),
          base44.entities.Profile.list("-created_date", 1000),
        ]);

        const nameMap = {};
        allUsers.forEach((user) => {
          nameMap[user.id] = user.full_name || user.email;
        });
        allProfiles.forEach((profile) => {
          if (profile.name) {
            nameMap[profile.user_id] = profile.name;
          }
        });

        const byUser = {};
        allAnswers.forEach((answer) => {
          if (!byUser[answer.user_id]) {
            byUser[answer.user_id] = { answers: {} };
          }
          byUser[answer.user_id].answers[answer.question_id] = answer.answer;
        });

        const result = Object.entries(byUser).map(([userId, data]) => ({
          userId,
          name: nameMap[userId] || userId,
          answers: data.answers,
        }));

        setRows(result);
      } catch (error) {
        console.error("Failed to load admin charter data:", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[linear-gradient(180deg,#fffaf6_0%,#fff_100%)]" dir="rtl">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[--theme-orange]" />
          <p className="text-sm font-medium text-slate-500">טוען נתוני התאמה...</p>
        </div>
      </div>
    );
  }

  const questionIds = Object.keys(QUESTIONS);
  const answeredUsers = rows.filter((row) => questionIds.every((qId) => row.answers[qId])).length;
  const answerCount = rows.reduce(
    (sum, row) => sum + questionIds.filter((qId) => row.answers[qId]).length,
    0
  );

  return (
    <PremiumPageFrame
      icon={ShieldCheck}
      eyebrow="Admin review"
      title="תשובות שאלון התאמה"
      subtitle="תצוגת בקרה פנימית שמרכזת את תשובות השאלון של המשתמשים ומאפשרת סקירה מהירה."
      backTo={createPageUrl("Discover")}
      backLabel="חזרה לאפליקציה"
      badge={<PremiumPill tone="orange">Admin only</PremiumPill>}
    >
      <PremiumCard>
        <div className="grid gap-3 sm:grid-cols-3">
          <PremiumStat label="משתמשים" value={rows.length} tone="orange" />
          <PremiumStat label="ענו מלא" value={answeredUsers} tone="emerald" />
          <PremiumStat label="תשובות" value={answerCount} tone="blue" />
        </div>
      </PremiumCard>

      <PremiumCard className="!p-0">
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-[--theme-orange]">Overview</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">{questionIds.length} שאלות, {rows.length} שורות</h2>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-[1.2rem] bg-orange-50 text-[--theme-orange] ring-1 ring-orange-100">
              <FileText className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur">
              <tr className="border-b border-slate-100">
                <th className="px-4 py-3 text-right font-semibold text-slate-700 whitespace-nowrap">שם משתמש</th>
                {questionIds.map((qId) => (
                  <th key={qId} className="px-3 py-3 text-center text-xs font-semibold text-slate-600 whitespace-nowrap">
                    {QUESTIONS[qId]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.userId} className={index % 2 === 0 ? "bg-slate-50/50" : "bg-white"}>
                  <td className="px-4 py-4 font-bold text-slate-950 whitespace-nowrap">{row.name}</td>
                  {questionIds.map((qId) => {
                    const ans = row.answers[qId];
                    return (
                      <td key={qId} className="px-3 py-4 text-center">
                        {ans ? (
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${
                              ans === "a"
                                ? "bg-orange-50 text-[--theme-orange] ring-orange-100"
                                : "bg-blue-50 text-blue-700 ring-blue-100"
                            }`}
                          >
                            {ans === "a" ? "א" : "ב"}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PremiumCard>

      <PremiumCard>
        <div className="flex items-center justify-between gap-4">
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-[--theme-orange]">Action</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">חזרה לפאנל האפליקציה</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              אפשר לחזור ל-Discover או להמשיך לעבור על הנתונים במסכים אחרים.
            </p>
          </div>
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.35rem] bg-slate-100 text-slate-600 ring-1 ring-slate-200">
            <Users className="h-6 w-6" />
          </div>
        </div>
        <div className="mt-5">
          <Button
            onClick={() => navigate(createPageUrl("Discover"))}
            className="w-full rounded-[18px] bg-[linear-gradient(135deg,#ff8a4c_0%,#ff5f2f_100%)] text-white shadow-[0_18px_40px_rgba(255,122,69,0.28)]"
          >
            <CheckSquare className="ml-2 h-4 w-4" />
            חזרה לאפליקציה
          </Button>
        </div>
      </PremiumCard>
    </PremiumPageFrame>
  );
}
