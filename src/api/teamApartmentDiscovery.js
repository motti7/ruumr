import { base44 } from "@/api/base44Client";

function unwrap(raw) {
  const body =
    raw && typeof raw === "object" && raw.data && !("success" in raw) && !("error" in raw)
      ? raw.data
      : raw;
  if (body && typeof body === "object" && body.error) {
    throw new Error(body.error);
  }
  return body;
}

export async function ensureTeamApartmentDiscovery() {
  return unwrap(await base44.functions.invoke("teamApartmentDiscovery", { action: "ensure" }));
}

export async function submitApartmentPreferences({ discoveryId, preferences }) {
  return unwrap(
    await base44.functions.invoke("teamApartmentDiscovery", {
      action: "submit_preferences",
      discovery_id: discoveryId,
      preferences,
    })
  );
}

export async function submitApartmentRanking({ discoveryId, rankings }) {
  return submitApartmentPreferences({ discoveryId, preferences: rankings });
}

export async function changeApartmentPreferences({ discoveryId }) {
  return unwrap(
    await base44.functions.invoke("teamApartmentDiscovery", {
      action: "change_preferences",
      discovery_id: discoveryId,
    })
  );
}

export async function requestMoreApartmentSuggestions({ discoveryId }) {
  return unwrap(
    await base44.functions.invoke("teamApartmentDiscovery", {
      action: "request_more_suggestions",
      discovery_id: discoveryId,
    })
  );
}

export async function scheduleApartmentVisit({ discoveryId, visitTime }) {
  return unwrap(
    await base44.functions.invoke("teamApartmentDiscovery", {
      action: "schedule_visit",
      discovery_id: discoveryId,
      visit_time: visitTime,
    })
  );
}

export async function rejectCurrentApartment({ discoveryId, reason, note = "" }) {
  return unwrap(
    await base44.functions.invoke("teamApartmentDiscovery", {
      action: "reject_current_apartment",
      discovery_id: discoveryId,
      reason,
      note,
    })
  );
}

export async function chooseCurrentApartment({ discoveryId }) {
  return unwrap(
    await base44.functions.invoke("teamApartmentDiscovery", {
      action: "choose_current_apartment",
      discovery_id: discoveryId,
    })
  );
}
