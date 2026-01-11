import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, Check, AlertCircle, Trophy, ArrowRight, Users, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

const CHARTER_DATA = {
  "game_title": "Roomi Vibe Check",
  "levels": [
    {
      "id": "level_1",
      "name": "🚩 הקווים האדומים (Dealbreakers)",
      "description": "דברים שאי אפשר לגור ביחד בלעדיהם. חייבים הסכמה!",
      "questions": [
        {
          "id": "q_smoking",
          "title": "🚬 עישון בדירה",
          "option_a": "בכיף, חופשי בסלון",
          "option_b": "איכס! רק בחוץ/במרפסת",
          "compromise": "מעשנים רק במרפסת (עם דלת סגורה!)",
          "icon": "🚬"
        },
        {
          "id": "q_partners",
          "title": "😍 בני/בנות זוג",
          "option_a": "בית פתוח - שישנו פה חופשי",
          "option_b": "מוגזם - גג פעמיים בשבוע",
          "compromise": "עד 3 לילות בשבוע. מעבר לזה? משתתפים בחשבונות.",
          "icon": "💕"
        },
        {
          "id": "q_pets",
          "title": "🐶 בעלי חיים",
          "option_a": "מת על חיות, תביאו הכל",
          "option_b": "אלרגי / לא מתחבר",
          "compromise": "אין פשרה (זה Dealbreaker). חייבים להסכים מראש.",
          "icon": "🐾"
        }
      ]
    },
    {
      "id": "level_2",
      "name": "💸 הכסף והבירוקרטיה (The Bank)",
      "description": "כדי שלא נריב על השקל...",
      "questions": [
        {
          "id": "q_groceries",
          "title": "🛒 קניות לבית (נייר טואלט, שמן, חלב)",
          "option_a": "קונים משותף ומתחלקים",
          "option_b": "כל אחד קונה לעצמו (מדפים נפרדים)",
          "compromise": "בסיס משותף (נייר טואלט, חומרי ניקוי) - אוכל בנפרד.",
          "icon": "🛒"
        },
        {
          "id": "q_bills",
          "title": "🧾 תשלום חשבונות",
          "option_a": "אחד משלם והשאר מעבירים לו בביט",
          "option_b": "כל חשבון על שם מישהו אחר",
          "compromise": "משתמשים באפליקציית תשלומים ייעודית (כמו Splitwise).",
          "icon": "💳"
        },
        {
          "id": "q_cleaning_money",
          "title": "🧹 מנקה חיצונית?",
          "option_a": "חייבים! שמים כסף כל שבוע",
          "option_b": "חבל על הכסף, מנקים לבד",
          "compromise": "מנקים לבד בשוטף, מביאים מנקה פעם בחודש ליסודי.",
          "icon": "🧽"
        }
      ]
    },
    {
      "id": "level_3",
      "name": "🍕 החיים עצמם (Lifestyle)",
      "description": "הדברים הקטנים שעושים את ההבדל",
      "questions": [
        {
          "id": "q_dishes",
          "title": "🍽️ כלים בכיור",
          "option_a": "שוטפים מיד אחרי האוכל!",
          "option_b": "זורמים... שוטפים כשמצטבר",
          "compromise": "חוק ה-24 שעות: הכיור חייב להיות ריק לפני שהולכים לישון.",
          "icon": "🍴"
        },
        {
          "id": "q_ac",
          "title": "❄️ מלחמות המזגן (קיץ)",
          "option_a": "מקפיא! 18 מעלות",
          "option_b": "חסכוני/נעים - 24 מעלות",
          "compromise": "23 מעלות ביום, בלילה כל אחד בחדר שלו מחליט.",
          "icon": "🌡️"
        },
        {
          "id": "q_hosting",
          "title": "🎉 חברים ומסיבות",
          "option_a": "תמיד שמח, הבית פתוח",
          "option_b": "צריך שקט, לתאם מראש",
          "compromise": "מותר לארח בכיף, אבל אחרי 23:00 שומרים על שקט בסלון.",
          "icon": "🎊"
        }
      ]
    }
  ]
};

