import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

function source(file) {
  return fs.readFileSync(path.resolve(file), "utf8");
}

describe("Ruumr Plus match entry points", () => {
  it("routes recommendation-card likes through the verified Plus match source", () => {
    const page = source("src/pages/RuumrPlus.jsx");

    expect(page).toContain('source: "ruumr_plus"');
    expect(page).toMatch(/if \(action === "like"\)\s*\{\s*await processSwipeMatch/);
  });

  it("routes likes from a Plus profile view through the same verified source", () => {
    const page = source("src/pages/ProfileView.jsx");

    expect(page).toContain('source: isPlusRecommendation ? "ruumr_plus" : "discover"');
  });

  it("returns Plus profile-view swipes to the Ruumr Plus tab", () => {
    const page = source("src/pages/ProfileView.jsx");

    expect(page).toContain("navigate(createPageUrl('RuumrPlus'), { replace: true })");
    expect(page).toContain("removeFromRuumrPlusActivation(currentUser.id, swipedId)");
  });

  it("carries the Plus context through the URL param OR the cached recommendation", () => {
    const page = source("src/pages/ProfileView.jsx");

    // Primary signal is the fromPlus query param; the cached Plus recommendation
    // is the fallback so a dropped param does not silently downgrade the like.
    expect(page).toContain('urlParams.get("fromPlus") === \'true\' || inPlusCache');
    expect(page).toContain('isPlusRec || new URLSearchParams(location.search).get("fromPlus") === "true"');
  });

  it("opens Plus recommendation profiles with the fromPlus flag", () => {
    const page = source("src/pages/RuumrPlus.jsx");

    expect(page).toContain("fromPlus=true");
  });
});
