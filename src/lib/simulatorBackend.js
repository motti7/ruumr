import { createProfileDefaults } from "@/lib/profileDefaults";
import {
  buildSimulatorApartmentPhotos,
  buildSimulatorProfilePhotos,
} from "@/lib/simulatorMode";
import { normalizeInterestValues } from "@/lib/interests";

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
  };
}

function createDemoState() {
  const currentUser = {
    id: "demo-user-noam",
    full_name: "נועם כהן",
    name: "נועם כהן",
    email: "noam@demo.ruumr",
    role: "user",
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
    Review: [review],
    PageView: [],
    TypingStatus: [],
    BannedUser: [],
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
            created_date: nowIso(),
            updated_date: nowIso(),
          };
          state.collections.Match = upsertByPair(state.collections.Match || [], matchRecord, "user1_id", "user2_id");
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

  if (typeof window !== "undefined" && window.__ruumrSimulatorBackendEnabled && window.__ruumrSimulatorState) {
    return true;
  }

  const state = hydrateSimulatorState(createDemoState(), readPersistedSimulatorState());
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
