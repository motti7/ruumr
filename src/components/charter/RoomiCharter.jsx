import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { X } from 'lucide-react';
import confetti from 'canvas-confetti';

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
          "option_a": "בית פתוח - שישנו פה חופשי",
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

export default function RoomiCharter({ user1Name, user2Name, onClose }) {
  const [currentUser, setCurrentUser] = useState('user1');
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showCompromise, setShowCompromise] = useState(false);
  const [showMatch, setShowMatch] = useState(false);
  const [showConflict, setShowConflict] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [direction, setDirection] = useState(0);

  const allQuestions = CHARTER_DATA.levels.flatMap(level => level.questions);
  const currentLevel = CHARTER_DATA.levels[currentLevelIndex];
  const currentQuestion = currentLevel?.questions[currentQuestionIndex];
  const totalAnswered = Object.keys(answers).filter(k => !k.includes('compromise')).length / 2;
  const progress = (totalAnswered / allQuestions.length) * 100;

  const handleAnswer = (option) => {
    const qId = currentQuestion.id;
    const newAnswers = { ...answers, [`${qId}_${currentUser}`]: option };
    setAnswers(newAnswers);

    const user1Answer = currentUser === 'user1' ? option : newAnswers[`${qId}_user1`];
    const user2Answer = currentUser === 'user2' ? option : newAnswers[`${qId}_user2`];

    if (user1Answer && user2Answer) {
      if (user1Answer === user2Answer) {
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
    } else {
      setCurrentUser(currentUser === 'user1' ? 'user2' : 'user1');
      setDirection(option === 'a' ? 1 : -1);
    }
  };

  const handleCompromiseAccept = () => {
    const qId = currentQuestion.id;
    setAnswers({ ...answers, [`${qId}_compromise`]: true });
    setShowCompromise(false);
    moveToNext();
  };

  const moveToNext = () => {
    setCurrentUser('user1');
    if (currentQuestionIndex < currentLevel.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (currentLevelIndex < CHARTER_DATA.levels.length - 1) {
      setCurrentLevelIndex(currentLevelIndex + 1);
      setCurrentQuestionIndex(0);
    } else {
      setIsComplete(true);
      confetti({
        particleCount: 200,
        spread: 120,
        origin: { y: 0.4 },
        colors: ['#FF5722', '#FF1744', '#F50057', '#E91E63', '#FFD700']
      });
    }
  };

  const calculateScore = () => {
    let score = 0;
    allQuestions.forEach(q => {
      const user1 = answers[`${q.id}_user1`];
      const user2 = answers[`${q.id}_user2`];
      if (user1 === user2) score += 10;
      else if (answers[`${q.id}_compromise`]) score += 5;
    });
    return score;
  };

  const getSummary = () => {
    return allQuestions.map(q => {
      const user1 = answers[`${q.id}_user1`];
      const user2 = answers[`${q.id}_user2`];
      const isMatch = user1 === user2;
      const isCompromise = answers[`${q.id}_compromise`];
      return {
        title: q.title,
        emoji: q.emoji,
        result: isMatch ? (user1 === 'a' ? q.option_a : q.option_b) : (isCompromise ? q.compromise : 'לא הוסכם'),
        type: isMatch ? 'match' : (isCompromise ? 'compromise' : 'conflict')
      };
    });
  };

  if (isComplete) {
    const finalScore = calculateScore();
    const maxScore = allQuestions.length * 10;
    const compatibilityPercent = Math.round((finalScore / maxScore) * 100);
    const summary = getSummary();

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 overflow-auto bg-gradient-to-br from-orange-900 via-red-900 to-orange-800"
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
              className="w-full h-16 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xl font-black rounded-full shadow-2xl"
            >
              חתימה והפצה 🚀
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  if (!currentQuestion) return null;

  const currentUserName = currentUser === 'user1' ? user1Name : user2Name;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-gray-900 via-orange-900 to-red-900 overflow-hidden" dir="rtl">
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
            className="absolute inset-0 bg-gradient-to-br from-red-600 to-orange-600 z-50 flex items-center justify-center"
          >
            <motion.div className="text-center">
              <div className="text-9xl mb-4">😬</div>
              <h2 className="text-6xl font-black text-white">אופס...</h2>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instagram-style Progress */}
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
              initial={{ x: direction > 0 ? 300 : -300, opacity: 0, rotate: direction > 0 ? 20 : -20 }}
              animate={{ x: 0, opacity: 1, rotate: 0 }}
              exit={{ x: direction > 0 ? -300 : 300, opacity: 0, rotate: direction > 0 ? -20 : 20 }}
              transition={{ type: "spring", damping: 20, stiffness: 100 }}
              className="w-full max-w-md"
            >
              <div className="bg-gradient-to-br from-orange-600 to-red-600 rounded-3xl shadow-2xl overflow-hidden">
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