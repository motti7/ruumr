import { describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const bridgePath = path.resolve("base44/functions/ruumrPlusBridge/entry.ts");
const bridgeSource = fs.readFileSync(bridgePath, "utf8");
const sourceFile = ts.createSourceFile(
  bridgePath,
  bridgeSource,
  ts.ScriptTarget.ESNext,
  true,
  ts.ScriptKind.TS
);
const functionNames = new Set([
  "resolveRecommendationUserId",
  "shouldRepairCurrentUserEntitlement",
  "requestRecommendationsWithEntitlementRepair",
  "hasEmptyProfileIndex",
]);
const declarations = sourceFile.statements.filter(
  (statement) =>
    ts.isFunctionDeclaration(statement) &&
    statement.name &&
    functionNames.has(statement.name.text)
);

if (declarations.length !== functionNames.size) {
  throw new Error("Could not load entitlement repair functions from ruumrPlusBridge");
}

const printer = ts.createPrinter();
const extractedSource = declarations
  .map((declaration) => printer.printNode(ts.EmitHint.Unspecified, declaration, sourceFile))
  .join("\n");
const executableSource = ts.transpileModule(
  `${extractedSource}
globalThis.entitlementRepair = {
  resolveRecommendationUserId,
  shouldRepairCurrentUserEntitlement,
  requestRecommendationsWithEntitlementRepair,
  hasEmptyProfileIndex,
};`,
  {
    compilerOptions: {
      module: ts.ModuleKind.None,
      target: ts.ScriptTarget.ES2022,
    },
  }
).outputText;
const context = {};
vm.createContext(context);
vm.runInContext(executableSource, context);

const {
  requestRecommendationsWithEntitlementRepair,
  resolveRecommendationUserId,
  shouldRepairCurrentUserEntitlement,
  hasEmptyProfileIndex,
} = context.entitlementRepair;

function statusError(status, message = "request failed") {
  return Object.assign(new Error(message), { status });
}

describe("Ruumr Plus bridge entitlement repair", () => {
  it("uses the authenticated user's id for non-admin requests", () => {
    expect(resolveRecommendationUserId(
      { id: "user-1", role: "user" },
      "user-2"
    )).toBe("user-1");
  });

  it("allows admins to request recommendations for a specified user", () => {
    expect(resolveRecommendationUserId(
      { id: "admin-1", role: "admin" },
      "user-2"
    )).toBe("user-2");
  });

  it("repairs only a 403 for the current user with an explicit Base44 Plus flag", () => {
    const user = { id: "user-1", role: "user", is_ruumr_plus: true };

    expect(shouldRepairCurrentUserEntitlement(statusError(403), user, "user-1")).toBe(true);
    expect(shouldRepairCurrentUserEntitlement(statusError(500), user, "user-1")).toBe(false);
    expect(shouldRepairCurrentUserEntitlement(statusError(403), { ...user, is_ruumr_plus: false }, "user-1")).toBe(false);
    expect(shouldRepairCurrentUserEntitlement(statusError(403), { ...user, is_ruumr_plus: 1 }, "user-1")).toBe(false);
    expect(shouldRepairCurrentUserEntitlement(statusError(403), user, "user-2")).toBe(false);
  });

  it("returns immediately when the first recommendation request succeeds", async () => {
    const requestRecommendations = vi.fn().mockResolvedValue({ recommendations: ["match"] });
    const grantEntitlement = vi.fn();

    await expect(requestRecommendationsWithEntitlementRepair({
      requestRecommendations,
      grantEntitlement,
      currentUser: { id: "user-1", is_ruumr_plus: true },
      recommendationUserId: "user-1",
    })).resolves.toEqual({ recommendations: ["match"] });

    expect(requestRecommendations).toHaveBeenCalledTimes(1);
    expect(grantEntitlement).not.toHaveBeenCalled();
  });

  it("grants the missing entitlement and retries recommendations exactly once", async () => {
    const requestRecommendations = vi.fn()
      .mockRejectedValueOnce(statusError(403, "missing entitlement"))
      .mockResolvedValueOnce({ recommendations: ["match"] });
    const grantEntitlement = vi.fn().mockResolvedValue({ active: true });
    const onRepair = vi.fn();

    await expect(requestRecommendationsWithEntitlementRepair({
      requestRecommendations,
      grantEntitlement,
      currentUser: { id: "user-1", is_ruumr_plus: true },
      recommendationUserId: "user-1",
      onRepair,
    })).resolves.toEqual({ recommendations: ["match"] });

    expect(requestRecommendations).toHaveBeenCalledTimes(2);
    expect(grantEntitlement).toHaveBeenCalledTimes(1);
    expect(onRepair).toHaveBeenCalledTimes(1);
  });

  it("does not repair a 403 when Base44 does not grant Plus", async () => {
    const denied = statusError(403, "not entitled");
    const requestRecommendations = vi.fn().mockRejectedValue(denied);
    const grantEntitlement = vi.fn();

    await expect(requestRecommendationsWithEntitlementRepair({
      requestRecommendations,
      grantEntitlement,
      currentUser: { id: "user-1", is_ruumr_plus: false },
      recommendationUserId: "user-1",
    })).rejects.toBe(denied);

    expect(requestRecommendations).toHaveBeenCalledTimes(1);
    expect(grantEntitlement).not.toHaveBeenCalled();
  });

  it("does not repair an admin request made for another user", async () => {
    const denied = statusError(403, "target not entitled");
    const requestRecommendations = vi.fn().mockRejectedValue(denied);
    const grantEntitlement = vi.fn();

    await expect(requestRecommendationsWithEntitlementRepair({
      requestRecommendations,
      grantEntitlement,
      currentUser: { id: "admin-1", role: "admin", is_ruumr_plus: true },
      recommendationUserId: "user-2",
    })).rejects.toBe(denied);

    expect(grantEntitlement).not.toHaveBeenCalled();
  });

  it("surfaces a grant failure without retrying recommendations", async () => {
    const grantFailure = statusError(500, "grant failed");
    const requestRecommendations = vi.fn().mockRejectedValueOnce(statusError(403));
    const grantEntitlement = vi.fn().mockRejectedValue(grantFailure);

    await expect(requestRecommendationsWithEntitlementRepair({
      requestRecommendations,
      grantEntitlement,
      currentUser: { id: "user-1", is_ruumr_plus: true },
      recommendationUserId: "user-1",
    })).rejects.toBe(grantFailure);

    expect(requestRecommendations).toHaveBeenCalledTimes(1);
    expect(grantEntitlement).toHaveBeenCalledTimes(1);
  });

  it("surfaces a second denial after one repair attempt without looping", async () => {
    const secondDenial = statusError(403, "still denied");
    const requestRecommendations = vi.fn()
      .mockRejectedValueOnce(statusError(403, "missing entitlement"))
      .mockRejectedValueOnce(secondDenial);
    const grantEntitlement = vi.fn().mockResolvedValue({ active: true });

    await expect(requestRecommendationsWithEntitlementRepair({
      requestRecommendations,
      grantEntitlement,
      currentUser: { id: "user-1", is_ruumr_plus: true },
      recommendationUserId: "user-1",
    })).rejects.toBe(secondDenial);

    expect(requestRecommendations).toHaveBeenCalledTimes(2);
    expect(grantEntitlement).toHaveBeenCalledTimes(1);
  });

  it("detects an empty service index only when both candidates and stored profiles are absent", () => {
    expect(hasEmptyProfileIndex(
      { candidate_count: 0 },
      { snapshot: { profile_count: 1 } }
    )).toBe(true);
    expect(hasEmptyProfileIndex(
      { candidate_count: 0 },
      { snapshot: { profile_count: 198 } }
    )).toBe(false);
    expect(hasEmptyProfileIndex(
      { candidate_count: 4 },
      { snapshot: { profile_count: 1 } }
    )).toBe(false);
  });
});
