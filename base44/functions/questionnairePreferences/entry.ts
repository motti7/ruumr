import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const QUESTION_IDS = [
  'q_smoking',
  'q_partners',
  'q_pets',
  'q_cleaning_strictness',
  'q_shopping',
  'q_dishes',
  'q_ac',
  'q_hosting',
] as const;

const WEIGHTS: Record<string, number> = {
  q_smoking: 1.5,
  q_partners: 1,
  q_pets: 1.5,
  q_cleaning_strictness: 1.25,
  q_shopping: 1,
  q_dishes: 1,
  q_ac: 0.75,
  q_hosting: 1,
};

const SOURCES = new Set(['legacy_import', 'match_questionnaire', 'plus_activation', 'plus_edit']);

function normalizeAnswers(value: unknown) {
  const input = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const answers: Record<string, 'a' | 'b'> = {};
  for (const questionId of QUESTION_IDS) {
    if (input[questionId] === 'a' || input[questionId] === 'b') {
      answers[questionId] = input[questionId] as 'a' | 'b';
    }
  }
  return answers;
}

function isComplete(answers: Record<string, unknown>) {
  return QUESTION_IDS.every((questionId) => answers[questionId] === 'a' || answers[questionId] === 'b');
}

function toTimestamp(value: unknown) {
  const timestamp = Date.parse(String(value || ''));
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function publicPreference(record: Record<string, unknown> | null) {
  if (!record) return null;
  const answers = normalizeAnswers(record.answers);
  if (!isComplete(answers)) return null;
  return {
    id: record.id,
    user_id: record.user_id,
    version: Number(record.version) || 1,
    completed_at: record.completed_at,
    source: record.source,
    source_match_id: record.source_match_id || null,
    answers,
  };
}

async function findCanonical(sr: Record<string, any>, userId: string) {
  const records = await sr.QuestionnairePreference.filter({ user_id: userId });
  return (Array.isArray(records) ? records : [])
    .filter((record) => publicPreference(record))
    .sort((left, right) => toTimestamp(right.completed_at || right.updated_date) - toTimestamp(left.completed_at || left.updated_date))[0] || null;
}

async function findLatestLegacy(sr: Record<string, any>, userId: string) {
  const rows = await sr.CharterAnswer.filter({ user_id: userId });
  const groups = new Map<string, {
    answers: Record<string, 'a' | 'b'>;
    answerTimestamps: Record<string, number>;
    completedAt: number;
  }>();

  for (const row of Array.isArray(rows) ? rows : []) {
    const matchId = String(row.match_id || '').trim();
    if (!matchId) continue;
    const group = groups.get(matchId) || { answers: {}, answerTimestamps: {}, completedAt: 0 };
    const rowTimestamp = Math.max(toTimestamp(row.updated_date), toTimestamp(row.created_date));
    if (QUESTION_IDS.includes(row.question_id) && (row.answer === 'a' || row.answer === 'b')) {
      if (rowTimestamp >= (group.answerTimestamps[row.question_id] || 0)) {
        group.answers[row.question_id] = row.answer;
        group.answerTimestamps[row.question_id] = rowTimestamp;
      }
    }
    group.completedAt = Math.max(group.completedAt, rowTimestamp);
    groups.set(matchId, group);
  }

  return [...groups.entries()]
    .filter(([, group]) => isComplete(group.answers))
    .sort((left, right) => right[1].completedAt - left[1].completedAt)[0] || null;
}

async function upsertPreference(
  sr: Record<string, any>,
  userId: string,
  answers: Record<string, 'a' | 'b'>,
  source: string,
  sourceMatchId: string | null,
  completedAt: string,
) {
  const existing = await sr.QuestionnairePreference.filter({ user_id: userId });
  const records = Array.isArray(existing) ? existing : [];
  const data = {
    user_id: userId,
    version: 1,
    completed_at: completedAt,
    source,
    source_match_id: sourceMatchId || undefined,
    answers,
  };

  const saved = records[0]
    ? await sr.QuestionnairePreference.update(records[0].id, data)
    : await sr.QuestionnairePreference.create(data);

  for (const duplicate of records.slice(1)) {
    try { await sr.QuestionnairePreference.delete(duplicate.id); } catch { /* best effort */ }
  }
  return saved;
}

async function resolveForUser(sr: Record<string, any>, userId: string, importLegacy = true) {
  const existing = await findCanonical(sr, userId);
  if (existing) {
    return { complete: true, preference: publicPreference(existing), imported: false };
  }
  if (!importLegacy) return { complete: false, preference: null, imported: false };

  const legacy = await findLatestLegacy(sr, userId);
  if (!legacy) return { complete: false, preference: null, imported: false };
  const completedAt = legacy[1].completedAt
    ? new Date(legacy[1].completedAt).toISOString()
    : new Date().toISOString();
  const saved = await upsertPreference(sr, userId, legacy[1].answers, 'legacy_import', legacy[0], completedAt);
  return { complete: true, preference: publicPreference(saved), imported: true };
}

function calculateCompatibility(leftValue: unknown, rightValue: unknown) {
  const left = normalizeAnswers(leftValue);
  const right = normalizeAnswers(rightValue);
  const agreements: string[] = [];
  const disagreements: string[] = [];
  let agreedWeight = 0;
  let totalWeight = 0;

  for (const questionId of QUESTION_IDS) {
    if (!left[questionId] || !right[questionId]) continue;
    totalWeight += WEIGHTS[questionId];
    if (left[questionId] === right[questionId]) {
      agreedWeight += WEIGHTS[questionId];
      agreements.push(questionId);
    } else {
      disagreements.push(questionId);
    }
  }

  return {
    compared_count: agreements.length + disagreements.length,
    score: totalWeight > 0 ? Math.round((agreedWeight / totalWeight) * 100) : null,
    agreements,
    disagreements,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const currentUser = await base44.auth.me();
    if (!currentUser) return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || '').trim();
    const sr = base44.asServiceRole.entities;

    if (action === 'resolve_current') {
      return Response.json({ ok: true, result: await resolveForUser(sr, String(currentUser.id)) });
    }

    if (action === 'save_current') {
      const answers = normalizeAnswers(body.answers);
      if (!isComplete(answers)) {
        return Response.json({ ok: false, error: 'questionnaire_incomplete' }, { status: 400 });
      }
      const source = SOURCES.has(String(body.source)) ? String(body.source) : 'plus_edit';
      const before = await findCanonical(sr, String(currentUser.id));
      const completedAt = new Date(body.completed_at || Date.now()).toISOString();
      const saved = await upsertPreference(
        sr,
        String(currentUser.id),
        answers,
        source,
        body.source_match_id ? String(body.source_match_id) : null,
        completedAt,
      );
      return Response.json({
        ok: true,
        result: {
          complete: true,
          preference: publicPreference(saved),
          imported: false,
          was_complete: Boolean(before),
        },
      });
    }

    if (action === 'match_summary') {
      const matchId = String(body.match_id || '').trim();
      if (!matchId) return Response.json({ ok: false, error: 'match_id_required' }, { status: 400 });
      const match = await sr.Match.get(matchId);
      const currentUserId = String(currentUser.id);
      if (!match || (String(match.user1_id) !== currentUserId && String(match.user2_id) !== currentUserId)) {
        return Response.json({ ok: false, error: 'match_not_found' }, { status: 404 });
      }
      const otherUserId = String(match.user1_id) === currentUserId ? String(match.user2_id) : String(match.user1_id);
      const [mine, theirs] = await Promise.all([
        resolveForUser(sr, currentUserId),
        resolveForUser(sr, otherUserId),
      ]);
      return Response.json({
        ok: true,
        result: {
          match_id: matchId,
          current_user_complete: mine.complete,
          other_user_complete: theirs.complete,
          current_preference: mine.preference,
          compatibility: mine.preference && theirs.preference
            ? calculateCompatibility(mine.preference.answers, theirs.preference.answers)
            : null,
        },
      });
    }

    return Response.json({ ok: false, error: 'unsupported_action' }, { status: 400 });
  } catch (error) {
    console.error('[questionnairePreferences]', error);
    return Response.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
});
