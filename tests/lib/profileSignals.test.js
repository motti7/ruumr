import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  me: vi.fn(),
  profileFilter: vi.fn(),
  profileUpdate: vi.fn(),
  answerFilter: vi.fn(),
  answerCreate: vi.fn(),
  answerUpdate: vi.fn(),
  analyticsTrack: vi.fn(),
}));

vi.mock("@/api/base44Client", () => ({
  base44: {
    analytics: { track: mocks.analyticsTrack },
  },
}));

vi.mock("@/entities/User", () => ({ User: { me: mocks.me } }));
vi.mock("@/entities/Profile", () => ({
  Profile: {
    filter: mocks.profileFilter,
    update: mocks.profileUpdate,
  },
}));
vi.mock("@/entities/ProfileSignalAnswer", () => ({
  ProfileSignalAnswer: {
    filter: mocks.answerFilter,
    create: mocks.answerCreate,
    update: mocks.answerUpdate,
  },
}));

import {
  saveProfileSignalAnswer,
  shouldPromptForProfileSignal,
} from "@/api/profileSignals";
import { PROFILE_SIGNAL_QUESTIONS } from "@/lib/profileSignals/questions";

describe("profile signal API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.me.mockResolvedValue({ id: "u1" });
    mocks.profileFilter.mockResolvedValue([{ id: "p1", user_id: "u1" }]);
    mocks.profileUpdate.mockResolvedValue({});
    mocks.answerCreate.mockImplementation(async (data) => ({ id: "a1", ...data }));
  });

  it("prompts when no answer has ever been recorded", () => {
    expect(shouldPromptForProfileSignal({ id: "p1" })).toBe(true);
  });

  it("respects the configured day interval", () => {
    const profile = {
      id: "p1",
      profile_signal_last_answered_at: "2026-06-20T10:00:00.000Z",
    };

    expect(shouldPromptForProfileSignal(profile, {
      now: new Date("2026-06-25T10:00:00.000Z"),
      intervalDays: 7,
    })).toBe(false);

    expect(shouldPromptForProfileSignal(profile, {
      now: new Date("2026-06-27T10:00:00.000Z"),
      intervalDays: 7,
    })).toBe(true);
  });

  it("creates a raw answer and updates profile progress", async () => {
    const question = PROFILE_SIGNAL_QUESTIONS[0];
    const answer = question.answers[0];
    mocks.answerFilter
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ question_id: question.id }]);

    await saveProfileSignalAnswer({
      question,
      answerId: answer.id,
      source: "onboarding",
    });

    expect(mocks.answerCreate).toHaveBeenCalledWith(expect.objectContaining({
      user_id: "u1",
      profile_id: "p1",
      question_id: question.id,
      question_version: question.version,
      answer_id: answer.id,
      source: "onboarding",
      media_type: question.media.type,
      markers: answer.markers,
    }));
    expect(mocks.profileUpdate).toHaveBeenCalledWith("p1", expect.objectContaining({
      profile_signal_answered_count: 1,
      profile_signal_version: 1,
    }));
    expect(mocks.analyticsTrack).toHaveBeenCalledWith(expect.objectContaining({
      eventName: "profile_signal_answered",
    }));
  });
});
