import { createProfileDefaults } from "@/lib/profileDefaults";
import {
  buildSimulatorApartmentPhotos,
  buildSimulatorProfilePhotos,
} from "@/lib/simulatorMode";
import { DEMO_CITY_OPTIONS, DEMO_STAGES, demoStageParamPresent, getDemoCityKey, isDemoApartmentServicesStage, isDemoHousingStage, setDemoStage } from "@/lib/demoStage";
import { normalizeInterestValues } from "@/lib/interests";
import { APARTMENT_LIFECYCLE, calculateApartmentPreferenceOutcome } from "@/lib/apartmentPreferences";
import { getDefaultDemoScenario } from "@/demo/demoScenario";
import { normalizeCharterAnswers } from "@/lib/charterCompletion";

const DAY_MS = 24 * 60 * 60 * 1000;
const SIMULATOR_STATE_STORAGE_KEY = "ruumr_simulator_state";
const SIMULATOR_STATE_VERSION = 5;
const DEMO_STAGE2_CREATED_AT = "2026-06-29T09:00:00.000Z";

const nowIso = () => new Date().toISOString();
const daysAgoIso = (days = 0) => new Date(Date.now() - Number(days || 0) * DAY_MS).toISOString();
const clone = (value) => {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value));
};

const slugify = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "");

const stableId = (prefix, value) => `${prefix}-${slugify(value) || "demo"}`;
const pairStableId = (prefix, left, right) => stableId(prefix, [left, right].map((value) => String(value || "")).sort().join("-"));
const apartmentTeamKey = (memberIds) => [...new Set(memberIds.map(String))].sort().join("_");

const APARTMENT_DISCOVERY_IMAGES = [
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80",
];

const APARTMENT_DISCOVERY_BATCH_COUNT = 3;

const SHARED_AMENITIES = {
  balcony: { en: "Balcony", he: "מרפסת" },
  elevator: { en: "Elevator", he: "מעלית" },
  shelter: { en: "Safe room", he: "ממ\"ד" },
  furnished: { en: "Partly furnished", he: "מרוהטת חלקית" },
  renovated: { en: "Renovated", he: "משופצת" },
  pets: { en: "Pets considered", he: "אפשרות לחיות מחמד" },
  parking: { en: "Parking nearby", he: "חניה באזור" },
  storage: { en: "Storage", he: "מחסן" },
};

const CITY_APARTMENT_MARKETS = {
  "תל אביב": {
    key: "tel_aviv",
    en: "Tel Aviv",
    center: { lat: 32.0809, lng: 34.7806 },
    teammateLocations: [
      { type: "work", label_he: "משרדי שרונה", label_en: "Sarona offices", lat: 32.0709, lng: 34.7865 },
      { type: "university", label_he: "אוניברסיטת תל אביב", label_en: "Tel Aviv University", lat: 32.1133, lng: 34.8044 },
      { type: "work", label_he: "מתחם רוטשילד", label_en: "Rothschild work area", lat: 32.0639, lng: 34.7732 },
    ],
    apartments: [
      { neighborhood_he: "הצפון הישן", neighborhood_en: "Old North", address_he: "דיזנגוף 214, תל אביב", address_en: "214 Dizengoff St, Tel Aviv", lat: 32.0882, lng: 34.7742, price: 11800, floor: 3, size_sqm: 92, amenities: ["balcony", "elevator", "renovated"], commute_he: "12 דקות לאוניברסיטה באוטובוס", commute_en: "12 minutes to the university by bus" },
      { neighborhood_he: "לב העיר", neighborhood_en: "Heart of the City", address_he: "שינקין 31, תל אביב", address_en: "31 Sheinkin St, Tel Aviv", lat: 32.0669, lng: 34.7738, price: 10950, floor: 2, size_sqm: 86, amenities: ["furnished", "renovated", "pets"], commute_he: "הליכה קצרה לרוטשילד ולתחבורה", commute_en: "Short walk to Rothschild and transit" },
      { neighborhood_he: "פלורנטין", neighborhood_en: "Florentin", address_he: "פרנקל 42, תל אביב", address_en: "42 Frenkel St, Tel Aviv", lat: 32.0568, lng: 34.7676, price: 9850, floor: 4, size_sqm: 88, amenities: ["balcony", "shelter", "furnished"], commute_he: "קרוב לרכבת הקלה ולאזורי עבודה", commute_en: "Near light rail and work areas" },
      { neighborhood_he: "יהודה המכבי", neighborhood_en: "Yehuda Maccabi", address_he: "יהודה המכבי 56, תל אביב", address_en: "56 Yehuda Maccabi St, Tel Aviv", lat: 32.0952, lng: 34.7895, price: 12400, floor: 1, size_sqm: 96, amenities: ["elevator", "storage", "renovated"], commute_he: "נוח לאוניברסיטה ולפארק הירקון", commute_en: "Convenient for TAU and Park HaYarkon" },
      { neighborhood_he: "בבלי", neighborhood_en: "Bavli", address_he: "הרב הרצוג 12, תל אביב", address_en: "12 HaRav Herzog St, Tel Aviv", lat: 32.0958, lng: 34.7971, price: 11650, floor: 5, size_sqm: 94, amenities: ["elevator", "parking", "balcony"], commute_he: "שקטה וקרובה ליציאה לאיילון", commute_en: "Quiet street with quick Ayalon access" },
      { neighborhood_he: "מונטיפיורי", neighborhood_en: "Montefiore", address_he: "שדרות יהודית 18, תל אביב", address_en: "18 Yehudit Blvd, Tel Aviv", lat: 32.0689, lng: 34.7924, price: 10400, floor: 2, size_sqm: 83, amenities: ["renovated", "furnished", "shelter"], commute_he: "קרוב לעזריאלי ולרכבת השלום", commute_en: "Near Azrieli and HaShalom train" },
      { neighborhood_he: "כיכר רבין", neighborhood_en: "Rabin Square", address_he: "אבן גבירול 82, תל אביב", address_en: "82 Ibn Gabirol St, Tel Aviv", lat: 32.0808, lng: 34.7819, price: 11250, floor: 3, size_sqm: 90, amenities: ["balcony", "elevator", "pets"], commute_he: "מרכזית ונוחה לכל חברי הצוות", commute_en: "Central and easy for the whole team" },
      { neighborhood_he: "רוטשילד", neighborhood_en: "Rothschild", address_he: "שדרות רוטשילד 96, תל אביב", address_en: "96 Rothschild Blvd, Tel Aviv", lat: 32.0639, lng: 34.7734, price: 12600, floor: 4, size_sqm: 91, amenities: ["renovated", "balcony", "elevator"], commute_he: "מעולה למי שעובד במרכז העיר", commute_en: "Great for central city work commutes" },
      { neighborhood_he: "יד אליהו", neighborhood_en: "Yad Eliyahu", address_he: "לה גוארדיה 48, תל אביב", address_en: "48 La Guardia St, Tel Aviv", lat: 32.0624, lng: 34.7959, price: 9400, floor: 2, size_sqm: 89, amenities: ["shelter", "parking", "storage"], commute_he: "מחיר טוב ויציאה מהירה לצירים ראשיים", commute_en: "Good value with fast main-road access" },
    ],
  },
  "באר שבע": {
    key: "beer_sheva",
    en: "Be'er Sheva",
    center: { lat: 31.2529, lng: 34.7915 },
    teammateLocations: [
      { type: "university", label_he: "אוניברסיטת בן גוריון", label_en: "Ben-Gurion University", lat: 31.2622, lng: 34.8015 },
      { type: "work", label_he: "פארק ההייטק גב ים", label_en: "Gav-Yam Negev Tech Park", lat: 31.2637, lng: 34.8126 },
      { type: "work", label_he: "מרכז העיר", label_en: "City center", lat: 31.2448, lng: 34.7925 },
    ],
    apartments: [
      { neighborhood_he: "שכונה ב'", neighborhood_en: "Neighborhood Bet", address_he: "ביאליק 22, באר שבע", address_en: "22 Bialik St, Be'er Sheva", lat: 31.2586, lng: 34.7939, price: 5200, floor: 2, size_sqm: 84, amenities: ["furnished", "renovated", "balcony"], commute_he: "הליכה נוחה לאוניברסיטה", commute_en: "Comfortable walk to BGU" },
      { neighborhood_he: "שכונה ג'", neighborhood_en: "Neighborhood Gimel", address_he: "וינגייט 16, באר שבע", address_en: "16 Wingate St, Be'er Sheva", lat: 31.2641, lng: 34.7961, price: 5600, floor: 3, size_sqm: 88, amenities: ["elevator", "shelter", "furnished"], commute_he: "קרובה לאוניברסיטה ולרכבת צפון", commute_en: "Near BGU and North train station" },
      { neighborhood_he: "העיר העתיקה", neighborhood_en: "Old City", address_he: "החלוץ 7, באר שבע", address_en: "7 HeHalutz St, Be'er Sheva", lat: 31.2418, lng: 34.7908, price: 4800, floor: 1, size_sqm: 78, amenities: ["renovated", "pets", "storage"], commute_he: "קרובה למסעדות ולתחבורה", commute_en: "Close to restaurants and transit" },
      { neighborhood_he: "רמות", neighborhood_en: "Ramot", address_he: "רמות 61, באר שבע", address_en: "61 Ramot, Be'er Sheva", lat: 31.2821, lng: 34.7967, price: 6100, floor: 4, size_sqm: 96, amenities: ["parking", "elevator", "balcony"], commute_he: "שקטה ומרווחת, נסיעה קצרה לאוניברסיטה", commute_en: "Quiet and spacious, short ride to BGU" },
      { neighborhood_he: "נווה זאב", neighborhood_en: "Neve Ze'ev", address_he: "טבנקין 28, באר שבע", address_en: "28 Tabenkin St, Be'er Sheva", lat: 31.2349, lng: 34.7738, price: 5400, floor: 2, size_sqm: 91, amenities: ["shelter", "parking", "renovated"], commute_he: "מתאימה לצוות עם רכב", commute_en: "Good for a team with a car" },
      { neighborhood_he: "שכונה ו'", neighborhood_en: "Neighborhood Vav", address_he: "משעול סביון 3, באר שבע", address_en: "3 Savyon Path, Be'er Sheva", lat: 31.2718, lng: 34.7838, price: 5050, floor: 3, size_sqm: 83, amenities: ["furnished", "balcony", "storage"], commute_he: "קרובה לשירותים יומיומיים", commute_en: "Close to daily essentials" },
      { neighborhood_he: "מרכז אזרחי", neighborhood_en: "Civic Center", address_he: "התקווה 11, באר שבע", address_en: "11 HaTikva St, Be'er Sheva", lat: 31.2487, lng: 34.7927, price: 4950, floor: 2, size_sqm: 80, amenities: ["renovated", "elevator", "furnished"], commute_he: "נוחה למרכז ולתחבורה ציבורית", commute_en: "Convenient for downtown and transit" },
      { neighborhood_he: "כלניות", neighborhood_en: "Kalaniyot", address_he: "כלנית 19, באר שבע", address_en: "19 Kalanit St, Be'er Sheva", lat: 31.2704, lng: 34.8232, price: 5900, floor: 1, size_sqm: 94, amenities: ["parking", "shelter", "pets"], commute_he: "קרובה לפארק ההייטק", commute_en: "Near the tech park" },
      { neighborhood_he: "שכונה ד'", neighborhood_en: "Neighborhood Dalet", address_he: "רגר 138, באר שבע", address_en: "138 Rager Blvd, Be'er Sheva", lat: 31.2658, lng: 34.7897, price: 5150, floor: 3, size_sqm: 85, amenities: ["balcony", "furnished", "renovated"], commute_he: "מרכזית לסטודנטים ולעבודה", commute_en: "Central for students and work" },
    ],
  },
  "ירושלים": {
    key: "jerusalem",
    en: "Jerusalem",
    center: { lat: 31.7683, lng: 35.2137 },
    teammateLocations: [
      { type: "university", label_he: "קמפוס גבעת רם", label_en: "Givat Ram campus", lat: 31.7751, lng: 35.1974 },
      { type: "work", label_he: "מרכז העיר", label_en: "City center", lat: 31.7812, lng: 35.2198 },
      { type: "university", label_he: "בצלאל", label_en: "Bezalel", lat: 31.7814, lng: 35.2237 },
    ],
    apartments: [
      { neighborhood_he: "נחלאות", neighborhood_en: "Nachlaot", address_he: "אגריפס 74, ירושלים", address_en: "74 Agripas St, Jerusalem", lat: 31.7842, lng: 35.2111, price: 8200, floor: 2, size_sqm: 82, amenities: ["renovated", "balcony", "furnished"], commute_he: "קרובה לשוק ולרכבת הקלה", commute_en: "Near the market and light rail" },
      { neighborhood_he: "רחביה", neighborhood_en: "Rehavia", address_he: "עזה 31, ירושלים", address_en: "31 Gaza St, Jerusalem", lat: 31.7719, lng: 35.2124, price: 9100, floor: 3, size_sqm: 88, amenities: ["elevator", "storage", "renovated"], commute_he: "נוחה לגבעת רם ולמרכז", commute_en: "Convenient for Givat Ram and downtown" },
      { neighborhood_he: "המושבה הגרמנית", neighborhood_en: "German Colony", address_he: "עמק רפאים 42, ירושלים", address_en: "42 Emek Refaim St, Jerusalem", lat: 31.7635, lng: 35.2196, price: 9400, floor: 2, size_sqm: 92, amenities: ["balcony", "pets", "furnished"], commute_he: "רחוב חי ונגיש לשירותים יומיומיים", commute_en: "Lively street with daily services nearby" },
      { neighborhood_he: "קטמון", neighborhood_en: "Katamon", address_he: "הל\"ה 18, ירושלים", address_en: "18 HaLamed Hei St, Jerusalem", lat: 31.7609, lng: 35.2104, price: 8350, floor: 1, size_sqm: 86, amenities: ["shelter", "renovated", "parking"], commute_he: "שקטה ומתאימה לשגרת לימודים", commute_en: "Quiet and good for study routines" },
      { neighborhood_he: "טלביה", neighborhood_en: "Talbiya", address_he: "מרכוס 9, ירושלים", address_en: "9 Marcus St, Jerusalem", lat: 31.7701, lng: 35.2214, price: 9800, floor: 3, size_sqm: 90, amenities: ["elevator", "balcony", "storage"], commute_he: "קרובה לתיאטרון ולמרכז העיר", commute_en: "Near the theater and city center" },
      { neighborhood_he: "בית הכרם", neighborhood_en: "Beit HaKerem", address_he: "החלוץ 29, ירושלים", address_en: "29 HaHalutz St, Jerusalem", lat: 31.7798, lng: 35.1894, price: 7900, floor: 2, size_sqm: 87, amenities: ["furnished", "parking", "renovated"], commute_he: "נוחה לקמפוס גבעת רם", commute_en: "Convenient for Givat Ram campus" },
      { neighborhood_he: "מרכז העיר", neighborhood_en: "City Center", address_he: "יפו 64, ירושלים", address_en: "64 Jaffa St, Jerusalem", lat: 31.7838, lng: 35.2186, price: 8600, floor: 4, size_sqm: 80, amenities: ["elevator", "furnished", "shelter"], commute_he: "על ציר הרכבת הקלה", commute_en: "On the light rail corridor" },
      { neighborhood_he: "בקעה", neighborhood_en: "Baka", address_he: "דרך בית לחם 88, ירושלים", address_en: "88 Bethlehem Rd, Jerusalem", lat: 31.7559, lng: 35.2226, price: 8750, floor: 2, size_sqm: 89, amenities: ["balcony", "pets", "storage"], commute_he: "שכונתית ונגישה", commute_en: "Neighborhood feel with easy access" },
      { neighborhood_he: "קריית שמואל", neighborhood_en: "Kiryat Shmuel", address_he: "הרצוג 22, ירושלים", address_en: "22 Herzog St, Jerusalem", lat: 31.7667, lng: 35.2077, price: 8050, floor: 1, size_sqm: 84, amenities: ["renovated", "parking", "furnished"], commute_he: "בין רחביה לקטמון", commute_en: "Between Rehavia and Katamon" },
    ],
  },
};

