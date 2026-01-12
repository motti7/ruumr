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

  if (isLoading) {
    return null;
  }

  if (!results) {
    return null;
  }

  if (results.waiting) {
    return (
      <div className="bg-gradient-to-r from-orange-100 to-orange-200 rounded-2xl p-6 mb-4">
        <div className="text-center">
          <div className="text-6xl mb-3">⏳</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">חוזה השותפות בתהליך</h3>
          <p className="text-gray-600 text-sm">
            {!results.user1Complete && !results.user2Complete && "שני הצדדים צריכים למלא את החוזה"}
            {results.user1Complete && !results.user2Complete && "מחכים שהשותף/ה שלך ימלא/תמלא את החוזה"}
            {!results.user1Complete && results.user2Complete && "הצד השני כבר מילא, עכשיו תורך!"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4"
    >
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 mb-3">
        <div className="text-center">
          <div className="text-6xl mb-3">🤝</div>
          <h2 className="text-3xl font-black text-white mb-2">חוזה השותפות שלכם</h2>
          <div className="text-6xl font-black text-yellow-300 my-3">{results.compatibilityPercent}%</div>
          <p className="text-white/90 text-lg font-bold">
            {results.compatibilityPercent >= 80 && "משגע! התאמה מושלמת 🔥"}
            {results.compatibilityPercent >= 60 && results.compatibilityPercent < 80 && "יפה מאוד! יש כאן שותפות 👌"}
            {results.compatibilityPercent < 60 && "צריך לדבר על הנושאים האלה 💬"}
          </p>
        </div>
      </div>

      {results.agreements.length > 0 && (
        <div className="bg-green-50 rounded-2xl p-4 mb-3">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h3 className="font-bold text-green-900">הסכמות ({results.agreements.length})</h3>
          </div>
          <div className="space-y-2">
            {results.agreements.map((item, i) => (
              <div key={i} className="bg-white rounded-xl p-3 flex items-center gap-3">
                <span className="text-2xl">{item.emoji}</span>
                <div className="flex-1">
                  <p className="font-bold text-gray-900 text-sm">{item.title}</p>
                  <p className="text-gray-600 text-xs mt-1">{item.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {results.disagreements.length > 0 && (
        <div className="bg-yellow-50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Handshake className="w-5 h-5 text-yellow-600" />
            <h3 className="font-bold text-yellow-900">צריך לדבר על זה ({results.disagreements.length})</h3>
          </div>
          <div className="space-y-2">
            {results.disagreements.map((item, i) => (
              <div key={i} className="bg-white rounded-xl p-3">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{item.emoji}</span>
                  <p className="font-bold text-gray-900 text-sm">{item.title}</p>
                </div>
                <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg p-3">
                  <p className="text-xs font-bold text-gray-700 mb-1">💡 הצעה לפשרה:</p>
                  <p className="text-gray-800 text-sm font-medium">{item.compromise}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}