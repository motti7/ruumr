import { beforeEach, describe, expect, it } from "vitest";
import {
  clearApartmentPreferenceDraft,
  preferencesForApartmentRanking,
  readApartmentPreferenceDraft,
  submittedApartmentPreferences,
  updateApartmentPreferenceDraft,
} from "@/lib/apartmentPreferenceDraft";

const discovery = {
  id: "discovery-1",
  suggested_apartments: [{ id: "apt-a" }, { id: "apt-b" }, { id: "apt-c" }],
};

describe("apartment preference drafts", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("stores only valid ratings for suggested apartments", () => {
    updateApartmentPreferenceDraft(discovery, "apt-a", "amazing");
    updateApartmentPreferenceDraft(discovery, "apt-x", "ok");
    updateApartmentPreferenceDraft(discovery, "apt-b", "maybe");

    expect(readApartmentPreferenceDraft(discovery)).toEqual({ "apt-a": "amazing" });
  });

  it("prefers submitted backend preferences over local drafts", () => {
    updateApartmentPreferenceDraft(discovery, "apt-a", "amazing");
    const withSubmitted = {
      ...discovery,
      preferences: {
        "user-1": {
          user_id: "user-1",
          preferences: { "apt-a": "ok", "apt-b": "ok", "apt-c": "no_way" },
        },
      },
    };

    expect(submittedApartmentPreferences(withSubmitted, "user-1")).toEqual({
      "apt-a": "ok",
      "apt-b": "ok",
      "apt-c": "no_way",
    });
    expect(preferencesForApartmentRanking(withSubmitted, "user-1")).toEqual({
      "apt-a": "ok",
      "apt-b": "ok",
      "apt-c": "no_way",
    });
  });

  it("clears the draft for the current discovery and apartment batch", () => {
    updateApartmentPreferenceDraft(discovery, "apt-a", "amazing");
    clearApartmentPreferenceDraft(discovery);

    expect(readApartmentPreferenceDraft(discovery)).toEqual({});
  });
});