function stableNumber(input, modulo) {
  let hash = 0;
  const text = String(input || "");
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash % modulo;
}

function normalizeCityName(city) {
  return String(city || "").trim().replace(/\s+/g, " ");
}

function cityIdentity(city) {
  return normalizeCityName(city).toLocaleLowerCase();
}

function cityMarketFor(city) {
  const normalized = normalizeCityName(city);
  return CITY_APARTMENT_MARKETS[normalized] || CITY_APARTMENT_MARKETS[DEMO_CITY_OPTIONS.tel_aviv.he];
}

function stage2DemoCityName() {
  const demoCity = DEMO_CITY_OPTIONS[getDemoCityKey()];
  return demoCity?.he || "";
}

function apartmentChatGroupId(teamKey, apartmentId) {
  return `${teamKey}_apt_${apartmentId}`;
}

function stage2TeamChatGroupId(memberIds = []) {
  return apartmentTeamKey(memberIds);
}

function apartmentDiscoverySuggestions({ city, bedrooms, teamKey, batchIndex = 0 }) {
  if (!city || !bedrooms) return [];
  if (batchIndex >= APARTMENT_DISCOVERY_BATCH_COUNT) return [];
  const market = cityMarketFor(city);
  const offset = batchIndex * 3;
  return market.apartments.slice(offset, offset + 3).map((apartment, index) => {
    const absoluteIndex = offset + index;
    const amenityRecords = (apartment.amenities || []).map((key) => SHARED_AMENITIES[key]).filter(Boolean);
    return {
      id: `sim-apartment-${teamKey}-${market.key}-${batchIndex + 1}-${index + 1}`,
      title: `${bedrooms} חדרי שינה ב${market.en}`,
      title_en: `${bedrooms}-bedroom apartment in ${market.en}`,
      title_he: `דירת ${bedrooms} חדרי שינה ב${city}`,
      city,
      city_en: market.en,
      neighborhood: apartment.neighborhood_he,
      neighborhood_en: apartment.neighborhood_en,
      neighborhood_he: apartment.neighborhood_he,
      address: apartment.address_he,
      address_en: apartment.address_en,
      address_he: apartment.address_he,
      price: apartment.price + stableNumber(`${teamKey}:${city}:${absoluteIndex}`, 180),
      bedrooms,
      floor: apartment.floor,
      size_sqm: apartment.size_sqm,
      latitude: apartment.lat,
      longitude: apartment.lng,
      image: APARTMENT_DISCOVERY_IMAGES[absoluteIndex % APARTMENT_DISCOVERY_IMAGES.length],
      images: [
        APARTMENT_DISCOVERY_IMAGES[absoluteIndex % APARTMENT_DISCOVERY_IMAGES.length],
        APARTMENT_DISCOVERY_IMAGES[(absoluteIndex + 3) % APARTMENT_DISCOVERY_IMAGES.length],
        APARTMENT_DISCOVERY_IMAGES[(absoluteIndex + 6) % APARTMENT_DISCOVERY_IMAGES.length],
      ],
      amenities: apartment.amenities || [],
      amenities_en: amenityRecords.map((item) => item.en),
      amenities_he: amenityRecords.map((item) => item.he),
      commute_note_en: apartment.commute_en,
      commute_note_he: apartment.commute_he,
      description_en: `A realistic shared apartment option with ${bedrooms} bedrooms, ${apartment.size_sqm} sqm, and a location that works for the team's daily routine.`,
      description_he: `דירת שותפים ריאליסטית עם ${bedrooms} חדרי שינה, ${apartment.size_sqm} מ"ר ומיקום שמתאים לשגרה היומיומית של הצוות.`,
      suggested_viewing_slots: [
        "2026-07-02T18:00",
        "2026-07-05T17:30",
      ],
      listing_url: `https://app.ruumrapp.com/ApartmentDetail?apartmentId=sim-${market.key}-${batchIndex + 1}-${index + 1}`,
      source: "simulator",
      batch_index: batchIndex,
    };
  });
}

function scenarioApartmentSuggestions(state, { batchIndex = 0 } = {}) {
  if (batchIndex !== 0 || !state?.scenario?.apartment_search?.apartments?.length) return [];
  return state.scenario.apartment_search.apartments.map((apartment) => apartmentFromScenario(apartment, state.scenario));
}

function apartmentDiscoverySuggestionsForState(state, options) {
  const scenarioSuggestions = scenarioApartmentSuggestions(state, options);
  return scenarioSuggestions.length ? scenarioSuggestions : apartmentDiscoverySuggestions(options);
}

function simulatorAutoRankTeamEnabled() {
  if (isDemoHousingStage()) {
    return true;
  }

  if (import.meta.env.VITE_RUUMR_SIMULATOR_AUTO_RANK_TEAM === "true") {
    return true;
  }

  try {
    return typeof window !== "undefined" && new URLSearchParams(window.location.search).get("simulator_auto_rank_team") === "true";
  } catch {
    return false;
  }
}

function scenarioTeammatePreferences(state, discovery) {
  const scenarioPreferences = state?.scenario?.apartment_search?.teammate_preferences || {};
  if (!state?.scenario?.apartment_search?.auto_submit_teammate_preferences) return null;
  const apartmentIds = new Set((discovery?.suggested_apartments || []).map((apartment) => String(apartment.id)));
  // Only apply scenario preferences for people who are actually on the team, so
  // a team built from arbitrary Plus picks doesn't inherit a non-member's votes.
  const memberIds = new Set((discovery?.member_user_ids || []).map((id) => String(id)));
  const entries = Object.entries(scenarioPreferences)
    .filter(([userId]) => String(userId) !== String(state.currentUser.id))
    .filter(([userId]) => memberIds.size === 0 || memberIds.has(String(userId)))
    .map(([userId, preferences]) => {
      const normalized = Object.fromEntries(
        Object.entries(preferences || {}).filter(([apartmentId]) => apartmentIds.has(String(apartmentId)))
      );
      return [
        String(userId),
        {
          user_id: String(userId),
          preferences: normalized,
          submitted_at: nowIso(),
          simulator_generated: true,
          simulator_scenario: true,
        },
      ];
    })
    .filter(([, record]) => Object.keys(record.preferences || {}).length === apartmentIds.size);
  // Return null (not an empty object) when no scenario teammate covers the
  // current batch — e.g. after "find three more" surfaces non-scenario
  // apartments whose ids aren't in teammate_preferences. A null result lets
  // submitApartmentPreferences fall through to the auto-rank fallback so the
  // teammates still submit and the flow doesn't softlock at "1/3".
  return entries.length ? Object.fromEntries(entries) : null;
}

function cloneCollectionRecords(collections = {}) {
  return Object.fromEntries(
    Object.entries(collections).map(([name, records]) => [
      name,
      Array.isArray(records) ? records.map((record) => clone(record)) : clone(records),
    ])
  );
}

function readPersistedSimulatorState() {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }

  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("simulator_reset_state") === "true") {
      window.localStorage.removeItem(SIMULATOR_STATE_STORAGE_KEY);
      try { window.sessionStorage?.removeItem("ruumr_apartment_intro_seen"); } catch { /* ignore */ }
      params.delete("simulator_reset_state");
      const nextUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}${window.location.hash || ""}`;
      window.history.replaceState(window.history.state, "", nextUrl);
      return null;
    }

    const raw = window.localStorage.getItem(SIMULATOR_STATE_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function consumeSimulatorResetFlag() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("simulator_reset_state") !== "true") {
      return false;
    }
    window.localStorage?.removeItem(SIMULATOR_STATE_STORAGE_KEY);
    Object.keys(window.localStorage || {}).forEach((key) => {
      if (key.startsWith("ruumr_plus_activation:")) {
        window.localStorage.removeItem(key);
      }
    });
    window.sessionStorage?.removeItem("ruumr_plus_pending_activation");
    params.delete("simulator_reset_state");
    const nextUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}${window.location.hash || ""}`;
    window.history.replaceState(window.history.state, "", nextUrl);
    return true;
  } catch {
    return false;
  }
}

function persistSimulatorState(state) {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.setItem(
      SIMULATOR_STATE_STORAGE_KEY,
      JSON.stringify({
        version: SIMULATOR_STATE_VERSION,
        currentUser: clone(state.currentUser),
        currentProfile: clone(state.currentProfile),
        users: clone(state.users),
        collections: cloneCollectionRecords(state.collections),
        groupId: state.groupId,
        matchMaya: clone(state.matchMaya),
        partnerUserId: state.partnerUserId,
      })
    );
  } catch {
    // Storage is best-effort only.
  }
}

function hydrateSimulatorState(baseState, persistedState = null) {
  if (!persistedState || typeof persistedState !== "object") {
    return baseState;
  }

  if (Number(persistedState.version) !== SIMULATOR_STATE_VERSION) {
    return baseState;
  }

  const collections = cloneCollectionRecords(baseState.collections);
  if (persistedState.collections && typeof persistedState.collections === "object") {
    Object.entries(persistedState.collections).forEach(([name, records]) => {
      collections[name] = Array.isArray(records) ? records.map((record) => clone(record)) : clone(records);
    });
  }

  return {
    ...baseState,
    currentUser: persistedState.currentUser
      ? { ...baseState.currentUser, ...clone(persistedState.currentUser) }
      : baseState.currentUser,
    currentProfile: persistedState.currentProfile
      ? { ...baseState.currentProfile, ...clone(persistedState.currentProfile) }
      : baseState.currentProfile,
    users: Array.isArray(persistedState.users) ? persistedState.users.map((user) => clone(user)) : baseState.users,
    collections,
    groupId: persistedState.groupId || baseState.groupId,
    matchMaya: persistedState.matchMaya
      ? { ...baseState.matchMaya, ...clone(persistedState.matchMaya) }
      : baseState.matchMaya,
    partnerUserId: persistedState.partnerUserId || baseState.partnerUserId,
  };
}

