import { APARTMENT_PREFERENCES } from "@/lib/apartmentPreferences";

const DRAFT_PREFIX = "ruumr_apartment_preference_draft";

function getApartmentIds(discovery) {
  return [
    ...(discovery?.suggested_apartments || []),
    discovery?.current_apartment,
    discovery?.selected_apartment,
    discovery?.winning_apartment,
  ]
    .filter(Boolean)
    .map((apartment) => String(apartment.id))
    .filter((apartmentId, index, apartmentIds) => apartmentId && apartmentIds.indexOf(apartmentId) === index);
}

function validPreference(value) {
  return APARTMENT_PREFERENCES.includes(value);
}

export function getApartmentPreferenceDraftKey(discovery) {
  const apartmentIds = getApartmentIds(discovery);
  if (!discovery?.id || apartmentIds.length === 0) return "";
  return `${DRAFT_PREFIX}:${discovery.id}:${apartmentIds.join("|")}`;
}

export function submittedApartmentPreferences(discovery, userId) {
  const entry =
    discovery?.preferences?.[String(userId)] ||
    discovery?.rankings?.[String(userId)];
  return entry?.preferences || entry?.rankings || null;
}

export function readApartmentPreferenceDraft(discovery) {
  if (typeof window === "undefined") return {};
  const key = getApartmentPreferenceDraftKey(discovery);
  if (!key) return {};

  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || "{}");
    const apartmentIds = new Set(getApartmentIds(discovery));
    return Object.fromEntries(
      Object.entries(parsed || {}).filter(
        ([apartmentId, preference]) => apartmentIds.has(String(apartmentId)) && validPreference(preference)
      )
    );
  } catch {
    return {};
  }
}

export function writeApartmentPreferenceDraft(discovery, preferences) {
  if (typeof window === "undefined") return {};
  const key = getApartmentPreferenceDraftKey(discovery);
  if (!key) return {};

  const apartmentIds = new Set(getApartmentIds(discovery));
  const next = Object.fromEntries(
    Object.entries(preferences || {}).filter(
      ([apartmentId, preference]) => apartmentIds.has(String(apartmentId)) && validPreference(preference)
    )
  );

  try {
    if (Object.keys(next).length > 0) {
      window.localStorage.setItem(key, JSON.stringify(next));
    } else {
      window.localStorage.removeItem(key);
    }
    window.dispatchEvent(new CustomEvent("ruumr-apartment-preference-draft", { detail: { key, preferences: next } }));
  } catch {
    // Draft ratings are a convenience; the backend submit remains authoritative.
  }

  return next;
}

export function updateApartmentPreferenceDraft(discovery, apartmentId, preference) {
  return writeApartmentPreferenceDraft(discovery, {
    ...readApartmentPreferenceDraft(discovery),
    [String(apartmentId)]: preference,
  });
}

export function clearApartmentPreferenceDraft(discovery) {
  return writeApartmentPreferenceDraft(discovery, {});
}

export function preferencesForApartmentRanking(discovery, userId) {
  return submittedApartmentPreferences(discovery, userId) || readApartmentPreferenceDraft(discovery);
}
