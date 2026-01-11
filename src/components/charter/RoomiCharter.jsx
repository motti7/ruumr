import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, AlertCircle, Sparkles, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";

const CHARTER_DATA = {
  levels: [
    {
      name: "Dealbreakers",
      emoji: "🚨",
      questions: [
        {
          id: "smoking",
          question: "עישון בדירה?",
          emoji: "🚬",
          options: [
            { id: "yes", text: "כן, בסדר גמור", emoji: "✅" },
            { id: "no", text: "ממש לא!", emoji: "🚫" }
          ],
          compromise: "עישון רק במרפסת/חוץ"
        },
        {
          id: "pets",
          question: "חיות מחמד בדירה?",
          emoji: "🐕",
          options: [
            { id: "yes", text: "בטח! אוהב/ת חיות", emoji: "❤️" },
            { id: "no", text: "לא, אלרגיה/העדפה", emoji: "🙅" }
          ],
          compromise: "רק חיות קטנות בכלוב (דגים, ציפורים)"
        },
        {
          id: "overnight_guests",
          question: "אורחים לינה?",
          emoji: "🛏️",
          options: [
            { id: "yes", text: "כן, בתיאום מראש", emoji: "👍" },
            { id: "rarely", text: "רק לעיתים נדירות", emoji: "⏰" }
          ],
          compromise: "אורחים מקסימום פעם בחודש עם הודעה מראש"
        }
      ]
    },
    {
      name: "Money Matters",
      emoji: "💰",
      questions: [
        {
          id: "bills_split",
          question: "איך מחלקים חשבונות?",
          emoji: "💸",
          options: [
            { id: "equal", text: "חלוקה שווה", emoji: "⚖️" },
            { id: "usage", text: "לפי שימוש", emoji: "📊" }
          ],
          compromise: "חשבונות קבועים שווה, משתנים לפי שימוש"
        },
        {
          id: "shared_expenses",
          question: "קניות משותפות?",
          emoji: "🛒",
          options: [
            { id: "shared", text: "קופה משותפת", emoji: "🏦" },
            { id: "separate", text: "כל אחד לעצמו", emoji: "🚶" }
          ],
          compromise: "משותף רק למוצרי בסיס (נייר טואלט, חומרי ניקיון)"
        }
      ]
    },
    {
      name: "Lifestyle Vibes",
      emoji: "🌟",
      questions: [
        {
          id: "cleaning",
          question: "שגרת ניקיון?",
          emoji: "🧹",
          options: [
            { id: "weekly", text: "ניקיון שבועי יחד", emoji: "📅" },
            { id: "rotation", text: "רוטציה - כל אחד בתורו", emoji: "🔄" }
          ],
          compromise: "רוטציה שבועית + ניקיון גדול משותף פעם בחודש"
        },
        {
          id: "noise",
          question: "רעש בלילה?",
          emoji: "🔊",
          options: [
            { id: "quiet", text: "שקט אחרי 22:00", emoji: "😴" },
            { id: "flexible", text: "גמיש, בתיאום", emoji: "🤝" }
          ],
          compromise: "שקט בימי ראשון-חמישי, גמיש בסופ\"ש"
        },
        {
          id: "parties",
          question: "מסיבות בדירה?",
          emoji: "🎉",
          options: [
            { id: "yes", text: "בטח! נהנה מחברה", emoji: "🥳" },
            { id: "rarely", text: "רק לאירועים מיוחדים", emoji: "🎂" }
          ],
          compromise: "מסיבות מקסימום פעם בחודשיים עם הודעה שבוע מראש"
        },
        {
          id: "common_areas",
          question: "שימוש במרחבים משותפים?",
          emoji: "🏠",
          options: [
            { id: "shared", text: "שימוש חופשי לכולם", emoji: "🤗" },
            { id: "scheduled", text: "מתואם מראש", emoji: "📋" }
          ],
          compromise: "חופשי למעט אירועים גדולים - צריך תיאום"
        }
      ]
    }
  ]
};