function createDemoProfile(options = {}) {
  const {
    userId,
    name,
    age,
    gender = "male",
    location,
    searchCities = [],
    searchArea = "מרכז",
    currentStatus = "seeking_apartment",
    budgetMin = 2500,
    budgetMax = 4500,
    vibeLevel = 3,
    aboutMe = "",
    lookingForDescription = "",
    lookingForGender = "any",
    religion = "secular",
    kosherPreference = "flow",
    shabbatPreference = "flow",
    petType = "none",
    petOtherDescription = "",
    interests = [],
    smokingPreference = "flow",
    petPreference = "flow",
    cleanliness = "3",
    shopping = "3",
    acWars = "3",
    dishesInSink = "3",
    friendsAndParties = "3",
    socialLink = "",
    apartmentTotalBudget = 5000,
    existingRoommates = 0,
    teamTarget = 3,
    teamMembers = [],
    isVisible = true,
    isVerified = true,
    createdOffsetDays = 0,
    apartmentPhotoCount = 3,
    photoCount = 3,
    ruumrPlus = null,
    photos = null,
    apartmentPhotos = null,
    songPreviewUrl = null,
    songName = "",
    songArtist = "",
    songImage = "",
    videoUrl = null,
    isApartmentFlowDemoUser = false,
    hiddenFromDiscover = false,
  } = options;

  const createdDate = daysAgoIso(createdOffsetDays);
  const base = createProfileDefaults();

  return {
    ...base,
    id: stableId("profile", userId || name),
    user_id: userId,
    name,
    age,
    gender,
    about_me: aboutMe,
    looking_for_description: lookingForDescription,
    photos: Array.isArray(photos) && photos.length > 0 ? [...photos] : buildSimulatorProfilePhotos(name, [], photoCount),
    apartment_photos:
      currentStatus === "has_apartment"
        ? Array.isArray(apartmentPhotos) && apartmentPhotos.length > 0
          ? [...apartmentPhotos]
          : buildSimulatorApartmentPhotos(name, [], apartmentPhotoCount)
        : [...Array(6).fill(null)],
    location,
    search_cities: [...searchCities],
    search_area: searchArea,
    budget_min: budgetMin,
    budget_max: budgetMax,
    vibe_level: vibeLevel,
    pet_type: petType,
    pet_other_description: petOtherDescription,
    looking_for_gender: lookingForGender,
    religion,
    kosher_preference: kosherPreference,
    shabbat_preference: shabbatPreference,
    current_status: currentStatus,
    apartment_total_budget: apartmentTotalBudget,
    existing_roommates: existingRoommates,
    interests: normalizeInterestValues(interests),
    social_link: socialLink,
    is_visible: isVisible,
    is_verified: isVerified,
    team_members: [...teamMembers],
    team_target: teamTarget,
    smoking_preference: smokingPreference,
    pet_preference: petPreference,
    cleanliness,
    shopping,
    ac_wars: acWars,
    dishes_in_sink: dishesInSink,
    friends_and_parties: friendsAndParties,
    song_preview_url: songPreviewUrl,
    song_name: songName,
    song_artist: songArtist,
    song_image: songImage,
    video_url: videoUrl,
    created_date: createdDate,
    updated_date: createdDate,
    ruumrPlus,
    ruumr_plus: ruumrPlus,
    is_apartment_flow_demo_user: isApartmentFlowDemoUser,
    // Demo-only: keep a profile out of the regular swipe deck while still
    // letting Ruumr Plus surface it (Plus reads recommendation_user_ids and
    // ignores this flag). Defaults false, so real users are unaffected.
    hidden_from_discover: hiddenFromDiscover,
  };
}

function createLegacyDemoState() {
  const currentUser = {
    id: "demo-user-noam",
    full_name: "נועם כהן",
    name: "נועם כהן",
    email: "noam@demo.ruumr",
    role: "user",
    is_apartment_flow_demo_user: true,
    enable_notifications: false,
    notify_likes: true,
    notify_matches: true,
    created_date: nowIso(),
    updated_date: nowIso(),
  };

  const eitanPhotos = [
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1200&q=80",
  ];
  const mayaPhotos = [
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=1200&q=80",
  ];
  const oriPhotos = [
    "https://images.unsplash.com/photo-1507591064344-4c6ce0052e9c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1200&q=80&sat=-40",
  ];
  const tamarPhotos = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1504257432389-52343af06ae3?auto=format&fit=crop&w=1200&q=80",
  ];
  const lihiPhotos = [
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1200&q=80&sat=-30",
  ];
  const yuvalPhotos = [
    "https://images.unsplash.com/photo-1504553101388-3b1b22f9be43?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1200&q=80&sat=-20",
  ];

  const eitanSong = {
    songPreviewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/bf/1f/c9/bf1fc9f8-d1c6-bc28-3d5b-5652501e5510/mzaf_10846663376352808320.plus.aac.p.m4a",
    songName: "Girls Like (feat. Zara Larsson)",
    songArtist: "Tinie Tempah",
    songImage: "https://is1-ssl.mzstatic.com/image/thumb/Music111/v4/fa/4e/16/fa4e16b9-9a5e-4ca5-f0fc-b3f2d988a92f/190295837846.jpg/100x100bb.jpg",
  };
  const tamarSong = {
    songPreviewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview116/v4/93/22/22/93222271-8d55-d923-e0ff-b2964a5abefe/mzaf_3513742103157153222.plus.aac.p.m4a",
    songName: "Hello",
    songArtist: "Adele",
    songImage: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/08/8c/24/088c2405-2e33-801b-5c38-e967f2c01e69/191404113974.png/100x100bb.jpg",
  };
  const oriSong = {
    songPreviewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/b0/db/7f/b0db7fbe-f8ff-1f67-fe72-ca8185ffbca2/mzaf_15298650366584767800.plus.aac.p.m4a",
    songName: "Counting Stars",
    songArtist: "OneRepublic",
    songImage: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/25/46/a7/2546a71a-b2bb-b4c9-4c52-a4daa3ae23ca/13UMGIM15076.rgb.jpg/100x100bb.jpg",
  };
  const lihiSong = {
    songPreviewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/c7/79/81/c7798117-a0f6-0695-275f-95fd3ef4fdf4/mzaf_9965434137419857797.plus.aac.p.m4a",
    songName: "Style",
    songArtist: "Taylor Swift",
    songImage: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/a7/98/d8/a798d867-344d-2bf2-fbfe-d2d1412dcef8/14UMDIM03793.rgb.jpg/100x100bb.jpg",
  };

  const maya = createDemoProfile({
    userId: "demo-user-maya",
    name: "מאיה לוי",
    age: 26,
    gender: "female",
    location: "תל אביב",
    searchCities: ["תל אביב", "גבעתיים"],
    searchArea: "מרכז",
    currentStatus: "has_apartment",
    budgetMin: 2800,
    budgetMax: 4800,
    vibeLevel: 4,
    aboutMe: "מעצבת מוצר שאוהבת בוקר שקט, קפה טוב ומוזיקה ברקע.",
    lookingForDescription: "מחפשת שותף/ה מסודר/ת, קליל/ה, שאוהב/ת דירה חמה ומכבדת.",
    interests: ["yoga", "plants", "reading", "photography", "night_owl"],
    petType: "cat",
    lookingForGender: "any",
    religion: "secular",
    kosherPreference: "flow",
    shabbatPreference: "flow",
    smokingPreference: "against",
    petPreference: "for",
    cleanliness: "4",
    shopping: "4",
    acWars: "3",
    dishesInSink: "4",
    friendsAndParties: "3",
    apartmentTotalBudget: 6200,
    existingRoommates: 1,
    teamTarget: 2,
    photos: mayaPhotos,
    apartmentPhotos: [
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
    ],
    ruumrPlus: {
      score: 0.92,
      insight: "יש כאן התאמה מצוינת לשיחות שקטות, בית מסודר ואיזון טוב בין שגרה לעשייה.",
      insight_i18n: {
        he: "יש כאן התאמה מצוינת לשיחות שקטות, בית מסודר ואיזון טוב בין שגרה לעשייה.",
        en: "A strong match for quiet conversations, a tidy home, and a balanced routine.",
      },
      reasons: {
        shared_cities: ["תל אביב"],
        shared_interests: ["plants", "reading"],
      },
      messageable: true,
    },
    createdOffsetDays: 4,
  });

  const ori = createDemoProfile({
    userId: "demo-user-ori",
    name: "אורי בן דוד",
    age: 29,
    gender: "male",
    location: "חיפה",
    searchCities: ["חיפה", "קריות"],
    searchArea: "צפון",
    currentStatus: "seeking_apartment",
    budgetMin: 2400,
    budgetMax: 4200,
    vibeLevel: 3,
    aboutMe: "עובד היברידי, אוהב גיימינג, ספורט ומסעדות טובות עם חברים.",
    lookingForDescription: "מחפש דירה נעימה עם אנשים זורמים, לא חייב בית שקט לגמרי.",
    interests: ["gaming", "business", "entrepreneurship", "soccer_basketball", "tech"],
    petType: "none",
    lookingForGender: "any",
    smokingPreference: "flow",
    petPreference: "flow",
    cleanliness: "3",
    shopping: "3",
    acWars: "2",
    dishesInSink: "3",
    friendsAndParties: "4",
    photos: oriPhotos,
    ...oriSong,
    createdOffsetDays: 3,
  });

  const tamar = createDemoProfile({
    userId: "demo-user-tamar",
    name: "תמר ישראלי",
    age: 24,
    gender: "female",
    location: "ירושלים",
    searchCities: ["ירושלים"],
    searchArea: "ירושלים",
    currentStatus: "seeking_apartment",
    budgetMin: 2200,
    budgetMax: 3600,
    vibeLevel: 5,
    aboutMe: "סטודנטית לעיצוב, אוהבת בישול, מוזיקה וטיולים בטבע.",
    lookingForDescription: "מחפשת שותפים נעימים עם תקשורת פתוחה וסביבת מגורים אסתטית.",
    interests: ["cooking", "music", "travel", "art", "nightlife"],
    petType: "none",
    lookingForGender: "any",
    smokingPreference: "against",
    petPreference: "flow",
    cleanliness: "5",
    shopping: "4",
    acWars: "3",
    dishesInSink: "5",
    friendsAndParties: "4",
    photos: tamarPhotos,
    ...tamarSong,
    ruumrPlus: {
      score: 0.81,
      insight: "יש הרבה חפיפה סביב יצירתיות, סדר יום וגישה חברתית מאוזנת.",
      insight_i18n: {
        he: "יש הרבה חפיפה סביב יצירתיות, סדר יום וגישה חברתית מאוזנת.",
        en: "There is strong overlap around creativity, daily rhythm, and a balanced social style.",
      },
      reasons: {
        shared_cities: [],
        shared_interests: ["music", "art"],
      },
      messageable: true,
    },
    createdOffsetDays: 2,
  });

  const eitan = createDemoProfile({
    userId: "demo-user-eitan",
    name: "Eitan",
    age: 25,
    gender: "male",
    location: "גבעת שמואל",
    searchCities: ["גבעת שמואל", "מרכז"],
    searchArea: "מרכז",
    currentStatus: "seeking_apartment",
    budgetMin: 2800,
    budgetMax: 5200,
    vibeLevel: 4,
    aboutMe: "אוהב מוזיקה, טיולים קצרים וצילומי רגעים טובים עם חברים.",
    lookingForDescription: "מחפש שותפים זורמים, מסודרים ועם אנרגיה טובה בבית.",
    interests: ["music", "travel", "photography", "hosting", "gym"],
    petType: "none",
    lookingForGender: "any",
    smokingPreference: "against",
    petPreference: "flow",
    cleanliness: "4",
    shopping: "3",
    acWars: "3",
    dishesInSink: "4",
    friendsAndParties: "3",
    photos: eitanPhotos,
    ...eitanSong,
    createdOffsetDays: 1,
  });

  const lihi = createDemoProfile({
    userId: "demo-user-lihi",
    name: "ליהי גולן",
    age: 30,
    gender: "female",
    location: "באר שבע",
    searchCities: ["באר שבע"],
    searchArea: "דרום",
    currentStatus: "has_apartment",
    budgetMin: 2400,
    budgetMax: 4200,
    vibeLevel: 3,
    aboutMe: "עובדת בהייטק, מארחת חברים לפעמים ואוהבת צמחייה בדירה.",
    lookingForDescription: "מחפשת שותף/ה מסודר/ת, עצמאי/ת וכזה/ו שאוהב/ת דירה חיה.",
    interests: ["plants", "homebody", "cooking", "tech", "pets"],
    petType: "dog",
    lookingForGender: "any",
    smokingPreference: "against",
    petPreference: "for",
    cleanliness: "3",
    shopping: "3",
    acWars: "2",
    dishesInSink: "4",
    friendsAndParties: "4",
    photos: lihiPhotos,
    apartmentPhotos: [
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80&sat=-10",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80&sat=-10",
      "https://images.unsplash.com/photo-1502672023488-70e25813eb80?auto=format&fit=crop&w=1200&q=80",
    ],
    ...lihiSong,
    teamTarget: 2,
    createdOffsetDays: 5,
  });

  const yuval = createDemoProfile({
    userId: "demo-user-yuval",
    name: "יובל שחר",
    age: 25,
    gender: "male",
    location: "נתניה",
    searchCities: ["נתניה", "הרצליה"],
    searchArea: "שרון",
    currentStatus: "seeking_apartment",
    budgetMin: 2300,
    budgetMax: 3900,
    vibeLevel: 4,
    aboutMe: "צלם חובב, אוהב אופנועים, קפה טוב וסופ\"ש בטבע.",
    lookingForDescription: "מחפש דירה נוחה עם אנשים נעימים ובלי דרמה מיותרת.",
    interests: ["motorcycles", "photography", "reading", "travel", "tech"],
    petType: "none",
    lookingForGender: "any",
    smokingPreference: "flow",
    petPreference: "flow",
    cleanliness: "3",
    shopping: "2",
    acWars: "3",
    dishesInSink: "2",
    friendsAndParties: "3",
    photos: yuvalPhotos,
    createdOffsetDays: 6,
  });

  const currentProfile = createDemoProfile({
    userId: currentUser.id,
    name: "נועם",
    age: 28,
    gender: "male",
    location: "תל אביב",
    searchCities: ["תל אביב", "רמת גן"],
    searchArea: "מרכז",
    currentStatus: "seeking_apartment",
    budgetMin: 2800,
    budgetMax: 4800,
    vibeLevel: 3,
    aboutMe: "אוהב מוזיקה, אימונים וערבים רגועים בבית מסודר.",
    lookingForDescription: "מחפש שותפים קלילים, מסודרים ועם תקשורת טובה.",
    interests: ["music", "gym", "travel", "hosting", "tech"],
    petType: "none",
    lookingForGender: "any",
    smokingPreference: "against",
    petPreference: "flow",
    cleanliness: "4",
    shopping: "3",
    acWars: "3",
    dishesInSink: "4",
    friendsAndParties: "3",
    photos: [
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1200&q=80",
    ],
    songPreviewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/b0/db/7f/b0db7fbe-f8ff-1f67-fe72-ca8185ffbca2/mzaf_15298650366584767800.plus.aac.p.m4a",
    songName: "Counting Stars",
    songArtist: "OneRepublic",
    songImage: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/25/46/a7/2546a71a-b2bb-b4c9-4c52-a4daa3ae23ca/13UMGIM15076.rgb.jpg/100x100bb.jpg",
    teamTarget: 2,
    isApartmentFlowDemoUser: true,
    teamMembers: [
      {
        match_id: pairStableId("match", currentUser.id, maya.user_id),
        user_id: maya.user_id,
        name: maya.name,
        photo: maya.photos?.[0] || null,
      },
    ],
    createdOffsetDays: 7,
  });

  const matchMaya = {
    id: pairStableId("match", currentUser.id, maya.user_id),
    user1_id: currentUser.id,
    user2_id: maya.user_id,
    user1_name: currentUser.full_name,
    user2_name: maya.name,
    status: "active",
    match_type: "mutual",
    created_date: daysAgoIso(1),
    updated_date: daysAgoIso(1),
  };

  const message1 = {
    id: stableId("message", "1"),
    match_id: matchMaya.id,
    sender_id: currentUser.id,
    content: "היי מאיה, המקום שלך נראה ממש נעים. אשמח לשמוע איך את אוהבת לחלק את הסידור בבית.",
    is_read: true,
    created_date: daysAgoIso(1),
    updated_date: daysAgoIso(1),
  };

  const message2 = {
    id: stableId("message", "2"),
    match_id: matchMaya.id,
    sender_id: maya.user_id,
    content: "הי נועם, הכי חשוב לי תקשורת זורמת וסדר בסיסי. גם אוהבת אורות רכים בערב.",
    is_read: false,
    created_date: daysAgoIso(0),
    updated_date: daysAgoIso(0),
  };

  const groupId = [currentUser.id, maya.user_id].sort().join("_");
  const groupMessage1 = {
    id: stableId("group-message", "1"),
    group_id: groupId,
    sender_id: currentUser.id,
    sender_name: currentUser.full_name,
    sender_photo: currentProfile.photos?.[0] || null,
    content: "נראה לי שאנחנו בכיוון טוב. מי רוצה לשריין דירה לשבוע הבא?",
    created_date: daysAgoIso(1),
    updated_date: daysAgoIso(1),
  };
  const groupMessage2 = {
    id: stableId("group-message", "2"),
    group_id: groupId,
    sender_id: maya.user_id,
    sender_name: maya.name,
    sender_photo: maya.photos?.[0] || null,
    content: "אני בעניין. אפשר להתחיל מסיור קצר ולסגור ציפיות?",
    created_date: daysAgoIso(0),
    updated_date: daysAgoIso(0),
  };

  const charterAnswersCurrent = [
    { id: stableId("answer", "current-1"), match_id: matchMaya.id, user_id: currentUser.id, question_id: "q_smoking", answer: "b", created_date: daysAgoIso(1) },
    { id: stableId("answer", "current-2"), match_id: matchMaya.id, user_id: currentUser.id, question_id: "q_partners", answer: "a", created_date: daysAgoIso(1) },
    { id: stableId("answer", "current-3"), match_id: matchMaya.id, user_id: currentUser.id, question_id: "q_pets", answer: "a", created_date: daysAgoIso(1) },
    { id: stableId("answer", "current-4"), match_id: matchMaya.id, user_id: currentUser.id, question_id: "q_cleaning_strictness", answer: "b", created_date: daysAgoIso(1) },
  ];

  const charterAnswersMaya = [
    { id: stableId("answer", "maya-1"), match_id: matchMaya.id, user_id: maya.user_id, question_id: "q_smoking", answer: "b", created_date: daysAgoIso(1) },
    { id: stableId("answer", "maya-2"), match_id: matchMaya.id, user_id: maya.user_id, question_id: "q_partners", answer: "a", created_date: daysAgoIso(1) },
    { id: stableId("answer", "maya-3"), match_id: matchMaya.id, user_id: maya.user_id, question_id: "q_pets", answer: "a", created_date: daysAgoIso(1) },
    { id: stableId("answer", "maya-4"), match_id: matchMaya.id, user_id: maya.user_id, question_id: "q_cleaning_strictness", answer: "a", created_date: daysAgoIso(1) },
  ];

  const review = {
    id: stableId("review", "maya"),
    reviewed_id: maya.user_id,
    reviewer_id: currentUser.id,
    reviewer_name: currentUser.full_name,
    rating: 5,
    content: "מאיה מסודרת, נוחה ועם אנרגיה ממש טובה לדירה משותפת.",
    created_date: daysAgoIso(2),
    updated_date: daysAgoIso(2),
  };

  const profiles = [currentProfile, maya, ori, tamar, eitan, lihi, yuval];

  const users = profiles.map((profile) => ({
    id: profile.user_id,
    full_name: profile.name === "נועם" ? currentUser.full_name : profile.name,
    name: profile.name,
    email: `${slugify(profile.name)}@demo.ruumr`,
    role: "user",
    enable_notifications: profile.user_id === currentUser.id ? false : true,
    notify_likes: true,
    notify_matches: true,
    created_date: profile.created_date,
    updated_date: profile.updated_date,
  }));

  const swipeLikeMayaCurrent = {
    id: stableId("swipe", "maya-current"),
    swiper_id: currentUser.id,
    swiped_id: maya.user_id,
    action: "like",
    created_date: daysAgoIso(1),
    updated_date: daysAgoIso(1),
  };
  const swipeLikeMayaReverse = {
    id: stableId("swipe", "maya-reverse"),
    swiper_id: maya.user_id,
    swiped_id: currentUser.id,
    action: "like",
    created_date: daysAgoIso(1),
    updated_date: daysAgoIso(1),
  };
  const swipeLikeOriCurrent = {
    id: stableId("swipe", "ori-current"),
    swiper_id: currentUser.id,
    swiped_id: ori.user_id,
    action: "like",
    created_date: daysAgoIso(0),
    updated_date: daysAgoIso(0),
  };
  const swipeLikeLihiReceived = {
    id: stableId("swipe", "lihi-received"),
    swiper_id: lihi.user_id,
    swiped_id: currentUser.id,
    action: "like",
    created_date: daysAgoIso(0),
    updated_date: daysAgoIso(0),
  };

  const collections = {
    Profile: profiles,
    Swipe: [swipeLikeMayaCurrent, swipeLikeMayaReverse, swipeLikeOriCurrent, swipeLikeLihiReceived],
    Match: [matchMaya],
    Message: [message1, message2],
    GroupMessage: [groupMessage1, groupMessage2],
    CharterAnswer: [...charterAnswersCurrent, ...charterAnswersMaya],
    QuestionnairePreference: [],
    Review: [review],
    PageView: [],
    TypingStatus: [],
    BannedUser: [],
    TeamApartmentDiscovery: [],
    GroupTracker: [],
    GroupCompatibility: [],
  };

  return {
    currentUser,
    currentProfile,
    users,
    collections,
    groupId,
    matchMaya,
    partnerUserId: maya.user_id,
  };
}

