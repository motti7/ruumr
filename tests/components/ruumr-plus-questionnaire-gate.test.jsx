import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import React from "react";

const mocks = vi.hoisted(() => ({
  resolve: vi.fn(),
  activate: vi.fn(),
}));

vi.mock("@/entities/User", () => ({
  User: { me: vi.fn().mockResolvedValue({ id: "u1", full_name: "Tester", role: "user", is_ruumr_plus: true }) },
}));
vi.mock("@/entities/Profile", () => ({
  Profile: {
    filter: vi.fn().mockResolvedValue([{ id: "p1", user_id: "u1", name: "Tester" }]),
    list: vi.fn().mockResolvedValue([{ id: "p1", user_id: "u1", name: "Tester" }]),
  },
}));
vi.mock("@/entities/all", () => ({ Swipe: { filter: vi.fn().mockResolvedValue([]) } }));
vi.mock("@/api/base44Client", () => ({ base44: { analytics: { track: vi.fn() } } }));
vi.mock("@/api/questionnairePreferences", () => ({
  resolveCurrentQuestionnairePreference: mocks.resolve,
}));
vi.mock("@/api/ruumrPlus", () => ({
  activateRuumrPlusRecommendations: mocks.activate,
  mergeRuumrPlusRecommendations: vi.fn().mockReturnValue([]),
  RUUMR_PLUS_RECOMMENDATION_LIMIT: 5,
  syncCurrentProfileToRuumrPlus: vi.fn().mockResolvedValue({ ok: true }),
}));
vi.mock("@/components/charter/RoomiCharter", () => ({
  default: ({ onComplete }) => (
    <button
      type="button"
      onClick={() => onComplete({ answers: { q_smoking: "a" } })}
    >
      Finish questionnaire
    </button>
  ),
}));
vi.mock("@/lib/mixpanelTracking", () => ({ trackMixpanel: vi.fn() }));
vi.mock("@/lib/simulatorMode", () => ({ isRuumrSimulatorMode: () => false }));
vi.mock("@/lib/swipeMatchProcessing", () => ({ processSwipeMatch: vi.fn() }));
vi.mock("@/components/shared/SmartImage", () => ({ default: () => null }));
vi.mock("@/lib/interests", () => ({ getInterestLabel: (value) => value }));
vi.mock("@/lib/ruumrPlusSimulator", () => ({ buildSimulatorRuumrPlusRecommendations: vi.fn() }));
vi.mock("@/lib/ruumrPlusActivation", () => ({
  buildRuumrPlusActivationRecord: vi.fn((value) => ({ ...value, activated_at: new Date().toISOString() })),
  consumeRuumrPlusActivationIntent: vi.fn().mockReturnValue(null),
  clearRuumrPlusActivation: vi.fn(),
  getRuumrPlusActivationRemainingMs: vi.fn().mockReturnValue(0),
  isRuumrPlusActivationFresh: vi.fn().mockReturnValue(false),
  loadRuumrPlusActivation: vi.fn().mockReturnValue(null),
  saveRuumrPlusActivation: vi.fn((id, value) => value),
  normalizeRuumrPlusActivation: vi.fn((value) => value),
}));

let RuumrPlusPage;

beforeEach(async () => {
  vi.clearAllMocks();
  mocks.resolve.mockResolvedValue({ complete: false, preference: null });
  mocks.activate.mockResolvedValue({ recommendations: [], candidate_count: 0 });
  vi.resetModules();
  RuumrPlusPage = (await import("@/pages/RuumrPlus")).default;
});

describe("Ruumr Plus questionnaire gate", () => {
  it("opens the questionnaire before a fresh run and resumes automatically after completion", async () => {
    render(
      <MemoryRouter initialEntries={["/RuumrPlus"]}>
        <RuumrPlusPage />
      </MemoryRouter>
    );

    const activateButton = await screen.findByRole("button", { name: /הפעל\/י Plus/ });
    fireEvent.click(activateButton);

    expect(await screen.findByRole("button", { name: "Finish questionnaire" })).toBeTruthy();
    expect(mocks.activate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Finish questionnaire" }));
    await waitFor(() => expect(mocks.activate).toHaveBeenCalledTimes(1));
  });
});
