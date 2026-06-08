export const CHARTER_QUESTION_IDS = Object.freeze([
  "q_smoking",
  "q_partners",
  "q_pets",
  "q_cleaning_strictness",
  "q_shopping",
  "q_dishes",
  "q_ac",
  "q_hosting",
]);

const CHARTER_QUESTION_ID_SET = new Set(CHARTER_QUESTION_IDS);

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

export function getCharterAnsweredCount(answers = []) {
  return getAnsweredCharterQuestionIds(answers).size;
}

export function isCharterComplete(answers = []) {
  const answeredIds = getAnsweredCharterQuestionIds(answers);
  return CHARTER_QUESTION_IDS.every((questionId) => answeredIds.has(questionId));
}
