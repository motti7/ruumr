import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { User } from '@/entities/User';
import { base44 } from '@/api/base44Client';

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
          "option_a": "בית פתוח - שייישנו פה חופשי",
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
      "name": "💸 הכסף והבירוקרטיה",
      "questions": [
        {
          "id": "q_groceries",
          "title": "קניות לבית",
          "emoji": "🛒",
          "option_a": "קונים משותף ומתחלקים",
          "option_b": "כל אחד קונה לעצמו (מדפים נפרדים)",
          "compromise": "בסיס משותף (נייר טואלט, חומרי ניקוי) - אוכל בנפרד."
        },
        {
          "id": "q_bills",
          "title": "תשלום חשבונות",
          "emoji": "💳",
          "option_a": "אחד משלם והשאר מעבירים לו בביט",
          "option_b": "כל חשבון על שם מישהו אחר",
          "compromise": "משתמשים באפליקציית תשלומים ייעודית (כמו Splitwise)."
        },
        {
          "id": "q_cleaning_money",
          "title": "מנקה חיצונית?",
          "emoji": "🧹",
          "option_a": "חייבים! שמים כסף כל שבוע",
          "option_b": "חבל על הכסף, מנקים לבד",
          "compromise": "מנקים לבד בשוטף, מביאים מנקה פעם בחודש ליסודי."
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

export default function RoomiCharter({ matchId, user1Name, user2Name, onClose, onComplete }) {
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [myAnswers, setMyAnswers] = useState({});
  const [partnerAnswers, setPartnerAnswers] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const allQuestions = CHARTER_DATA.levels.flatMap(level => level.questions);
  const currentLevel = CHARTER_DATA.levels[currentLevelIndex];
  const currentQuestion = currentLevel?.questions[currentQuestionIndex];
  const totalAnswered = Object.keys(myAnswers).length;
  const progress = (totalAnswered / allQuestions.length) * 100;

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = await User.me();
        setCurrentUserId(user.id);

        // טען תשובות קיימות
        const myCharterAnswers = await base44.entities.CharterAnswer.filter({ 
          match_id: matchId, 
          user_id: user.id 
        });

        if (myCharterAnswers.length > 0) {
          const saved = myCharterAnswers[0];
          setMyAnswers(saved.answers || {});
          
          if (saved.is_complete) {
            // אני סיימתי - בדוק אם השותף סיים
            const partnerCharterAnswers = await base44.entities.CharterAnswer.filter({ 
              match_id: matchId 
            });
            const partnerAnswer = partnerCharterAnswers.find(a => a.user_id !== user.id);
            
            if (partnerAnswer && partnerAnswer.is_complete) {
              setPartnerAnswers(partnerAnswer.answers);
              setIsComplete(true);
            } else {
              // השותף עדיין לא סיים - סגור ונצא
              onClose();
              return;
            }
          }
        }
      } catch (error) {
        console.error("Error loading charter data:", error);
      }
      setIsLoading(false);
    };
    loadData();
  }, [matchId]);

  const handleAnswer = async (option) => {
    const qId = currentQuestion.id;
    const newAnswers = { ...myAnswers, [qId]: option };
    setMyAnswers(newAnswers);

    // שמור בדטה-בייס
    try {
      const existing = await base44.entities.CharterAnswer.filter({ 
        match_id: matchId, 
        user_id: currentUserId 
      });

      const isLastQuestion = (
        currentQuestionIndex === currentLevel.questions.length - 1 && 
        currentLevelIndex === CHARTER_DATA.levels.length - 1
      );

      if (existing.length > 0) {
        await base44.entities.CharterAnswer.update(existing[0].id, {
          answers: newAnswers,
          is_complete: isLastQuestion
        });
      } else {
        await base44.entities.CharterAnswer.create({
          match_id: matchId,
          user_id: currentUserId,
          answers: newAnswers,
          is_complete: isLastQuestion
        });
      }
    } catch (error) {
      console.error("Error saving answer:", error);
    }

    // עבור לשאלה הבאה
    if (currentQuestionIndex < currentLevel.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (currentLevelIndex < CHARTER_DATA.levels.length - 1) {
      setCurrentLevelIndex(currentLevelIndex + 1);
      setCurrentQuestionIndex(0);
    } else {
      // סיימתי! בדוק אם השותף סיים
      try {
        const allAnswers = await base44.entities.CharterAnswer.filter({ match_id: matchId });
        const partnerAnswer = allAnswers.find(a => a.user_id !== currentUserId);
        
        if (partnerAnswer && partnerAnswer.is_complete) {
          setPartnerAnswers(partnerAnswer.answers);
          setIsComplete(true);
          confetti({
            particleCount: 200,
            spread: 120,
            origin: { y: 0.4 },
            colors: ['#FF5722', '#FF1744', '#F50057', '#E91E63', '#FFD700']
          });
        } else {
          // השותף עדיין לא סיים - פשוט סגור
          onClose();
        }
      } catch (error) {
        console.error("Error checking partner completion:", error);
        onClose();
      }
    }
  };

  const calculateScore = () => {
    if (!partnerAnswers) return 0;
    let matches = 0;
    allQuestions.forEach(q => {
      if (myAnswers[q.id] && myAnswers[q.id] === partnerAnswers[q.id]) {
        matches++;
      }
    });
    return Math.round((matches / allQuestions.length) * 100);
  };

  const getSummary = () => {
    return allQuestions.map(q => {
      const myAnswer = myAnswers[q.id];
      const theirAnswer = partnerAnswers?.[q.id];
      const isMatch = myAnswer === theirAnswer;
      return {
        title: q.title,
        emoji: q.emoji,
        myChoice: myAnswer === 'a' ? q.option_a : q.option_b,
        theirChoice: theirAnswer === 'a' ? q.option_a : q.option_b,
        isMatch,
        compromise: q.compromise
      };
    });
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-orange-700 via-orange-600 to-orange-500 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </div>
    );
  }



  if (isComplete && partnerAnswers) {
    const compatibilityPercent = calculateScore();
    const summary = getSummary();

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 overflow-auto bg-gradient-to-br from-orange-700 via-orange-600 to-orange-500"
        dir="rtl"
      >
        <div className="min-h-screen p-4 pb-32 flex flex-col items-center justify-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="w-full max-w-md"
          >
            <div className="text-center mb-8">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-8xl mb-4"
              >
                🏆
              </motion.div>
              <h1 className="text-6xl font-black text-white mb-2 leading-tight">
                החוזה<br/>מוכן!
              </h1>
              <div className="text-9xl font-black text-yellow-400 my-4">{compatibilityPercent}%</div>
              <p className="text-2xl text-white/80 font-bold">
                {compatibilityPercent >= 80 && "משגע! אתם מושלמים ביחד 🔥"}
                {compatibilityPercent >= 60 && compatibilityPercent < 80 && "יפה מאוד! יש כאן שותפות 👌"}
                {compatibilityPercent < 60 && "צריך לעבוד על זה... אבל אפשרי! 💪"}
              </p>
            </div>

            <div className="space-y-2 mb-8">
              {summary.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`backdrop-blur-xl rounded-2xl p-4 border-2 ${
                    item.isMatch ? 'bg-green-500/20 border-green-400' : 'bg-yellow-500/20 border-yellow-400'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{item.emoji}</span>
                    <p className="font-bold text-white text-sm flex-1">{item.title}</p>
                  </div>
                  {item.isMatch ? (
                    <p className="text-white/90 text-xs pr-11">✓ שניכם: {item.myChoice}</p>
                  ) : (
                    <>
                      <p className="text-white/80 text-xs pr-11">אני: {item.myChoice}</p>
                      <p className="text-white/80 text-xs pr-11">{user2Name}: {item.theirChoice}</p>
                      <p className="text-white font-bold text-xs pr-11 mt-2">💡 {item.compromise}</p>
                    </>
                  )}
                </motion.div>
              ))}
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onComplete?.(summary, compatibilityPercent)}
              className="w-full h-16 bg-gradient-to-r from-orange-400 to-orange-500 text-white text-xl font-black rounded-full shadow-2xl"
            >
              המשך לצ'אט 💬
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-orange-700 to-orange-600 overflow-hidden" dir="rtl">
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 p-3 flex gap-1 z-10">
        {allQuestions.map((_, i) => (
          <div key={i} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: i < totalAnswered ? '100%' : '0%' }}
              className="h-full bg-gradient-to-r from-orange-400 to-red-400 rounded-full"
            />
          </div>
        ))}
      </div>

      {/* Close Button */}
      <button
        onClick={() => onClose?.()}
        className="absolute top-4 left-4 z-20 w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/20 active:scale-95 transition-transform"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      <div className="h-full flex items-center justify-center p-6 pt-32">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
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
      </div>
    </div>
  );
}