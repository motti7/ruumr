import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Loader2, X } from "lucide-react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import {
  CHARTER_LEVELS,
  CHARTER_QUESTIONS,
  getCharterAnsweredCount,
  normalizeCharterAnswers,
} from "@/lib/charterCompletion";
import { saveQuestionnairePreference } from "@/api/questionnairePreferences";
import { syncCurrentProfileToRuumrPlus } from "@/api/ruumrPlus";
import { base44 } from "@/api/base44Client";
import { User } from "@/entities/User";
import { trackMixpanel } from "@/lib/mixpanelTracking";

export default function RoomiCharter({
  matchId = null,
  mode = "match",
  initialAnswers = {},
  onClose,
  onComplete,
  requirePlusSync = false,
}) {
  const initial = useMemo(() => normalizeCharterAnswers(initialAnswers), [initialAnswers]);
  const firstMissingIndex = Math.max(0, CHARTER_QUESTIONS.findIndex((question) => !initial[question.id]));
  const [answers, setAnswers] = useState(initial);
  const [questionIndex, setQuestionIndex] = useState(firstMissingIndex === -1 ? 0 : firstMissingIndex);
  const [direction, setDirection] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const currentQuestion = CHARTER_QUESTIONS[questionIndex];
  const currentLevel = CHARTER_LEVELS.find((level) =>
    level.questions.some((question) => question.id === currentQuestion.id)
  );
  const progress = (getCharterAnsweredCount(answers) / CHARTER_QUESTIONS.length) * 100;

  const notifyMatchPartner = async (wasComplete) => {
    if (!matchId || wasComplete) return;
    try {
      const user = await User.me();
      const matches = [
        ...(await base44.entities.Match.filter({ user1_id: user.id })),
        ...(await base44.entities.Match.filter({ user2_id: user.id })),
      ];
      const match = matches.find((item) => String(item.id) === String(matchId));
      if (!match) return;
      const partnerId = String(match.user1_id) === String(user.id) ? match.user2_id : match.user1_id;

      // Get current user's profile name for the email
      const myProfiles = await base44.entities.Profile.filter({ user_id: user.id });
      const myName = myProfiles[0]?.name || user.full_name || 'ההתאמה שלך';

      // Send push notification
      await base44.functions.invoke("sendPushNotification", {
        user_id: partnerId,
        title: "השאלון מחכה לך!",
        message: `${myName} כבר מילא/ה את שאלון הדירה - עכשיו התור שלך.`,
        data: { type: "charter", match_id: matchId },
      });

      // Send email reminder
      await base44.functions.invoke("sendQuestionnaireReminderEmail", {
        user_id: partnerId,
        partner_name: myName,
      });
    } catch (notificationError) {
      console.info("Questionnaire notification skipped", notificationError);
    }
  };

  const saveCompletedAnswers = async (completedAnswers) => {
    setIsSaving(true);
    setError("");
    try {
      const source = mode === "plus"
        ? (Object.keys(initial).length ? "plus_edit" : "plus_activation")
        : "match_questionnaire";
      const result = await saveQuestionnairePreference({
        answers: completedAnswers,
        source,
        sourceMatchId: matchId,
      });

      if (requirePlusSync) {
        await syncCurrentProfileToRuumrPlus();
      } else {
        syncCurrentProfileToRuumrPlus().catch((syncError) => {
          console.error("Questionnaire Plus sync failed:", syncError);
        });
      }

      trackMixpanel("Match Questionnaire Completed", { source });
      confetti({
        particleCount: 140,
        spread: 100,
        origin: { y: 0.45 },
        colors: ["#FF5722", "#FF1744", "#F50057", "#FFD700"],
      });
      await notifyMatchPartner(Boolean(result?.was_complete));
      onComplete?.(result.preference);
    } catch (saveError) {
      console.error("Questionnaire save failed:", saveError);
      setError(
        requirePlusSync
          ? "התשובות נשמרו בטופס, אבל לא הצלחנו לסנכרן אותן ל-Plus. נסו שוב."
          : "לא הצלחנו לשמור את התשובות. נסו שוב."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleAnswer = async (value) => {
    if (isSaving) return;
    const nextAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(nextAnswers);
    setDirection(value === "a" ? -1 : 1);

    if (questionIndex < CHARTER_QUESTIONS.length - 1) {
      setQuestionIndex((index) => index + 1);
      return;
    }
    await saveCompletedAnswers(nextAnswers);
  };

  return (
    <div className="fixed inset-0 z-[80] overflow-hidden bg-gradient-to-br from-slate-900 via-orange-700 to-orange-600" dir="rtl">
      <button
        type="button"
        onClick={onClose}
        disabled={isSaving}
        className="absolute left-4 top-14 z-20 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white/10 backdrop-blur-md"
        aria-label="סגור"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 56px)' }}
      >
        <X className="h-6 w-6 text-white" />
      </button>

      <div className="absolute left-4 right-4 h-2 overflow-hidden rounded-full bg-white/20" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}>
        <motion.div className="h-full bg-white" animate={{ width: `${progress}%` }} />
      </div>

      <div className="absolute inset-x-0 bottom-20 top-16 flex items-center justify-center px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ x: direction > 0 ? 260 : -260, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction > 0 ? -260 : 260, opacity: 0 }}
            className="w-full max-w-md"
          >
            <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-orange-400 to-orange-500 shadow-2xl">
              <div className="px-6 pb-7 pt-10 text-center">
                <p className="mb-2 text-xs font-bold text-white/70">{currentLevel?.name}</p>
                <div className="mb-4 text-6xl">{currentQuestion.emoji}</div>
                <h2 className="text-2xl font-black text-white">{currentQuestion.title}</h2>
                <p className="mt-2 font-bold text-white/80">מה את/ה מעדיפ/ה?</p>
              </div>
              <div className="space-y-4 px-6 pb-10">
                {["a", "b"].map((value) => (
                  <motion.button
                    key={value}
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleAnswer(value)}
                    disabled={isSaving}
                    className={`w-full rounded-2xl px-4 py-7 text-right text-base font-bold text-white shadow-lg ${
                      value === "a"
                        ? "bg-gradient-to-r from-orange-500 to-red-600"
                        : "bg-gradient-to-r from-blue-500 to-purple-600"
                    } ${answers[currentQuestion.id] === value ? "ring-4 ring-white/70" : ""}`}
                  >
                    {value === "a" ? currentQuestion.option_a : currentQuestion.option_b}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {error && (
        <div className="absolute inset-x-4 bottom-20 rounded-2xl bg-white p-4 text-sm font-medium text-red-700 shadow-xl">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            type="button"
            onClick={() => saveCompletedAnswers(answers)}
            disabled={isSaving}
            className="mt-3 w-full rounded-full bg-[--theme-orange] text-white"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "נסה/י שוב"}
          </Button>
        </div>
      )}
    </div>
  );
}