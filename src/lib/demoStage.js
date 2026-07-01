const DEMO_STAGE_STORAGE_KEY = "ruumr_demo_stage";
const DEMO_CITY_STORAGE_KEY = "ruumr_demo_city";
const DEMO_STAGE_QUERY_PARAM = "demo_stage";
const DEMO_CITY_QUERY_PARAM = "demo_city";

export const DEMO_STAGES = {
  TEAM_BUILDING: "1",
  APARTMENT_SEARCH: "2",
  APARTMENT_SERVICES: "3",
};

export const DEMO_CITY_OPTIONS = {
  tel_aviv: {
    key: "tel_aviv",
    aliases: ["tel_aviv", "tel-aviv", "telaviv", "ta", "תל אביב"],
    he: "תל אביב",
    en: "Tel Aviv",
  },
  beer_sheva: {
    key: "beer_sheva",
    aliases: ["beer_sheva", "beer-sheva", "beersheva", "be'er sheva", "באר שבע"],
    he: "באר שבע",
    en: "Be'er Sheva",
  },
  jerusalem: {
    key: "jerusalem",
    aliases: ["jerusalem", "jlem", "ירושלים"],
    he: "ירושלים",
    en: "Jerusalem",
  },
};

function normalizeStage(value) {
  const stage = String(value || "").trim();
  return Object.values(DEMO_STAGES).includes(stage) ? stage : "";
}

export function normalizeDemoCityKey(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "";
  return Object.values(DEMO_CITY_OPTIONS).find((city) => city.aliases.includes(raw))?.key || "";
}

function readQueryParam(name) {
  if (typeof window === "undefined") return "";
  try {
    return new URLSearchParams(window.location.search).get(name) || "";
  } catch {
    return "";
  }
}

function readStorage(key) {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function writeStorage(key, value) {
  if (typeof window === "undefined") return;
  try {
    if (value) {
      window.localStorage.setItem(key, value);
    } else {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Demo controls are best-effort only.
  }
}

export function getDemoStage() {
  const queryStage = normalizeStage(readQueryParam(DEMO_STAGE_QUERY_PARAM));
  if (queryStage) {
    writeStorage(DEMO_STAGE_STORAGE_KEY, queryStage);
    return queryStage;
  }
  return normalizeStage(readStorage(DEMO_STAGE_STORAGE_KEY));
}

export function getDemoCityKey() {
  const queryCity = normalizeDemoCityKey(readQueryParam(DEMO_CITY_QUERY_PARAM));
  if (queryCity) {
    writeStorage(DEMO_CITY_STORAGE_KEY, queryCity);
    return queryCity;
  }
  return normalizeDemoCityKey(readStorage(DEMO_CITY_STORAGE_KEY));
}

export function getDemoCityLabel(language = "he") {
  const city = DEMO_CITY_OPTIONS[getDemoCityKey()];
  if (!city) return "";
  return city[language === "en" ? "en" : "he"];
}

export function isDemoApartmentStage() {
  return getDemoStage() === DEMO_STAGES.APARTMENT_SEARCH;
}

export function isDemoApartmentServicesStage() {
  return getDemoStage() === DEMO_STAGES.APARTMENT_SERVICES;
}

export function isDemoHousingStage() {
  return [DEMO_STAGES.APARTMENT_SEARCH, DEMO_STAGES.APARTMENT_SERVICES].includes(getDemoStage());
}

export function setDemoStage(stage) {
  const normalized = normalizeStage(stage);
  if (!normalized) return "";
  writeStorage(DEMO_STAGE_STORAGE_KEY, normalized);
  return normalized;
}

export function demoStageParamPresent() {
  return Boolean(normalizeStage(readQueryParam(DEMO_STAGE_QUERY_PARAM)));
}
