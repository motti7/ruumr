import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * One-off migration: denormalize match participants (user1_id / user2_id) onto
 * existing Message records so the Message read/update RLS can authorize the
 * counterparty with a direct field equality check instead of the unreliable
 * Match subquery. New messages already carry these fields (see
 * src/lib/messagePayload.js); this backfills the legacy ones.
 *
 * Admin only. Idempotent — messages that already have both participant fields
 * matching their match are skipped.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const sr = base44.asServiceRole.entities;

    // Index matches by id so we can resolve each message's participants.
    const allMatches = await sr.Match.list('-created_date', 5000);
    const matchById = new Map();
    for (const m of allMatches) {
      matchById.set(String(m.id), m);
    }

    const allMessages = await sr.Message.list('-created_date', 10000);

    const results = {
      processed: 0,
      updated: 0,
      skipped_already_set: 0,
      skipped_no_match: 0,
      errors: [],
    };

    for (const msg of allMessages) {
      results.processed++;
      try {
        const match = matchById.get(String(msg.match_id));
        if (!match || !match.user1_id || !match.user2_id) {
          results.skipped_no_match++;
          continue;
        }

        const needsUpdate =
          msg.user1_id !== match.user1_id || msg.user2_id !== match.user2_id;
        if (!needsUpdate) {
          results.skipped_already_set++;
          continue;
        }

        await sr.Message.update(msg.id, {
          user1_id: match.user1_id,
          user2_id: match.user2_id,
        });
        results.updated++;
      } catch (e) {
        results.errors.push({ messageId: msg.id, error: e.message });
        console.error(`❌ Error for message ${msg.id}:`, e.message);
      }
    }

    console.log('📊 Message participant backfill complete:', results);
    return Response.json({ success: true, results });
  } catch (error) {
    console.error('Fatal error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