function profileFromScenario(profile = {}) {
  return createDemoProfile({
    userId: profile.user_id,
    name: profile.name,
    age: profile.age,
    gender: profile.gender || "male",
    location: profile.location,
    searchCities: profile.search_cities || [],
    searchArea: profile.search_area || "מרכז",
    currentStatus: profile.current_status || "seeking_apartment",
    budgetMin: profile.budget_min,
    budgetMax: profile.budget_max,
    vibeLevel: profile.vibe_level,
    aboutMe: profile.about_me || "",
    lookingForDescription: profile.looking_for_description || "",
    lookingForGender: profile.looking_for_gender || "any",
    religion: profile.religion || "secular",
    kosherPreference: profile.kosher_preference || "flow",
    shabbatPreference: profile.shabbat_preference || "flow",
    petType: profile.pet_type || "none",
    interests: profile.interests || [],
    smokingPreference: profile.smoking_preference || "against",
    petPreference: profile.pet_preference || "flow",
    cleanliness: profile.cleanliness || "4",
    shopping: profile.shopping || "3",
    acWars: profile.ac_wars || "3",
    dishesInSink: profile.dishes_in_sink || "4",
    friendsAndParties: profile.friends_and_parties || "3",
    apartmentTotalBudget: profile.apartment_total_budget || 5000,
    existingRoommates: profile.existing_roommates || 0,
    teamTarget: profile.team_target || 3,
    isVisible: profile.is_visible !== false,
    isVerified: profile.is_verified !== false,
    createdOffsetDays: profile.created_offset_days || 0,
    ruumrPlus: profile.ruumr_plus || null,
    hiddenFromDiscover: profile.hidden_from_discover === true,
    photos: profile.photos || null,
    apartmentPhotos: profile.apartment_photos || null,
    songPreviewUrl: profile.song_preview_url || null,
    songName: profile.song_name || "",
    songArtist: profile.song_artist || "",
    songImage: profile.song_image || "",
    isApartmentFlowDemoUser: profile.role === "current",
  });
}

function apartmentFromScenario(apartment = {}, scenario = {}) {
  return {
    id: apartment.id,
    title: apartment.title_he || apartment.title || apartment.title_en,
    title_en: apartment.title_en || apartment.title,
    title_he: apartment.title_he || apartment.title,
    city: scenario.apartment_search?.city || DEMO_CITY_OPTIONS.tel_aviv.he,
    city_en: DEMO_CITY_OPTIONS[scenario.apartment_search?.city_key]?.en || "Tel Aviv",
    neighborhood: apartment.neighborhood_he || apartment.neighborhood,
    neighborhood_en: apartment.neighborhood_en || apartment.neighborhood,
    neighborhood_he: apartment.neighborhood_he || apartment.neighborhood,
    address: apartment.address_he || apartment.address,
    address_en: apartment.address_en || apartment.address,
    address_he: apartment.address_he || apartment.address,
    price: apartment.price,
    bedrooms: apartment.bedrooms,
    floor: apartment.floor,
    size_sqm: apartment.size_sqm,
    latitude: apartment.latitude,
    longitude: apartment.longitude,
    image: apartment.image,
    images: apartment.images?.length ? apartment.images : [apartment.image].filter(Boolean),
    amenities: apartment.amenities || [],
    amenities_en: apartment.amenities_en || [],
    amenities_he: apartment.amenities_he || [],
    commute_note_en: apartment.commute_note_en || "",
    commute_note_he: apartment.commute_note_he || "",
    description_en: apartment.description_en || "",
    description_he: apartment.description_he || "",
    suggested_viewing_slots: [
      scenario.apartment_search?.viewing_slot,
      "2026-07-05T17:30:00.000Z",
    ].filter(Boolean),
    listing_url: apartment.listing_url || `https://app.ruumrapp.com/ApartmentDetail?apartmentId=${encodeURIComponent(apartment.id)}`,
    source: "scenario",
    batch_index: 0,
  };
}

function questionnairePreferenceFromScenario(preference = {}) {
  const completedAt = preference.completed_at || daysAgoIso(1);
  return {
    id: stableId("questionnaire", preference.user_id),
    user_id: preference.user_id,
    version: Number(preference.version) || 1,
    completed_at: completedAt,
    source: preference.source || "demo_scenario",
    source_match_id: preference.source_match_id || null,
    answers: normalizeCharterAnswers(preference.answers || {}),
    simulator_scenario: true,
    created_date: completedAt,
    updated_date: completedAt,
  };
}

function createScenarioMatch(currentUser, targetProfile, createdDate = daysAgoIso(1), matchType = "mutual") {
  return {
    id: pairStableId("match", currentUser.id, targetProfile.user_id),
    user1_id: currentUser.id,
    user2_id: targetProfile.user_id,
    user1_name: currentUser.full_name || currentUser.name,
    user2_name: targetProfile.name,
    status: "active",
    match_type: matchType,
    created_date: createdDate,
    updated_date: createdDate,
    simulator_scenario: true,
  };
}

