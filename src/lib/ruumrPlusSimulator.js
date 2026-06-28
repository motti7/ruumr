import i18n from "@/i18n";
import { Profile } from "@/entities/Profile";
import { getInterestLabel, normalizeInterestValues } from "@/lib/interests";
import { applyTwoStageSwipeFilter } from "@/lib/ruumrPlusDisplayFilter";
import { calculateCharterCompatibility, isCharterComplete } from "@/lib/charterCompletion";
import { isRuumrSimulatorPlusLocked } from "@/lib/simulatorMode";

/**
 * @typedef {Object} SimulatorRecommendationOptions
 * @property {any} [userId]
 * @property {number} [limit]
 * @property {any} [requestId]
 * @property {boolean} [requirePlus]
 * @property {boolean} [refresh]
 * @property {any[] | null} [localProfiles]
 * @property {any | null} [currentProfile]
 * @property {any[]} [userSwipes]
 */

const NEUTRAL_VALUES = new Set([
  "any",
  "all",
  "flow",
  "flexible",
  "neutral",
  "open",
  "maybe",
  "whatever",
  "dontcare",
  "doesntmatter",
  "notimportant",
  "לאמשנה",
  "זורם",
  "זורמת",
  "זורמים",
  "זורמות",
]);

const POSITIVE_VALUES = new Set([
  "for",
  "yes",
  "y",
  "true",
  "allow",
  "allowed",
  "smoker",
  "smoking",
  "love",
  "like",
  "likes",
  "pets",
  "petfriendly",
  "animalfriendly",
  "petlover",
  "support",
  "approve",
  "בעד",
  "אוהב",
  "אוהבת",
  "כן",
]);

const NEGATIVE_VALUES = new Set([
  "against",
  "no",
  "n",
  "false",
  "deny",
  "denied",
  "dislike",
  "avoid",
  "allergic",
  "nonsmoker",
  "nonsmoking",
  "nonsmoke",
  "non-smoker",
  "non_smoker",
  "smokefree",
  "nosmoking",
  "nopets",
  "no_pets",
  "נגד",
  "אלרגי",
  "אלרגית",
  "לא",
]);

