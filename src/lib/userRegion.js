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
  IRELAND: 'IE',
  US: 'US',
  // Any other market without its own configuration yet. Behaves like the US
  // market: English defaults, US cities, dollars, no religion/kosher/Shabbat.
  INTERNATIONAL: 'INTL',
};

// Timezones of the United States (including Alaska, Hawaii and the shared
// America/* zones used by US states).
const US_TIMEZONES = [
  'America/New_York', 'America/Detroit', 'America/Chicago', 'America/Denver',
  'America/Phoenix', 'America/Los_Angeles', 'America/Anchorage', 'America/Boise',
  'America/Juneau', 'America/Sitka', 'America/Nome', 'America/Menominee',
  'America/Indiana/Indianapolis', 'America/Indiana/Knox', 'America/Indiana/Marengo',
  'America/Indiana/Petersburg', 'America/Indiana/Tell_City', 'America/Indiana/Vevay',
  'America/Indiana/Vincennes', 'America/Indiana/Winamac', 'America/Kentucky/Louisville',
  'America/Kentucky/Monticello', 'America/North_Dakota/Center',
  'America/North_Dakota/New_Salem', 'America/North_Dakota/Beulah', 'Pacific/Honolulu',
];

// The device locale carries an explicit country for most visitors (en-US,
// es-US, he-IL…), which is more reliable than the timezone.
function detectLocaleCountry() {
  try {
    const langs = [navigator.language, ...(navigator.languages || [])];
    for (const lang of langs) {
      const match = /[-_]([A-Za-z]{2})\b/.exec(lang || '');
      if (match) return match[1].toUpperCase();
    }
  } catch {
    // navigator unavailable.
  }
  return null;
}

export function detectRegion() {
  try {
    const country = detectLocaleCountry();
    if (country === 'IL') return REGIONS.ISRAEL;
    if (country === 'GB') return REGIONS.UK;
    if (country === 'IE') return REGIONS.IRELAND;
    if (country === 'US') return REGIONS.US;

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (!tz) return null;
    if (tz === 'Asia/Jerusalem') return REGIONS.ISRAEL;
    if (tz === 'Europe/London') return REGIONS.UK;
    if (tz === 'Europe/Dublin') return REGIONS.IRELAND;
    if (US_TIMEZONES.includes(tz)) return REGIONS.US;
    // A real timezone that is none of the above means the user is outside
    // Israel — never assume the Israeli marketplace for them.
    return REGIONS.INTERNATIONAL;
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
    if (v === REGIONS.IRELAND) return REGIONS.IRELAND;
    if (v === REGIONS.US) return REGIONS.US;
    if (v === REGIONS.INTERNATIONAL) return REGIONS.INTERNATIONAL;
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

export function isIrelandRegion() {
  return resolveRegion() === REGIONS.IRELAND;
}

export function isIsraelRegion() {
  return resolveRegion() === REGIONS.ISRAEL;
}

export function isUSRegion() {
  return resolveRegion() === REGIONS.US;
}

// The marketplace a user belongs to — stamped on the profile as `region` and
// used to isolate Discovery so each country sees only its own pool.
// Israel → IL, UK/Ireland → GB, everything else (US and any other country) → US.
export function getMarketRegion() {
  const region = resolveRegion();
  if (region === REGIONS.ISRAEL) return REGIONS.ISRAEL;
  if (region === REGIONS.UK || region === REGIONS.IRELAND) return REGIONS.UK;
  return REGIONS.US;
}

// Religion, kosher and Shabbat preferences belong to the Israeli marketplace
// only. Every other market (UK, Ireland, US, everywhere else) hides them.
export function showsReligiousPreferences() {
  return resolveRegion() === REGIONS.ISRAEL;
}

// The rooms feed is not live in the US marketplace yet: visitors there see
// only the roommate feed (people who post rooms still appear as people).
export function showsRoomFeed() {
  return getMarketRegion() !== REGIONS.US;
}