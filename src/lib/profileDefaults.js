import { HOUSEHOLD_PREFERENCE_DEFAULTS } from "./ruumrPlusFields";

const DEFAULT_PHOTOS = Array(6).fill(null);

export function createProfileDefaults(overrides = {}) {
  return {
    name: "",
    age: 25,
    gender: "male",
    about_me: "",
    social_link: "",
    looking_for_description: "",
    photos: [...DEFAULT_PHOTOS],
    location: "",
    search_cities: [],
    search_area: "מרכז",
    budget_min: 0,
    budget_max: 3500,
    vibe_level: 3,
    pet_type: "none",
    pet_other_description: "",
    looking_for_gender: "any",
    religion: "secular",
    kosher_preference: "flow",
    shabbat_preference: "flow",
    current_status: "",
    apartment_photos: [...DEFAULT_PHOTOS],
    existing_roommates: 0,
    apartment_total_budget: 5000,
    interests: [],
    itunes_track_id: "",
    song_preview_url: null,
    song_name: "",
    song_artist: "",
    song_image: "",
    video_url: null,
    location_lat: null,
    location_lng: null,
    location_radius_km: null,
    is_visible: true,
    is_verified: false,
    team_members: [],
    team_target: 3,
    ...HOUSEHOLD_PREFERENCE_DEFAULTS,
    ...overrides,
  };
}

export const PROFILE_DEFAULTS = createProfileDefaults();
