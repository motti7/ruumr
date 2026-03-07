import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';

const CHARTER_DATA = {
  "levels": [
    {
      "id": "level_1",
      "name": "🚩 הקווים האדומים",
      "questions": [
        { "id": "q_smoking", "title": "עישון בדירה", "emoji": "🚬", "option_a": "בכיף, חופשי בסלון", "option_b": "איכס! רק בחוץ/במרפסת", "compromise": "מעשנים רק במרפסת (עם דלת סגורה!)" },
        { "id": "q_partners", "title": "בני/בנות זוג", "emoji": "😍", "option_a": "בית פתוח - שיישנו פה חופשי", "option_b": "מוגזם - גג פעמיים בשבוע", "compromise": "עד 3 לילות בשבוע. מעבר לזה? משתתפים בחשבונות." },
        { "id": "q_pets", "title": "בעלי חיים", "emoji": "🐶", "option_a": "מת על חיות, תביאו הכל", "option_b": "אלרגי / לא מתחבר", "compromise": "אין פשרה (זה Dealbreaker). חייבים להסכים מראש." }
      ]
    },
    {
      "id": "level_2",
      "name": "🧹 ניקיון וסדר",
      "questions": [
        { "id": "q_cleaning_strictness", "title": "עד כמה מקפידים?", "emoji": "🧹", "option_a": "בית מרקחת: חייב להיות מצוחצח תמיד", "option_b": "חיים פה: מנקים כשרואים לכלוך", "compromise": "מנקים יסודי פעם בשבוע, בשאר הזמן שומרים על סביר." },
        { "id": "q_shopping", "title": "קניות לבית (נייר טואלט/שמן)", "emoji": "🛒", "option_a": "שותפות מלאה: קונים הכל יחד ומתחלקים", "option_b": "הפרדה: כל אחד קונה לעצמו", "compromise": "קופה קטנה משותפת לדברים בסיסיים, אוכל כל אחד בנפרד." }
      ]
    },
    {
      "id": "level_3",
      "name": "🍕 החיים עצמם",
      "questions": [
        { "id": "q_dishes", "title": "כלים בכיור", "emoji": "🍽️", "option_a": "שוטפים מיד אחרי האוכל!", "option_b": "זורמים... שוטפים כשמצטבר", "compromise": "חוק ה-24 שעות: הכיור חייב להיות ריק לפני שינה." },
        { "id": "q_ac", "title": "מלחמות המזגן", "emoji": "❄️", "option_a": "מקפיא! 18 מעלות", "option_b": "חסכוני/נעים - 24 מעלות", "compromise": "23 מעלות ביום, בלילה כל אחד בחדר שלו מחליט." },
        { "id": "q_hosting", "title": "חברים ומסיבות", "emoji": "🎉", "option_a": "תמיד שמח, הבית פתוח", "option_b": "צריך שקט, לתאם מראש", "compromise": "מותר לארח בכיף, אבל אחרי 23:00 שקט בסלון." }
      ]
    }
  ]
};

function CompatibilityRing({ percent }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <div className="relative w-20 h-20 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="80" height="80">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="7" />
        <motion.circle
          cx="40" cy="40" r={radius}
          fill="none"
          stroke="white"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <span className="text-xl font-black text-white drop-shadow">{percent}%</span>
    </div>
  );
}

export default function CharterResults({ matchId }) {
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadResults = async () => {
      try {
        const allAnswers = await base44.entities.CharterAnswer.filter({ match_id: matchId });

        if (allAnswers.length === 0) {
          setResults(null);
          setIsLoading(false);
          return;
        }

        const user1Answers = {};
        const user2Answers = {};
        let user1Id = null;
        let user2Id = null;

        allAnswers.forEach(answer => {
          if (!user1Id) user1Id = answer.user_id;
          if (answer.user_id === user1Id) {
            user1Answers[answer.question_id] = answer.answer;
          } else {
            if (!user2Id) user2Id = answer.user_id;
            user2Answers[answer.question_id] = answer.answer;
          }
        });

        const allQuestions = CHARTER_DATA.levels.flatMap(l => l.questions);
        const user1Complete = Object.keys(user1Answers).length === allQuestions.length;
        const user2Complete = Object.keys(user2Answers).length === allQuestions.length;

        if (!user1Complete || !user2Complete) {
          setResults({ waiting: true });
          setIsLoading(false);
          return;
        }

        const agreements = [];
        const disagreements = [];

        allQuestions.forEach(q => {
          const u1 = user1Answers[q.id];
          const u2 = user2Answers[q.id];
          if (u1 === u2) {
            agreements.push({ ...q, answer: u1 === 'a' ? q.option_a : q.option_b });
          } else {
            disagreements.push(q);
          }
        });

        const compatibilityPercent = Math.round((agreements.length / allQuestions.length) * 100);
        setResults({ waiting: false, agreements, disagreements, compatibilityPercent });
      } catch (error) {
        console.error("Error loading charter results:", error);
      }
      setIsLoading(false);
    };

    loadResults();
  }, [matchId]);

  if (isLoading || !results || results.waiting) return null;

  const { compatibilityPercent, agreements, disagreements } = results;

  const vibe =
    compatibilityPercent >= 80 ? { label: "התאמה מושלמת! 🔥", color: "from-orange-400 to-orange-500" } :
    compatibilityPercent >= 60 ? { label: "כמעט מושלם 👌", color: "from-orange-400 to-orange-500" } :
    { label: "יש על מה לדבר 💬", color: "from-orange-400 to-orange-500" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex justify-start mb-4"
    >
      <div className="max-w-[88%] rounded-3xl overflow-hidden shadow-lg border border-gray-100 bg-white">

        {/* Header gradient */}
        <div className={`bg-gradient-to-l ${vibe.color} px-4 py-3 flex items-center justify-between`}>
          <div>
            <p className="text-white/80 text-[10px] font-semibold uppercase tracking-wide">שאלון משותף</p>
            <p className="text-white font-black text-base leading-tight">{vibe.label}</p>
          </div>
          <CompatibilityRing percent={compatibilityPercent} />
        </div>

        {/* Agreements */}
        {agreements.length > 0 && (
          <div className="px-4 pt-3 pb-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">מסכימים על הכל ✅</p>
            <div className="space-y-1.5">
              {agreements.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="flex items-center gap-2 bg-green-50 rounded-xl px-3 py-2"
                >
                  <span className="text-base">{item.emoji}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-800 truncate">{item.title}</p>
                    <p className="text-[10px] text-gray-500 truncate">{item.answer}</p>
                  </div>
                  <span className="mr-auto text-green-500 text-xs">✓</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Disagreements */}
        {disagreements.length > 0 && (
          <div className="px-4 pt-2 pb-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">נושאים לשיחה 💬</p>
            <div className="space-y-1.5">
              {disagreements.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (agreements.length + i) * 0.07 }}
                  className="bg-orange-50 rounded-xl px-3 py-2"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{item.emoji}</span>
                    <p className="text-xs font-bold text-gray-800">{item.title}</p>
                  </div>
                  <p className="text-[10px] text-orange-700 mr-7">
                    💡 {item.compromise}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-100 px-4 py-2 text-center">
          <p className="text-[10px] text-gray-400">
            {agreements.length} הסכמות · {disagreements.length} נושאים לשיחה
          </p>
        </div>
      </div>
    </motion.div>
  );
}