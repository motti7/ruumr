import { beforeEach, describe, expect, it } from "vitest";
import { resetDemoRunStorage } from "@/components/dev/DemoStageSwitcher";

describe("DemoStageSwitcher reset", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it("clears the session profile-signal answered marker so the floating CTA can return", () => {
    window.sessionStorage.setItem("ruumr_profile_signal_answered:dishes_sink_reaction_001", "1");
    window.sessionStorage.setItem("ruumr_profile_signal_dismissed_session", "1");
    window.localStorage.setItem("ruumr_plus_activation:demo-user", "{}");
    window.localStorage.setItem("unrelated_key", "keep");

    resetDemoRunStorage();

    expect(window.sessionStorage.getItem("ruumr_profile_signal_answered:dishes_sink_reaction_001")).toBeNull();
    expect(window.sessionStorage.getItem("ruumr_profile_signal_dismissed_session")).toBeNull();
    expect(window.localStorage.getItem("ruumr_plus_activation:demo-user")).toBeNull();
    expect(window.localStorage.getItem("unrelated_key")).toBe("keep");
  });
});