function createScenarioMessages(scenario, profileByUserId, currentUser) {
  const messages = [];
  const groupMessages = [];
  const directThreads = scenario.chats?.direct || [];
  directThreads.forEach((thread, threadIndex) => {
    const teammate = profileByUserId.get(String(thread.with_user_id));
    if (!teammate) return;
    const matchId = pairStableId("match", currentUser.id, teammate.user_id);
    (thread.messages || []).forEach((message, messageIndex) => {
      const created = daysAgoIso(message.days_ago ?? 0);
      messages.push({
        id: stableId("message", `scenario-${threadIndex}-${messageIndex}`),
        match_id: matchId,
        sender_id: message.sender_id,
        content: message.content,
        is_read: message.is_read !== false,
        created_date: created,
        updated_date: created,
        simulator_scenario: true,
      });
    });
  });

  const lockedIds = scenario.team?.locked_user_ids || [];
  const groupId = [currentUser.id, ...lockedIds].sort().join("_");
  (scenario.chats?.group?.messages || []).forEach((message, index) => {
    const sender = profileByUserId.get(String(message.sender_id));
    const created = daysAgoIso(message.days_ago ?? 0);
    groupMessages.push({
      id: stableId("group-message", `scenario-${index}`),
      group_id: groupId,
      sender_id: message.sender_id,
      sender_name: sender?.name || currentUser.full_name,
      sender_photo: sender?.photos?.[0] || null,
      content: message.content,
      created_date: created,
      updated_date: created,
      simulator_scenario: true,
    });
  });

  return { messages, groupMessages, groupId };
}

function scenarioPhaseToDemoStage(phase) {
  const normalized = String(phase || "").trim();
  if (normalized === "apartment_search" || normalized === "phase_2") return DEMO_STAGES.APARTMENT_SEARCH;
  if (normalized === "move_in" || normalized === "apartment_services" || normalized === "phase_3" || normalized === "phase_4") {
    return DEMO_STAGES.APARTMENT_SERVICES;
  }
  return DEMO_STAGES.TEAM_BUILDING;
}

function createScenarioDemoState({ reset = false } = {}) {
  let scenario;
  try {
    scenario = getDefaultDemoScenario();
  } catch (error) {
    console.warn("[ruumr] failed to load demo scenario; falling back to legacy simulator state", error);
    return null;
  }

  if (reset && !demoStageParamPresent()) {
    setDemoStage(scenarioPhaseToDemoStage(scenario.starting_phase));
  }

  const currentUser = {
    id: scenario.current_user.id,
    full_name: scenario.current_user.full_name || scenario.current_user.name,
    name: scenario.current_user.name || scenario.current_user.full_name,
    email: scenario.current_user.email,
    role: "user",
    is_apartment_flow_demo_user: true,
    enable_notifications: false,
    notify_likes: true,
    notify_matches: true,
    created_date: nowIso(),
    updated_date: nowIso(),
  };

  const profiles = scenario.profiles.map(profileFromScenario);
  const questionnairePreferences = (scenario.questionnaire_preferences || []).map(questionnairePreferenceFromScenario);
  const profileByUserId = new Map(profiles.map((profile) => [String(profile.user_id), profile]));
  const currentProfile = profileByUserId.get(String(currentUser.id));
  if (!currentProfile) return null;

  const lockedIds = scenario.team?.locked_user_ids || [];
  currentProfile.team_target = scenario.team?.target_count || currentProfile.team_target || 3;
  currentProfile.team_members = lockedIds
    .map((userId) => profileByUserId.get(String(userId)))
    .filter(Boolean)
    .map((profile) => ({
      match_id: pairStableId("match", currentUser.id, profile.user_id),
      user_id: profile.user_id,
      name: profile.name,
      photo: profile.photos?.[0] || null,
      simulator_scenario: true,
    }));

  const matches = lockedIds
    .map((userId) => profileByUserId.get(String(userId)))
    .filter(Boolean)
    .map((profile) => createScenarioMatch(currentUser, profile));

  const swipes = lockedIds
    .map((userId) => profileByUserId.get(String(userId)))
    .filter(Boolean)
    .flatMap((profile) => [
      {
        id: stableId("swipe", `scenario-current-${profile.user_id}`),
        swiper_id: currentUser.id,
        swiped_id: profile.user_id,
        action: "like",
        created_date: daysAgoIso(1),
        updated_date: daysAgoIso(1),
        simulator_scenario: true,
      },
      {
        id: stableId("swipe", `scenario-reverse-${profile.user_id}`),
        swiper_id: profile.user_id,
        swiped_id: currentUser.id,
        action: "like",
        created_date: daysAgoIso(1),
        updated_date: daysAgoIso(1),
        simulator_scenario: true,
      },
    ]);

  const { messages, groupMessages, groupId } = createScenarioMessages(scenario, profileByUserId, currentUser);
  const users = profiles.map((profile) => ({
    id: profile.user_id,
    full_name: profile.user_id === currentUser.id ? currentUser.full_name : profile.name,
    name: profile.name,
    email: `${slugify(profile.name)}@demo.ruumr`,
    role: "user",
    enable_notifications: profile.user_id !== currentUser.id,
    notify_likes: true,
    notify_matches: true,
    created_date: profile.created_date,
    updated_date: profile.updated_date,
  }));

  return {
    currentUser,
    currentProfile,
    users,
    collections: {
      Profile: profiles,
      Swipe: swipes,
      Match: matches,
      Message: messages,
      GroupMessage: groupMessages,
      CharterAnswer: [],
      QuestionnairePreference: questionnairePreferences,
      Review: [],
      PageView: [],
      TypingStatus: [],
      BannedUser: [],
      TeamApartmentDiscovery: [],
      GroupTracker: [],
      GroupCompatibility: [],
    },
    groupId,
    matchMaya: matches[0] || null,
    partnerUserId: lockedIds[0] || "",
    scenario,
  };
}

function createDemoState(options = {}) {
  return createScenarioDemoState(options) || createLegacyDemoState();
}

export function getSimulatorBackendState() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.__ruumrSimulatorState || null;
}

function normalizeValue(value) {
  return String(value ?? "").trim();
}

function primitiveMatch(left, right) {
  if (Array.isArray(left)) {
    return left.some((item) => primitiveMatch(item, right));
  }

  if (Array.isArray(right)) {
    return right.some((item) => primitiveMatch(left, item));
  }

  if (left == null || right == null) {
    return String(left ?? "") === String(right ?? "");
  }

  return normalizeValue(left) === normalizeValue(right);
}

function matchesQuery(record, query) {
  if (!query || Object.keys(query).length === 0) {
    return true;
  }

  if (Array.isArray(query)) {
    return query.some((subQuery) => matchesQuery(record, subQuery));
  }

  if (typeof query !== "object") {
    return true;
  }

  if (Array.isArray(query.$or)) {
    return query.$or.some((subQuery) => matchesQuery(record, subQuery));
  }

  if (Array.isArray(query.$and)) {
    return query.$and.every((subQuery) => matchesQuery(record, subQuery));
  }

  return Object.entries(query).every(([key, value]) => {
    if (key.startsWith("$")) {
      return true;
    }

    return primitiveMatch(record?.[key], value);
  });
}

function sortRecords(records, orderBy) {
  if (!orderBy || typeof orderBy !== "string") {
    return [...records];
  }

  const descending = orderBy.startsWith("-");
  const field = descending ? orderBy.slice(1) : orderBy;

  return [...records].sort((left, right) => {
    const leftValue = left?.[field];
    const rightValue = right?.[field];

    const leftTime = Date.parse(leftValue);
    const rightTime = Date.parse(rightValue);
    if (Number.isFinite(leftTime) && Number.isFinite(rightTime)) {
      return descending ? rightTime - leftTime : leftTime - rightTime;
    }

    const leftNumber = Number(leftValue);
    const rightNumber = Number(rightValue);
    if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
      return descending ? rightNumber - leftNumber : leftNumber - rightNumber;
    }

    const leftString = normalizeValue(leftValue);
    const rightString = normalizeValue(rightValue);
    return descending ? rightString.localeCompare(leftString) : leftString.localeCompare(rightString);
  });
}

function upsertByPair(collection, record, leftKey, rightKey) {
  const next = [...collection];
  const leftValue = normalizeValue(record?.[leftKey]);
  const rightValue = normalizeValue(record?.[rightKey]);

  const idx = next.findIndex((item) => {
    const itemLeft = normalizeValue(item?.[leftKey]);
    const itemRight = normalizeValue(item?.[rightKey]);
    return itemLeft === leftValue && itemRight === rightValue;
  });

  if (idx >= 0) {
    next[idx] = record;
  } else {
    next.push(record);
  }
  return next;
}

function addScenarioTeamMemberForMatch(state, matchRecord) {
  const autoLockIds = new Set((state?.scenario?.team?.auto_lock_on_ruumr_plus_like || []).map(String));
  if (!autoLockIds.size || !matchRecord) return;

  const participants = [String(matchRecord.user1_id), String(matchRecord.user2_id)];
  if (!participants.includes(String(state.currentUser.id))) return;
  const targetId = participants.find((id) => id !== String(state.currentUser.id));
  if (!targetId || !autoLockIds.has(targetId)) return;

  const currentProfile = getSimulatorProfileByUserId(state, state.currentUser.id);
  const targetProfile = getSimulatorProfileByUserId(state, targetId);
  if (!currentProfile || !targetProfile) return;

  const alreadyMember = (currentProfile.team_members || []).some((member) => String(member.user_id) === String(targetId) && !member.pending);
  if (alreadyMember) return;

  currentProfile.team_target = state.scenario?.team?.target_count || currentProfile.team_target || 3;
  currentProfile.team_members = [
    ...(currentProfile.team_members || []),
    {
      match_id: matchRecord.id,
      user_id: targetProfile.user_id,
      name: targetProfile.name,
      photo: targetProfile.photos?.[0] || null,
      simulator_scenario: true,
      auto_locked_from_ruumr_plus: true,
    },
  ];
  currentProfile.updated_date = nowIso();
  if (state.currentProfile && String(state.currentProfile.user_id) === String(currentProfile.user_id)) {
    state.currentProfile = { ...state.currentProfile, ...clone(currentProfile) };
  }
  if (1 + (currentProfile.team_members || []).filter((member) => !member.pending).length >= Number(currentProfile.team_target || 3)) {
    setDemoStage(DEMO_STAGES.APARTMENT_SEARCH);
  }
}

