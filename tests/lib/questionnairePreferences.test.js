import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  invoke: vi.fn(),
  me: vi.fn(),
  preferenceFilter: vi.fn(),
  charterFilter: vi.fn(),
}));

vi.mock("@/api/base44Client", () => ({
  base44: {
    functions: { invoke: mocks.invoke },
    entities: {
      QuestionnairePreference: {
        filter: mocks.preferenceFilter,
        create: vi.fn(),
        update: vi.fn(),
      },
      CharterAnswer: { filter: mocks.charterFilter },
    },
  },
}));
vi.mock("@/entities/User", () => ({ User: { me: mocks.me } }));
vi.mock("@/lib/simulatorMode", () => ({ isRuumrSimulatorMode: () => false }));

import { resolveCurrentQuestionnairePreference } from "@/api/questionnairePreferences";

const completeAnswers = {
  q_smoking: "a",
  q_partners: "b",
  q_pets: "a",
  q_cleaning_strictness: "b",
  q_shopping: "a",
  q_dishes: "b",
  q_ac: "a",
  q_hosting: "b",
};

describe("resolveCurrentQuestionnairePreference", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.me.mockResolvedValue({ id: "u1" });
    mocks.charterFilter.mockResolvedValue([]);
  });

  it("falls back to the user's canonical entity when the backend function fails", async () => {
    mocks.invoke.mockRejectedValue(new Error("function unavailable"));
    mocks.preferenceFilter.mockResolvedValue([{
      id: "pref-1",
      user_id: "u1",
      version: 1,
      completed_at: "2026-06-10T08:00:00.000Z",
      source: "plus_activation",
      answers: completeAnswers,
    }]);

    await expect(resolveCurrentQuestionnairePreference()).resolves.toMatchObject({
      complete: true,
      imported: false,
      preference: {
        id: "pref-1",
        user_id: "u1",
        answers: completeAnswers,
      },
    });
  });

  it("reports incomplete when neither canonical nor legacy answers exist", async () => {
    mocks.invoke.mockRejectedValue(new Error("function unavailable"));
    mocks.preferenceFilter.mockResolvedValue([]);

    await expect(resolveCurrentQuestionnairePreference()).resolves.toEqual({
      complete: false,
      preference: null,
      imported: false,
    });
  });
});
