import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const schema = JSON.parse(
  fs.readFileSync(path.resolve("base44/entities/Message.jsonc"), "utf8")
);

const SUBQUERY_BRANCH = {
  "data.match_id": {
    $in: [
      "{{base44.entities.Match.filter({'$or': [{'data.user1_id': '{{user.id}}'}, {'data.user2_id': '{{user.id}}'}]}).id}}",
    ],
  },
};

describe("Message schema", () => {
  it("denormalizes both match participants onto the message", () => {
    expect(schema.properties.user1_id.type).toBe("string");
    expect(schema.properties.user2_id.type).toBe("string");
  });

  for (const op of ["read", "update"]) {
    describe(`${op} RLS`, () => {
      it("authorizes the counterparty via a direct participant equality check", () => {
        // The reliable path: no Match subquery required. A participant can read/
        // update a message purely because their id is denormalized onto it.
        expect(schema.rls[op].$or).toEqual(
          expect.arrayContaining([
            { "data.sender_id": "{{user.id}}" },
            { "data.user1_id": "{{user.id}}" },
            { "data.user2_id": "{{user.id}}" },
          ])
        );
      });

      it("keeps the legacy Match subquery as a fallback for un-backfilled messages", () => {
        expect(schema.rls[op].$or).toEqual(
          expect.arrayContaining([SUBQUERY_BRANCH])
        );
      });

      it("still allows admins", () => {
        expect(schema.rls[op].$or).toEqual(
          expect.arrayContaining([{ user_condition: { role: "admin" } }])
        );
      });
    });
  }
});
