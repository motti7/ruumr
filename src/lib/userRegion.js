// Detects the user's country region at first connection and persists it for
// subsequent sessions. Used to vary behavior between the Israeli marketplace
// (current logic) and the planned UK expansion (English defaults, UK cities,
// no kosher/Shabbat preferences).
//
// Detection is based on the browser timezone, which reliably distinguishes
// Israel (Asia/Jerusalem) from the UK (Europe/London). Unknown timezones fall
// back to Israel so existing behavior is preserved for users outside these
// two markets.

const REGION_STORAGE_KEY = 'ruumr_region';

export const REGIONS = {
  ISRAEL: 'IL',
  UK: 'GB',
};

export function detectRegion() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz === 'Asia/Jerusalem') return REGIONS.ISRAEL;
    if (tz === 'Europe/London') return REGIONS.UK;
  } catch {
    // Timezone API unavailable; fall back below.
  }
  return null;
}

export function getStoredRegion() {
  try {
    const v = window.localStorage.getItem(REGION_STORAGE_KEY);
    if (v === REGIONS.UK) return REGIONS.UK;
    if (v === REGIONS.ISRAEL) return REGIONS.ISRAEL;
  } catch {
    // Storage unavailable; fall back to detection.
  }
  return null;
}

export function setStoredRegion(region) {
  try {
    window.localStorage.setItem(REGION_STORAGE_KEY, region);
  } catch {
    // Best-effort only.
  }
}

// Resolves the active region. On first connection (no stored value), we detect
// from the timezone and persist the result. Subsequent sessions read the
// persisted value so behavior is stable even if the user travels.
export function resolveRegion() {
  const stored = getStoredRegion();
  if (stored) return stored;
  const detected = detectRegion();
  const region = detected || REGIONS.ISRAEL;
  setStoredRegion(region);
  return region;
}

export function isUKRegion() {
  return resolveRegion() === REGIONS.UK;
}

export function isIsraelRegion() {
  return resolveRegion() === REGIONS.ISRAEL;
}