import { describe, expect, it } from "vitest";
import {
  CHARTER_QUESTION_IDS,
  getCharterAnsweredCount,
  isCharterComplete,
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
});
