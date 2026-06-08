export const CHARTER_LEVELS = Object.freeze([
  {
    id: "level_1",
    name: "הקווים האדומים",
    questions: [
      { id: "q_smoking", title: "עישון בדירה", emoji: "🚬", option_a: "זורם/ת, תרגישו חופשי", option_b: "מעדיפ/ה אוויר נקי", compromise: "מעשנים רק במרפסת עם דלת סגורה.", weight: 1.5 },
      { id: "q_partners", title: "בני/בנות זוג", emoji: "😍", option_a: "הבית פתוח, כולם מוזמנים", option_b: "מעדיפ/ה את הלבד שלי", compromise: "עד 3 לילות בשבוע; מעבר לכך משתתפים בחשבונות.", weight: 1 },
      { id: "q_pets", title: "בעלי חיים", emoji: "🐶", option_a: "אין על חיות!", option_b: "אלרגי/ת או פחות מתאים לי", compromise: "חשוב להסכים מראש לפני שנכנסים לדירה.", weight: 1.5 },
    ],
  },
  {
    id: "level_2",
    name: "ניקיון וסדר",
    questions: [
      { id: "q_cleaning_strictness", title: "ניקיון - עד כמה מקפידים?", emoji: "🧹", option_a: "אוהב/ת ניקיון וטבלה מסודרת", option_b: "קליל/ה, מנקים כשצריך", compromise: "ניקיון יסודי פעם בשבוע ושמירה על סדר סביר.", weight: 1.25 },
      { id: "q_shopping", title: "קניות לבית", emoji: "🛒", option_a: "קונים יחד ומתחלקים", option_b: "כל אחד קונה לעצמו", compromise: "קופה משותפת לבסיס, אוכל בנפרד.", weight: 1 },
    ],
  },
  {
    id: "level_3",
    name: "החיים עצמם",
    questions: [
      { id: "q_dishes", title: "כלים בכיור", emoji: "🍽️", option_a: "שוטפ/ת מיד", option_b: "יכול לחכות למחר", compromise: "הכיור מתרוקן לפחות פעם ביום.", weight: 1 },
      { id: "q_ac", title: "מלחמות המזגן", emoji: "❄️", option_a: "קר מאוד, 18 מעלות", option_b: "חסכוני ונעים, 24 מעלות", compromise: "23 מעלות בשטח המשותף.", weight: 0.75 },
      { id: "q_hosting", title: "חברים ומסיבות", emoji: "🎉", option_a: "הבית פתוח", option_b: "צריך שקט ותיאום", compromise: "מתאמים מראש ושומרים על שקט אחרי 23:00.", weight: 1 },
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
