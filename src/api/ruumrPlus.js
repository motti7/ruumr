import { base44 } from "@/api/base44Client";
import { Match, Profile, Swipe } from "@/entities/all";
import { isRuumrSimulatorMode } from "@/lib/simulatorMode";
import { buildSimulatorRuumrPlusRecommendations } from "@/lib/ruumrPlusSimulator";
import { normalizeCharterAnswers } from "@/lib/charterCompletion";

const BRIDGE_FUNCTION_NAME = "ruumrPlusBridge";
export const RUUMR_PLUS_RECOMMENDATION_LIMIT = 5;

/**
 * @typedef {Object} RuumrPlusRecommendationOptions
 * @property {number} [limit]
 * @property {boolean} [refresh]
 * @property {boolean} [requirePlus]
 * @property {any} [userId]
 * @property {any[] | null} [localProfiles]
 * @property {any | null} [currentProfile]
 * @property {any} [requestId]
 * @property {any} [request_id]
 * @property {any[]} [userSwipes]
 */

async function invokeBridge(action, payload = {}) {
  const raw = await base44.functions.invoke(BRIDGE_FUNCTION_NAME, {
    action,
    ...payload,
  });

  // Different SDK/runtime versions return either the parsed JSON body or a
  // full axios-style envelope ({ data, status, ... }). Unwrap to the body so
  // we read the bridge's actual payload, not the envelope.
  const body =
    raw && typeof raw === "object" && raw.data && !("ok" in raw) && !("result" in raw)
      ? raw.data
      : raw;

  if (body && typeof body === "object" && body.ok === false) {
    const error = /** @type {Error & { payload?: unknown }} */ (
      new Error(body.error || `Ruumr Plus action ${action} failed`)
    );
    error.payload = body;
    throw error;
  }

  // The bridge wraps the service response as { ok, action, result }.
  return body?.result ?? body;
}

function uniqueProfilesByUserId(items = []) {
  const seen = new Set();
  const unique = [];

  items.forEach((item) => {
    const userId = item?.user_id ?? item?.profile?.user_id ?? null;
    const key = String(userId ?? "").trim();
    if (!key || seen.has(key)) {
      return;
    }

    seen.add(key);
    unique.push(item);
  });

  return unique;
}

export async function syncCurrentProfileToRuumrPlus(options = {}) {
  if (isRuumrSimulatorMode()) {
    const currentUser = await base44.auth.me();
    const userId = options.userId ?? currentUser.id;
    const [profiles, preferences] = await Promise.all([
      Profile.filter({ user_id: userId }),
      base44.entities.QuestionnairePreference.filter({ user_id: userId }, "-completed_at"),
    ]);
    const preference = preferences[0];
    return {
      ok: true,
      stored: Boolean(profiles[0]),
      profile_found: Boolean(profiles[0]),
      profile_payload: profiles[0]
        ? {
            ...profiles[0],
            ruumr_plus_questionnaire: preference
              ? {
                  version: Number(preference.version) || 1,
                  completed_at: preference.completed_at,
                  source: preference.source,
                  source_match_id: preference.source_match_id ?? undefined,
                  answers: normalizeCharterAnswers(preference.answers),
                }
              : undefined,
          }
        : null,
    };
  }
  return invokeBridge("profile.sync_current", options);
}

export async function deleteCurrentProfileFromRuumrPlus(options = {}) {
  return invokeBridge("profile.delete_current", options);
}

export async function snapshotProfilesToRuumrPlus(options = {}) {
  return invokeBridge("profile.snapshot", options);
}

/**
 * @param {RuumrPlusRecommendationOptions} options
 */
