import {
  PROFILE_SIGNAL_IMAGE_REVEAL_SECONDS,
  PROFILE_SIGNAL_MODEL_VERSION,
} from "@/lib/profileSignals/config";

export const PROFILE_SIGNAL_QUESTIONS = Object.freeze([
  {
    id: "dishes_sink_reaction_001",
    version: 1,
    modelVersion: PROFILE_SIGNAL_MODEL_VERSION,
    media: {
      type: "video",
      src: "/profile-signals/dishes-sink-roommate-tension.mp4",
      alt: "A rushed roommate leaves dirty dishes in the sink and another roommate notices them",
    },
    prompt_he: "מה הכי דומה למה שהיית עושה בסיטואציה הזאת?",
    prompt_en: "What best describes what you would do in this situation?",
    answers: [
      {
        id: "direct_boundary",
        label_he: "אומר/ת מיד שזה מפריע לי",
        label_en: "I would say right away that it bothers me",
        markers: { directness: 0.8, cleanliness_need: 0.7, conflict_avoidance: -0.4 },
      },
      {
        id: "quiet_fix",
        label_he: "אשטוף בעצמי ואמשיך הלאה",
        label_en: "I would wash them myself and move on",
        markers: { directness: -0.5, cleanliness_need: 0.6, conflict_avoidance: 0.6 },
      },
      {
        id: "later_message",
        label_he: "אשלח הודעה רגועה אחר כך",
        label_en: "I would send a calm message later",
        markers: { directness: 0.3, cleanliness_need: 0.5, conflict_avoidance: 0.2 },
      },
      {
        id: "shared_rule",
        label_he: "אציע כלל קבוע לכלים",
        label_en: "I would suggest a clear dishes rule",
        markers: { structure_preference: 0.8, cleanliness_need: 0.6, cooperation: 0.7 },
      },
    ],
  },
  {
    id: "late_guests_living_room_001",
    version: 1,
    modelVersion: PROFILE_SIGNAL_MODEL_VERSION,
    media: {
      type: "image",
      src: "/profile-signals/late-guests.svg",
      revealAfterSeconds: PROFILE_SIGNAL_IMAGE_REVEAL_SECONDS,
      alt: "Late guests in a shared living room",
    },
    prompt_he: "השותף/ה הזמין/ה חברים מאוחר בלי לעדכן. מה הכי מתאים לך?",
    prompt_en: "Your roommate invited friends over late without letting you know. What feels most like you?",
    answers: [
      {
        id: "join_flow",
        label_he: "אצטרף בכיף אם יש אווירה טובה",
        label_en: "I would join if the vibe is good",
        markers: { social_flexibility: 0.8, quiet_need: -0.5, spontaneity: 0.6 },
      },
      {
        id: "ask_quiet_now",
        label_he: "אבקש להנמיך עכשיו",
        label_en: "I would ask them to keep it down now",
        markers: { directness: 0.7, quiet_need: 0.7, conflict_avoidance: -0.3 },
      },
      {
        id: "expect_notice",
        label_he: "זה בסדר, אבל חשוב לעדכן מראש",
        label_en: "It is okay, but I expect advance notice",
        markers: { structure_preference: 0.6, quiet_need: 0.3, cooperation: 0.5 },
      },
      {
        id: "hard_no_late",
        label_he: "מעדיפ/ה שלא יהיו אורחים מאוחר",
        label_en: "I prefer not having guests late at night",
        markers: { quiet_need: 0.9, social_flexibility: -0.6, boundary_strength: 0.7 },
      },
    ],
  },
  {
    id: "shared_bill_forgotten_001",
    version: 1,
    modelVersion: PROFILE_SIGNAL_MODEL_VERSION,
    media: {
      type: "image",
      src: "/profile-signals/shared-bill.svg",
      revealAfterSeconds: PROFILE_SIGNAL_IMAGE_REVEAL_SECONDS,
      alt: "Roommates looking at a forgotten shared bill",
    },
    prompt_he: "חשבון משותף נשכח ונוצר קנס קטן. איך תגיב/י?",
    prompt_en: "A shared bill was forgotten and caused a small fee. How would you react?",
    answers: [
      {
        id: "split_and_move",
        label_he: "נתחלק ונמשיך הלאה",
        label_en: "We split it and move on",
        markers: { financial_precision: -0.2, forgiveness: 0.7, cooperation: 0.6 },
      },
      {
        id: "owner_pays",
        label_he: "מי ששכח צריך לשלם את הקנס",
        label_en: "Whoever forgot should pay the fee",
        markers: { financial_precision: 0.8, accountability: 0.8, forgiveness: -0.3 },
      },
      {
        id: "make_tracking",
        label_he: "נפתח מעקב כדי שזה לא יקרה שוב",
        label_en: "We should set up tracking so it does not happen again",
        markers: { structure_preference: 0.8, accountability: 0.5, cooperation: 0.5 },
      },
      {
        id: "depends_pattern",
        label_he: "תלוי אם זה חד פעמי או דפוס",
        label_en: "It depends if this is a one-off or a pattern",
        markers: { forgiveness: 0.4, accountability: 0.5, nuance_tolerance: 0.8 },
      },
    ],
  },
  {
    id: "morning_bathroom_queue_001",
    version: 1,
    modelVersion: PROFILE_SIGNAL_MODEL_VERSION,
    media: {
      type: "image",
      src: "/profile-signals/bathroom-queue.svg",
      revealAfterSeconds: PROFILE_SIGNAL_IMAGE_REVEAL_SECONDS,
      alt: "Morning bathroom queue in a shared apartment",
    },
    prompt_he: "שני שותפים צריכים לצאת באותה שעה ויש תור למקלחת. מה הפתרון שלך?",
    prompt_en: "Two roommates need to leave at the same time and there is a bathroom queue. What is your fix?",
    answers: [
      {
        id: "schedule_slots",
        label_he: "קובעים שעות קבועות לבקרים",
        label_en: "Set regular morning time slots",
        markers: { structure_preference: 0.9, routine_need: 0.8, spontaneity: -0.5 },
      },
      {
        id: "who_first_today",
        label_he: "מי שממהר יותר נכנס ראשון",
        label_en: "Whoever is in a bigger rush goes first",
        markers: { flexibility: 0.7, cooperation: 0.6, structure_preference: -0.2 },
      },
      {
        id: "alternate_days",
        label_he: "עושים תורנות לפי ימים",
        label_en: "Alternate days fairly",
        markers: { fairness_need: 0.8, structure_preference: 0.6, cooperation: 0.4 },
      },
      {
        id: "wake_earlier",
        label_he: "אני פשוט אקום מוקדם יותר",
        label_en: "I would just wake up earlier",
        markers: { self_adjustment: 0.8, conflict_avoidance: 0.5, routine_need: 0.4 },
      },
    ],
  },
  {
    id: "fridge_space_overflow_001",
    version: 1,
    modelVersion: PROFILE_SIGNAL_MODEL_VERSION,
    media: {
      type: "image",
      src: "/profile-signals/fridge-space.svg",
      revealAfterSeconds: PROFILE_SIGNAL_IMAGE_REVEAL_SECONDS,
      alt: "Shared fridge with crowded shelves",
    },
    prompt_he: "המקרר מלא בדברים של שותף/ה אחד/ת ואין לך מקום. מה תעשה/י?",
    prompt_en: "The fridge is full of one roommate's food and you have no space. What would you do?",
    answers: [
      {
        id: "ask_clear_space",
        label_he: "אבקש לפנות מקום היום",
        label_en: "I would ask them to clear space today",
        markers: { directness: 0.7, shared_space_sensitivity: 0.8, conflict_avoidance: -0.2 },
      },
      {
        id: "label_shelves",
        label_he: "נחלק מדפים בצורה ברורה",
        label_en: "We should clearly divide shelves",
        markers: { structure_preference: 0.8, shared_space_sensitivity: 0.7, fairness_need: 0.7 },
      },
      {
        id: "use_less_space",
        label_he: "אסתדר עם פחות מקום בינתיים",
        label_en: "I would make do with less space for now",
        markers: { self_adjustment: 0.7, conflict_avoidance: 0.5, shared_space_sensitivity: -0.2 },
      },
      {
        id: "group_cleanup",
        label_he: "נעשה ניקוי מקרר משותף",
        label_en: "We should do a shared fridge cleanout",
        markers: { cooperation: 0.8, cleanliness_need: 0.5, shared_space_sensitivity: 0.5 },
      },
    ],
  },
]);

