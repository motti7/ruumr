// Each level/question keeps its original Hebrew text as a fallback and carries
// `*Key` fields pointing at the i18n catalog so React consumers (RoomiCharter,
// CharterResults) can render translated copy via t(...). `id`/`weight`/`emoji`
// are stable and not translated.
export const CHARTER_LEVELS = Object.freeze([
  {
    id: "level_1",
    name: "הקווים האדומים",
    nameKey: "charter_level_1",
    questions: [
      { id: "q_smoking", title: "עישון בדירה", titleKey: "cq_smoking_title", emoji: "🚬", option_a: "זורם/ת, תרגישו חופשי", optionAKey: "cq_smoking_a", option_b: "מעדיפ/ה אוויר נקי", optionBKey: "cq_smoking_b", compromise: "מעשנים רק במרפסת עם דלת סגורה.", compromiseKey: "cq_smoking_c", weight: 1.5 },
      { id: "q_partners", title: "בני/בנות זוג", titleKey: "cq_partners_title", emoji: "😍", option_a: "הבית פתוח, כולם מוזמנים", optionAKey: "cq_partners_a", option_b: "מעדיפ/ה את הלבד שלי", optionBKey: "cq_partners_b", compromise: "עד 3 לילות בשבוע; מעבר לכך משתתפים בחשבונות.", compromiseKey: "cq_partners_c", weight: 1 },
      { id: "q_pets", title: "בעלי חיים", titleKey: "cq_pets_title", emoji: "🐶", option_a: "אין על חיות!", optionAKey: "cq_pets_a", option_b: "אלרגי/ת או פחות מתאים לי", optionBKey: "cq_pets_b", compromise: "חשוב להסכים מראש לפני שנכנסים לדירה.", compromiseKey: "cq_pets_c", weight: 1.5 },
    ],
  },
  {
    id: "level_2",
    name: "ניקיון וסדר",
    nameKey: "charter_level_2",
    questions: [
      { id: "q_cleaning_strictness", title: "ניקיון - עד כמה מקפידים?", titleKey: "cq_cleaning_title", emoji: "🧹", option_a: "אוהב/ת ניקיון וטבלה מסודרת", optionAKey: "cq_cleaning_a", option_b: "קליל/ה, מנקים כשצריך", optionBKey: "cq_cleaning_b", compromise: "ניקיון יסודי פעם בשבוע ושמירה על סדר סביר.", compromiseKey: "cq_cleaning_c", weight: 1.25 },
      { id: "q_shopping", title: "קניות לבית", titleKey: "cq_shopping_title", emoji: "🛒", option_a: "קונים יחד ומתחלקים", optionAKey: "cq_shopping_a", option_b: "כל אחד קונה לעצמו", optionBKey: "cq_shopping_b", compromise: "קופה משותפת לבסיס, אוכל בנפרד.", compromiseKey: "cq_shopping_c", weight: 1 },
    ],
  },
  {
    id: "level_3",
    name: "החיים עצמם",
    nameKey: "charter_level_3",
    questions: [
      { id: "q_dishes", title: "כלים בכיור", titleKey: "cq_dishes_title", emoji: "🍽️", option_a: "שוטפ/ת מיד", optionAKey: "cq_dishes_a", option_b: "יכול לחכות למחר", optionBKey: "cq_dishes_b", compromise: "הכיור מתרוקן לפחות פעם ביום.", compromiseKey: "cq_dishes_c", weight: 1 },
      { id: "q_ac", title: "מלחמות המזגן", titleKey: "cq_ac_title", emoji: "❄️", option_a: "קר מאוד, 18 מעלות", optionAKey: "cq_ac_a", option_b: "חסכוני ונעים, 24 מעלות", optionBKey: "cq_ac_b", compromise: "23 מעלות בשטח המשותף.", compromiseKey: "cq_ac_c", weight: 0.75 },
      { id: "q_hosting", title: "חברים ומסיבות", titleKey: "cq_hosting_title", emoji: "🎉", option_a: "הבית פתוח", optionAKey: "cq_hosting_a", option_b: "צריך שקט ותיאום", optionBKey: "cq_hosting_b", compromise: "מתאמים מראש ושומרים על שקט אחרי 23:00.", compromiseKey: "cq_hosting_c", weight: 1 },
    ],
  },
]);

export const CHARTER_QUESTIONS = Object.freeze(CHARTER_LEVELS.flatMap((level) => level.questions));
export const CHARTER_QUESTION_IDS = Object.freeze(CHARTER_QUESTIONS.map((question) => question.id));

const CHARTER_QUESTION_ID_SET = new Set(CHARTER_QUESTION_IDS);