export async function fetchRuumrPlusRecommendations(options = {}) {
  const {
    limit = 12,
    refresh = false,
    requirePlus = true,
    userId = null,
    localProfiles = null,
    currentProfile = null,
    userSwipes = [],
  } = options;

  if (isRuumrSimulatorMode()) {
    const preferences = await base44.entities.QuestionnairePreference.list("-completed_at", 500);
    const preferencesByUserId = new Map();
    preferences.forEach((preference) => {
      const key = String(preference.user_id ?? "");
      if (!key || preferencesByUserId.has(key)) return;
      preferencesByUserId.set(key, preference);
    });
    const attachQuestionnaire = (profile) => {
      if (!profile) return profile;
      const preference = preferencesByUserId.get(String(profile.user_id));
      return preference
        ? {
            ...profile,
            ruumr_plus_questionnaire: {
              version: Number(preference.version) || 1,
              completed_at: preference.completed_at,
              source: preference.source,
              source_match_id: preference.source_match_id ?? undefined,
              answers: normalizeCharterAnswers(preference.answers),
            },
          }
        : profile;
    };
    // Simulator runs entirely client-side, so it needs the swipe list to mirror
    // the swipe filtering the bridge applies server-side in production.
    return buildSimulatorRuumrPlusRecommendations({
      userId,
      limit,
      requestId: options.requestId ?? options.request_id ?? null,
      requirePlus,
      localProfiles: Array.isArray(localProfiles) ? localProfiles.map(attachQuestionnaire) : localProfiles,
      currentProfile: attachQuestionnaire(currentProfile),
      userSwipes,
    });
  }

  // Production path: the ruumrPlusBridge function fetches the user's swipes from
  // Base44 and passes the exclusions to the service authoritatively.
  return invokeBridge("recommendations", {
    limit,
    refresh,
    require_plus: requirePlus,
    user_id: userId ?? undefined,
  });
}

/**
 * @param {RuumrPlusRecommendationOptions} options
 */
export async function activateRuumrPlusRecommendations(options = {}) {
  return fetchRuumrPlusRecommendations({
    ...options,
    limit: RUUMR_PLUS_RECOMMENDATION_LIMIT,
    refresh: false,
    requirePlus: true,
  });
}

/**
 * @param {{ targetUserId?: string }} [options]
 */
export async function createRuumrPlusMatch({ targetUserId } = {}) {
  if (!targetUserId) {
    throw new Error("targetUserId is required");
  }

  if (!isRuumrSimulatorMode()) {
    return invokeBridge("match.create_from_recommendation", {
      target_user_id: targetUserId,
    });
  }

  const currentUser = await base44.auth.me();
  const swiperId = currentUser.id;
  const [currentProfiles, targetProfiles, reverseLikes, directMatches, reverseMatches, existingSwipes] =
    await Promise.all([
      Profile.filter({ user_id: swiperId }),
      Profile.filter({ user_id: targetUserId }),
      Swipe.filter({ swiper_id: targetUserId, swiped_id: swiperId, action: "like" }),
      Match.filter({ user1_id: swiperId, user2_id: targetUserId }),
      Match.filter({ user1_id: targetUserId, user2_id: swiperId }),
      Swipe.filter({ swiper_id: swiperId, swiped_id: targetUserId }),
    ]);

  if (existingSwipes[0]) {
    await Swipe.update(existingSwipes[0].id, { action: "like" });
  } else {
    await Swipe.create({
      swiper_id: swiperId,
      swiper_name: currentProfiles[0]?.name || currentUser.full_name,
      swiped_id: targetUserId,
      swiped_name: targetProfiles[0]?.name,
      action: "like",
    });
  }

  const existingMatch = [...directMatches, ...reverseMatches][0];
  const isMutual = reverseLikes.length > 0;
  const matchType = isMutual ? "mutual" : "ruumr_plus";

  if (existingMatch) {
    if (isMutual && existingMatch.match_type === "ruumr_plus") {
      await Match.update(existingMatch.id, {
        match_type: "mutual",
      });
    }
    return {
      match: true,
      match_id: existingMatch.id,
      match_type: isMutual ? "mutual" : existingMatch.match_type || "mutual",
    };
  }

  const match = await Match.create({
    user1_id: swiperId,
    user2_id: targetUserId,
    user1_name: currentProfiles[0]?.name || currentUser.full_name || "",
    user2_name: targetProfiles[0]?.name || "",
    status: "active",
    match_type: matchType,
    ...(isMutual ? {} : { plus_initiator_id: swiperId }),
  });

  return { match: true, match_id: match.id, match_type: matchType };
}