export const PROFILE_SIGNAL_QUESTION_IDS = Object.freeze(
  PROFILE_SIGNAL_QUESTIONS.map((question) => question.id)
);

export const PROFILE_SIGNAL_COPY = Object.freeze({
  he: {
    dialogLabel: "שאלה לשיפור הפרופיל",
    close: "סגור",
    badge: "שיפור התאמות",
    watch: "צפו בסיטואציה...",
    improveProfile: "שפרו את הפרופיל",
  },
  en: {
    dialogLabel: "Profile improvement question",
    close: "Close",
    badge: "Improve matches",
    watch: "Watch the situation...",
    improveProfile: "Improve profile",
  },
});

export function normalizeProfileSignalLanguage(language) {
  return String(language || "").trim().toLowerCase().startsWith("en") ? "en" : "he";
}

export function getPreferredProfileSignalLanguage(language = null) {
  if (language) return normalizeProfileSignalLanguage(language);
  if (typeof window !== "undefined") {
    const queryLanguage = new URLSearchParams(window.location.search).get("profileSignalLang");
    if (queryLanguage) return normalizeProfileSignalLanguage(queryLanguage);
  }
  if (typeof document !== "undefined") {
    const htmlLang = document.documentElement?.lang;
    if (htmlLang) return normalizeProfileSignalLanguage(htmlLang);
  }
  if (typeof navigator !== "undefined") {
    return normalizeProfileSignalLanguage(navigator.language);
  }
  return "he";
}