/**
 * @typedef {Array<Record<string, any>> | Record<string, any> | null | undefined} CharterAnswers
 */

/**
 * @param {CharterAnswers} answers
 */
export function getAnsweredCharterQuestionIds(answers = []) {
  const answeredIds = new Set();

  if (Array.isArray(answers)) {
    answers.forEach((answer) => {
      const questionId = String(answer?.question_id ?? "").trim();
      if (CHARTER_QUESTION_ID_SET.has(questionId) && (answer?.answer === "a" || answer?.answer === "b")) {
        answeredIds.add(questionId);
      }
    });
    return answeredIds;
  }

  if (answers && typeof answers === "object") {
    Object.entries(answers).forEach(([questionId, answer]) => {
      if (CHARTER_QUESTION_ID_SET.has(questionId) && (answer === "a" || answer === "b")) {
        answeredIds.add(questionId);
      }
    });
  }

  return answeredIds;
}

/**
 * @param {CharterAnswers} answers
 */
export function getCharterAnsweredCount(answers = []) {
  return getAnsweredCharterQuestionIds(answers).size;
}

/**
 * @param {CharterAnswers} answers
 */
export function isCharterComplete(answers = []) {
  const answeredIds = getAnsweredCharterQuestionIds(answers);
  return CHARTER_QUESTION_IDS.every((questionId) => answeredIds.has(questionId));
}

/**
 * @param {CharterAnswers} answers
 * @returns {Record<string, "a" | "b">}
 */
export function normalizeCharterAnswers(answers = []) {
  /** @type {Record<string, "a" | "b">} */
  const normalized = {};

  if (Array.isArray(answers)) {
    answers.forEach((answer) => {
      const questionId = String(answer?.question_id ?? "").trim();
      if (CHARTER_QUESTION_ID_SET.has(questionId) && (answer?.answer === "a" || answer?.answer === "b")) {
        normalized[questionId] = answer.answer;
      }
    });
  } else if (answers && typeof answers === "object") {
    CHARTER_QUESTION_IDS.forEach((questionId) => {
      if (answers[questionId] === "a" || answers[questionId] === "b") {
        normalized[questionId] = answers[questionId];
      }
    });
  }

  return normalized;
}

/**
 * @param {CharterAnswers} leftAnswers
 * @param {CharterAnswers} rightAnswers
 */
export function calculateCharterCompatibility(leftAnswers = {}, rightAnswers = {}) {
  const left = normalizeCharterAnswers(leftAnswers);
  const right = normalizeCharterAnswers(rightAnswers);
  const agreements = [];
  const disagreements = [];
  let agreedWeight = 0;
  let comparedWeight = 0;

  CHARTER_QUESTIONS.forEach((question) => {
    if (!left[question.id] || !right[question.id]) return;
    comparedWeight += question.weight;
    if (left[question.id] === right[question.id]) {
      agreedWeight += question.weight;
      agreements.push(question.id);
    } else {
      disagreements.push(question.id);
    }
  });

  return {
    compared_count: agreements.length + disagreements.length,
    score: comparedWeight > 0 ? Math.round((agreedWeight / comparedWeight) * 100) : null,
    agreements,
    disagreements,
  };
}

/**
 * @param {Array<Record<string, any>>} rows
 */
export function selectLatestCompleteLegacyQuestionnaire(rows = []) {
  const groups = new Map();
  (Array.isArray(rows) ? rows : []).forEach((row) => {
    const matchId = String(row?.match_id ?? "").trim();
    if (!matchId) return;
    const group = groups.get(matchId) || { answers: {}, answer_timestamps: {}, completed_at: null, timestamp: 0 };
    const timestamp = Math.max(
      Date.parse(String(row?.updated_date || "")) || 0,
      Date.parse(String(row?.created_date || "")) || 0
    );
    if (row?.answer === "a" || row?.answer === "b") {
      const previousTimestamp = group.answer_timestamps[row.question_id] || 0;
      if (timestamp >= previousTimestamp) {
        group.answers[row.question_id] = row.answer;
        group.answer_timestamps[row.question_id] = timestamp;
      }
    }
    if (timestamp >= group.timestamp) {
      group.timestamp = timestamp;
      group.completed_at = timestamp ? new Date(timestamp).toISOString() : group.completed_at;
    }
    groups.set(matchId, group);
  });

  const latest = [...groups.entries()]
    .filter(([, group]) => isCharterComplete(group.answers))
    .sort((left, right) => right[1].timestamp - left[1].timestamp)[0];

  return latest
    ? {
        match_id: latest[0],
        answers: normalizeCharterAnswers(latest[1].answers),
        completed_at: latest[1].completed_at,
      }
    : null;
}
