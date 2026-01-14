import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { User } from '@/entities/User';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const CHARTER_DATA = {
  "game_title": "Roomi Vibe Check",
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
          "title": "ניקיון - עד כמה מקפידים?",
          "emoji": "🧹",
          "option_a": "בית מרקחת: חייב להיות מצוחצח תמיד (יש טבלה ואין ויתורים!)",
          "option_b": "חיים פה: מנקים כשרואים לכלוך, לא צריך להשתגע",
          "compromise": "מנקים 'יסודי' פעם בשבוע (סופ\"ש), ובשאר הזמן שומרים על סביר."
        },
        {
          "id": "q_shopping",
          "title": "🧻 קניות לבית",
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

export default function RoomiCharter({ matchId, user1Name, user2Name, onClose }) {
  const navigate = useNavigate();
  const [currentUserId, setCurrentUserId] = useState(null);
  const [myAnswers, setMyAnswers] = useState({});
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [direction, setDirection] = useState(0);

  const allQuestions = CHARTER_DATA.levels.flatMap(level => level.questions);
  const currentLevel = CHARTER_DATA.levels[currentLevelIndex];
  const currentQuestion = currentLevel?.questions[currentQuestionIndex];

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = await User.me();
        setCurrentUserId(user.id);

        // טעינת תשובות קיימות
        const allAnswers = await base44.entities.CharterAnswer.filter({ 
          match_id: matchId,
          user_id: user.id 
        });
        
        const mine = {};
        allAnswers.forEach(answer => {
          mine[answer.question_id] = answer.answer;
        });

        setMyAnswers(mine);

        // בדיקה אם כבר סיימתי
        if (Object.keys(mine).length === allQuestions.length) {
          // סיימתי - עובר לצ'אט
          navigate(createPageUrl('Chat') + `?matchId=${matchId}`);
          return;
        }

        // מציאת השאלה הבאה
        for (let i = 0; i < allQuestions.length; i++) {
          const q = allQuestions[i];
          if (!mine[q.id]) {
            const levelIndex = CHARTER_DATA.levels.findIndex(l => l.questions.some(qq => qq.id === q.id));
            const questionIndex = CHARTER_DATA.levels[levelIndex].questions.findIndex(qq => qq.id === q.id);
            setCurrentLevelIndex(levelIndex);
            setCurrentQuestionIndex(questionIndex);
            break;
          }
        }

      } catch (error) {
        console.error("Error loading charter data:", error);
      }
      setIsLoading(false);
    };

    loadData();
  }, [matchId, navigate]);

  const handleAnswer = async (option) => {
    if (!currentQuestion || !currentUserId) return;

    const qId = currentQuestion.id;
    setDirection(option === 'a' ? 1 : -1);
    
    try {
      await base44.entities.CharterAnswer.create({
        match_id: matchId,
        user_id: currentUserId,
        question_id: qId,
        answer: option
      });

      setMyAnswers(prev => ({ ...prev, [qId]: option }));

      // עובר לשאלה הבאה
      if (currentQuestionIndex < currentLevel.questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else if (currentLevelIndex < CHARTER_DATA.levels.length - 1) {
        setCurrentLevelIndex(currentLevelIndex + 1);
        setCurrentQuestionIndex(0);
      } else {
        // סיימנו - עובר לצ'אט
        confetti({
          particleCount: 200,
          spread: 120,
          origin: { y: 0.4 },
          colors: ['#FF5722', '#FF1744', '#F50057', '#E91E63', '#FFD700']
        });
        setTimeout(() => {
          navigate(createPageUrl('Chat') + `?matchId=${matchId}`);
        }, 2000);
      }
    } catch (error) {
      console.error("Error saving answer:", error);
      alert("שגיאה בשמירת התשובה");
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-orange-700 to-orange-600 flex items-center justify-center" dir="rtl">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full"
        />
      </div>
    );
  }

  if (!currentQuestion) return null;

  const totalAnswered = Object.keys(myAnswers).length;
  const progress = (totalAnswered / allQuestions.length) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-orange-700 to-orange-600 overflow-hidden" dir="rtl">
      <div className="absolute top-0 left-0 right-0 p-3 flex gap-1 z-10">
        {allQuestions.map((q, i) => {
          const answered = myAnswers[q.id];
          return (
            <div key={i} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: answered ? '100%' : '0%' }}
                className="h-full bg-gradient-to-r from-orange-500 to-yellow-400 rounded-full"
              />
            </div>
          );
        })}
      </div>

      <button
        onClick={() => navigate(createPageUrl('Discover'))}
        className="absolute top-4 right-4 z-20 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/20 active:scale-95 transition-transform"
      >
        <h1 className="text-2xl logo-font text-white">Roomi</h1>
      </button>
      
      <button
        onClick={() => onClose?.()}
        className="absolute top-4 left-4 z-20 w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/20 active:scale-95 transition-transform"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      <div className="h-full flex items-center justify-center p-6 pt-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ x: direction > 0 ? 300 : -300, opacity: 0, rotate: direction > 0 ? 20 : -20 }}
            animate={{ x: 0, opacity: 1, rotate: 0 }}
            exit={{ x: direction > 0 ? -300 : 300, opacity: 0, rotate: direction > 0 ? -20 : 20 }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
            className="w-full max-w-md"
          >
            <div className="bg-gradient-to-br from-orange-400 to-orange-500 rounded-3xl shadow-2xl overflow-hidden">
              <div className="p-8 text-center">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-9xl mb-6"
                >
                  {currentQuestion.emoji}
                </motion.div>
                <h2 className="text-5xl font-black text-white leading-tight mb-2">
                  {currentQuestion.title}
                </h2>
                <p className="text-xl text-white/80 font-bold">מה אתה/ת מעדיפ/ה?</p>
              </div>
              
              <div className="p-6 space-y-4">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleAnswer('a')}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-black text-xl p-6 rounded-2xl shadow-xl"
                >
                  {currentQuestion.option_a}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleAnswer('b')}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-black text-xl p-6 rounded-2xl shadow-xl"
                >
                  {currentQuestion.option_b}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}