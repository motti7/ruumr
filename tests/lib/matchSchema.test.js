import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const schema = JSON.parse(
  fs.readFileSync(path.resolve("base44/entities/Match.jsonc"), "utf8")
);

describe("Match schema", () => {
  it("stores the match origin while treating new ordinary matches as mutual", () => {
    expect(schema.properties.match_type).toMatchObject({
      enum: ["mutual", "ruumr_plus"],
      default: "mutual",
    });
    expect(schema.properties.plus_initiator_id.type).toBe("string");
  });

  it("allows either participant to read the same differentiated match", () => {
    expect(schema.rls.read.$or).toEqual(
      expect.arrayContaining([
        { "data.user1_id": "{{user.id}}" },
        { "data.user2_id": "{{user.id}}" },
      ])
    );
  });
});
