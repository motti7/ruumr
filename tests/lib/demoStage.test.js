import { beforeEach, describe, expect, it } from "vitest";
import { DEMO_STAGES, getDemoStage, isDemoTeamBuildingStage } from "@/lib/demoStage";

describe("demo stage helpers", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState(null, "", "/");
  });

  it("reads team-building stage from the query string and persists it", () => {
    window.history.replaceState(null, "", "/Discover?demo_stage=1");

    expect(getDemoStage()).toBe(DEMO_STAGES.TEAM_BUILDING);
    expect(isDemoTeamBuildingStage()).toBe(true);
    expect(window.localStorage.getItem("ruumr_demo_stage")).toBe("1");
  });

  it("falls back to stored demo stage", () => {
    window.localStorage.setItem("ruumr_demo_stage", "2");

    expect(getDemoStage()).toBe(DEMO_STAGES.APARTMENT_SEARCH);
    expect(isDemoTeamBuildingStage()).toBe(false);
  });

  it("resets to team-building stage when simulator mode is explicitly opened without a demo_stage", () => {
    window.localStorage.setItem("ruumr_demo_stage", "3");
    window.history.replaceState(null, "", "/Discover?simulator_mode=true");

    expect(getDemoStage()).toBe(DEMO_STAGES.TEAM_BUILDING);
    expect(isDemoTeamBuildingStage()).toBe(true);
    expect(window.localStorage.getItem("ruumr_demo_stage")).toBe("1");
  });
});
