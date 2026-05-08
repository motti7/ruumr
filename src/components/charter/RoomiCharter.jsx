import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { User } from '@/entities/User';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import mixpanel from 'mixpanel-browser';
import {
  PremiumCard,
  PremiumPill,
} from '@/components/shared/PremiumPageFrame';
import { enableSimulatorBackend, getSimulatorBackendState } from '@/lib/simulatorBackend';
import { isRuumrSimulatorMode } from '@/lib/simulatorMode';

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
  const [currentUserId, setCurrentUserId] = useState(null);
  const [myAnswers, setMyAnswers] = useState({});
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [direction, setDirection] = useState(0);
  const isMixpanelTrackingEnabled = (() => {
    const hostname = window.location.hostname.toLowerCase();
    return !hostname.includes('localhost') && !hostname.includes('preview-sandbox') && !hostname.includes('base44');
  })();

  const allQuestions = CHARTER_DATA.levels.flatMap(level => level.questions);
  const currentLevel = CHARTER_DATA.levels[currentLevelIndex];
  const currentQuestion = currentLevel?.questions[currentQuestionIndex];

  useEffect(() => {
    return () => { clearTimeout(navTimerRef.current); };
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (isRuumrSimulatorMode()) {
          enableSimulatorBackend(base44);
          const simulatorState = getSimulatorBackendState();
          const currentUser = simulatorState?.currentUser || null;
          setCurrentUserId(currentUser?.id || null);

          const allAnswers = Array.isArray(simulatorState?.collections?.CharterAnswer)
            ? simulatorState.collections.CharterAnswer.filter((answer) =>
                String(answer.match_id) === String(matchId) &&
                String(answer.user_id) === String(currentUser?.id)
              )
            : [];

          const mine = {};
          allAnswers.forEach(answer => {
            mine[answer.question_id] = answer.answer;
          });

          setMyAnswers(mine);

          if (Object.keys(mine).length === allQuestions.length) {
            navigate(createPageUrl('Chat') + `?matchId=${matchId}`);
            setIsLoading(false);
            return;
          }

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

          setIsLoading(false);
          return;
        }

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
        if (isMixpanelTrackingEnabled) {
          mixpanel.track('Match Questionnaire Completed');
        }
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
                data: { matchId }
              });
            }
          } catch(e) { console.log("Push notification skipped", e); }
        })();
      }
    } catch (error) {
      console.error("Error saving answer:", error);
      alert("שגיאה בשמירת התשובה");
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[linear-gradient(180deg,#fffaf6_0%,#fff_100%)]" dir="rtl">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
          className="h-16 w-16 rounded-full border-4 border-slate-200 border-t-[--theme-orange]"
        />
      </div>
    );
  }

  if (!currentQuestion) return null;

  const totalAnswered = Object.keys(myAnswers).length;
  const progress = (totalAnswered / allQuestions.length) * 100;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[linear-gradient(180deg,#fffaf6_0%,#fff_100%)]" dir="rtl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top_left,_rgba(255,111,63,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(255,255,255,0.88),_transparent_24%)]" />
      <div className="absolute left-[-8rem] top-28 h-64 w-64 rounded-full bg-orange-100/50 blur-3xl" />
      <div className="absolute right-[-6rem] bottom-24 h-72 w-72 rounded-full bg-rose-100/50 blur-3xl" />

      <button
        onClick={() => {
          if (onClose) {
            onClose();
          } else {
            navigate(-1);
          }
        }}
        className="absolute top-4 left-4 z-20 flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-700 shadow-sm backdrop-blur-md transition-transform hover:scale-[1.02]"
        aria-label="סגור"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="absolute inset-0 flex items-center justify-center px-4 pt-16 pb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ x: direction > 0 ? 240 : -240, opacity: 0, rotate: direction > 0 ? 12 : -12 }}
            animate={{ x: 0, opacity: 1, rotate: 0 }}
            exit={{ x: direction > 0 ? -240 : 240, opacity: 0, rotate: direction > 0 ? -12 : 12 }}
            transition={{ type: "spring", damping: 20, stiffness: 120 }}
            className="w-full max-w-md"
          >
            <PremiumCard className="overflow-hidden bg-white/88">
              <div className="flex items-start justify-between gap-3">
                <div className="text-right">
                  <PremiumPill tone="orange">{currentLevel?.name}</PremiumPill>
                  <h2 className="mt-3 text-2xl font-black text-slate-950">{currentQuestion.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    שאלה {totalAnswered + 1} מתוך {allQuestions.length}
                  </p>
                </div>

                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.35rem] bg-[linear-gradient(135deg,#ff8a4c_0%,#ff5f2f_100%)] text-3xl shadow-[0_18px_40px_rgba(255,122,69,0.28)]">
                  {currentQuestion.emoji}
                </div>
              </div>

              <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
                <motion.div
                  className="h-full rounded-full bg-[linear-gradient(135deg,#ff8a4c_0%,#ff5f2f_100%)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                />
              </div>

              <div className="mt-5 space-y-3">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAnswer("a")}
                  className="w-full rounded-[1.45rem] border border-orange-100 bg-[linear-gradient(135deg,#fff7ed_0%,#ffedd5_100%)] px-4 py-4 text-right shadow-sm transition-transform hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-black text-[--theme-orange] ring-1 ring-orange-100">
                      א
                    </span>
                    <span className="text-base font-bold leading-7 text-slate-900">{currentQuestion.option_a}</span>
                  </div>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAnswer("b")}
                  className="w-full rounded-[1.45rem] border border-blue-100 bg-[linear-gradient(135deg,#eff6ff_0%,#dbeafe_100%)] px-4 py-4 text-right shadow-sm transition-transform hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-black text-blue-700 ring-1 ring-blue-100">
                      ב
                    </span>
                    <span className="text-base font-bold leading-7 text-slate-900">{currentQuestion.option_b}</span>
                  </div>
                </motion.button>
              </div>

              <p className="mt-5 text-center text-xs leading-6 text-slate-400">
                בוחרים את מה שנכון לכם עכשיו. בסיום נפתח צ'אט רך וישיר, בלי עוד מסכים מיותרים.
              </p>
            </PremiumCard>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
