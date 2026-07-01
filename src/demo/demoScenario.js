import YAML from "yaml";
import defaultScenarioRaw from "@/demo/scenarios/default.yaml?raw";

function assertArray(value, path) {
  if (!Array.isArray(value)) {
    throw new Error(`Demo scenario ${path} must be an array`);
  }
  return value;
}

function assertObject(value, path) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Demo scenario ${path} must be an object`);
  }
  return value;
}

function normalizeScenario(raw) {
  const scenario = assertObject(raw, "root");
  assertObject(scenario.current_user, "current_user");
  assertArray(scenario.profiles, "profiles");
  assertObject(scenario.team, "team");
  assertObject(scenario.apartment_search, "apartment_search");
  assertArray(scenario.apartment_search.apartments, "apartment_search.apartments");

  const profileIds = new Set();
  const userIds = new Set();
  scenario.profiles.forEach((profile, index) => {
    assertObject(profile, `profiles[${index}]`);
    if (!profile.id || !profile.user_id || !profile.name) {
      throw new Error(`Demo scenario profile at index ${index} needs id, user_id, and name`);
    }
    profileIds.add(String(profile.id));
    userIds.add(String(profile.user_id));
  });

  const currentUserId = String(scenario.current_user.id || "");
  if (!currentUserId || !userIds.has(currentUserId)) {
    throw new Error("Demo scenario current_user.id must match one profile.user_id");
  }

  const apartmentIds = new Set(scenario.apartment_search.apartments.map((apartment) => String(apartment.id)));
  if (!apartmentIds.has(String(scenario.apartment_search.selected_apartment_id || ""))) {
    throw new Error("Demo scenario selected_apartment_id must match an apartment id");
  }

  return {
    ...scenario,
    version: Number(scenario.version || 1),
    profileIds,
    userIds,
    apartmentIds,
  };
}

let cachedScenario = null;

export function getDefaultDemoScenario() {
  if (cachedScenario) return cachedScenario;
  const parsed = YAML.parse(defaultScenarioRaw);
  cachedScenario = normalizeScenario(parsed);
  return cachedScenario;
}