export default function RoomiCharter({ user1Name, user2Name, onComplete }) {
  const [currentUser, setCurrentUser] = useState('user1'); // user1 or user2
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showCompromise, setShowCompromise] = useState(false);
  const [showMatch, setShowMatch] = useState(false);
  const [showConflict, setShowConflict] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const allQuestions = CHARTER_DATA.levels.flatMap(level => 
    level.questions.map(q => ({ ...q, levelName: level.name }))
  );
  
  const currentLevel = CHARTER_DATA.levels[currentLevelIndex];
  const currentQuestion = currentLevel?.questions[currentQuestionIndex];
  const progress = ((Object.keys(answers).length / 2) / allQuestions.length) * 100;

  const handleAnswer = (option) => {
    const qId = currentQuestion.id;
    const newAnswers = { ...answers, [`${qId}_${currentUser}`]: option };
    setAnswers(newAnswers);

    // Check if both users answered
    const user1Answer = currentUser === 'user1' ? option : newAnswers[`${qId}_user1`];
    const user2Answer = currentUser === 'user2' ? option : newAnswers[`${qId}_user2`];

    if (user1Answer && user2Answer) {
      if (user1Answer === user2Answer) {
        // Match!
        setShowMatch(true);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        setTimeout(() => {
          setShowMatch(false);
          moveToNext();
        }, 2000);
      } else {
        // Conflict
        setShowConflict(true);
        setTimeout(() => {
          setShowConflict(false);
          setShowCompromise(true);
        }, 1500);
      }
    } else {
      // Switch to other user
      setCurrentUser(currentUser === 'user1' ? 'user2' : 'user1');
    }
  };

  const handleCompromiseAccept = () => {
    const qId = currentQuestion.id;
    setAnswers({ ...answers, [`${qId}_compromise`]: true });
    setShowCompromise(false);
    moveToNext();
  };

  const moveToNext = () => {
    if (currentQuestionIndex < currentLevel.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCurrentUser('user1');
    } else if (currentLevelIndex < CHARTER_DATA.levels.length - 1) {
      setCurrentLevelIndex(currentLevelIndex + 1);
      setCurrentQuestionIndex(0);
      setCurrentUser('user1');
    } else {
      setIsComplete(true);
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
        result: isMatch ? (user1 === 'a' ? q.option_a : q.option_b) : (isCompromise ? q.compromise : 'לא הוסכם'),
        type: isMatch ? 'match' : (isCompromise ? 'compromise' : 'conflict')
      };
    });
  };

  if (isComplete) {
    const finalScore = calculateScore();
    const maxScore = allQuestions.length * 10;
    const summary = getSummary();

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-gradient-to-br from-orange-400 to-pink-500 z-50 overflow-auto"
        dir="rtl"
      >
        <div className="min-h-screen p-6 pb-24">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring" }}
              className="bg-white rounded-3xl p-8 shadow-2xl mb-6"
            >
              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Trophy className="w-12 h-12 text-white" />
                </div>
                <h1 className="text-3xl font-black text-gray-900 mb-2">🎉 החוזה הושלם!</h1>
                <p className="text-gray-600">ציון תואמות: <span className="text-4xl font-black text-[--theme-orange]">{finalScore}/{maxScore}</span></p>
              </div>

              <div className="space-y-3 mb-6">
                <h3 className="font-bold text-lg text-gray-900 mb-3">✅ הכללים המוסכמים:</h3>
                {summary.map((item, i) => (
                  <div key={i} className={`p-3 rounded-xl border-2 ${
                    item.type === 'match' ? 'bg-green-50 border-green-200' :
                    item.type === 'compromise' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-start gap-2">
                      {item.type === 'match' && <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />}
                      {item.type === 'compromise' && <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />}
                      {item.type === 'conflict' && <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />}
                      <div className="flex-1">
                        <p className="font-bold text-sm text-gray-900">{item.title}</p>
                        <p className="text-xs text-gray-700 mt-1">{item.result}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => onComplete?.(summary, finalScore)}
                className="w-full h-14 text-lg font-bold gradient-orange text-white rounded-full shadow-lg hover:scale-105 transition-transform"
              >
                <Sparkles className="w-5 h-5 ml-2" />
                חתום ושמור את החוזה
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (!currentQuestion) return null;

  const currentUserName = currentUser === 'user1' ? user1Name : user2Name;

  return (
    <div className="fixed inset-0 bg-gray-50 z-50 overflow-hidden" dir="rtl">
      <AnimatePresence>
        {showMatch && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center mb-4 mx-auto shadow-2xl">
                <Heart className="w-16 h-16 text-white" fill="white" />
              </div>
              <h2 className="text-4xl font-black text-white">התאמה! 🎉</h2>
            </motion.div>
          </motion.div>
        )}

        {showConflict && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="w-32 h-32 bg-red-500 rounded-full flex items-center justify-center mb-4 mx-auto shadow-2xl">
                <AlertCircle className="w-16 h-16 text-white" />
              </div>
              <h2 className="text-4xl font-black text-white">אופס... 😅</h2>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-full flex flex-col">
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-black text-gray-900">{CHARTER_DATA.game_title}</h1>
            <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
              <Users className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-bold text-gray-700">{currentUserName}</span>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full gradient-orange"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">{currentLevel.name}</p>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          {showCompromise ? (
            <motion.div
              key="compromise"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-md"
            >
              <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl p-8 shadow-2xl text-center">
                <div className="text-6xl mb-4">🤝</div>
                <h2 className="text-2xl font-black text-white mb-4">בואו נמצא פתרון</h2>
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 mb-6">
                  <p className="text-white font-bold text-lg leading-relaxed">{currentQuestion.compromise}</p>
                </div>
                <Button
                  onClick={handleCompromiseAccept}
                  className="w-full h-14 bg-white text-[--theme-orange] font-black text-lg rounded-full hover:scale-105 transition-transform shadow-lg"
                >
                  <Check className="w-5 h-5 ml-2" />
                  מקובל עלינו!
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -300 }}
              className="w-full max-w-md"
            >
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-br from-orange-400 to-pink-500 p-8 text-center">
                  <div className="text-7xl mb-4">{currentQuestion.icon}</div>
                  <h2 className="text-2xl font-black text-white leading-tight">{currentQuestion.title}</h2>
                </div>
                <div className="p-6 space-y-4">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAnswer('a')}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-lg p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-105"
                  >
                    {currentQuestion.option_a}
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAnswer('b')}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold text-lg p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-105"
                  >
                    {currentQuestion.option_b}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}