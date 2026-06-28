import { describe, expect, it } from "vitest";
import { calculateApartmentPreferenceOutcome, preferencesAreComplete } from "../../src/lib/apartmentPreferences";

const apartments = [
  { id: "apt-a", price: 9000 },
  { id: "apt-b", price: 8500 },
  { id: "apt-c", price: 8000 },
];

describe("apartment preference scoring", () => {
  it("requires every apartment to have a valid preference", () => {
    expect(preferencesAreComplete(apartments, {
      "apt-a": "amazing",
      "apt-b": "ok",
    })).toBe(false);
    expect(preferencesAreComplete(apartments, {
      "apt-a": "amazing",
      "apt-b": "ok",
      "apt-c": "no_way",
    })).toBe(true);
  });

  it("rejects an apartment vetoed by any teammate", () => {
    const outcome = calculateApartmentPreferenceOutcome(apartments, {
      u1: { user_id: "u1", preferences: { "apt-a": "amazing", "apt-b": "ok", "apt-c": "no_way" } },
      u2: { user_id: "u2", preferences: { "apt-a": "amazing", "apt-b": "amazing", "apt-c": "amazing" } },
    });

    expect(outcome.current_apartment.id).toBe("apt-a");
    expect(outcome.rejected_by_veto).toEqual([
      expect.objectContaining({ apartment_id: "apt-c", veto_user_ids: ["u1"] }),
    ]);
  });

  it("maximizes happiness among non-vetoed apartments", () => {
    const outcome = calculateApartmentPreferenceOutcome(apartments, {
      u1: { user_id: "u1", preferences: { "apt-a": "ok", "apt-b": "amazing", "apt-c": "ok" } },
      u2: { user_id: "u2", preferences: { "apt-a": "ok", "apt-b": "amazing", "apt-c": "ok" } },
    });

    expect(outcome.current_apartment.id).toBe("apt-b");
    expect(outcome.eligible_apartments[0]).toMatchObject({
      apartment_id: "apt-b",
      points: 4,
      amazing_votes: 2,
    });
  });

  it("tie-breaks by amazing votes, then cheaper price, then original order", () => {
    const amazingTie = calculateApartmentPreferenceOutcome(apartments, {
      u1: { user_id: "u1", preferences: { "apt-a": "ok", "apt-b": "amazing", "apt-c": "ok" } },
      u2: { user_id: "u2", preferences: { "apt-a": "ok", "apt-b": "ok", "apt-c": "ok" } },
    });
    expect(amazingTie.current_apartment.id).toBe("apt-b");

    const priceTie = calculateApartmentPreferenceOutcome(apartments, {
      u1: { user_id: "u1", preferences: { "apt-a": "ok", "apt-b": "ok", "apt-c": "ok" } },
      u2: { user_id: "u2", preferences: { "apt-a": "ok", "apt-b": "ok", "apt-c": "ok" } },
    });
    expect(priceTie.current_apartment.id).toBe("apt-c");
  });

  it("returns no eligible apartment when every option is vetoed", () => {
    const outcome = calculateApartmentPreferenceOutcome(apartments, {
      u1: { user_id: "u1", preferences: { "apt-a": "no_way", "apt-b": "ok", "apt-c": "ok" } },
      u2: { user_id: "u2", preferences: { "apt-a": "ok", "apt-b": "no_way", "apt-c": "no_way" } },
    });

    expect(outcome.no_eligible_apartment).toBe(true);
    expect(outcome.current_apartment).toBeNull();
  });
});
