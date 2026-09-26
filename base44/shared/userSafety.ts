export function safetyError(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

export const pairKey = (a, b) => JSON.stringify([String(a), String(b)].sort());

export async function allRows(entity, query) {
  const rows = [];
  for (let skip = 0; ; ) {
    const page = await entity.filter(query, 'id', 100, skip);
    if (!Array.isArray(page)) throw new Error('Invalid entity response');
    if (!page.length) return rows;
    rows.push(...page);
    skip += page.length;
  }
}

export async function isBlocked(sr, a, b) {
  return (await sr.UserBlock.filter({ pair_key: pairKey(a, b) }, 'id', 1)).length > 0;
}

export async function requireOpenChat(sr, matchId, userId) {
  const rows = await sr.Match.filter({ id: matchId }, 'id', 1);
  const match = rows[0];
  if (!match || ![match.user1_id, match.user2_id].includes(userId)) {
    throw safetyError('Chat unavailable', 404);
  }
  if (match.status === 'blocked' || await isBlocked(sr, match.user1_id, match.user2_id)) {
    throw safetyError('Chat unavailable', 403);
  }
  return match;
}

async function remove(entity, id) {
  try {
    const result = await entity.delete(id);
    if (result?.success === false) throw new Error('Deletion not acknowledged');
  } catch (error) {
    if (Number(error?.status ?? error?.response?.status) !== 404) throw error;
  }
}

export async function drain(entity, query) {
  const seen = new Set();
  for (;;) {
    const rows = await entity.filter(query, 'id', 100, 0);
    if (!Array.isArray(rows)) throw new Error('Invalid entity response');
    if (!rows.length) return;
    for (const row of rows) {
      if (!row.id || seen.has(row.id)) throw new Error('Deletion could not be verified');
      seen.add(row.id);
      await remove(entity, row.id);
    }
  }
}

// The block is durable before cleanup starts. It is never deleted by this routine.
// Match ids remain available for retries even after the visible conversation is gone.
export async function cleanupBlock(sr, block) {
  const matches = [
    ...await allRows(sr.Match, { user1_id: block.blocker_id, user2_id: block.blocked_id }),
    ...await allRows(sr.Match, { user1_id: block.blocked_id, user2_id: block.blocker_id }),
  ];
  const ids = [...new Set([...(block.match_ids || []), ...matches.map(m => m.id)])];
  await sr.UserBlock.update(block.id, { match_ids: ids, cleanup_pending: true });
  for (const match of matches) await sr.Match.update(match.id, { status: 'blocked' });
  for (const matchId of ids) {
    await drain(sr.Message, { match_id: matchId });
    await drain(sr.TypingStatus, { match_id: matchId });
    await remove(sr.Match, matchId);
  }
  await sr.UserBlock.update(block.id, { cleanup_pending: false });
}

