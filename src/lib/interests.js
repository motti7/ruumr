import {
  Activity,
  BookOpen,
  Box,
  Briefcase,
  Camera,
  ChefHat,
  Dumbbell,
  EyeOff,
  Film,
  Gamepad2,
  Home,
  Lightbulb,
  Leaf,
  Laptop,
  Mic,
  Moon,
  Music,
  PawPrint,
  Palette,
  PartyPopper,
  Plane,
  ShoppingCart,
  Sparkles,
  Sprout,
  Shirt,
  SunMedium,
  Trophy,
  Tv2,
  User as UserIcon,
  UtensilsCrossed,
  Zap,
  Brush,
  Coffee,
  BedDouble,
} from "lucide-react";

// Each option keeps its Hebrew `label` as the canonical value: it is the
// fallback display string and — importantly — the key used by
// INTERESTS_BY_LABEL to map legacy stored interest values (which may have been
// saved as Hebrew labels) back to a stable `id`. Removing it would break that
// reverse lookup. `labelKey` points at the i18n catalog entry so React
// components can render a translated label via t(option.labelKey).
const INTEREST_OPTIONS = [
  { id: "gym", labelKey: "interest_gym", label: "חדר כושר", Icon: Dumbbell, color: "bg-orange-50 text-orange-700 border-orange-200" },
  { id: "tennis", labelKey: "interest_tennis", label: "טניס", Icon: Activity, color: "bg-green-50 text-green-700 border-green-200" },
  { id: "pilates", labelKey: "interest_pilates", label: "פילאטיס / יוגה", Icon: UserIcon, color: "bg-teal-50 text-teal-700 border-teal-200" },
  { id: "soccer_basketball", labelKey: "interest_soccer_basketball", label: "כדורגל / כדורסל", Icon: Trophy, color: "bg-green-50 text-green-700 border-green-200" },
  { id: "gaming", labelKey: "interest_gaming", label: "גיימינג", Icon: Gamepad2, color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { id: "lego", labelKey: "interest_lego", label: "לגו", Icon: Box, color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  { id: "photography", labelKey: "interest_photography", label: "צילום", Icon: Camera, color: "bg-gray-100 text-gray-700 border-gray-300" },
  { id: "reading", labelKey: "interest_reading", label: "קריאה", Icon: BookOpen, color: "bg-amber-50 text-amber-700 border-amber-200" },
  { id: "cooking", labelKey: "interest_cooking", label: "בישול ואפייה", Icon: ChefHat, color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  { id: "business", labelKey: "interest_business", label: "עסקים", Icon: Briefcase, color: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: "entrepreneurship", labelKey: "interest_entrepreneurship", label: "יזמות", Icon: Lightbulb, color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  { id: "plants", labelKey: "interest_plants", label: "צמחייה", Icon: Sprout, color: "bg-lime-50 text-lime-700 border-lime-200" },
  { id: "nature", labelKey: "interest_nature", label: "טיולים בטבע", Icon: Leaf, color: "bg-lime-50 text-lime-700 border-lime-200" },
  { id: "sport", labelKey: "interest_sport", label: "ספורט", Icon: Trophy, color: "bg-green-50 text-green-700 border-green-200" },
  { id: "music", labelKey: "interest_music", label: "מוזיקה", Icon: Music, color: "bg-purple-50 text-purple-700 border-purple-200" },
  { id: "art", labelKey: "interest_art", label: "אמנות", Icon: Palette, color: "bg-pink-50 text-pink-700 border-pink-200" },
  { id: "movies", labelKey: "interest_movies", label: "קולנוע", Icon: Film, color: "bg-red-50 text-red-700 border-red-200" },
  { id: "nightlife", labelKey: "interest_nightlife", label: "חיי לילה", Icon: PartyPopper, color: "bg-violet-50 text-violet-700 border-violet-200" },
  { id: "fashion", labelKey: "interest_fashion", label: "אופנה", Icon: Shirt, color: "bg-rose-50 text-rose-700 border-rose-200" },
  { id: "clean_home", labelKey: "interest_clean_home", label: "שהבית מתוקתק", Icon: Brush, color: "bg-sky-50 text-sky-700 border-sky-200" },
  { id: "morning_coffee", labelKey: "interest_morning_coffee", label: "קפה של בוקר", Icon: Coffee, color: "bg-amber-50 text-amber-700 border-amber-200" },
];

const INTERESTS_BY_ID = new Map(INTEREST_OPTIONS.map((option) => [option.id, option]));
const INTERESTS_BY_LABEL = new Map(
  INTEREST_OPTIONS.map((option) => [normalizeLabelKey(option.label), option])
);

function normalizeLookupKey(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "_");
}

function normalizeLabelKey(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeInterestValue(value) {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return "";
  }

  const normalizedId = normalizeLookupKey(raw);
  if (INTERESTS_BY_ID.has(normalizedId)) {
    return normalizedId;
  }

  const normalizedLabel = normalizeLabelKey(raw);
  if (INTERESTS_BY_LABEL.has(normalizedLabel)) {
    return INTERESTS_BY_LABEL.get(normalizedLabel).id;
  }

  return normalizedId;
}

export function normalizeInterestValues(values = []) {
  const input = Array.isArray(values) ? values : [values];
  const seen = new Set();
  const result = [];

  input.forEach((value) => {
    const normalized = normalizeInterestValue(value);
    if (!normalized || seen.has(normalized)) {
      return;
    }
    seen.add(normalized);
    result.push(normalized);
  });

  return result;
}

export function getInterestOption(value) {
  const normalized = normalizeInterestValue(value);
  return INTERESTS_BY_ID.get(normalized) || null;
}

export function getInterestLabel(value) {
  const option = getInterestOption(value);
  if (option) {
    return option.label;
  }

  const raw = String(value ?? "").trim();
  return raw ? raw.replace(/_/g, " ") : "-";
}

// Returns the i18n catalog key for a known interest, or null for unknown
// values (callers should fall back to getInterestLabel in that case). Lets
// React components translate a label without importing the options table.
export function getInterestLabelKey(value) {
  const option = getInterestOption(value);
  return option ? option.labelKey : null;
}

export function getInterestDisplayOption(value) {
  return getInterestOption(value) || {
    id: normalizeInterestValue(value) || String(value ?? "").trim(),
    labelKey: null,
    label: getInterestLabel(value),
    Icon: Sparkles,
    color: "bg-gray-100 text-gray-700 border-gray-300",
  };
}

export { INTEREST_OPTIONS, INTEREST_OPTIONS as INTERESTS_LIST, INTERESTS_BY_ID };