function createCollectionApi(state, collectionName) {
  const getCollection = () => {
    if (!state.collections[collectionName]) {
      state.collections[collectionName] = [];
    }
    return state.collections[collectionName];
  };

  const cloneRecords = (records) => records.map((record) => clone(record));

  const list = async (orderBy = null, limit = null) => {
    let records = sortRecords(getCollection(), orderBy);
    const hasLimit = limit !== null && limit !== undefined && limit !== "";
    const limitNumber = Number(limit);
    if (hasLimit && Number.isFinite(limitNumber) && limitNumber >= 0) {
      records = records.slice(0, limitNumber);
    }
    return cloneRecords(records);
  };

  const filter = async (query = {}, orderBy = null, limit = null) => {
    let records = getCollection().filter((record) => matchesQuery(record, query));
    records = sortRecords(records, orderBy);
    const hasLimit = limit !== null && limit !== undefined && limit !== "";
    const limitNumber = Number(limit);
    if (hasLimit && Number.isFinite(limitNumber) && limitNumber >= 0) {
      records = records.slice(0, limitNumber);
    }
    return cloneRecords(records);
  };

  const create = async (data = {}) => {
    const record = {
      id: data.id || stableId(collectionName, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
      created_date: data.created_date || nowIso(),
      updated_date: data.updated_date || data.created_date || nowIso(),
      ...clone(data),
    };

    if (collectionName === "Profile" && record.user_id) {
      const collection = getCollection();
      const existingIndex = collection.findIndex((item) => String(item.user_id) === String(record.user_id));
      if (existingIndex >= 0) {
        collection[existingIndex] = record;
      } else {
        collection.push(record);
      }
      persistSimulatorState(state);
      return clone(record);
    }

    if (collectionName === "Swipe") {
      state.collections.Match = state.collections.Match || [];
      const existingMatch = state.collections.Swipe.find(
        (item) =>
          String(item.swiper_id) === String(record.swiper_id) &&
          String(item.swiped_id) === String(record.swiped_id)
      );
      if (existingMatch) {
        const idx = state.collections.Swipe.findIndex((item) => String(item.id) === String(existingMatch.id));
        state.collections.Swipe[idx] = record;
      } else {
        state.collections.Swipe.push(record);
      }

      if (String(record.action) === "like") {
        const reverseLike = state.collections.Swipe.find(
          (item) =>
            String(item.swiper_id) === String(record.swiped_id) &&
            String(item.swiped_id) === String(record.swiper_id) &&
            String(item.action) === "like"
        );

        if (reverseLike) {
          const users = state.users;
          const leftUser = users.find((user) => String(user.id) === String(record.swiper_id));
          const rightUser = users.find((user) => String(user.id) === String(record.swiped_id));
          const matchRecord = {
            id: pairStableId("match", record.swiper_id, record.swiped_id),
            user1_id: record.swiper_id,
            user2_id: record.swiped_id,
            user1_name: leftUser?.full_name || leftUser?.name || record.swiper_id,
            user2_name: rightUser?.full_name || rightUser?.name || record.swiped_id,
            status: "active",
            match_type: "mutual",
            created_date: nowIso(),
            updated_date: nowIso(),
          };
          const existingMatch = (state.collections.Match || []).find((item) => {
            const sameDirection =
              String(item.user1_id) === String(record.swiper_id) &&
              String(item.user2_id) === String(record.swiped_id);
            const reverseDirection =
              String(item.user1_id) === String(record.swiped_id) &&
              String(item.user2_id) === String(record.swiper_id);
            return sameDirection || reverseDirection;
          });
          if (existingMatch) {
            const idx = state.collections.Match.findIndex((item) => String(item.id) === String(existingMatch.id));
            state.collections.Match[idx] = {
              ...existingMatch,
              match_type: "mutual",
              updated_date: nowIso(),
            };
          } else {
            state.collections.Match = upsertByPair(state.collections.Match || [], matchRecord, "user1_id", "user2_id");
          }
        }
      }

      persistSimulatorState(state);
      return clone(record);
    }

    if (collectionName === "Match") {
      state.collections.Match = upsertByPair(getCollection(), record, "user1_id", "user2_id");
      addScenarioTeamMemberForMatch(state, record);
      persistSimulatorState(state);
      return clone(record);
    }

    if (collectionName === "CharterAnswer") {
      const next = getCollection();
      const idx = next.findIndex(
        (item) =>
          String(item.match_id) === String(record.match_id) &&
          String(item.user_id) === String(record.user_id) &&
          String(item.question_id) === String(record.question_id)
      );
      if (idx >= 0) {
        next[idx] = record;
      } else {
        next.push(record);
      }
      persistSimulatorState(state);
      return clone(record);
    }

    if (collectionName === "Message" || collectionName === "GroupMessage" || collectionName === "Review" || collectionName === "PageView" || collectionName === "TypingStatus") {
      getCollection().push(record);
      persistSimulatorState(state);
      return clone(record);
    }

    getCollection().push(record);
    persistSimulatorState(state);
    return clone(record);
  };

  const update = async (id, patch = {}) => {
    const next = getCollection();
    const idx = next.findIndex((item) => String(item.id) === String(id));
    if (idx === -1) {
      throw new Error(`${collectionName} record not found: ${id}`);
    }
    next[idx] = {
      ...next[idx],
      ...clone(patch),
      updated_date: nowIso(),
    };
    persistSimulatorState(state);
    return clone(next[idx]);
  };

  const remove = async (id) => {
    const next = getCollection();
    const idx = next.findIndex((item) => String(item.id) === String(id));
    if (idx >= 0) {
      next.splice(idx, 1);
    }
    persistSimulatorState(state);
    return true;
  };

  const subscribe = () => () => {};

  return { list, filter, create, update, delete: remove, subscribe };
}

function createAuthApi(state) {
  const cloneUser = () => clone(state.currentUser);

  return {
    me: async () => cloneUser(),
    list: async () => clone(state.users),
    updateMe: async (patch = {}) => {
      state.currentUser = {
        ...state.currentUser,
        ...clone(patch),
        updated_date: nowIso(),
      };
      const idx = state.users.findIndex((user) => String(user.id) === String(state.currentUser.id));
      if (idx >= 0) {
        state.users[idx] = clone(state.currentUser);
      }
      persistSimulatorState(state);
      return cloneUser();
    },
    logout: async () => {
      return true;
    },
    redirectToLogin: () => {},
  };
}

function getSimulatorProfileByUserId(state, userId) {
  return (state.collections.Profile || []).find((profile) => String(profile.user_id) === String(userId)) || null;
}

function simulatorTeamMemberIds(state) {
  const currentProfile = getSimulatorProfileByUserId(state, state.currentUser.id) || state.currentProfile;
  const ids = [String(state.currentUser.id)];
  for (const member of currentProfile?.team_members || []) {
    if (member?.pending || !member?.user_id) continue;
    ids.push(String(member.user_id));
  }
  return [...new Set(ids)];
}

function simulatorCityState(profiles) {
  const cityLists = profiles.map((profile) =>
    (profile?.search_cities || []).map(normalizeCityName).filter(Boolean)
  );

  const sharedCounts = new Map();
  const labels = new Map();
  for (const cities of cityLists) {
    const seen = new Set();
    for (const city of cities) {
      const key = cityIdentity(city);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      labels.set(key, labels.get(key) || city);
      sharedCounts.set(key, (sharedCounts.get(key) || 0) + 1);
    }
  }

  if (!cityLists.length || cityLists.some((cities) => cities.length === 0)) {
    return {
      commonCities: [],
      suggestedCities: [...sharedCounts.entries()]
        .filter(([, count]) => count > 1)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([key, count]) => ({ city: labels.get(key), count })),
    };
  }

  const [firstCities, ...rest] = cityLists;
  const restSets = rest.map((cities) => new Set(cities.map(cityIdentity)));
  const commonCities = firstCities.filter((city, index) => {
    const key = cityIdentity(city);
    return firstCities.findIndex((candidate) => cityIdentity(candidate) === key) === index
      && restSets.every((set) => set.has(key));
  });

  return {
    commonCities,
    suggestedCities: commonCities.length
      ? []
      : [...sharedCounts.entries()]
        .filter(([, count]) => count > 1)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([key, count]) => ({ city: labels.get(key), count })),
  };
}

function buildStage2TeamLocations(state, memberIds, selectedCity) {
  const market = cityMarketFor(selectedCity);
  return memberIds.map((memberId, index) => {
    const profile = getSimulatorProfileByUserId(state, memberId);
    const location = market.teammateLocations[index % market.teammateLocations.length];
    return {
      user_id: String(memberId),
      name: profile?.name || profile?.full_name || "Teammate",
      photo: profile?.photos?.[0] || null,
      type: location.type,
      label_he: location.label_he,
      label_en: location.label_en,
      latitude: location.lat,
      longitude: location.lng,
    };
  });
}

function ensureStage2DemoTeam(state) {
  if (!isDemoHousingStage()) return;
  const currentProfile = getSimulatorProfileByUserId(state, state.currentUser.id) || state.currentProfile;
  if (!currentProfile) return;

  const desiredCount = Math.max(Number(currentProfile.team_target || 3), 3);
  const currentMemberIds = new Set(
    (currentProfile.team_members || [])
      .filter((member) => !member.pending && member.user_id)
      .map((member) => String(member.user_id))
  );
  const fillerIds = [
    "demo-user-maya",
    "demo-user-eitan",
    "demo-user-tamar",
    "demo-user-lihi",
    "demo-user-ori",
    "demo-user-yuval",
  ];

  const nextMembers = [...(currentProfile.team_members || [])];
  for (const fillerId of fillerIds) {
    if (1 + currentMemberIds.size >= desiredCount) break;
    if (String(fillerId) === String(state.currentUser.id) || currentMemberIds.has(fillerId)) continue;
    const profile = getSimulatorProfileByUserId(state, fillerId);
    if (!profile) continue;
    const matchId = pairStableId("match", state.currentUser.id, fillerId);
    currentMemberIds.add(fillerId);
    nextMembers.push({
      match_id: matchId,
      user_id: fillerId,
      name: profile.name,
      photo: profile.photos?.[0] || null,
      simulator_filled: true,
    });

    state.collections.Match = state.collections.Match || [];
    if (!state.collections.Match.some((match) => String(match.id) === String(matchId))) {
      state.collections.Match.push({
        id: matchId,
        user1_id: state.currentUser.id,
        user2_id: fillerId,
        user1_name: state.currentUser.full_name || state.currentUser.name,
        user2_name: profile.name,
        status: "active",
        match_type: "mutual",
        created_date: DEMO_STAGE2_CREATED_AT,
        updated_date: DEMO_STAGE2_CREATED_AT,
        simulator_filled: true,
      });
    }
  }

  const patch = {
    team_target: desiredCount,
    team_members: nextMembers,
    is_apartment_flow_demo_user: true,
    updated_date: nowIso(),
  };
  Object.assign(currentProfile, patch);
  if (state.currentProfile && String(state.currentProfile.user_id) === String(currentProfile.user_id)) {
    Object.assign(state.currentProfile, patch);
  }
  const profileIdx = (state.collections.Profile || []).findIndex((profile) => String(profile.user_id) === String(currentProfile.user_id));
  if (profileIdx >= 0) {
    state.collections.Profile[profileIdx] = {
      ...state.collections.Profile[profileIdx],
      ...patch,
    };
  }
}

function ensureApartmentChatSeeds(state, discovery) {
  if (!isDemoHousingStage() || !discovery?.team_key) return;
  state.collections.GroupMessage = state.collections.GroupMessage || [];
  const apartments = discovery.suggested_apartments || [];
  const memberIds = discovery.member_user_ids || [];
  const profiles = memberIds.map((id) => getSimulatorProfileByUserId(state, id)).filter(Boolean);

  apartments.forEach((apartment, index) => {
    const groupId = apartmentChatGroupId(discovery.team_key, apartment.id);
    if (state.collections.GroupMessage.some((message) => message.group_id === groupId)) return;
    const [first, second, third] = profiles;
    const messages = [
      {
        sender: second || first,
        content: `מה אתם חושבים על דירה ${index + 1}? המיקום נראה לי ממש נוח.`,
        content_en: `What do you think about Apartment ${index + 1}? The location looks really convenient to me.`,
      },
      {
        sender: first || second,
        content: apartment.commute_note_he || "הנסיעה נראית סבירה לכולם.",
        content_en: apartment.commute_note_en || "The commute looks reasonable for everyone.",
      },
      {
        sender: third || first || second,
        content: "אם כולם זורמים, אפשר לקבוע ביקור ולראות איך זה מרגיש במציאות.",
        content_en: "If everyone is into it, we can schedule a viewing and see how it feels in person.",
      },
    ].filter((message) => message.sender);

    messages.forEach((message, messageIndex) => {
      const created = `2026-06-29T09:${String(10 + index * 6 + messageIndex * 2).padStart(2, "0")}:00.000Z`;
      state.collections.GroupMessage.push({
        id: stableId("apartment-message", `${groupId}-${messageIndex + 1}`),
        group_id: groupId,
        sender_id: message.sender.user_id,
        sender_name: message.sender.name,
        sender_photo: message.sender.photos?.[0] || null,
        content: message.content,
        content_en: message.content_en,
        apartment_id: apartment.id,
        created_date: created,
        updated_date: created,
        simulator_seeded: true,
      });
    });
  });
}

function ensureStage2GroupChatSeeds(state, discovery) {
  if (!isDemoHousingStage() || !discovery?.team_key) return;
  state.collections.GroupMessage = state.collections.GroupMessage || [];

  const groupId = stage2TeamChatGroupId(discovery.member_user_ids || []);
  if (!groupId || state.collections.GroupMessage.some((message) => message.id === stableId("group-message", `${groupId}-stage2-coffee-1`))) {
    return;
  }

  const profilesById = new Map(
    (discovery.member_user_ids || [])
      .map((id) => getSimulatorProfileByUserId(state, id))
      .filter(Boolean)
      .map((profile) => [String(profile.user_id), profile])
  );
  const currentProfile = profilesById.get(String(state.currentUser.id));
  const maya = profilesById.get("demo-user-maya") || [...profilesById.values()].find((profile) => profile !== currentProfile);
  const eitan = profilesById.get("demo-user-eitan") || [...profilesById.values()].find((profile) => profile !== currentProfile && profile !== maya);
  const apartments = discovery.suggested_apartments || [];
  const viewingApartment =
    apartments.find((apartment) => String(apartment.id) === String(state?.scenario?.apartment_search?.selected_apartment_id))
    || apartments[0]
    || null;
  const apartmentNameHe = viewingApartment?.neighborhood_he || viewingApartment?.neighborhood || "דיזנגוף";
  const apartmentNameEn = viewingApartment?.neighborhood_en || viewingApartment?.neighborhood || "Dizengoff";
  const coffeeShopHe = apartmentNameHe === "הצפון הישן" ? "קפה נחת בדיזנגוף" : `בית קפה ליד ${apartmentNameHe}`;
  const coffeeShopEn = apartmentNameEn === "Old North" ? "Cafe Nahat on Dizengoff" : `a coffee shop near ${apartmentNameEn}`;
  const createdTimes = [
    "2026-06-30T14:04:00.000Z",
    "2026-06-30T14:07:00.000Z",
    "2026-06-30T14:10:00.000Z",
    "2026-06-30T14:13:00.000Z",
  ];
  const messages = [
    {
      sender: maya || currentProfile,
      content: `קבעתי לנו לראות את הדירה ב${apartmentNameHe} מחר ב-18:00. ניפגש לפני זה ב${coffeeShopHe}?`,
      content_en: `I scheduled us to check out the ${apartmentNameEn} apartment tomorrow at 18:00. Want to meet first at ${coffeeShopEn}?`,
    },
    {
      sender: eitan || currentProfile || maya,
      content: "מעולה, מתאים לי לשבת שם חצי שעה לפני ולסגור יחד מה חשוב לנו לבדוק בדירה.",
      content_en: "Perfect. I’m good with sitting there half an hour before and agreeing what we want to check in the apartment.",
    },
    {
      sender: currentProfile || maya || eitan,
      content: "כן, וגם נעבור על שלוש האופציות בדירוג לפני שנחליט סופית.",
      content_en: "Yes, and let’s go over the three apartment options in the ranking before we decide.",
    },
    {
      sender: maya || eitan || currentProfile,
      content: "סגור. אני אביא לפטופ, נשב על קפה ונשווה מחיר, רעש ותחבורה.",
      content_en: "Done. I’ll bring my laptop, we’ll sit over coffee and compare price, noise, and transit.",
    },
  ].filter((message) => message.sender);

  messages.forEach((message, index) => {
    const created = createdTimes[index] || `2026-06-30T14:${String(4 + index * 3).padStart(2, "0")}:00.000Z`;
    state.collections.GroupMessage.push({
      id: stableId("group-message", `${groupId}-stage2-coffee-${index + 1}`),
      group_id: groupId,
      sender_id: message.sender.user_id,
      sender_name: message.sender.name,
      sender_photo: message.sender.photos?.[0] || null,
      content: message.content,
      content_en: message.content_en,
      apartment_id: viewingApartment?.id || "",
      created_date: created,
      updated_date: created,
      simulator_seeded: true,
      simulator_stage2_group_chat: true,
    });
  });
}

