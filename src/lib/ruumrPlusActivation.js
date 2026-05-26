const ACTIVATION_STORAGE_PREFIX = "ruumr_plus_activation";
const PENDING_INTENT_STORAGE_KEY = "ruumr_plus_pending_activation";

export const RUUMR_PLUS_ACTIVATION_WINDOW_MS = 24 * 60 * 60 * 1000;

function getStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function getSessionStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function getActivationStorageKey(userId) {
  return `${ACTIVATION_STORAGE_PREFIX}:${String(userId ?? "").trim()}`;
}

function toIso(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function addWindow(activatedAt) {
  const parsed = new Date(activatedAt);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return new Date(parsed.getTime() + RUUMR_PLUS_ACTIVATION_WINDOW_MS).toISOString();
}

/**
 * @param {Record<string, any> | null} record
 * @returns {Record<string, any> | null}
 */
export function normalizeRuumrPlusActivation(record = null) {
  if (!record || typeof record !== "object") {
    return null;
  }

  const activatedAt = toIso(
    record.activated_at ??
      record.activatedAt ??
      record.cached_at ??
      record.cachedAt ??
      record.generated_at ??
      record.generatedAt
  );

  if (!activatedAt) {
    return null;
  }

  const expiresAt = toIso(record.expires_at ?? record.expiresAt) ?? addWindow(activatedAt);
  const recommendations = Array.isArray(record.recommendations) ? record.recommendations : [];
  const matchedCount = Number(
    record.matched_count ??
      record.matchedCount ??
      recommendations.length ??
      0
  );
  const candidateCount = Number(record.candidate_count ?? record.candidateCount ?? 0);

  return {
    ...record,
    activated_at: activatedAt,
    activatedAt,
    expires_at: expiresAt,
    expiresAt,
    generated_at: toIso(record.generated_at ?? record.generatedAt) ?? activatedAt,
    generatedAt: toIso(record.generatedAt ?? record.generated_at) ?? activatedAt,
    recommendations,
    matched_count: Number.isFinite(matchedCount) ? matchedCount : recommendations.length,
    matchedCount: Number.isFinite(matchedCount) ? matchedCount : recommendations.length,
    candidate_count: Number.isFinite(candidateCount) ? candidateCount : 0,
    candidateCount: Number.isFinite(candidateCount) ? candidateCount : 0,
    client_contract: record.client_contract ?? null,
  };
}

export function isRuumrPlusActivationFresh(record = null, now = Date.now()) {
  const normalized = normalizeRuumrPlusActivation(record);
  if (!normalized?.expires_at) {
    return false;
  }

  if ((normalized.recommendations?.length ?? 0) === 0) {
    return false;
  }

  return new Date(normalized.expires_at).getTime() > now;
}

export function getRuumrPlusActivationRemainingMs(record = null, now = Date.now()) {
  const normalized = normalizeRuumrPlusActivation(record);
  if (!normalized?.expires_at) {
    return 0;
  }

  return Math.max(0, new Date(normalized.expires_at).getTime() - now);
}

export function loadRuumrPlusActivation(userId) {
  const storage = getStorage();
  const key = getActivationStorageKey(userId);
  if (!storage || !key.trim()) {
    return null;
  }

  try {
    const raw = storage.getItem(key);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    return normalizeRuumrPlusActivation(parsed);
  } catch {
    try {
      storage.removeItem(key);
    } catch {
      // Ignore storage cleanup failures.
    }
    return null;
  }
}

export function saveRuumrPlusActivation(userId, record = null) {
  const storage = getStorage();
  const key = getActivationStorageKey(userId);
  const normalized = normalizeRuumrPlusActivation(record);

  if (!storage || !key.trim() || !normalized) {
    return null;
  }

  try {
    storage.setItem(key, JSON.stringify(normalized));
    return normalized;
  } catch {
    return null;
  }
}

export function clearRuumrPlusActivation(userId) {
  const storage = getStorage();
  const key = getActivationStorageKey(userId);
  if (!storage || !key.trim()) {
    return;
  }

  try {
    storage.removeItem(key);
  } catch {
    // Ignore storage cleanup failures.
  }
}

export function markRuumrPlusActivationIntent(intent = {}) {
  const storage = getSessionStorage();
  if (!storage) {
    return null;
  }

  const payload = {
    ...intent,
    requested_at: new Date().toISOString(),
  };

  try {
    storage.setItem(PENDING_INTENT_STORAGE_KEY, JSON.stringify(payload));
    return payload;
  } catch {
    return null;
  }
}

export function consumeRuumrPlusActivationIntent() {
  const storage = getSessionStorage();
  if (!storage) {
    return null;
  }

  try {
    const raw = storage.getItem(PENDING_INTENT_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    storage.removeItem(PENDING_INTENT_STORAGE_KEY);
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    try {
      storage.removeItem(PENDING_INTENT_STORAGE_KEY);
    } catch {
      // Ignore storage cleanup failures.
    }
    return null;
  }
}

/**
 * @param {{
 *   response?: Record<string, any>;
 *   recommendations?: any[];
 *   matchedCount?: number | null;
 *   candidateCount?: number | null;
 *   source?: string;
 * }} options
 * @returns {Record<string, any> | null}
 */
export function buildRuumrPlusActivationRecord({
  response = {},
  recommendations = [],
  matchedCount = null,
  candidateCount = null,
  source = "live",
} = {}) {
  const activatedAt = toIso(
    response.activated_at ??
      response.cached_at ??
      response.generated_at ??
      new Date().toISOString()
  ) ?? new Date().toISOString();

  return normalizeRuumrPlusActivation({
    source,
    activated_at: activatedAt,
    expires_at: addWindow(activatedAt),
    request_id: response.request_id ?? null,
    generated_at: response.generated_at ?? activatedAt,
    client_contract: response.client_contract ?? null,
    matched_count: matchedCount ?? recommendations.length,
    candidate_count: candidateCount ?? 0,
    recommendations,
  });
}
