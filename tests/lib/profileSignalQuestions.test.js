import { describe, expect, it } from "vitest";
import {
  PROFILE_SIGNAL_QUESTIONS,
  getAnsweredProfileSignalQuestionIds,
  getProfileSignalAnswerLabel,
  getProfileSignalCopy,
  getProfileSignalDirection,
  getProfileSignalPrompt,
  normalizeProfileSignalLanguage,
  selectRandomUnansweredProfileSignalQuestion,
} from "@/lib/profileSignals/questions";

describe("profile signal questions", () => {
  it("selects a random unanswered question", () => {
    const firstQuestion = PROFILE_SIGNAL_QUESTIONS[0];
    const secondQuestion = PROFILE_SIGNAL_QUESTIONS[1];

    const selected = selectRandomUnansweredProfileSignalQuestion(
      [{ question_id: firstQuestion.id }],
      () => 0
    );

    expect(selected.id).toBe(secondQuestion.id);
  });

  it("returns null when every question is already answered", () => {
    const answers = PROFILE_SIGNAL_QUESTIONS.map((question) => ({ question_id: question.id }));
    expect(selectRandomUnansweredProfileSignalQuestion(answers)).toBeNull();
  });

  it("normalizes answered question ids into a set", () => {
    const ids = getAnsweredProfileSignalQuestionIds([
      { question_id: " dishes_sink_reaction_001 " },
      { question_id: "" },
      {},
    ]);

    expect(ids.has("dishes_sink_reaction_001")).toBe(true);
    expect(ids.size).toBe(1);
  });

  it("exposes English prompt and answer copy", () => {
    const question = PROFILE_SIGNAL_QUESTIONS[0];
    expect(getProfileSignalPrompt(question, "en")).toBe("What best describes what you would do in this situation?");
    expect(getProfileSignalAnswerLabel(question.answers[0], "en")).toBe("I would say right away that it bothers me");
  });

  it("defaults unsupported languages to Hebrew", () => {
    const question = PROFILE_SIGNAL_QUESTIONS[0];
    expect(normalizeProfileSignalLanguage("fr")).toBe("he");
    expect(getProfileSignalDirection("fr")).toBe("rtl");
    expect(getProfileSignalPrompt(question, "fr")).toBe(question.prompt_he);
  });

  it("provides localized UI copy for the floating prompt", () => {
    expect(getProfileSignalCopy("en").improveProfile).toBe("Improve profile");
    expect(getProfileSignalCopy("he").improveProfile).toBe("שפרו את הפרופיל");
  });
});