export async function fetchRuumrPlusStats(options = {}) {
  return invokeBridge("admin.stats", options);
}

export async function fetchRuumrPlusEntitlements(options = {}) {
  return invokeBridge("admin.entitlements.list", options);
}

/**
 * Lists Base44 users (id, email, full_name, is_ruumr_plus) via the bridge's
 * service role. Required because the client cannot list the User entity
 * directly — Base44 restricts that to project collaborators.
 */
export async function searchRuumrPlusUsers(options = {}) {
  // No default limit: the bridge paginates the full user set server-side.
  const result = await invokeBridge("admin.users.search", { limit: options.limit });
  return Array.isArray(result?.users) ? result.users : [];
}

export async function grantRuumrPlusEntitlement(options = {}) {
  const {
    userId,
    tier = "plus",
    grantedBy = null,
    expiresAt = null,
    notes = null,
    entitlementSource = "admin_grant",
  } = options;

  return invokeBridge("admin.entitlements.grant", {
    user_id: userId,
    tier,
    granted_by: grantedBy,
    expires_at: expiresAt,
    notes,
    entitlement_source: entitlementSource,
  });
}

export async function revokeRuumrPlusEntitlement(options = {}) {
  const {
    userId,
    tier = "plus",
    grantedBy = null,
    expiresAt = null,
    notes = null,
  } = options;

  return invokeBridge("admin.entitlements.revoke", {
    user_id: userId,
    tier,
    granted_by: grantedBy,
    expires_at: expiresAt,
    notes,
  });
}

export async function reindexRuumrPlusProfiles(options = {}) {
  return invokeBridge("admin.reindex", options);
}

export async function clearRuumrPlusCache(options = {}) {
  return invokeBridge("admin.cache.clear", options);
}

export async function replayRuumrPlusEvents(options = {}) {
  return invokeBridge("admin.replay", options);
}

export async function listRuumrPlusEvents(options = {}) {
  return invokeBridge("admin.events.list", options);
}

export function mergeRuumrPlusRecommendations({ localProfiles = [], recommendations = [] } = {}) {
  const localByUserId = new Map();

  uniqueProfilesByUserId(localProfiles).forEach((profile) => {
    localByUserId.set(String(profile.user_id), profile);
  });

  const merged = uniqueProfilesByUserId(recommendations).map((recommendation) => {
    const recommendationProfile = recommendation.profile || {};
    const localProfile = localByUserId.get(String(recommendation.user_id)) || {};
    const mergedProfile = {
      ...localProfile,
      ...recommendationProfile,
      id: localProfile.id ?? recommendationProfile.id ?? recommendationProfile.user_id ?? recommendation.user_id,
      user_id: recommendationProfile.user_id ?? localProfile.user_id ?? recommendation.user_id,
      ruumrPlus: {
        score: recommendation.score ?? null,
        semantic_similarity: recommendation.semantic_similarity ?? null,
        structured_score: recommendation.structured_score ?? null,
        insight: recommendation.insight ?? "",
        reasons: recommendation.reasons ?? {},
        compatibility: recommendation.compatibility ?? {},
        messageable: Boolean(recommendation.messageable),
        client_contract: recommendation.client_contract ?? null,
      },
    };

    return mergedProfile;
  });

  // Display is sliced and shown in array order, so guarantee descending match
  // score here rather than trusting whatever order the service returned.
  // Null/unknown scores sort last. Ties fall back to the secondary signals.
  const scoreOf = (profile) => {
    const value = Number(profile?.ruumrPlus?.score);
    return Number.isFinite(value) ? value : -Infinity;
  };
  const semanticOf = (profile) => {
    const value = Number(profile?.ruumrPlus?.semantic_similarity);
    return Number.isFinite(value) ? value : -Infinity;
  };

  return merged.sort((left, right) => {
    if (scoreOf(right) !== scoreOf(left)) return scoreOf(right) - scoreOf(left);
    return semanticOf(right) - semanticOf(left);
  });
}
