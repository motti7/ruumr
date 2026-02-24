import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { CheckCircle, AlertCircle, Handshake } from 'lucide-react';

const CHARTER_DATA = {
  "levels": [
    {
      "id": "level_1",
      "name": "🚩 הקווים האדומים",
      "questions": [
        {
          "id": "q_smoking",
          "title": "עישון בדירה",
          "emoji": "🚬",
          "option_a": "בכיף, חופשי בסלון",
          "option_b": "איכס! רק בחוץ/במרפסת",
          "compromise": "מעשנים רק במרפסת (עם דלת סגורה!)"
        },
        {
          "id": "q_partners",
          "title": "בני/בנות זוג",
          "emoji": "😍",
          "option_a": "בית פתוח - שיישנו פה חופשי",
          "option_b": "מוגזם - גג פעמיים בשבוע",
          "compromise": "עד 3 לילות בשבוע. מעבר לזה? משתתפים בחשבונות."
        },
        {
          "id": "q_pets",
          "title": "בעלי חיים",
          "emoji": "🐶",
          "option_a": "מת על חיות, תביאו הכל",
          "option_b": "אלרגי / לא מתחבר",
          "compromise": "אין פשרה (זה Dealbreaker). חייבים להסכים מראש."
        }
      ]
    },
    {
      "id": "level_2",
      "name": "🧹 ניקיון וסדר (Cleanliness)",
      "description": "עד כמה הבית צריך להיות מבריק?",
      "questions": [
        {
          "id": "q_cleaning_strictness",
          "title": "🧐 עד כמה מקפידים?",
          "emoji": "🧹",
          "option_a": "בית מרקחת: חייב להיות מצוחצח תמיד (יש טבלה ואין ויתורים!)",
          "option_b": "חיים פה: מנקים כשרואים לכלוך, לא צריך להשתגע",
          "compromise": "מנקים 'יסודי' פעם בשבוע (סופ\"ש), ובשאר הזמן שומרים על סביר."
        },
        {
          "id": "q_shopping",
          "title": "🧻 קניות לבית (נייר טואלט/שמן)",
          "emoji": "🛒",
          "option_a": "שותפות מלאה: קונים הכל יחד ומתחלקים",
          "option_b": "הפרדה: כל אחד קונה לעצמו (חוץ מנייר טואלט)",
          "compromise": "קופה קטנה משותפת לדברים בסיסיים, אוכל כל אחד בנפרד."
        }
      ]
    },
    {
      "id": "level_3",
      "name": "🍕 החיים עצמם",
      "questions": [
        {
          "id": "q_dishes",
          "title": "כלים בכיור",
          "emoji": "🍽️",
          "option_a": "שוטפים מיד אחרי האוכל!",
          "option_b": "זורמים... שוטפים כשמצטבר",
          "compromise": "חוק ה-24 שעות: הכיור חייב להיות ריק לפני שהולכים לישון."
        },
        {
          "id": "q_ac",
          "title": "מלחמות המזגן",
          "emoji": "❄️",
          "option_a": "מקפיא! 18 מעלות",
          "option_b": "חסכוני/נעים - 24 מעלות",
          "compromise": "23 מעלות ביום, בלילה כל אחד בחדר שלו מחליט."
        },
        {
          "id": "q_hosting",
          "title": "חברים ומסיבות",
          "emoji": "🎉",
          "option_a": "תמיד שמח, הבית פתוח",
          "option_b": "צריך שקט, לתאם מראש",
          "compromise": "מותר לארח בכיף, אבל אחרי 23:00 שומרים על שקט בסלון."
        }
      ]
    }
  ]
};

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

        // קיבוץ תשובות לפי משתמש
        const user1Answers = {};
        const user2Answers = {};
        let user1Id = null;
        let user2Id = null;

        allAnswers.forEach(answer => {
          if (!user1Id) {
            user1Id = answer.user_id;
          }
          
          if (answer.user_id === user1Id) {
            user1Answers[answer.question_id] = answer.answer;
          } else {
            if (!user2Id) user2Id = answer.user_id;
            user2Answers[answer.question_id] = answer.answer;
          }
        });

        const allQuestions = CHARTER_DATA.levels.flatMap(level => level.questions);
        
        // בדיקה אם שני המשתמשים ענו על הכל
        const user1Complete = Object.keys(user1Answers).length === allQuestions.length;
        const user2Complete = Object.keys(user2Answers).length === allQuestions.length;

        if (!user1Complete || !user2Complete) {
          setResults({ waiting: true, user1Complete, user2Complete });
          setIsLoading(false);
          return;
        }

        // ניתוח תוצאות
        const agreements = [];
        const disagreements = [];

        allQuestions.forEach(q => {
          const u1 = user1Answers[q.id];
          const u2 = user2Answers[q.id];
          
          if (u1 === u2) {
            agreements.push({
              ...q,
              answer: u1 === 'a' ? q.option_a : q.option_b
            });
          } else {
            disagreements.push(q);
          }
        });

        const compatibilityPercent = Math.round((agreements.length / allQuestions.length) * 100);

        setResults({
          waiting: false,
          agreements,
          disagreements,
          compatibilityPercent
        });

      } catch (error) {
        console.error("Error loading charter results:", error);
      }
      setIsLoading(false);
    };

    loadResults();
  }, [matchId]);

  if (isLoading || !results || results.waiting) {
    return null;
  }

  return (
    <>
      {/* הודעת מערכת - סיכום */}
      <div className="flex justify-start mb-3">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-3 max-w-[85%] shadow-sm border border-gray-100">
          <p className="text-xs text-gray-400 text-center mb-2">סיכום השאלון המשותף</p>
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
              <span className="text-lg font-black text-white">{results.compatibilityPercent}%</span>
            </div>
          </div>
          <p className="text-sm text-gray-700 text-center leading-relaxed">
            {results.compatibilityPercent >= 80 && "יש לכם המון מכנה משותף! זה נראה כמו שותפות מעולה 🎉"}
            {results.compatibilityPercent >= 60 && results.compatibilityPercent < 80 && "בגדול מסכימים! יש כמה נושאים לשיחה אבל זה נראה טוב 👌"}
            {results.compatibilityPercent < 60 && "יש כמה הבדלים, אבל זה בסדר - חשוב לדבר על זה ולהגיע להבנות 💬"}
          </p>
        </div>
      </div>

      {results.agreements.length > 0 && (
        <div className="flex justify-start mb-3">
          <div className="bg-white rounded-2xl px-4 py-3 max-w-[85%] shadow-sm border border-gray-100">
            <p className="text-sm text-gray-700 leading-relaxed mb-2">
              <strong className="text-green-600">✓ דברים שמסכימים עליהם:</strong>
            </p>
            <div className="space-y-1.5">
              {results.agreements.map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-lg">{item.emoji}</span>
                  <div>
                    <p className="text-gray-700 text-xs font-medium">{item.title}</p>
                    <p className="text-gray-500 text-[10px]">{item.answer}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">זה הבסיס לשותפות מעולה 💚</p>
          </div>
        </div>
      )}

      {results.disagreements.length > 0 && (
        <div className="flex justify-start mb-3">
          <div className="bg-white rounded-2xl px-4 py-3 max-w-[85%] shadow-sm border border-gray-100">
            <p className="text-sm text-gray-700 leading-relaxed mb-2">
              <strong className="text-yellow-600">💬 נושאים לשיחה:</strong>
            </p>
            <div className="space-y-2">
              {results.disagreements.map((item, i) => (
                <div key={i} className="text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{item.emoji}</span>
                    <p className="text-gray-700 text-xs font-medium">{item.title}</p>
                  </div>
                  <p className="text-[10px] text-gray-500 mr-7">
                    💡 <strong>הצעת פשרה:</strong> {item.compromise}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">כדאי לדבר על זה ולהגיע להבנות 🤝</p>
          </div>
        </div>
      )}
    </>
  );
}