export default function RoomiCharter({ matchId, user1Name, user2Name, onClose }) {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({ user1: {}, user2: {} });
  const [currentUser, setCurrentUser] = useState("user1");
  const [showConflict, setShowConflict] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [pendingAnswer, setPendingAnswer] = useState(null);

  const allQuestions = CHARTER_DATA.levels.flatMap(level => level.questions);
  const currentQ = allQuestions[currentQuestion];
  const totalQuestions = allQuestions.length;
  const progress = ((currentQuestion + 1) / totalQuestions) * 100;

  const handleAnswer = (optionId) => {
    const questionId = currentQ.id;
    const newAnswers = { ...answers };
    
    if (currentUser === "user1") {
      newAnswers.user1[questionId] = optionId;
      setAnswers(newAnswers);
      setPendingAnswer(optionId);
      setCurrentUser("user2");
    } else {
      newAnswers.user2[questionId] = optionId;
      setAnswers(newAnswers);
      
      // Check if match
      if (newAnswers.user1[questionId] === optionId) {
        // Match!
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        setTimeout(() => nextQuestion(), 1500);
      } else {
        // Conflict
        setShowConflict(true);
      }
    }
  };

  const handleCompromise = () => {
    const questionId = currentQ.id;
    const newAnswers = { ...answers };
    newAnswers.user1[questionId] = "compromise";
    newAnswers.user2[questionId] = "compromise";
    setAnswers(newAnswers);
    setShowConflict(false);
    nextQuestion();
  };

  const nextQuestion = () => {
    setCurrentUser("user1");
    setPendingAnswer(null);
    
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      setShowSummary(true);
    }
  };

  const calculateScore = () => {
    let score = 0;
    allQuestions.forEach(q => {
      const answer1 = answers.user1[q.id];
      const answer2 = answers.user2[q.id];
      
      if (answer1 === answer2 && answer1 !== "compromise") {
        score += 10; // Perfect match
      } else if (answer1 === "compromise" && answer2 === "compromise") {
        score += 5; // Compromise
      }
    });
    return score;
  };

  const maxScore = totalQuestions * 10;
  const score = calculateScore();
  const compatibilityPercent = Math.round((score / maxScore) * 100);

  if (showSummary) {
    return (
      <div className="fixed inset-0 bg-white z-[100] overflow-auto" dir="rtl">
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-white rounded-3xl shadow-2xl p-8">
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="w-24 h-24 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <Sparkles className="w-12 h-12 text-white" />
                </motion.div>
                <h2 className="text-3xl font-black mb-2">חוזה השותפות שלכם מוכן!</h2>
                <p className="text-gray-500">הנה מה שסיכמתם 🎉</p>
              </div>

              <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-gray-700">ציון התאמה</span>
                  <span className="text-2xl font-black text-[--theme-orange]">{compatibilityPercent}%</span>
                </div>
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${compatibilityPercent}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full bg-gradient-to-r from-orange-400 to-pink-500"
                  />
                </div>
                <p className="text-center text-sm text-gray-500 mt-2">
                  {compatibilityPercent >= 80 && "התאמה מעולה! אתם יכולים להיות שותפים נהדרים 🌟"}
                  {compatibilityPercent >= 60 && compatibilityPercent < 80 && "התאמה טובה! יש לכם בסיס מוצק 👍"}
                  {compatibilityPercent < 60 && "יש עבודה לעשות, אבל אפשר להצליח! 💪"}
                </p>
              </div>

              <div className="space-y-4 mb-8">
                <h3 className="font-bold text-lg mb-4">הכללים שלכם:</h3>
                {allQuestions.map(q => {
                  const answer1 = answers.user1[q.id];
                  const answer2 = answers.user2[q.id];
                  const isMatch = answer1 === answer2 && answer1 !== "compromise";
                  const isCompromise = answer1 === "compromise";
                  
                  return (
                    <div key={q.id} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{q.emoji}</span>
                        <div className="flex-1">
                          <p className="font-bold text-gray-800 mb-1">{q.question}</p>
                          {isMatch && (
                            <div className="flex items-center gap-2 text-green-600">
                              <Check className="w-4 h-4" />
                              <span className="text-sm font-medium">
                                {q.options.find(o => o.id === answer1)?.text}
                              </span>
                            </div>
                          )}
                          {isCompromise && (
                            <div className="flex items-center gap-2 text-orange-600">
                              <AlertCircle className="w-4 h-4" />
                              <span className="text-sm font-medium">{q.compromise}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <Button onClick={onClose} variant="outline" className="flex-1">
                  סגור
                </Button>
                <Button 
                  onClick={() => {
                    confetti({
                      particleCount: 200,
                      spread: 100,
                      origin: { y: 0.5 }
                    });
                  }}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
                >
                  <Sparkles className="w-4 h-4 ml-2" />
                  חגוג!
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (showConflict) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-red-50 to-orange-50 z-[100] flex items-center justify-center p-6" dir="rtl">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full"
        >
          <div className="text-center mb-6">
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.5 }}
              className="text-6xl mb-4"
            >
              😬
            </motion.div>
            <h3 className="text-2xl font-black mb-2">אופס! יש פה אי-הסכמה</h3>
            <p className="text-gray-600">אבל אל דאגה, יש לנו פשרה מנצחת!</p>
          </div>

          <div className="bg-orange-50 rounded-2xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-3xl">{currentQ.emoji}</span>
              <div>
                <p className="font-bold text-lg mb-3">{currentQ.question}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-blue-600">{user1Name}:</span>
                    <span>{currentQ.options.find(o => o.id === answers.user1[currentQ.id])?.text}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-pink-600">{user2Name}:</span>
                    <span>{currentQ.options.find(o => o.id === answers.user2[currentQ.id])?.text}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 mb-6">
            <p className="text-sm text-gray-500 mb-2">💡 הפשרה שלנו:</p>
            <p className="font-bold text-gray-800">{currentQ.compromise}</p>
          </div>

          <Button 
            onClick={handleCompromise}
            className="w-full h-14 text-lg font-bold bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
          >
            מסכימ/ה לפשרה ✨
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-orange-100 to-pink-100 z-[100] overflow-auto" dir="rtl">
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm p-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <button onClick={onClose} className="p-2">
                <ArrowRight className="w-6 h-6 text-gray-600" />
              </button>
              <h2 className="font-black text-xl">חוזה השותפות 📜</h2>
              <div className="w-10" />
            </div>
            
            {/* Progress Bar */}
            <div className="mb-2">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-gradient-to-r from-orange-400 to-pink-500"
                />
              </div>
              <p className="text-xs text-gray-500 text-center mt-1">
                שאלה {currentQuestion + 1} מתוך {totalQuestions}
              </p>
            </div>

            {/* Current User Indicator */}
            <div className="flex items-center justify-center gap-4">
              <div className={`px-4 py-2 rounded-full font-bold transition-all ${
                currentUser === "user1" 
                  ? "bg-blue-500 text-white scale-110" 
                  : "bg-gray-200 text-gray-500"
              }`}>
                {user1Name}
              </div>
              <span className="text-2xl">👥</span>
              <div className={`px-4 py-2 rounded-full font-bold transition-all ${
                currentUser === "user2" 
                  ? "bg-pink-500 text-white scale-110" 
                  : "bg-gray-200 text-gray-500"
              }`}>
                {user2Name}
              </div>
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div className="flex-1 flex items-center justify-center p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion}
              initial={{ scale: 0.8, opacity: 0, rotateY: -90 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              exit={{ scale: 0.8, opacity: 0, rotateY: 90 }}
              transition={{ type: "spring", duration: 0.6 }}
              className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full"
            >
              <div className="text-center mb-8">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-7xl mb-4"
                >
                  {currentQ.emoji}
                </motion.div>
                <h3 className="text-2xl font-black mb-2">{currentQ.question}</h3>
                <p className="text-gray-500 text-sm">
                  {currentUser === "user1" ? user1Name : user2Name}, מה אתה/ת מעדיפ/ה?
                </p>
              </div>

              <div className="space-y-4">
                {currentQ.options.map((option, idx) => (
                  <motion.button
                    key={option.id}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleAnswer(option.id)}
                    className="w-full bg-gradient-to-r from-orange-50 to-pink-50 hover:from-orange-100 hover:to-pink-100 border-2 border-orange-200 rounded-2xl p-6 flex items-center gap-4 transition-all"
                  >
                    <span className="text-4xl">{option.emoji}</span>
                    <span className="font-bold text-lg flex-1 text-right">{option.text}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}