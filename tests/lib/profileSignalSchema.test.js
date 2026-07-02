import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const answerSchemaPath = path.resolve("base44/entities/ProfileSignalAnswer.jsonc");
const answerSchema = JSON.parse(fs.readFileSync(answerSchemaPath, "utf8"));
const profileSchemaPath = path.resolve("base44/entities/Profile.jsonc");
const profileSchema = JSON.parse(fs.readFileSync(profileSchemaPath, "utf8"));

describe("ProfileSignalAnswer schema", () => {
  it("keeps raw profile signal answers private to the owner and admins", () => {
    expect(answerSchema.rls.create).toEqual({ "data.user_id": "{{user.id}}" });
    expect(answerSchema.rls.read.$or).toContainEqual({ "data.user_id": "{{user.id}}" });
    expect(answerSchema.rls.read.$or).toContainEqual({ user_condition: { role: "admin" } });
    expect(answerSchema.rls.read).not.toBe(true);
  });

  it("requires the fields needed to interpret answer history later", () => {
    expect(answerSchema.required).toEqual(expect.arrayContaining([
      "user_id",
      "profile_id",
      "question_id",
      "question_version",
      "answer_id",
      "source",
      "media_type",
      "answered_at",
    ]));
  });

  it("stores only lightweight profile signal progress on public profiles", () => {
    expect(profileSchema.properties.profile_signal_answered_count.type).toBe("number");
    expect(profileSchema.properties.profile_signal_last_answered_at.format).toBe("date-time");
    expect(profileSchema.properties.profile_signal_version.type).toBe("number");
    expect(profileSchema.properties.profile_signal_answers).toBeUndefined();
  });
});
