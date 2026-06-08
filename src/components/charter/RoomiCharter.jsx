import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { User } from '@/entities/User';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { trackMixpanel } from '@/lib/mixpanelTracking';
import { getCharterAnsweredCount, isCharterComplete } from '@/lib/charterCompletion';

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
          "option_a": "זורם/ת, תרגישו חופשי",
          "option_b": "מעדיפ/ה אוויר נקי",
          "compromise": "מעשנים רק במרפסת (עם דלת סגורה!)"
        },
        {
          "id": "q_partners",
          "title": "בני/בנות זוג",
          "emoji": "😍",
          "option_a": "הבית פתוח, כולם מוזמנים",
          "option_b": "מעדיפ/ה את הלבד שלי",
          "compromise": "עד 3 לילות בשבוע. מעבר לזה? משתתפים בחשבונות."
        },
        {
          "id": "q_pets",
          "title": "בעלי חיים",
          "emoji": "🐶",
          "option_a": "אין על חיות!",
          "option_b": "אלרגי / פחות מתאים לי",
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
          "option_a": "אוהב/ת ניקיון, יש טבלה מסודרת",
          "option_b": "קליל/ה, מנקים כשצריך",
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
          "option_a": "שוטפ/ת מיד, לא סובלת ערימות",
          "option_b": "יחכה למחר, הכל טוב",
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
  const navTimerRef = React.useRef(null);
  const submittedQuestionIdsRef = React.useRef(new Set());
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
    return () => { clearTimeout(navTimerRef.current); };
  }, []);

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
        submittedQuestionIdsRef.current = new Set(allAnswers.map(answer => answer.question_id));

        setMyAnswers(mine);

        // בדיקה אם כבר סיימתי — עובר ישירות לצ'אט בלי להציג את השאלון מחדש
        if (isCharterComplete(allAnswers)) {
          setIsLoading(false);
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
    if (submittedQuestionIdsRef.current.has(qId)) return;

    submittedQuestionIdsRef.current.add(qId);
    setDirection(option === 'a' ? -1 : 1);
    
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
        // סיימנו - עובר לצ'אט מיד (הניווט לא תלוי ב-push notification)
        trackMixpanel('Match Questionnaire Completed');
        confetti({
          particleCount: 200,
          spread: 120,
          origin: { y: 0.4 },
          colors: ['#FF5722', '#FF1744', '#F50057', '#E91E63', '#FFD700']
        });
        navTimerRef.current = setTimeout(() => {
          navigate(createPageUrl('Chat') + `?matchId=${matchId}`);
        }, 2000);

        // שליחת נוטיפיקציה לשותף - fire and forget, לא חוסם את הניווט
        (async () => {
          try {
            const allMatches = await base44.entities.Match.filter({ user1_id: currentUserId });
            const allMatches2 = await base44.entities.Match.filter({ user2_id: currentUserId });
            const matchData = [...allMatches, ...allMatches2].find(m => m.id === matchId);
            if (matchData) {
              const partnerId = matchData.user1_id === currentUserId ? matchData.user2_id : matchData.user1_id;
              await base44.functions.invoke('sendPushNotification', {
                user_id: partnerId,
                title: '📋 השאלון מחכה לך!',
                message: 'השותף שלך כבר מילא את שאלון הדירה – עכשיו התור שלך!',
                data: { type: 'charter', match_id: matchId }
              });
            }
          } catch(e) { console.log("Push notification skipped", e); }
        })();
      }
    } catch (error) {
      submittedQuestionIdsRef.current.delete(qId);
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

  const totalAnswered = getCharterAnsweredCount(myAnswers);
  const progress = (totalAnswered / allQuestions.length) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-orange-700 to-orange-600 overflow-hidden" dir="rtl">
      <button
        onClick={() => {
          if (onClose) {
            onClose();
          } else {
            navigate(-1);
          }
        }}
        className="absolute top-4 left-4 z-20 min-w-[44px] min-h-[44px] bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/20 active:scale-95 transition-transform"
        aria-label="סגור"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* האזור שבין כפתור ה-X (72px מלמעלה) לפוטר (80px מלמטה) */}
      <div
        className="absolute flex items-center justify-center px-4"
        style={{ top: '72px', bottom: '80px', left: 0, right: 0 }}
      >
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
              <div className="px-6 pt-12 pb-8 text-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-6xl mb-5"
                >
                  {currentQuestion.emoji}
                </motion.div>
                <h2 className="text-2xl font-black text-white leading-snug mb-2">
                  {currentQuestion.title}
                </h2>
                <p className="text-base text-white/80 font-bold">מה את/ה מעדיפ/ה?</p>
              </div>
              
              <div className="px-6 pb-12 space-y-4">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleAnswer('a')}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold text-base py-8 px-4 rounded-2xl shadow-lg leading-snug text-right"
                >
                  {currentQuestion.option_a}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleAnswer('b')}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-base py-8 px-4 rounded-2xl shadow-lg leading-snug text-right"
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
