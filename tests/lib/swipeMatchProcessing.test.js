import { beforeEach, describe, expect, it, vi } from "vitest";

const invoke = vi.fn();


vi.mock("@/api/base44Client", () => ({
  base44: { functions: { invoke } },
}));

vi.mock("@/lib/simulatorMode", () => ({ isRuumrSimulatorMode: () => false }));
vi.mock("@/entities/Swipe", () => ({ Swipe: { filter: vi.fn() } }));

const { processSwipeMatch } = await import("@/lib/swipeMatchProcessing");

describe("processSwipeMatch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("cannot bypass mutual matching with an obsolete source", async () => {
    invoke.mockResolvedValue({ data: { match: false } });
    await expect(processSwipeMatch({ swiperId: 'user-1', swipedId: 'user-2', action: 'like', source: 'ruumr_plus' })).resolves.toEqual({ match: false });
    expect(invoke).toHaveBeenCalledWith('handleSwipe', expect.objectContaining({ swiper_id: 'user-1', swiped_id: 'user-2' }));
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

  });
});
