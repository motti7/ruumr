import { base44 } from "@/api/base44Client";
import { User } from "@/entities/User";
import { isRuumrSimulatorMode } from "@/lib/simulatorMode";
import {
  CHARTER_QUESTION_IDS,
  calculateCharterCompatibility,
  isCharterComplete,
  normalizeCharterAnswers,
  selectLatestCompleteLegacyQuestionnaire,
} from "@/lib/charterCompletion";

function unwrap(raw) {
  const body = raw && typeof raw === "object" && raw.data && !("ok" in raw) ? raw.data : raw;
  if (body?.ok === false) throw new Error(body.error || "Questionnaire request failed");
  return body?.result ?? body;
}

/**
 * @typedef {Object} SaveQuestionnairePreferenceOptions
 * @property {Record<string, "a" | "b">} answers
 * @property {"legacy_import" | "match_questionnaire" | "plus_activation" | "plus_edit"} source
 * @property {string | null} [sourceMatchId]
 * @property {string | null} [completedAt]
 */

function preferencePayload(record) {
  if (!record || !isCharterComplete(record.answers)) return null;
  return {
    id: record.id,
    user_id: record.user_id,
    version: Number(record.version) || 1,
    completed_at: record.completed_at,
    source: record.source,
    source_match_id: record.source_match_id ?? null,
    answers: normalizeCharterAnswers(record.answers),
  };
}

async function simulatorResolveCurrent() {
  const user = await User.me();
  const existing = await base44.entities.QuestionnairePreference.filter({ user_id: user.id }, "-completed_at");
  if (existing[0] && isCharterComplete(existing[0].answers)) {
    return { complete: true, preference: preferencePayload(existing[0]), imported: false };
  }

  const legacy = await base44.entities.CharterAnswer.filter({ user_id: user.id });
  const latest = selectLatestCompleteLegacyQuestionnaire(legacy);
  if (!latest) return { complete: false, preference: null, imported: false };

  return saveQuestionnairePreference({
    answers: latest.answers,
    source: "legacy_import",
    sourceMatchId: latest.match_id,
    completedAt: latest.completed_at || new Date().toISOString(),
  }).then((result) => ({ ...result, imported: true }));
}

/** @param {SaveQuestionnairePreferenceOptions} options */
async function simulatorSave({ answers, source, sourceMatchId = null, completedAt = null }) {
  const user = await User.me();
  const normalized = normalizeCharterAnswers(answers);
  if (!isCharterComplete(normalized)) throw new Error("questionnaire_incomplete");
  const existing = await base44.entities.QuestionnairePreference.filter({ user_id: user.id });
  const wasComplete = Boolean(existing[0] && isCharterComplete(existing[0].answers));
  const data = {
    user_id: user.id,
    version: 1,
    completed_at: completedAt || new Date().toISOString(),
    source,
    source_match_id: sourceMatchId || undefined,
    answers: normalized,
  };
  const saved = existing[0]
    ? await base44.entities.QuestionnairePreference.update(existing[0].id, data)
    : await base44.entities.QuestionnairePreference.create(data);
  return { complete: true, preference: preferencePayload(saved), imported: false, was_complete: wasComplete };
}

async function simulatorMatchSummary(matchId) {
  const user = await User.me();
  const matches = [
    ...(await base44.entities.Match.filter({ user1_id: user.id })),
    ...(await base44.entities.Match.filter({ user2_id: user.id })),
  ];
  const match = matches.find((item) => String(item.id) === String(matchId));
  if (!match) throw new Error("match_not_found");
  const otherUserId = String(match.user1_id) === String(user.id) ? match.user2_id : match.user1_id;
  const [mine, theirs] = await Promise.all([
    base44.entities.QuestionnairePreference.filter({ user_id: user.id }, "-completed_at"),
    base44.entities.QuestionnairePreference.filter({ user_id: otherUserId }, "-completed_at"),
  ]);
  const myPreference = preferencePayload(mine[0]);
  const theirPreference = preferencePayload(theirs[0]);
  return {
    match_id: matchId,
    current_user_complete: Boolean(myPreference),
    other_user_complete: Boolean(theirPreference),
    current_preference: myPreference,
    compatibility: myPreference && theirPreference
      ? calculateCharterCompatibility(myPreference.answers, theirPreference.answers)
      : null,
  };
}

export async function resolveCurrentQuestionnairePreference() {
  if (isRuumrSimulatorMode()) return simulatorResolveCurrent();
  return unwrap(await base44.functions.invoke("questionnairePreferences", { action: "resolve_current" }));
}

/** @param {SaveQuestionnairePreferenceOptions} options */
export async function saveQuestionnairePreference({
  answers,
  source,
  sourceMatchId = null,
  completedAt = null,
}) {
  if (isRuumrSimulatorMode()) {
    return simulatorSave({ answers, source, sourceMatchId, completedAt });
  }
  return unwrap(await base44.functions.invoke("questionnairePreferences", {
    action: "save_current",
    answers,
    source,
    source_match_id: sourceMatchId,
    completed_at: completedAt,
  }));
}

export async function fetchQuestionnaireMatchSummary(matchId) {
  if (isRuumrSimulatorMode()) return simulatorMatchSummary(matchId);
  return unwrap(await base44.functions.invoke("questionnairePreferences", {
    action: "match_summary",
    match_id: matchId,
  }));
}

export { CHARTER_QUESTION_IDS };