function createSimulatorFunctionsApi(state, existingFunctions = {}) {
  const ensureApartmentDiscovery = async () => {
    ensureStage2DemoTeam(state);
    const memberIds = simulatorTeamMemberIds(state);
    const currentProfile = getSimulatorProfileByUserId(state, state.currentUser.id) || state.currentProfile;
    const targetCount = isDemoHousingStage()
      ? Math.max(Number(currentProfile?.team_target || 3), 3)
      : Number(currentProfile?.team_target || 3);

    if (memberIds.length < 2 || memberIds.length < targetCount) {
      return { success: true, discovery: null, status: "not_established", member_count: memberIds.length, target_count: targetCount };
    }

    const key = apartmentTeamKey(memberIds);
    state.collections.TeamApartmentDiscovery = state.collections.TeamApartmentDiscovery || [];
    const existing = state.collections.TeamApartmentDiscovery.find((item) => item.team_key === key);
    if (existing) {
      const stage2City = stage2DemoCityName();
      if (isDemoHousingStage() && stage2City && existing.selected_city !== stage2City) {
        Object.assign(existing, {
          selected_city: stage2City,
          common_cities: [stage2City],
          suggested_apartments: apartmentDiscoverySuggestionsForState(state, { city: stage2City, bedrooms: existing.bedrooms || memberIds.length, teamKey: key, batchIndex: 0 }),
          suggestion_batch_index: 0,
          preferences: {},
          rankings: {},
          rankings_finalized: false,
          eligible_apartments: [],
          rejected_by_veto: [],
          happiness_scores: [],
          ranking_scores: [],
          current_apartment: null,
          selected_apartment: null,
          winning_apartment_id: "",
          winning_apartment: null,
          rejected_apartments: [],
          no_eligible_apartment: false,
          no_more_suggestions: false,
          lifecycle_state: APARTMENT_LIFECYCLE.APARTMENT_RANKING,
          status: "apartment_ranking",
          updated_date: nowIso(),
        });
      }
      if (isDemoApartmentServicesStage()) {
        const selectedCity = stage2City || existing.selected_city || DEMO_CITY_OPTIONS.tel_aviv.he;
        const suggestedApartments = existing.suggested_apartments?.length
          ? existing.suggested_apartments
          : apartmentDiscoverySuggestionsForState(state, { city: selectedCity, bedrooms: existing.bedrooms || memberIds.length, teamKey: key, batchIndex: 0 });
        const selectedApartment =
          existing.selected_apartment
          || existing.current_apartment
          || existing.winning_apartment
          || suggestedApartments[0]
          || null;
        Object.assign(existing, {
          selected_city: selectedCity,
          common_cities: [selectedCity],
          suggested_apartments: suggestedApartments,
          team_locations: existing.team_locations?.length ? existing.team_locations : buildStage2TeamLocations(state, memberIds, selectedCity),
          lifecycle_state: selectedApartment ? APARTMENT_LIFECYCLE.APARTMENT_FOUND : APARTMENT_LIFECYCLE.APARTMENT_RANKING,
          status: selectedApartment ? "apartment_found" : "apartment_ranking",
          selected_apartment_id: selectedApartment?.id || "",
          selected_apartment: selectedApartment,
          current_apartment: selectedApartment,
          winning_apartment_id: selectedApartment?.id || "",
          winning_apartment: selectedApartment,
          updated_date: nowIso(),
        });
      }
      const normalized = {
        ...existing,
        lifecycle_state: existing.lifecycle_state || (existing.status === "finalized" ? APARTMENT_LIFECYCLE.APARTMENT_VIEWING : APARTMENT_LIFECYCLE.APARTMENT_RANKING),
        preferences: existing.preferences || existing.rankings || {},
        current_apartment: existing.current_apartment || existing.winning_apartment || null,
        eligible_apartments: existing.eligible_apartments || existing.ranking_scores || [],
        happiness_scores: existing.happiness_scores || existing.ranking_scores || [],
        rejected_by_veto: existing.rejected_by_veto || [],
        rejected_apartments: existing.rejected_apartments || [],
        suggestion_batch_index: Number(existing.suggestion_batch_index || 0),
        current_apartment_index: Number(existing.current_apartment_index || 0),
        team_locations: existing.team_locations?.length ? existing.team_locations : buildStage2TeamLocations(state, memberIds, existing.selected_city),
      };
      Object.assign(existing, normalized);
      ensureApartmentChatSeeds(state, existing);
      ensureStage2GroupChatSeeds(state, existing);
      persistSimulatorState(state);
      return { success: true, discovery: clone(existing), status: existing.status || "apartment_ranking" };
    }

    const profiles = memberIds.map((id) => getSimulatorProfileByUserId(state, id)).filter(Boolean);
    const { commonCities, suggestedCities } = simulatorCityState(profiles);
    const selectedCity = stage2DemoCityName() || commonCities[0] || (isDemoHousingStage() ? DEMO_CITY_OPTIONS.tel_aviv.he : "");
    const bedrooms = memberIds.length;
    const suggestedApartments = selectedCity ? apartmentDiscoverySuggestionsForState(state, { city: selectedCity, bedrooms, teamKey: key, batchIndex: 0 }) : [];
    const stage3SelectedApartment = isDemoApartmentServicesStage() ? suggestedApartments[0] || null : null;
    const discovery = {
      id: stableId("team-apartment-discovery", key),
      team_key: key,
      member_user_ids: memberIds,
      member_count: memberIds.length,
      entered_discovery: true,
      common_cities: commonCities,
      suggested_cities: suggestedCities,
      selected_city: selectedCity,
      bedrooms,
      suggested_apartments: suggestedApartments,
      team_locations: selectedCity ? buildStage2TeamLocations(state, memberIds, selectedCity) : [],
      lifecycle_state: stage3SelectedApartment
        ? APARTMENT_LIFECYCLE.APARTMENT_FOUND
        : selectedCity
          ? APARTMENT_LIFECYCLE.APARTMENT_RANKING
          : APARTMENT_LIFECYCLE.TEAM_BUILDING,
      suggestion_batch_index: 0,
      current_apartment_index: 0,
      exhausted_suggestions: false,
      preferences: {},
      eligible_apartments: [],
      rejected_by_veto: [],
      happiness_scores: [],
      current_apartment: stage3SelectedApartment,
      selected_apartment: stage3SelectedApartment,
      selected_apartment_id: stage3SelectedApartment?.id || "",
      winning_apartment_id: stage3SelectedApartment?.id || "",
      winning_apartment: stage3SelectedApartment,
      rejected_apartments: [],
      no_eligible_apartment: false,
      no_more_suggestions: false,
      rankings: {},
      rankings_finalized: false,
      ranking_scores: [],
      status: stage3SelectedApartment ? "apartment_found" : selectedCity ? "apartment_ranking" : "needs_city",
      created_date: nowIso(),
      updated_date: nowIso(),
    };
    state.collections.TeamApartmentDiscovery.push(discovery);
    ensureApartmentChatSeeds(state, discovery);
    ensureStage2GroupChatSeeds(state, discovery);
    persistSimulatorState(state);
    return { success: true, discovery: clone(discovery), status: discovery.status };
  };

  const submitApartmentPreferences = async ({ discovery_id: discoveryId, preferences, rankings }) => {
    state.collections.TeamApartmentDiscovery = state.collections.TeamApartmentDiscovery || [];
    const idx = state.collections.TeamApartmentDiscovery.findIndex((item) => String(item.id) === String(discoveryId));
    if (idx === -1) throw new Error("Discovery not found");
    const discovery = state.collections.TeamApartmentDiscovery[idx];
    if (!(discovery.member_user_ids || []).includes(String(state.currentUser.id))) {
      throw new Error("Not authorized for this team apartment discovery");
    }
    if ((discovery.lifecycle_state || APARTMENT_LIFECYCLE.APARTMENT_RANKING) !== APARTMENT_LIFECYCLE.APARTMENT_RANKING) {
      throw new Error("Preferences can only be changed during apartment ranking.");
    }

    const submittedPreferences = preferences || rankings || {};
    const apartmentIds = (discovery.suggested_apartments || []).map((apartment) => apartment.id);
    const values = Object.values(submittedPreferences || {});
    if (
      apartmentIds.length !== 3
      || Object.keys(submittedPreferences || {}).length !== 3
      || !apartmentIds.every((apartmentId) => Object.prototype.hasOwnProperty.call(submittedPreferences, apartmentId))
      || !values.every((value) => ["amazing", "ok", "no_way"].includes(value))
    ) {
      throw new Error("Rate all 3 apartments.");
    }

    const nextPreferences = {
      ...(discovery.preferences || discovery.rankings || {}),
      [String(state.currentUser.id)]: {
        user_id: String(state.currentUser.id),
        preferences: clone(submittedPreferences),
        submitted_at: nowIso(),
      },
    };

    const scenarioGeneratedPreferences = scenarioTeammatePreferences(state, discovery);
    if (scenarioGeneratedPreferences) {
      Object.entries(scenarioGeneratedPreferences).forEach(([memberId, record]) => {
        if (!nextPreferences[memberId]) {
          nextPreferences[memberId] = record;
        }
      });
    }
    // Auto-rank any team member the scenario didn't cover (e.g. a team built
    // from arbitrary Plus picks), so submission never stalls waiting on them.
    if (simulatorAutoRankTeamEnabled()) {
      const apartmentIds = (discovery.suggested_apartments || []).map((apartment) => apartment.id);
      const preferenceOrders = [
        ["amazing", "ok", "ok"],
        ["ok", "amazing", "ok"],
        ["amazing", "amazing", "ok"],
      ];
      (discovery.member_user_ids || []).forEach((memberId, memberIndex) => {
        const key = String(memberId);
        if (nextPreferences[key]) return;
        const order = preferenceOrders[memberIndex % preferenceOrders.length];
        nextPreferences[key] = {
          user_id: key,
          preferences: Object.fromEntries(apartmentIds.map((apartmentId, index) => [apartmentId, order[index]])),
          submitted_at: nowIso(),
          simulator_generated: true,
        };
      });
    }

    const allSubmitted = (discovery.member_user_ids || []).every((id) => nextPreferences[String(id)]);
    const outcome = allSubmitted ? calculateApartmentPreferenceOutcome(discovery.suggested_apartments || [], nextPreferences) : null;
    state.collections.TeamApartmentDiscovery[idx] = {
      ...discovery,
      preferences: nextPreferences,
      rankings: nextPreferences,
      no_eligible_apartment: false,
      no_more_suggestions: false,
      ...(outcome
        ? outcome.no_eligible_apartment
          ? {
            rankings_finalized: false,
            lifecycle_state: APARTMENT_LIFECYCLE.APARTMENT_RANKING,
            status: "no_eligible_apartment",
            eligible_apartments: [],
            rejected_by_veto: outcome.rejected_by_veto,
            happiness_scores: outcome.happiness_scores,
            ranking_scores: outcome.happiness_scores,
            current_apartment: null,
            winning_apartment_id: "",
            winning_apartment: null,
            no_eligible_apartment: true,
          }
          : {
            rankings_finalized: true,
            lifecycle_state: APARTMENT_LIFECYCLE.APARTMENT_VIEWING,
            status: "apartment_viewing",
            current_apartment_index: 0,
            eligible_apartments: outcome.eligible_apartments,
            rejected_by_veto: outcome.rejected_by_veto,
            happiness_scores: outcome.happiness_scores,
            ranking_scores: outcome.happiness_scores,
            current_apartment: outcome.current_apartment,
            winning_apartment_id: outcome.current_apartment?.id || "",
            winning_apartment: outcome.current_apartment || null,
        }
        : {}),
      updated_date: nowIso(),
    };
    persistSimulatorState(state);
    return { success: true, discovery: clone(state.collections.TeamApartmentDiscovery[idx]) };
  };

  const changeApartmentPreferences = async ({ discovery_id: discoveryId }) => {
    state.collections.TeamApartmentDiscovery = state.collections.TeamApartmentDiscovery || [];
    const idx = state.collections.TeamApartmentDiscovery.findIndex((item) => String(item.id) === String(discoveryId));
    if (idx === -1) throw new Error("Discovery not found");
    const discovery = state.collections.TeamApartmentDiscovery[idx];
    const nextPreferences = { ...(discovery.preferences || discovery.rankings || {}) };
    delete nextPreferences[String(state.currentUser.id)];
    state.collections.TeamApartmentDiscovery[idx] = {
      ...discovery,
      lifecycle_state: APARTMENT_LIFECYCLE.APARTMENT_RANKING,
      status: "apartment_ranking",
      preferences: nextPreferences,
      rankings: nextPreferences,
      rankings_finalized: false,
      no_eligible_apartment: false,
      no_more_suggestions: false,
      eligible_apartments: [],
      rejected_by_veto: [],
      happiness_scores: [],
      ranking_scores: [],
      current_apartment: null,
      winning_apartment_id: "",
      winning_apartment: null,
      updated_date: nowIso(),
    };
    persistSimulatorState(state);
    return { success: true, discovery: clone(state.collections.TeamApartmentDiscovery[idx]) };
  };

  const requestMoreApartmentSuggestions = async ({ discovery_id: discoveryId }) => {
    state.collections.TeamApartmentDiscovery = state.collections.TeamApartmentDiscovery || [];
    const idx = state.collections.TeamApartmentDiscovery.findIndex((item) => String(item.id) === String(discoveryId));
    if (idx === -1) throw new Error("Discovery not found");
    const discovery = state.collections.TeamApartmentDiscovery[idx];
    const nextBatchIndex = Number(discovery.suggestion_batch_index || 0) + 1;
    const suggestions = apartmentDiscoverySuggestionsForState(state, {
      city: discovery.selected_city,
      bedrooms: discovery.bedrooms,
      teamKey: discovery.team_key,
      batchIndex: nextBatchIndex,
    });

    if (!suggestions.length) {
      state.collections.TeamApartmentDiscovery[idx] = {
        ...discovery,
        lifecycle_state: APARTMENT_LIFECYCLE.APARTMENT_RANKING,
        status: "no_more_suggestions",
        no_more_suggestions: true,
        exhausted_suggestions: true,
        no_eligible_apartment: false,
        updated_date: nowIso(),
      };
      persistSimulatorState(state);
      return { success: true, discovery: clone(state.collections.TeamApartmentDiscovery[idx]), status: "no_more_suggestions", no_more_suggestions: true };
    }

    state.collections.TeamApartmentDiscovery[idx] = {
      ...discovery,
      lifecycle_state: APARTMENT_LIFECYCLE.APARTMENT_RANKING,
      status: "apartment_ranking",
      suggestion_batch_index: nextBatchIndex,
      current_apartment_index: 0,
      suggested_apartments: suggestions,
      preferences: {},
      rankings: {},
      rankings_finalized: false,
      ranking_scores: [],
      eligible_apartments: [],
      rejected_by_veto: [],
      happiness_scores: [],
      current_apartment: null,
      winning_apartment_id: "",
      winning_apartment: null,
      no_eligible_apartment: false,
      no_more_suggestions: false,
      exhausted_suggestions: false,
      updated_date: nowIso(),
    };
    ensureApartmentChatSeeds(state, state.collections.TeamApartmentDiscovery[idx]);
    persistSimulatorState(state);
    return { success: true, discovery: clone(state.collections.TeamApartmentDiscovery[idx]), status: "apartment_ranking" };
  };

  const scheduleApartmentVisit = async ({ discovery_id: discoveryId, visit_time: visitTime }) => {
    state.collections.TeamApartmentDiscovery = state.collections.TeamApartmentDiscovery || [];
    const idx = state.collections.TeamApartmentDiscovery.findIndex((item) => String(item.id) === String(discoveryId));
    if (idx === -1) throw new Error("Discovery not found");
    const discovery = state.collections.TeamApartmentDiscovery[idx];
    if (!(discovery.member_user_ids || []).includes(String(state.currentUser.id))) {
      throw new Error("Not authorized for this team apartment discovery");
    }
    const visit = new Date(visitTime || "");
    if (!Number.isFinite(visit.getTime())) throw new Error("A valid visit time is required");
    state.collections.TeamApartmentDiscovery[idx] = {
      ...discovery,
      visit_time: visit.toISOString(),
      visit_scheduled_by_user_id: String(state.currentUser.id),
      visit_scheduled_at: nowIso(),
      updated_date: nowIso(),
    };
    persistSimulatorState(state);
    return { success: true, discovery: clone(state.collections.TeamApartmentDiscovery[idx]) };
  };

  const rejectCurrentApartment = async ({ discovery_id: discoveryId, reason = "other" }) => {
    state.collections.TeamApartmentDiscovery = state.collections.TeamApartmentDiscovery || [];
    const idx = state.collections.TeamApartmentDiscovery.findIndex((item) => String(item.id) === String(discoveryId));
    if (idx === -1) throw new Error("Discovery not found");
    const discovery = state.collections.TeamApartmentDiscovery[idx];
    const currentApartment = discovery.current_apartment || discovery.winning_apartment;
    if ((discovery.lifecycle_state || APARTMENT_LIFECYCLE.APARTMENT_VIEWING) !== APARTMENT_LIFECYCLE.APARTMENT_VIEWING || !currentApartment) {
      throw new Error("No current apartment is available to reject.");
    }
    const currentIndex = Number(discovery.current_apartment_index || 0);
    const nextIndex = currentIndex + 1;
    const nextScore = (discovery.eligible_apartments || [])[nextIndex];
    const nextApartment = (discovery.suggested_apartments || []).find((apartment) => apartment.id === nextScore?.apartment_id) || null;
    const rejectedApartments = [
      ...(discovery.rejected_apartments || []),
      {
        apartment_id: currentApartment.id,
        reason,
        rejected_by_user_id: String(state.currentUser.id),
        rejected_at: nowIso(),
      },
    ];

    state.collections.TeamApartmentDiscovery[idx] = nextApartment
      ? {
        ...discovery,
        current_apartment_index: nextIndex,
        current_apartment: nextApartment,
        winning_apartment_id: nextApartment.id,
        winning_apartment: nextApartment,
        rejected_apartments: rejectedApartments,
        visit_time: "",
        visit_scheduled_by_user_id: "",
        visit_scheduled_at: "",
        updated_date: nowIso(),
      }
      : {
        ...discovery,
        lifecycle_state: APARTMENT_LIFECYCLE.APARTMENT_RANKING,
        status: "apartment_ranking",
        preferences: {},
        rankings: {},
        rankings_finalized: false,
        current_apartment_index: 0,
        current_apartment: null,
        winning_apartment_id: "",
        winning_apartment: null,
        rejected_apartments: rejectedApartments,
        no_eligible_apartment: false,
        updated_date: nowIso(),
      };
    persistSimulatorState(state);
    return { success: true, discovery: clone(state.collections.TeamApartmentDiscovery[idx]) };
  };

  const chooseCurrentApartment = async ({ discovery_id: discoveryId }) => {
    state.collections.TeamApartmentDiscovery = state.collections.TeamApartmentDiscovery || [];
    const idx = state.collections.TeamApartmentDiscovery.findIndex((item) => String(item.id) === String(discoveryId));
    if (idx === -1) throw new Error("Discovery not found");
    const discovery = state.collections.TeamApartmentDiscovery[idx];
    const currentApartment = discovery.current_apartment || discovery.winning_apartment;
    if (!currentApartment) throw new Error("No current apartment is available to choose.");
    state.collections.TeamApartmentDiscovery[idx] = {
      ...discovery,
      lifecycle_state: APARTMENT_LIFECYCLE.APARTMENT_FOUND,
      status: "apartment_found",
      selected_apartment_id: currentApartment.id,
      selected_apartment: currentApartment,
      current_apartment: currentApartment,
      winning_apartment_id: currentApartment.id,
      winning_apartment: currentApartment,
      updated_date: nowIso(),
    };
    setDemoStage(DEMO_STAGES.APARTMENT_SERVICES);
    persistSimulatorState(state);
    return { success: true, discovery: clone(state.collections.TeamApartmentDiscovery[idx]), status: "apartment_found" };
  };

  return {
    ...existingFunctions,
    invoke: async (functionName, data = {}) => {
      if (functionName === "teamApartmentDiscovery") {
        if (data?.action === "submit_preferences" || data?.action === "submit_ranking") return submitApartmentPreferences(data);
        if (data?.action === "change_preferences") return changeApartmentPreferences(data);
        if (data?.action === "request_more_suggestions") return requestMoreApartmentSuggestions(data);
        if (data?.action === "schedule_visit") return scheduleApartmentVisit(data);
        if (data?.action === "reject_current_apartment") return rejectCurrentApartment(data);
        if (data?.action === "choose_current_apartment") return chooseCurrentApartment(data);
        return ensureApartmentDiscovery();
      }
      if (functionName === "reconcileMyTeam") {
        return { success: true, roster: simulatorTeamMemberIds(state), reconciled: true };
      }
      if (functionName === "removeTeamMember") {
        const targetId = String(data?.target_user_id || "");
        const currentProfile = getSimulatorProfileByUserId(state, state.currentUser.id);
        if (currentProfile) {
          currentProfile.team_members = (currentProfile.team_members || []).filter((member) => String(member.user_id) !== targetId);
          persistSimulatorState(state);
        }
        return { success: true };
      }
      if (functionName === "createTeamInvite") {
        // Manual add-to-team from an existing match: in the demo there is no
        // counterparty to approve, so add the matched teammate immediately.
        const targetId = String(data?.target_user_id || "");
        const currentProfile = getSimulatorProfileByUserId(state, state.currentUser.id);
        const targetProfile = targetId ? getSimulatorProfileByUserId(state, targetId) : null;
        // Email / no-target invites have no one to add yet — leave pending.
        if (!targetId || !currentProfile || !targetProfile) {
          return { success: true, status: "already_pending" };
        }
        const members = currentProfile.team_members || [];
        const activeMemberCount = (mem) => 1 + mem.filter((member) => !member.pending).length;
        const isComplete = (count) => count >= Number(currentProfile.team_target || 3);
        if (members.some((member) => String(member.user_id) === targetId && !member.pending)) {
          const count = activeMemberCount(members);
          return { success: true, status: "already_member", team_complete: isComplete(count), member_count: count };
        }
        const match = (state.collections.Match || []).find((item) => {
          const me = String(state.currentUser.id);
          const a = String(item.user1_id);
          const b = String(item.user2_id);
          return (a === me && b === targetId) || (b === me && a === targetId);
        });
        const matchId = match?.id || pairStableId("match", state.currentUser.id, targetId);
        currentProfile.team_members = [
          ...members,
          {
            match_id: matchId,
            user_id: targetId,
            name: targetProfile.name,
            photo: targetProfile.photos?.[0] || null,
            added_from_match: true,
          },
        ];
        currentProfile.team_target = state.scenario?.team?.target_count || currentProfile.team_target || 3;
        currentProfile.updated_date = nowIso();
        if (state.currentProfile && String(state.currentProfile.user_id) === String(currentProfile.user_id)) {
          state.currentProfile = { ...state.currentProfile, ...clone(currentProfile) };
        }
        persistSimulatorState(state);
        const activeCount = 1 + (currentProfile.team_members || []).filter((member) => !member.pending).length;
        const teamComplete = activeCount >= Number(currentProfile.team_target || 3);
        return { success: true, status: "added", team_complete: teamComplete, member_count: activeCount };
      }
      if (functionName === "respondToTeamInvite" || functionName === "claimTeamInvites") {
        return { success: true };
      }
      if (typeof existingFunctions?.invoke === "function") {
        return existingFunctions.invoke(functionName, data);
      }
      throw new Error(`Simulator function not implemented: ${functionName}`);
    },
  };
}

