import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const QUESTION_IDS = ['q_smoking','q_partners','q_pets','q_cleaning_strictness','q_shopping','q_dishes','q_ac','q_hosting'];

function isComplete(answers) {
  return QUESTION_IDS.every(q => answers[q] === 'a' || answers[q] === 'b');
}

function toTimestamp(value) {
  const ts = Date.parse(String(value || ''));
  return Number.isFinite(ts) ? ts : 0;
}

function buildLegacyFromCharterAnswers(rows) {
  const groups = new Map();
  for (const row of rows) {
    const matchId = String(row.match_id || '').trim();
    if (!matchId) continue;
    const group = groups.get(matchId) || { answers: {}, answerTimestamps: {}, completedAt: 0 };
    const rowTs = Math.max(toTimestamp(row.updated_date), toTimestamp(row.created_date));
    if (QUESTION_IDS.includes(row.question_id) && (row.answer === 'a' || row.answer === 'b')) {
      if (rowTs >= (group.answerTimestamps[row.question_id] || 0)) {
        group.answers[row.question_id] = row.answer;
        group.answerTimestamps[row.question_id] = rowTs;
      }
    }
    group.completedAt = Math.max(group.completedAt, rowTs);
    groups.set(matchId, group);
  }
  return [...groups.entries()]
    .filter(([, g]) => isComplete(g.answers))
    .sort((a, b) => b[1].completedAt - a[1].completedAt)[0] || null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const sr = base44.asServiceRole.entities;

    // Get all CharterAnswers grouped by user
    const allAnswers = await sr.CharterAnswer.list('-created_date', 2000);
    const byUser = new Map();
    for (const row of allAnswers) {
      const uid = String(row.user_id || '').trim();
      if (!uid) continue;
      if (!byUser.has(uid)) byUser.set(uid, []);
      byUser.get(uid).push(row);
    }

    const results = { processed: 0, created: 0, skipped_already_exists: 0, skipped_incomplete: 0, errors: [] };

    for (const [userId, rows] of byUser.entries()) {
      results.processed++;
      try {
        // Skip if already has QuestionnairePreference
        const existing = await sr.QuestionnairePreference.filter({ user_id: userId });
        if (existing.length > 0 && isComplete(existing[0].answers || {})) {
          results.skipped_already_exists++;
          console.log(`⏭️  User ${userId} already has complete preference`);
          continue;
        }

        // Try to build from legacy CharterAnswers
        const legacy = buildLegacyFromCharterAnswers(rows);
        if (!legacy) {
          results.skipped_incomplete++;
          console.log(`⚠️  User ${userId} has no complete legacy questionnaire`);
          continue;
        }

        const [matchId, group] = legacy;
        const completedAt = group.completedAt ? new Date(group.completedAt).toISOString() : new Date().toISOString();
        const data = {
          user_id: userId,
          version: 1,
          completed_at: completedAt,
          source: 'legacy_import',
          source_match_id: matchId,
          answers: group.answers,
        };

        if (existing.length > 0) {
          await sr.QuestionnairePreference.update(existing[0].id, data);
        } else {
          await sr.QuestionnairePreference.create(data);
        }

        results.created++;
        console.log(`✅ Backfilled user ${userId} (match: ${matchId})`);
      } catch (e) {
        results.errors.push({ userId, error: e.message });
        console.error(`❌ Error for user ${userId}:`, e.message);
      }
    }

    console.log('📊 Backfill complete:', results);
    return Response.json({ success: true, results });
  } catch (error) {
    console.error('Fatal error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});