function normalizeKey(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function humanizeInterest(value) {
  return getInterestLabel(value);
}

function toList(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (value == null || value === "") {
    return [];
  }

  return [value];
}

function uniqueList(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function uniqueProfilesByUserId(profiles = []) {
  const seen = new Set();
  const unique = [];

  profiles.forEach((profile) => {
    const key = String(profile?.user_id ?? "").trim();
    if (!key || seen.has(key)) {
      return;
    }

    seen.add(key);
    unique.push(profile);
  });

  return unique;
}

function normalizeCity(value) {
  return normalizeKey(value).replace(/[^\p{L}\p{N}]+/gu, " ").replace(/\s+/g, " ").trim();
}

function getProfileCities(profile = {}) {
  const cities = toList(profile.search_cities).map((city) => String(city).trim()).filter(Boolean);
  if (cities.length > 0) {
    return cities;
  }

  const location = String(profile.location ?? "").trim();
  return location ? [location] : [];
}

function getProfileInterests(profile = {}) {
  return normalizeInterestValues(toList(profile.interests));
}

function getProfileText(profile = {}) {
  return [
    profile.about_me,
    profile.looking_for_description,
    profile.pet_other_description,
    profile.song_name,
    profile.song_artist,
  ]
    .map((part) => String(part ?? "").trim())
    .filter(Boolean)
    .join(" ");
}

function tokenizeText(text) {
  return uniqueList(
    String(text ?? "")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .split(/\s+/)
      .map((part) => part.trim())
      .filter((part) => part.length >= 2)
  );
}

function jaccardSimilarity(leftText, rightText) {
  const leftTokens = new Set(tokenizeText(leftText));
  const rightTokens = new Set(tokenizeText(rightText));

  if (leftTokens.size === 0 && rightTokens.size === 0) {
    return 0;
  }

  let intersection = 0;
  leftTokens.forEach((token) => {
    if (rightTokens.has(token)) {
      intersection += 1;
    }
  });

  const union = new Set([...leftTokens, ...rightTokens]).size || 1;
  return intersection / union;
}

function average(values = []) {
  const numeric = values.map((value) => Number(value)).filter((value) => Number.isFinite(value));
  if (numeric.length === 0) {
    return 0;
  }

  return numeric.reduce((sum, value) => sum + value, 0) / numeric.length;
}

function scoreDifference(left, right, maxDifference = 4) {
  const leftNumber = Number(left);
  const rightNumber = Number(right);

  if (!Number.isFinite(leftNumber) || !Number.isFinite(rightNumber)) {
    return 0.5;
  }

  const diff = Math.abs(leftNumber - rightNumber);
  if (diff <= 0) return 1;
  if (diff <= 2) return 0.92;
  if (diff <= 4) return 0.78;
  if (diff <= maxDifference * 2) return 0.58;
  return 0.34;
}

function scoreAgeDifference(left, right) {
  const leftNumber = Number(left);
  const rightNumber = Number(right);

  if (!Number.isFinite(leftNumber) || !Number.isFinite(rightNumber)) {
    return 0.5;
  }

  const diff = Math.abs(leftNumber - rightNumber);
  if (diff <= 1) return 1;
  if (diff <= 2) return 0.92;
  if (diff <= 4) return 0.78;
  if (diff <= 6) return 0.62;
  if (diff <= 8) return 0.46;
  return 0.28;
}

function normalizePreference(value) {
  const key = normalizeKey(value).replace(/[\s_-]+/g, "");
  if (!key) {
    return "flow";
  }

  if (NEUTRAL_VALUES.has(key)) {
    return "flow";
  }

  if (POSITIVE_VALUES.has(key)) {
    return "for";
  }

  if (NEGATIVE_VALUES.has(key)) {
    return "against";
  }

  return key;
}

function preferencesCompatible(left, right) {
  const leftValue = normalizePreference(left);
  const rightValue = normalizePreference(right);

  if (!leftValue || !rightValue) {
    return true;
  }

  if (leftValue === "flow" || rightValue === "flow") {
    return true;
  }

  return leftValue === rightValue;
}

function valueRangeOverlap(requestorMin, requestorMax, candidateMin, candidateMax) {
  const minA = Number(requestorMin);
  const maxA = Number(requestorMax);
  const minB = Number(candidateMin);
  const maxB = Number(candidateMax);

  if (![minA, maxA, minB, maxB].every((value) => Number.isFinite(value) && value > 0)) {
    return true;
  }

  const tolerance = 0.1;
  const effectiveMinA = minA * (1 - tolerance);
  const effectiveMaxA = maxA * (1 + tolerance);
  const effectiveMinB = minB * (1 - tolerance);
  const effectiveMaxB = maxB * (1 + tolerance);

  return effectiveMinB <= effectiveMaxA && effectiveMaxB >= effectiveMinA;
}

function collectSharedItems(left = [], right = [], formatter = (value) => value) {
  const leftMap = new Map();
  left.forEach((value) => {
    const key = normalizeKey(value);
    if (key) {
      leftMap.set(key, formatter(value));
    }
  });

  const result = [];
  right.forEach((value) => {
    const key = normalizeKey(value);
    if (key && leftMap.has(key)) {
      result.push(leftMap.get(key));
    }
  });

  return uniqueList(result);
}

function buildInsight(reasons = {}) {
  const phrases = [];

  if (reasons.status === "complementary") {
    phrases.push(i18n.t("sim_insight_complementary"));
  }
  if (reasons.city_match) {
    phrases.push(i18n.t("sim_insight_same_city"));
  }
  if (reasons.budget_fit) {
    phrases.push(i18n.t("sim_insight_budget_fit"));
  }
  if (reasons.vibe_close) {
    phrases.push(i18n.t("sim_insight_vibe_close"));
  }
  if ((reasons.shared_interests || []).length > 0) {
    phrases.push(i18n.t("sim_insight_shared_interests"));
  }
  if (reasons.lifestyle_overlap) {
    phrases.push(i18n.t("sim_insight_lifestyle"));
  }

  if (phrases.length === 0) {
    return i18n.t("sim_insight_default");
  }

  return phrases.slice(0, 3).join(" · ");
}

function buildClientContract({ requirePlus = true, accessGranted = true } = {}) {
  const unlocked = Boolean(accessGranted || !requirePlus);

  return {
    version: "ruumr-plus-client-v1",
    surface: "match_cards",
    dm: {
      state: unlocked ? "unlocked" : "locked",
      requires_plus: Boolean(requirePlus),
      can_message: unlocked,
      action: unlocked ? "open_dm" : "upgrade_plus",
    },
    card: {
      action: "open_profile",
      expandable: true,
    },
  };
}

function buildEntitlementSummary(userId, accessGranted) {
  return {
    active: Boolean(accessGranted),
    tier: accessGranted ? "plus" : null,
    status: accessGranted ? "active" : "inactive",
    user_id: userId ?? null,
    granted_at: accessGranted ? new Date().toISOString() : null,
    revoked_at: null,
    expires_at: null,
    granted_by: accessGranted ? "ruumr-simulator" : null,
    notes: accessGranted ? "simulated entitlement for local Android testing" : null,
  };
}

function evaluateCandidate(requestor, candidate) {
  if (!requestor || !candidate || String(requestor.user_id) === String(candidate.user_id)) {
    return null;
  }

  if (candidate.is_visible === false) {
    return null;
  }

  const requestorGender = normalizeKey(requestor.gender || "any");
  const requestorPreference = normalizeKey(requestor.looking_for_gender || "any");
  const candidateGender = normalizeKey(candidate.gender || "any");
  const candidatePreference = normalizeKey(candidate.looking_for_gender || "any");

  const theyWantMe = requestorPreference === "any" || requestorPreference === candidateGender;
  const iWantThem = candidatePreference === "any" || candidatePreference === requestorGender;
  if (!theyWantMe || !iWantThem) {
    return null;
  }

  const requestorStatus = normalizeKey(requestor.current_status);
  const candidateStatus = normalizeKey(candidate.current_status);
  if (requestorStatus === "has_apartment" && candidateStatus === "has_apartment") {
    return null;
  }

  if (!preferencesCompatible(requestor.smoking_preference, candidate.smoking_preference)) {
    return null;
  }
  if (!preferencesCompatible(requestor.pet_preference, candidate.pet_preference)) {
    return null;
  }
  if (!preferencesCompatible(requestor.kosher_preference, candidate.kosher_preference)) {
    return null;
  }
  if (!preferencesCompatible(requestor.shabbat_preference, candidate.shabbat_preference)) {
    return null;
  }

  const requestorCities = getProfileCities(requestor);
  const candidateCities = getProfileCities(candidate);
  const sharedCities = collectSharedItems(requestorCities, candidateCities, (value) => String(value).trim());
  const cityMatch = sharedCities.length > 0 || requestorCities.length === 0 || candidateCities.length === 0;

  const requestorBudgetMin = requestor.budget_min ?? requestor.rent_min ?? 0;
  const requestorBudgetMax = requestor.budget_max ?? requestor.apartment_total_budget ?? requestor.rent_max ?? 0;
  const candidateBudgetMin = candidate.budget_min ?? candidate.rent_min ?? 0;
  const candidateBudgetMax = candidate.budget_max ?? candidate.apartment_total_budget ?? candidate.rent_max ?? 0;
  const budgetFit = valueRangeOverlap(requestorBudgetMin, requestorBudgetMax, candidateBudgetMin, candidateBudgetMax);
  if (!budgetFit) {
    return null;
  }

  const vibeDiff = Math.abs(Number(requestor.vibe_level) - Number(candidate.vibe_level));
  const vibeClose = Number.isFinite(vibeDiff) ? vibeDiff <= 2 : true;
  if (!vibeClose) {
    return null;
  }

  const sharedInterests = collectSharedItems(getProfileInterests(requestor), getProfileInterests(candidate), humanizeInterest);

  const requestorHousehold = [
    requestor.cleanliness,
    requestor.shopping,
    requestor.ac_wars,
    requestor.dishes_in_sink,
    requestor.friends_and_parties,
  ];
  const candidateHousehold = [
    candidate.cleanliness,
    candidate.shopping,
    candidate.ac_wars,
    candidate.dishes_in_sink,
    candidate.friends_and_parties,
  ];
  const householdSimilarity = average(requestorHousehold.map((value, index) => scoreDifference(value, candidateHousehold[index], 5)));

  const ageScore = scoreAgeDifference(requestor.age, candidate.age);
  const vibeScore = scoreDifference(requestor.vibe_level, candidate.vibe_level, 5);
  const interestScore = Math.min(1, sharedInterests.length / Math.max(1, Math.max(getProfileInterests(requestor).length, getProfileInterests(candidate).length)));
  const textSimilarity = jaccardSimilarity(getProfileText(requestor), getProfileText(candidate));

  const statusScore = requestorStatus === "seeking_apartment" && candidateStatus === "has_apartment"
    ? 1
    : requestorStatus === candidateStatus
      ? 0.7
      : 0.85;

  const structuredScore = average([
    ageScore,
    cityMatch ? 1 : 0.5,
    budgetFit ? 1 : 0,
    vibeScore,
    householdSimilarity,
    interestScore,
    statusScore,
  ]);

  const semanticSimilarity = textSimilarity;
  const baseScore = (structuredScore * 0.66) + (semanticSimilarity * 0.34);
  const requestorQuestionnaire = requestor.ruumr_plus_questionnaire?.answers;
  const candidateQuestionnaire = candidate.ruumr_plus_questionnaire?.answers;
  const questionnaireCompatibility =
    isCharterComplete(requestorQuestionnaire) && isCharterComplete(candidateQuestionnaire)
      ? calculateCharterCompatibility(requestorQuestionnaire, candidateQuestionnaire)
      : null;
  const totalScore = questionnaireCompatibility?.score != null
    ? (baseScore * 0.8) + ((questionnaireCompatibility.score / 100) * 0.2)
    : baseScore;

  const reasons = {
    shared_cities: sharedCities,
    shared_interests: sharedInterests,
    city_match: cityMatch,
    budget_fit: budgetFit,
    vibe_close: vibeClose,
    lifestyle_overlap: householdSimilarity >= 0.62,
    status: requestorStatus === "seeking_apartment" && candidateStatus === "has_apartment"
      ? "complementary"
      : requestorStatus === candidateStatus
        ? "aligned"
        : "complementary",
  };

  return {
    user_id: candidate.user_id,
    score: Number(totalScore.toFixed(4)),
    semantic_similarity: Number(semanticSimilarity.toFixed(4)),
    structured_score: Number(structuredScore.toFixed(4)),
    insight: buildInsight(reasons),
    reasons,
    compatibility: {
      age: Number(ageScore.toFixed(4)),
      city: cityMatch ? 1 : 0,
      budget: budgetFit ? 1 : 0,
      vibe: Number(vibeScore.toFixed(4)),
      interests: Number(interestScore.toFixed(4)),
      household: Number(householdSimilarity.toFixed(4)),
      status: Number(statusScore.toFixed(4)),
      text: Number(semanticSimilarity.toFixed(4)),
      questionnaire: questionnaireCompatibility?.score != null
        ? Number((questionnaireCompatibility.score / 100).toFixed(4))
        : null,
    },
    questionnaire_compatibility: questionnaireCompatibility,
    profile: candidate,
    messageable: true,
  };
}

/**
 * @param {SimulatorRecommendationOptions} options
 */
async function loadSimulatorProfiles({ userId = null, localProfiles = null, currentProfile = null } = {}) {
  if (Array.isArray(localProfiles) && localProfiles.length > 0) {
    const normalizedProfiles = uniqueProfilesByUserId(localProfiles);
    return {
      requestor: currentProfile || normalizedProfiles.find((profile) => String(profile?.user_id) === String(userId)) || null,
      allProfiles: normalizedProfiles,
    };
  }

  const [currentProfileList, allProfiles] = await Promise.all([
    currentProfile ? Promise.resolve([currentProfile]) : Profile.filter({ user_id: userId }),
    Profile.list("-created_date", 500),
  ]);

  return {
    requestor: currentProfile || currentProfileList[0] || null,
    allProfiles: uniqueProfilesByUserId(Array.isArray(allProfiles) ? allProfiles : []),
  };
}

/**
 * @param {SimulatorRecommendationOptions} options
 */
export async function buildSimulatorRuumrPlusRecommendations({
  userId,
  limit = 12,
  requestId = null,
  requirePlus = true,
  localProfiles = null,
  currentProfile = null,
  userSwipes = [],
} = {}) {
  const { requestor, allProfiles } = await loadSimulatorProfiles({
    userId,
    localProfiles,
    currentProfile,
  });

  const requestorProfile = requestor || null;
  const safeLimit = Math.max(0, Math.floor(Number(limit) || 0));
  // Mirror the production service entitlement gate so the locked UX is testable.
  const plusLocked = isRuumrSimulatorPlusLocked();
  const accessGranted = Boolean(requestorProfile) && !plusLocked;

  if (!requestorProfile) {
    return {
      ok: true,
      status: "ok",
      mode: "simulator",
      request_id: requestId ?? `sim_${Date.now()}`,
      user_id: userId ?? null,
      requestor: null,
      limit: safeLimit,
      candidate_count: 0,
      matched_count: 0,
      access_granted: false,
      entitlement: buildEntitlementSummary(userId ?? null, false),
      client_contract: buildClientContract({ accessGranted: false, requirePlus }),
      recommendations: [],
      generated_at: new Date().toISOString(),
      cached: false,
    };
  }

  // Same as the real service: require_plus + no entitlement -> 403, which the
  // page turns into the locked / upgrade state.
  if (requirePlus && !accessGranted) {
    const error = new Error("Ruumr Plus access is required for this request");
    error.status = 403;
    throw error;
  }

  const candidateProfiles = uniqueProfilesByUserId(
    allProfiles.filter((profile) => {
      if (!profile) return false;
      if (String(profile.user_id) === String(requestorProfile.user_id)) return false;
      return profile.is_visible !== false;
    })
  );

  const rankedCandidates = candidateProfiles
    .map((candidate) => evaluateCandidate(requestorProfile, candidate))
    .filter(Boolean)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      if (right.semantic_similarity !== left.semantic_similarity) {
        return right.semantic_similarity - left.semantic_similarity;
      }
      return right.structured_score - left.structured_score;
    });

  // Mirror the production service: hard-exclude disliked, prefer-out liked with
  // backfill from the full ranked pool so the result still reaches the limit.
  const recommendations = applyTwoStageSwipeFilter(rankedCandidates, userSwipes, safeLimit || 12);

  return {
    ok: true,
    status: "ok",
    mode: "simulator",
    request_id: requestId ?? `sim_${Date.now()}`,
    user_id: requestorProfile.user_id,
    requestor: requestorProfile,
    limit: safeLimit || 12,
    candidate_count: candidateProfiles.length,
    matched_count: recommendations.length,
    access_granted: accessGranted,
    entitlement: buildEntitlementSummary(requestorProfile.user_id, accessGranted),
    client_contract: buildClientContract({ accessGranted, requirePlus }),
    recommendations,
    generated_at: new Date().toISOString(),
    cached: false,
  };
}
