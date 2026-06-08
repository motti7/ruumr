import { describe, expect, it } from "vitest";
import {
  CHARTER_QUESTION_IDS,
  calculateCharterCompatibility,
  getCharterAnsweredCount,
  isCharterComplete,
  selectLatestCompleteLegacyQuestionnaire,
} from "@/lib/charterCompletion";

function answer(questionId, value = "a") {
  return { question_id: questionId, answer: value };
}

describe("Charter questionnaire completion", () => {
  it("requires all eight unique Charter questions", () => {
    const answers = CHARTER_QUESTION_IDS.map((questionId) => answer(questionId));

    expect(getCharterAnsweredCount(answers)).toBe(8);
    expect(isCharterComplete(answers)).toBe(true);
  });

  it("does not count duplicate answers as separate questions", () => {
    const answers = Array.from({ length: 8 }, () => answer("q_smoking"));

    expect(getCharterAnsweredCount(answers)).toBe(1);
    expect(isCharterComplete(answers)).toBe(false);
  });

  it("ignores unknown questions and invalid answers", () => {
    const answers = [
      ...CHARTER_QUESTION_IDS.slice(0, 7).map((questionId) => answer(questionId)),
      answer("q_unknown"),
      answer("q_hosting", "invalid"),
    ];

    expect(getCharterAnsweredCount(answers)).toBe(7);
    expect(isCharterComplete(answers)).toBe(false);
  });

  it("selects the latest complete legacy match and ignores a newer incomplete match", () => {
    const completeOlder = CHARTER_QUESTION_IDS.map((questionId) => ({
      ...answer(questionId),
      match_id: "match-complete",
      created_date: "2026-01-02T00:00:00.000Z",
    }));
    const incompleteNewer = CHARTER_QUESTION_IDS.slice(0, 7).map((questionId) => ({
      ...answer(questionId, "b"),
      match_id: "match-incomplete",
      created_date: "2026-02-02T00:00:00.000Z",
    }));

    const selected = selectLatestCompleteLegacyQuestionnaire([...completeOlder, ...incompleteNewer]);
    expect(selected.match_id).toBe("match-complete");
    expect(isCharterComplete(selected.answers)).toBe(true);
  });

  it("uses the latest duplicate answer within the selected legacy match", () => {
    const rows = CHARTER_QUESTION_IDS.map((questionId) => ({
      ...answer(questionId),
      match_id: "match-1",
      created_date: "2026-01-01T00:00:00.000Z",
    }));
    rows.push({
      ...answer("q_smoking", "b"),
      match_id: "match-1",
      created_date: "2026-01-03T00:00:00.000Z",
    });

    expect(selectLatestCompleteLegacyQuestionnaire(rows).answers.q_smoking).toBe("b");
  });

  it("uses the configured weighted questionnaire compatibility", () => {
    const left = Object.fromEntries(CHARTER_QUESTION_IDS.map((questionId) => [questionId, "a"]));
    const right = { ...left, q_smoking: "b" };
    const result = calculateCharterCompatibility(left, right);

    expect(result.compared_count).toBe(8);
    expect(result.disagreements).toEqual(["q_smoking"]);
    expect(result.score).toBe(83);
  });
});
