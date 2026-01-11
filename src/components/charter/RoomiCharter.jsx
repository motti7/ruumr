import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock } from 'lucide-react';
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

export default function RoomiCharter({ matchId, user1Name, user2Name, onClose }) {
  const [currentUserId, setCurrentUserId] = useState(null);
  const [myAnswers, setMyAnswers] = useState({});
  const [theirAnswers, setTheirAnswers] = useState({});
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showCompromise, setShowCompromise] = useState(false);
  const [showMatch, setShowMatch] = useState(false);
  const [showConflict, setShowConflict] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [waitingForOther, setWaitingForOther] = useState(false);

  const allQuestions = CHARTER_DATA.levels.flatMap(level => level.questions);
  const currentLevel = CHARTER_DATA.levels[currentLevelIndex];
  const currentQuestion = currentLevel?.questions[currentQuestionIndex];

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = await User.me();
        setCurrentUserId(user.id);

        // טעינת תשובות קיימות
        const allAnswers = await base44.entities.CharterAnswer.filter({ match_id: matchId });
        
        const mine = {};
        const theirs = {};
        
        allAnswers.forEach(answer => {
          const key = answer.question_id;
          if (answer.user_id === user.id) {
            mine[key] = answer.answer;
            if (answer.accepted_compromise) {
              mine[`${key}_compromise`] = true;
            }
          } else {
            theirs[key] = answer.answer;
            if (answer.accepted_compromise) {
              theirs[`${key}_compromise`] = true;
            }
          }
        });

        setMyAnswers(mine);
        setTheirAnswers(theirs);

        // מציאת השאלה הבאה שצריך לענות עליה
        let foundNext = false;
        for (let i = 0; i < allQuestions.length && !foundNext; i++) {
          const q = allQuestions[i];
          if (!mine[q.id]) {
            // מצאנו שאלה שעדיין לא עניתי עליה
            const levelIndex = CHARTER_DATA.levels.findIndex(l => l.questions.some(qq => qq.id === q.id));
            const questionIndex = CHARTER_DATA.levels[levelIndex].questions.findIndex(qq => qq.id === q.id);
            setCurrentLevelIndex(levelIndex);
            setCurrentQuestionIndex(questionIndex);
            foundNext = true;
          }
        }

        // בדיקה אם סיימנו
        if (Object.keys(mine).filter(k => !k.includes('compromise')).length === allQuestions.length) {
          // עניתי על הכל, האם השני גם ענה?
          if (Object.keys(theirs).filter(k => !k.includes('compromise')).length === allQuestions.length) {
            setIsComplete(true);
          } else {
            setWaitingForOther(true);
          }
        }

      } catch (error) {
        console.error("Error loading charter data:", error);
      }
      setIsLoading(false);
    };

    loadData();

    // Subscribe to real-time updates
    const unsubscribe = base44.entities.CharterAnswer.subscribe((event) => {
      if (event.data.match_id === matchId && event.data.user_id !== currentUserId) {
        // השני ענה על שאלה
        const key = event.data.question_id;
        setTheirAnswers(prev => ({
          ...prev,
          [key]: event.data.answer,
          ...(event.data.accepted_compromise ? { [`${key}_compromise`]: true } : {})
        }));

        // בדיקה אם עכשיו יש תשובה משני הצדדים לשאלה הנוכחית
        if (currentQuestion && event.data.question_id === currentQuestion.id && myAnswers[currentQuestion.id]) {
          checkForMatchOrConflict(currentQuestion.id, myAnswers[currentQuestion.id], event.data.answer);
        }
      }
    });

    return unsubscribe;
  }, [matchId]);

  const checkForMatchOrConflict = (questionId, myAnswer, theirAnswer) => {
    if (myAnswer === theirAnswer) {
      setShowMatch(true);
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#FF5722', '#FF1744', '#F50057', '#E91E63']
      });
      setTimeout(() => {
        setShowMatch(false);
        moveToNext();
      }, 2500);
    } else {
      setShowConflict(true);
      setTimeout(() => {
        setShowConflict(false);
        setShowCompromise(true);
      }, 1800);
    }
  };

  const handleAnswer = async (option) => {
    if (!currentQuestion || !currentUserId) return;

    const qId = currentQuestion.id;
    
    try {
      // שמירה בדאטאבייס
      await base44.entities.CharterAnswer.create({
        match_id: matchId,
        user_id: currentUserId,
        question_id: qId,
        answer: option,
        accepted_compromise: false
      });

      // עדכון state
      setMyAnswers(prev => ({ ...prev, [qId]: option }));

      // בדיקה אם השני כבר ענה
      if (theirAnswers[qId]) {
        checkForMatchOrConflict(qId, option, theirAnswers[qId]);
      } else {
        // ממתינים לשני
        setWaitingForOther(true);
      }
    } catch (error) {
      console.error("Error saving answer:", error);
      alert("שגיאה בשמירת התשובה");
    }
  };

  const handleCompromiseAccept = async () => {
    const qId = currentQuestion.id;
    
    try {
      // עדכון התשובה שלי שקיבלתי את הפשרה
      const myAnswer = await base44.entities.CharterAnswer.filter({
        match_id: matchId,
        user_id: currentUserId,
        question_id: qId
      });

      if (myAnswer[0]) {
        await base44.entities.CharterAnswer.update(myAnswer[0].id, {
          accepted_compromise: true
        });
      }

      setMyAnswers(prev => ({ ...prev, [`${qId}_compromise`]: true }));
      setShowCompromise(false);
      moveToNext();
    } catch (error) {
      console.error("Error accepting compromise:", error);
    }
  };

  const moveToNext = () => {
    if (currentQuestionIndex < currentLevel.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setWaitingForOther(false);
    } else if (currentLevelIndex < CHARTER_DATA.levels.length - 1) {
      setCurrentLevelIndex(currentLevelIndex + 1);
      setCurrentQuestionIndex(0);
      setWaitingForOther(false);
    } else {
      // סיימנו את כל השאלות - בדיקה אם השני גם סיים
      if (Object.keys(theirAnswers).filter(k => !k.includes('compromise')).length === allQuestions.length) {
        setIsComplete(true);
        confetti({
          particleCount: 200,
          spread: 120,
          origin: { y: 0.4 },
          colors: ['#FF5722', '#FF1744', '#F50057', '#E91E63', '#FFD700']
        });
      } else {
        setWaitingForOther(true);
      }
    }
  };

  const calculateScore = () => {
    let score = 0;
    allQuestions.forEach(q => {
      const mine = myAnswers[q.id];
      const theirs = theirAnswers[q.id];
      if (mine === theirs) score += 10;
      else if (myAnswers[`${q.id}_compromise`] || theirAnswers[`${q.id}_compromise`]) score += 5;
    });
    return score;
  };

  const getSummary = () => {
    return allQuestions.map(q => {
      const mine = myAnswers[q.id];
      const theirs = theirAnswers[q.id];
      const isMatch = mine === theirs;
      const isCompromise = myAnswers[`${q.id}_compromise`] || theirAnswers[`${q.id}_compromise`];
      return {
        title: q.title,
        emoji: q.emoji,
        result: isMatch ? (mine === 'a' ? q.option_a : q.option_b) : (isCompromise ? q.compromise : 'לא הוסכם'),
        type: isMatch ? 'match' : (isCompromise ? 'compromise' : 'conflict')
      };
    });
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

  if (waitingForOther) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-orange-700 to-orange-600 flex items-center justify-center p-6" dir="rtl">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 text-center max-w-md"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-8xl mb-6"
          >
            ⏳
          </motion.div>
          <h2 className="text-4xl font-black text-white mb-4">
            מחכים ל{user2Name}...
          </h2>
          <p className="text-xl text-white/80 mb-8">
            שלחנו לו/ה הודעה, הוא/היא צריכ/ה לענות על השאלות
          </p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="bg-white/20 hover:bg-white/30 text-white font-bold py-4 px-8 rounded-full"
          >
            סגור בינתיים
          </motion.button>
        </motion.div>
      </div>
    );
  }

  if (isComplete) {
    const finalScore = calculateScore();
    const maxScore = allQuestions.length * 10;
    const compatibilityPercent = Math.round((finalScore / maxScore) * 100);
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
                    item.type === 'match' ? 'bg-green-500/20 border-green-400' :
                    item.type === 'compromise' ? 'bg-yellow-500/20 border-yellow-400' :
                    'bg-red-500/20 border-red-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{item.emoji}</span>
                    <div className="flex-1">
                      <p className="font-bold text-white text-sm">{item.title}</p>
                      <p className="text-white/80 text-xs mt-1">{item.result}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onClose?.()}
              className="w-full h-16 bg-gradient-to-r from-orange-400 to-orange-500 text-white text-xl font-black rounded-full shadow-2xl"
            >
              חתימה והפצה 🚀
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-orange-700 to-orange-600 overflow-hidden" dir="rtl">
      <AnimatePresence mode="wait">
        {showMatch && (
          <motion.div
            key="match"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600 z-50 flex items-center justify-center"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.3, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="text-9xl mb-4">💚</div>
              <h2 className="text-7xl font-black text-white">זה התאמה!</h2>
            </motion.div>
          </motion.div>
        )}

        {showConflict && (
          <motion.div
            key="conflict"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: 1, 
              opacity: 1,
              x: [0, -10, 10, -10, 10, 0]
            }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ x: { duration: 0.5 } }}
            className="absolute inset-0 bg-gradient-to-br from-orange-500 to-orange-600 z-50 flex items-center justify-center"
          >
            <motion.div className="text-center">
              <div className="text-9xl mb-4">😬</div>
              <h2 className="text-6xl font-black text-white">אופס...</h2>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-0 left-0 right-0 p-3 flex gap-1 z-10">
        {allQuestions.map((q, i) => {
          const answered = myAnswers[q.id] && theirAnswers[q.id];
          return (
            <div key={i} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: answered ? '100%' : '0%' }}
                className="h-full bg-gradient-to-r from-orange-400 to-red-400 rounded-full"
              />
            </div>
          );
        })}
      </div>

      <button
        onClick={() => onClose?.()}
        className="absolute top-4 left-4 z-20 w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/20 active:scale-95 transition-transform"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      <div className="h-full flex items-center justify-center p-6 pt-32">
        <AnimatePresence mode="wait">
          {showCompromise ? (
            <motion.div
              key="compromise"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: "spring", damping: 15 }}
              className="w-full max-w-md"
            >
              <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl p-8 shadow-2xl">
                <div className="text-center mb-6">
                  <div className="text-8xl mb-4">🤝</div>
                  <h2 className="text-4xl font-black text-white mb-2">בואו נמצא פתרון</h2>
                </div>
                <div className="bg-white/30 backdrop-blur-lg rounded-2xl p-6 mb-6">
                  <p className="text-white font-black text-2xl leading-tight text-center">
                    {currentQuestion.compromise}
                  </p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCompromiseAccept}
                  className="w-full h-16 bg-white text-orange-600 font-black text-xl rounded-full shadow-xl"
                >
                  מקובל! 👍
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
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
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}