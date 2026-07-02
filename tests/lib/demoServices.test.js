import { describe, expect, it } from "vitest";
import { buildDemoServices, findDemoServiceProvider } from "../../src/lib/demoServices";

describe("demo move-in services", () => {
  it("centers stage 3 on move-in logistics instead of daily services", () => {
    const demo = buildDemoServices({
      id: "apt-dizengoff-214",
      city_en: "Tel Aviv",
    });

    expect(demo.categories.map((category) => category.id)).toEqual([
      "setup",
      "moving",
      "furniture",
      "cleaning",
      "repairs",
    ]);
    expect(demo.providers.map((provider) => provider.id)).toEqual(
      expect.arrayContaining([
        "fiber-fast-tel_aviv",
        "move-squad-tel_aviv",
        "packing-supplies-tel_aviv",
        "fresh-start-tel_aviv",
        "utility-handoff-tel_aviv",
        "key-safe-tel_aviv",
        "fix-mate-tel_aviv",
      ])
    );
    expect(demo.providers.some((provider) => provider.category === "food")).toBe(false);
    expect(demo).not.toHaveProperty("dailyDeals");
  });

  it("includes a practical move-in checklist", () => {
    const demo = buildDemoServices({ city_en: "Tel Aviv" });
    const taskLabels = demo.moveInTasks.map((task) => task.en);

    expect(taskLabels).toEqual(
      expect.arrayContaining([
        "Schedule key handoff and meter photos",
        "Book internet installation",
        "Book movers or shipping route",
        "Order boxes and packing equipment",
        "Schedule deep clean before move-in",
        "Assign electricity, water, gas, and arnona owners",
        "Check locks, keys, and small repairs",
      ])
    );
  });

  it("finds the new move-in providers by generated city id", () => {
    const provider = findDemoServiceProvider({ city_en: "Jerusalem" }, "packing-supplies-jerusalem");

    expect(provider).toMatchObject({
      category: "moving",
      nameEn: "Box & packing kit",
      primaryAction: "hybrid",
    });
  });
});
