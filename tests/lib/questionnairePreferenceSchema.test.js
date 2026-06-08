import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const schemaPath = path.resolve("base44/entities/QuestionnairePreference.jsonc");
const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));

describe("QuestionnairePreference schema", () => {
  it("keeps canonical questionnaire records private to the owner and admins", () => {
    expect(schema.rls.create).toEqual({ "data.user_id": "{{user.id}}" });
    expect(schema.rls.read.$or).toContainEqual({ "data.user_id": "{{user.id}}" });
    expect(schema.rls.read.$or).toContainEqual({ user_condition: { role: "admin" } });
    expect(schema.rls.read).not.toBe(true);
  });

  it("requires every canonical question", () => {
    expect(schema.properties.answers.required).toHaveLength(8);
    expect(schema.properties.answers.required).toContain("q_hosting");
  });
});
