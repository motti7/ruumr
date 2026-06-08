import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const schemaPath = path.resolve("base44/entities/Swipe.jsonc");
const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));

describe("Swipe entity security", () => {
  it("allows users to create only their own swipe records", () => {
    expect(schema.rls.create).toEqual({
      "data.swiper_id": "{{user.id}}",
    });
  });

  it("allows both participants to read a swipe", () => {
    expect(schema.rls.read.$or).toContainEqual({
      "data.swiper_id": "{{user.id}}",
    });
    expect(schema.rls.read.$or).toContainEqual({
      "data.swiped_id": "{{user.id}}",
    });
  });
});