export function getProfileSignalCopy(language = null) {
  const normalized = normalizeProfileSignalLanguage(language);
  return PROFILE_SIGNAL_COPY[normalized] || PROFILE_SIGNAL_COPY.he;
}

export function getProfileSignalPrompt(question, language = null) {
  const normalized = normalizeProfileSignalLanguage(language);
  return question?.[`prompt_${normalized}`] || question?.prompt_he || "";
}

export function getProfileSignalAnswerLabel(answer, language = null) {
  const normalized = normalizeProfileSignalLanguage(language);
  return answer?.[`label_${normalized}`] || answer?.label_he || "";
}

export function getProfileSignalDirection(language = null) {
  return normalizeProfileSignalLanguage(language) === "en" ? "ltr" : "rtl";
}

export function getProfileSignalQuestion(questionId) {
  return PROFILE_SIGNAL_QUESTIONS.find((question) => question.id === questionId) || null;
}

export function getProfileSignalAnswer(question, answerId) {
  return question?.answers?.find((answer) => answer.id === answerId) || null;
}

export function getAnsweredProfileSignalQuestionIds(answers = []) {
  return new Set(
    (Array.isArray(answers) ? answers : [])
      .map((answer) => String(answer?.question_id || "").trim())
      .filter(Boolean)
  );
}

export function selectRandomUnansweredProfileSignalQuestion(answers = [], random = Math.random) {
  const answeredIds = getAnsweredProfileSignalQuestionIds(answers);
  const unanswered = PROFILE_SIGNAL_QUESTIONS.filter((question) => !answeredIds.has(question.id));
  if (unanswered.length === 0) return null;
  const index = Math.floor(random() * unanswered.length);
  return unanswered[Math.max(0, Math.min(index, unanswered.length - 1))];
}
