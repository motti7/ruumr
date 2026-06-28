import { createProfileDefaults } from "@/lib/profileDefaults";
import {
  buildSimulatorApartmentPhotos,
  buildSimulatorProfilePhotos,
} from "@/lib/simulatorMode";
import { normalizeInterestValues } from "@/lib/interests";
import { APARTMENT_LIFECYCLE, calculateApartmentPreferenceOutcome } from "@/lib/apartmentPreferences";

const DAY_MS = 24 * 60 * 60 * 1000;
const SIMULATOR_STATE_STORAGE_KEY = "ruumr_simulator_state";
const SIMULATOR_STATE_VERSION = 2;

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

const APARTMENT_DISCOVERY_NEIGHBORHOODS = [
  { en: "City Center", he: "מרכז העיר" },
  { en: "Old North", he: "הצפון הישן" },
  { en: "Heart of the City", he: "לב העיר" },
  { en: "Florentin", he: "פלורנטין" },
  { en: "Yehuda Maccabi", he: "יהודה המכבי" },
  { en: "Bavli", he: "בבלי" },
  { en: "Montefiore", he: "מונטיפיורי" },
  { en: "Kikar Rabin", he: "כיכר רבין" },
  { en: "Rothschild", he: "רוטשילד" },
];

const APARTMENT_DISCOVERY_BATCH_COUNT = 3;

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

function apartmentDiscoverySuggestions({ city, bedrooms, teamKey, batchIndex = 0 }) {
  if (!city || !bedrooms) return [];
  if (batchIndex >= APARTMENT_DISCOVERY_BATCH_COUNT) return [];
  const basePrice = 4300 + bedrooms * 1850 + stableNumber(`${teamKey}:${city}:${batchIndex}`, 650) + batchIndex * 260;
  return [0, 1, 2].map((index) => ({
    id: `sim-apartment-${teamKey}-${batchIndex + 1}-${index + 1}`,
    title: `${bedrooms} חדרי שינה ב${city}`,
    city,
    neighborhood: APARTMENT_DISCOVERY_NEIGHBORHOODS[batchIndex * 3 + index].he,
    neighborhood_en: APARTMENT_DISCOVERY_NEIGHBORHOODS[batchIndex * 3 + index].en,
    neighborhood_he: APARTMENT_DISCOVERY_NEIGHBORHOODS[batchIndex * 3 + index].he,
    address: `${APARTMENT_DISCOVERY_NEIGHBORHOODS[batchIndex * 3 + index].he}, ${city}`,
    address_en: `${APARTMENT_DISCOVERY_NEIGHBORHOODS[batchIndex * 3 + index].en}, ${city}`,
    address_he: `${APARTMENT_DISCOVERY_NEIGHBORHOODS[batchIndex * 3 + index].he}, ${city}`,
    price: basePrice + index * 420,
    bedrooms,
    image: APARTMENT_DISCOVERY_IMAGES[batchIndex * 3 + index],
    description: `דירת שותפים נעימה עם ${bedrooms} חדרי שינה, סלון נוח וגישה קלה לכל מה שצריך ביום יום.`,
    listing_url: `https://app.ruumrapp.com/GroupTracker?listing=sim-${batchIndex + 1}-${index + 1}`,
    source: "simulator",
    batch_index: batchIndex,
  }));
}

function simulatorAutoRankTeamEnabled() {
  if (import.meta.env.VITE_RUUMR_SIMULATOR_AUTO_RANK_TEAM === "true") {
    return true;
  }

  try {
    return typeof window !== "undefined" && new URLSearchParams(window.location.search).get("simulator_auto_rank_team") === "true";
  } catch {
    return false;
  }
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
    is_apartment_flow_demo_user: isApartmentFlowDemoUser,
  };
}

function createDemoState() {
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

  const groupId = [currentUser.id, matchMaya.id].sort().join("_");
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

function createSimulatorFunctionsApi(state, existingFunctions = {}) {
  const ensureApartmentDiscovery = async () => {
    const memberIds = simulatorTeamMemberIds(state);
    const currentProfile = getSimulatorProfileByUserId(state, state.currentUser.id) || state.currentProfile;
    const targetCount = Number(currentProfile?.team_target || 3);

    if (memberIds.length < 2 || memberIds.length < targetCount) {
      return { success: true, discovery: null, status: "not_established", member_count: memberIds.length, target_count: targetCount };
    }

    const key = apartmentTeamKey(memberIds);
    state.collections.TeamApartmentDiscovery = state.collections.TeamApartmentDiscovery || [];
    const existing = state.collections.TeamApartmentDiscovery.find((item) => item.team_key === key);
    if (existing) {
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
      };
      Object.assign(existing, normalized);
      return { success: true, discovery: clone(existing), status: existing.status || "apartment_ranking" };
    }

    const profiles = memberIds.map((id) => getSimulatorProfileByUserId(state, id)).filter(Boolean);
    const { commonCities, suggestedCities } = simulatorCityState(profiles);
    const selectedCity = commonCities[0] || "";
    const bedrooms = memberIds.length;
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
      suggested_apartments: selectedCity ? apartmentDiscoverySuggestions({ city: selectedCity, bedrooms, teamKey: key, batchIndex: 0 }) : [],
      lifecycle_state: selectedCity ? APARTMENT_LIFECYCLE.APARTMENT_RANKING : APARTMENT_LIFECYCLE.TEAM_BUILDING,
      suggestion_batch_index: 0,
      current_apartment_index: 0,
      exhausted_suggestions: false,
      preferences: {},
      eligible_apartments: [],
      rejected_by_veto: [],
      happiness_scores: [],
      current_apartment: null,
      selected_apartment: null,
      rejected_apartments: [],
      no_eligible_apartment: false,
      no_more_suggestions: false,
      rankings: {},
      rankings_finalized: false,
      ranking_scores: [],
      status: selectedCity ? "apartment_ranking" : "needs_city",
      created_date: nowIso(),
      updated_date: nowIso(),
    };
    state.collections.TeamApartmentDiscovery.push(discovery);
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
    const suggestions = apartmentDiscoverySuggestions({
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
        return { success: true, status: "already_pending" };
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

  const state = hydrateSimulatorState(createDemoState(), shouldResetState ? null : readPersistedSimulatorState());
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
