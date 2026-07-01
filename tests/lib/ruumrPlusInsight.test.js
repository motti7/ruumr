import { describe, expect, it } from "vitest";
import { containsHebrewText, resolveRuumrPlusInsight } from "@/lib/ruumrPlusInsight";

describe("resolveRuumrPlusInsight", () => {
  it("uses localized insight for the active language", () => {
    const meta = {
      insight: "התאמה טובה.",
      insight_i18n: {
        en: "A good match.",
        he: "התאמה טובה.",
      },
    };

    expect(resolveRuumrPlusInsight(meta, "en", "Fallback")).toBe("A good match.");
    expect(resolveRuumrPlusInsight(meta, "he", "Fallback")).toBe("התאמה טובה.");
  });

  it("does not show cached Hebrew insight in English mode", () => {
    expect(resolveRuumrPlusInsight({ insight: "התאמה טובה." }, "en", "Fallback")).toBe("Fallback");
  });

  it("translates known cached demo insights in English mode", () => {
    expect(
      resolveRuumrPlusInsight(
        { insight: "התאמה אישית טובה, אבל אזורי החיפוש פחות חופפים לצוות תל אביב." },
        "en",
        "Fallback"
      )
    ).toBe("A good personal fit, though the search areas overlap less with the Tel Aviv team.");
  });

  it("detects Hebrew text", () => {
    expect(containsHebrewText("A good match")).toBe(false);
    expect(containsHebrewText("התאמה טובה")).toBe(true);
  });
});
