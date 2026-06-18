import { beforeEach, describe, expect, it, vi } from "vitest";

const invoke = vi.fn();
const createRuumrPlusMatch = vi.fn();

vi.mock("@/api/base44Client", () => ({
  base44: { functions: { invoke } },
}));
vi.mock("@/api/ruumrPlus", () => ({ createRuumrPlusMatch }));
vi.mock("@/lib/simulatorMode", () => ({ isRuumrSimulatorMode: () => false }));
vi.mock("@/entities/Swipe", () => ({ Swipe: { filter: vi.fn() } }));

const { processSwipeMatch } = await import("@/lib/swipeMatchProcessing");

describe("processSwipeMatch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses the verified Plus match path for a Plus recommendation", async () => {
    createRuumrPlusMatch.mockResolvedValue({
      match: true,
      match_id: "match-1",
      match_type: "ruumr_plus",
    });

    await expect(processSwipeMatch({
      swiperId: "user-1",
      swipedId: "user-2",
      action: "like",
      source: "ruumr_plus",
    })).resolves.toMatchObject({ match: true, match_type: "ruumr_plus" });

    expect(createRuumrPlusMatch).toHaveBeenCalledWith({ targetUserId: "user-2" });
    expect(invoke).not.toHaveBeenCalled();
  });

  it("keeps ordinary likes on the mutual-match function", async () => {
    invoke.mockResolvedValue({ match: false });

    await processSwipeMatch({
      swiperId: "user-1",
      swipedId: "user-2",
      action: "like",
      origin: "http://localhost",
    });

    expect(invoke).toHaveBeenCalledWith("handleSwipe", {
      swiper_id: "user-1",
      swiped_id: "user-2",
      action: "like",
      origin: "http://localhost",
    });
    expect(createRuumrPlusMatch).not.toHaveBeenCalled();
  });
});
