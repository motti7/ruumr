import { beforeEach, describe, expect, it, vi } from "vitest";

const authMe = vi.fn();
const profileFilter = vi.fn();
const swipeFilter = vi.fn();
const swipeCreate = vi.fn();
const swipeUpdate = vi.fn();
const matchFilter = vi.fn();
const matchCreate = vi.fn();
const matchUpdate = vi.fn();

vi.mock("@/api/base44Client", () => ({
  base44: {
    auth: { me: authMe },
    entities: { QuestionnairePreference: {} },
    functions: { invoke: vi.fn() },
  },
}));
vi.mock("@/entities/all", () => ({
  Profile: { filter: profileFilter },
  Swipe: { filter: swipeFilter, create: swipeCreate, update: swipeUpdate },
  Match: { filter: matchFilter, create: matchCreate, update: matchUpdate },
}));
vi.mock("@/lib/simulatorMode", () => ({ isRuumrSimulatorMode: () => true }));

const { createRuumrPlusMatch } = await import("@/api/ruumrPlus");

describe("createRuumrPlusMatch simulator behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMe.mockResolvedValue({ id: "user-1", full_name: "User One" });
    profileFilter.mockImplementation(async ({ user_id }) => [
      { user_id, name: user_id === "user-1" ? "User One" : "User Two" },
    ]);
    swipeFilter.mockImplementation(async (query) => {
      if (query.swiper_id === "user-2" && query.action === "like") return [];
      return [];
    });
    matchFilter.mockResolvedValue([]);
    swipeCreate.mockResolvedValue({ id: "swipe-1" });
    matchCreate.mockResolvedValue({ id: "match-1" });
  });

  it("creates a one-sided Plus match immediately when there is no reverse like", async () => {
    await expect(createRuumrPlusMatch({ targetUserId: "user-2" })).resolves.toEqual({
      match: true,
      match_id: "match-1",
      match_type: "ruumr_plus",
    });

    expect(swipeCreate).toHaveBeenCalledWith(expect.objectContaining({
      swiper_id: "user-1",
      swiped_id: "user-2",
      action: "like",
    }));
    expect(matchCreate).toHaveBeenCalledWith(expect.objectContaining({
      user1_id: "user-1",
      user2_id: "user-2",
      match_type: "ruumr_plus",
      plus_initiator_id: "user-1",
    }));
  });

  it("creates an ordinary mutual match when the suggested user already liked back", async () => {
    swipeFilter.mockImplementation(async (query) => {
      if (query.swiper_id === "user-2" && query.action === "like") {
        return [{ id: "reverse-like" }];
      }
      return [];
    });

    await expect(createRuumrPlusMatch({ targetUserId: "user-2" })).resolves.toMatchObject({
      match: true,
      match_type: "mutual",
    });

    expect(matchCreate).toHaveBeenCalledWith(expect.objectContaining({
      match_type: "mutual",
    }));
    expect(matchCreate.mock.calls[0][0]).not.toHaveProperty("plus_initiator_id");
  });

  it("upgrades an existing Plus match when the other side likes back", async () => {
    swipeFilter.mockImplementation(async (query) => {
      if (query.swiper_id === "user-2" && query.action === "like") {
        return [{ id: "reverse-like" }];
      }
      return [];
    });
    matchFilter
      .mockResolvedValueOnce([{ id: "match-existing", match_type: "ruumr_plus" }])
      .mockResolvedValueOnce([]);

    await expect(createRuumrPlusMatch({ targetUserId: "user-2" })).resolves.toMatchObject({
      match_id: "match-existing",
      match_type: "mutual",
    });

    expect(matchUpdate).toHaveBeenCalledWith("match-existing", {
      match_type: "mutual",
    });
    expect(matchCreate).not.toHaveBeenCalled();
  });
});