function createSimulatorEntitiesModule(state, existingEntities = {}) {
  const apiCache = new Map();

  const getApi = (collectionName) => {
    if (!apiCache.has(collectionName)) {
      apiCache.set(collectionName, createCollectionApi(state, collectionName));
    }
    return apiCache.get(collectionName);
  };

  return new Proxy(existingEntities || {}, {
    get(target, entityName, receiver) {
      if (
        typeof entityName !== "string" ||
        entityName === "then" ||
        entityName.startsWith("_")
      ) {
        return Reflect.get(target, entityName, receiver);
      }

      return getApi(entityName);
    },
  });
}

export function enableSimulatorBackend(base44) {
  if (!base44 || typeof base44 !== "object") {
    return false;
  }

  const shouldResetState = consumeSimulatorResetFlag();

  if (!shouldResetState && typeof window !== "undefined" && window.__ruumrSimulatorBackendEnabled && window.__ruumrSimulatorState) {
    return true;
  }

  const state = hydrateSimulatorState(createDemoState({ reset: shouldResetState }), shouldResetState ? null : readPersistedSimulatorState());
  const collections = state.collections;

  if (typeof window !== "undefined") {
    window.__ruumrSimulatorState = state;
    window.__ruumrSimulatorBackendEnabled = true;
  }

  // Keep the current profile in sync with the auth user.
  collections.Profile = collections.Profile.map((profile) =>
    String(profile.user_id) === String(state.currentUser.id)
      ? { ...profile, name: state.currentUser.full_name || profile.name }
      : profile
  );
  state.currentProfile = collections.Profile.find((profile) => String(profile.user_id) === String(state.currentUser.id)) || state.currentProfile;
  persistSimulatorState(state);

  const simulatorAuth = createAuthApi(state);
  if (base44.auth && typeof base44.auth === "object") {
    Object.assign(base44.auth, simulatorAuth);
  } else {
    base44.auth = simulatorAuth;
  }

  base44.entities = createSimulatorEntitiesModule(state, base44.entities);
  base44.functions = createSimulatorFunctionsApi(state, base44.functions);
  try {
    base44.analytics?.cleanup?.();
  } catch {
    // Simulator mode should never depend on remote analytics cleanup.
  }
  base44.analytics = {
    track: () => undefined,
    cleanup: () => undefined,
  };
  base44.appLogs = {
    logUserInApp: async () => true,
    fetchLogs: async () => [],
    getStats: async () => ({}),
  };

  return true;
}
