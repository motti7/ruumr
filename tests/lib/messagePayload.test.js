import { describe, expect, it } from "vitest";
import { buildMessagePayload } from "@/lib/messagePayload";

const match = {
  id: "match-1",
  user1_id: "alice",
  user2_id: "bob",
};

describe("buildMessagePayload", () => {
  it("denormalizes both participants regardless of who sends", () => {
    const fromUser1 = buildMessagePayload(match, { id: "alice" }, "hey");
    expect(fromUser1).toEqual({
      match_id: "match-1",
      sender_id: "alice",
      content: "hey",
      is_read: false,
      user1_id: "alice",
      user2_id: "bob",
    });

    const fromUser2 = buildMessagePayload(match, { id: "bob" }, "how are you?");
    expect(fromUser2).toMatchObject({
      sender_id: "bob",
      user1_id: "alice",
      user2_id: "bob",
    });
  });

  it("lets the counterparty satisfy RLS via the denormalized participant ids", () => {
    // Regression: previously the counterparty could only read via a Match
    // subquery, which failed for accounts with many matches. The payload must
    // now carry the receiver's id directly.
    const sender = { id: "alice" };
    const receiverId = "bob";
    const payload = buildMessagePayload(match, sender, "hi");
    const receiverIsParticipant =
      payload.user1_id === receiverId || payload.user2_id === receiverId;
    expect(receiverIsParticipant).toBe(true);
  });

  it("omits participant fields when the match lacks them (falls back to subquery)", () => {
    const payload = buildMessagePayload({ id: "match-2" }, { id: "alice" }, "yo");
    expect(payload).toEqual({
      match_id: "match-2",
      sender_id: "alice",
      content: "yo",
      is_read: false,
    });
    expect(payload).not.toHaveProperty("user1_id");
    expect(payload).not.toHaveProperty("user2_id");
  });

  it("throws when match or user is missing", () => {
    expect(() => buildMessagePayload(null, { id: "alice" }, "x")).toThrow();
    expect(() => buildMessagePayload(match, null, "x")).toThrow();
  });
});
