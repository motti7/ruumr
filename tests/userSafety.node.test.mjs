import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const shared = read('base44/shared/userSafety.ts').replace(/^export /gm, '');
const handlerCode = read('base44/functions/userSafety/entry.ts').replace(/^import .*;\r?\n/gm, '');
function fixture(options = {}) {
  const rows = { UserBlock: [], UserReport: [], Match: [
    { id: 'chat', user1_id: 'a', user2_id: 'b', status: 'active' },
    { id: 'unrelated', user1_id: 'b', user2_id: 'c', status: 'active' },
  ], Message: [{ id: 'msg', match_id: 'chat', sender_id: 'b', content: 'private', is_read: false }],
  TypingStatus: [], Profile: [{ id: 'profile', user_id: 'b', name: 'B', about_me: 'public bio', email: 'private@example.com' }] };
  const events = [];
  let next = 0;
  const entities = Object.fromEntries(Object.keys(rows).map(name => [name, {
    filter: async (query, _sort, limit = 100, skip = 0) => rows[name]
      .filter(row => Object.entries(query).every(([k, v]) => row[k] === v))
      .slice(skip, skip + Math.min(limit, options.cap ?? limit)).map(row => ({ ...row })),
    create: async data => {
      const row = { ...data, id: `new${next++}` }; rows[name].push(row); events.push('create:' + name);
      await options.afterCreate?.(name, row, rows);
      return { ...row };
    },
    update: async (id, data) => {
      const row = rows[name].find(r => r.id === id);
      if (!row) throw Object.assign(new Error('missing'), { status: 404 });
      Object.assign(row, data); return { ...row };
    },
    delete: async id => {
      if (options.failDelete?.(name, id)) throw new Error('offline');
      rows[name] = rows[name].filter(row => row.id !== id); events.push('delete:' + name); return { success: true };
    },
  }]));
  let handler;
  vm.runInNewContext(shared + '\n' + handlerCode, {
    Response, console,
    createClientFromRequest: req => ({
      auth: { me: async () => req.headers.get('x-user') ? { id: req.headers.get('x-user') } : null },
      asServiceRole: { entities },
    }),
    Deno: { serve(fn) { handler = fn; } },
  });
  const call = async (body, user = 'a') => {
    const response = await handler(new Request('https://local/userSafety', {
      method: 'POST', headers: user ? { 'x-user': user } : {}, body: JSON.stringify(body),
    }));
    return { status: response.status, data: await response.json() };
  };
  return { rows, events, call };
}

test('report uses server identity and snapshot; ignores attacker-supplied target and status', async () => {
  const f = fixture();
  assert.equal((await f.call({ action: 'report', profile_id: 'profile', reason: 'spam', reporter_id: 'c', status: 'resolved' })).status, 200);
  const report = f.rows.UserReport[0];
  assert.equal(report.reporter_id, 'a'); assert.equal(report.reported_user_id, 'b');
  assert.equal(report.status, 'new'); assert.equal(report.profile_snapshot.about_me, 'public bio');
  assert.equal(report.profile_snapshot.email, undefined);
});
test('invalid and self reports are rejected, open duplicate is idempotent', async () => {
  const f = fixture();
  const report = { action: 'report', profile_id: 'profile', reason: 'spam' };
  assert.equal((await f.call(report, 'b')).status, 400);
  assert.equal((await f.call({ ...report, reason: 'invented' })).status, 400);
  assert.equal((await f.call({ ...report, details: 'x'.repeat(2001) })).status, 400);
  await f.call(report); await f.call(report);
  assert.equal(f.rows.UserReport.length, 1);
});
test('blocking requires explicit confirmation and actual chat membership', async () => {
  const f = fixture();
  assert.equal((await f.call({ action: 'block', match_id: 'chat' })).status, 400);
  assert.equal((await f.call({ action: 'block', match_id: 'unrelated', confirm: true })).status, 404);
  assert.equal(f.rows.UserBlock.length, 0);
});
test('block deletes all duplicate chats and paginated messages, preserving unrelated chats and reports', async () => {
  const f = fixture({ cap: 7 });
  f.rows.Match.push({ id: 'reverse', user1_id: 'b', user2_id: 'a', status: 'active' });
  f.rows.Message.push(...Array.from({ length: 225 }, (_, i) => ({ id: `m${i}`, match_id: 'reverse' })),
    { id: 'keep', match_id: 'unrelated' });
  f.rows.TypingStatus.push({ id: 'typing', match_id: 'chat' });
  await f.call({ action: 'report', profile_id: 'profile', reason: 'harassment' });
  const result = await f.call({ action: 'block', match_id: 'chat', confirm: true });
  assert.deepEqual(result.data, { success: true, cleanup_pending: false });
  assert.deepEqual(f.rows.Message.map(r => r.id), ['keep']);
  assert.deepEqual(f.rows.Match.map(r => r.id), ['unrelated']);
  assert.equal(f.rows.TypingStatus.length, 0); assert.equal(f.rows.UserReport.length, 1);
  assert.equal(f.rows.Profile.length, 1);
  assert.equal((await f.call({ action: 'block', match_id: 'chat', confirm: true })).status, 200);
  assert.equal(f.rows.UserBlock.length, 1);
});
test('cleanup failure keeps durable block and retry removes remaining messages', async () => {
  let failed = true;
  const f = fixture({ failDelete: name => failed && name === 'Message' });
  const result = await f.call({ action: 'block', match_id: 'chat', confirm: true });
  assert.equal(result.data.cleanup_pending, true);
  for (const user of ['a', 'b']) for (const action of ['send', 'typing', 'messages', 'chat_status']) {
    assert.equal((await f.call({ action, match_id: 'chat', content: 'blocked' }, user)).status, 403);
  }
  failed = false;
  assert.equal((await f.call({ action: 'block', match_id: 'chat', confirm: true })).data.cleanup_pending, false);
});
test('recreated match does not bypass durable block in either direction', async () => {
  const f = fixture();
  await f.call({ action: 'block', match_id: 'chat', confirm: true });
  f.rows.Match.push({ id: 'newchat', user1_id: 'b', user2_id: 'a', status: 'active' });
  for (const user of ['a', 'b']) assert.equal((await f.call({ action: 'send', match_id: 'newchat', content: 'x' }, user)).status, 403);
});
test('send ignores forged sender/participants; nonmembers cannot read or send', async () => {
  const f = fixture();
  const result = await f.call({ action: 'send', match_id: 'chat', content: ' hi ', sender_id: 'b', user2_id: 'c' });
  assert.equal(result.data.record.sender_id, 'a'); assert.equal(result.data.record.user2_id, 'b');
  assert.equal(result.data.record.content, 'hi');
  for (const action of ['send', 'messages', 'typing']) assert.equal((await f.call({ action, match_id: 'chat', content: 'x' }, 'c')).status, 404);
});
test('a block racing send removes the in-flight message', async () => {
  const f = fixture({ afterCreate: (name, row, rows) => {
    if (name === 'Message') rows.UserBlock.push({ id: 'block', pair_key: JSON.stringify(['a', 'b']), blocker_id: 'a', blocked_id: 'b' });
  } });
  assert.equal((await f.call({ action: 'send', match_id: 'chat', content: 'race' })).status, 403);
  assert.equal(f.rows.Message.some(m => m.content === 'race'), false);
});
test('mark read changes only the read flag and requires recipient membership', async () => {
  const f = fixture();
  assert.equal((await f.call({ action: 'mark_read', message_id: 'msg', content: 'forged' }, 'c')).status, 404);
  assert.equal((await f.call({ action: 'mark_read', message_id: 'msg' }, 'b')).status, 400);
  await f.call({ action: 'mark_read', message_id: 'msg', content: 'forged' });
  assert.equal(f.rows.Message[0].is_read, true); assert.equal(f.rows.Message[0].content, 'private');
});
test('blocked ids are symmetric and expose neither reports nor who initiated blocking', async () => {
  const f = fixture(); await f.call({ action: 'block', match_id: 'chat', confirm: true });
  assert.deepEqual((await f.call({ action: 'blocked_users' })).data, { user_ids: ['b'] });
  assert.deepEqual((await f.call({ action: 'blocked_users' }, 'b')).data, { user_ids: ['a'] });
  assert.deepEqual((await f.call({ action: 'blocked_users' }, 'c')).data, { user_ids: [] });
  assert.equal((await f.call({ action: 'blocked_users' }, null)).status, 401);
});
test('entity policies prevent direct message writes/reads and public report or block access', () => {
  for (const name of ['UserBlock', 'UserReport', 'Message']) {
    const { rls } = JSON.parse(read(`base44/entities/${name}.jsonc`));
    assert.equal(rls.create, false);
    assert.deepEqual(rls.read, { user_condition: { role: 'admin' } });
    assert.deepEqual(rls.update, { user_condition: { role: 'admin' } });
  }
});

test('unread summaries exclude blocked chats and do not expose message text', async () => {
  const f = fixture();
  let result = await f.call({ action: 'unread' });
  assert.equal(result.data.records.length, 1);
  assert.equal(result.data.records[0].content, undefined);
  await f.call({ action: 'block', match_id: 'chat', confirm: true });
  result = await f.call({ action: 'unread' });
  assert.deepEqual(result.data.records, []);
});

test('typing cleanup cannot delete another user signal', async () => {
  const f = fixture();
  const result = await f.call({ action: 'typing', match_id: 'chat' });
  const id = result.data.record.id;
  await f.call({ action: 'stop_typing', typing_id: id }, 'b');
  assert.equal(f.rows.TypingStatus.length, 1);
  await f.call({ action: 'stop_typing', typing_id: id });
  assert.equal(f.rows.TypingStatus.length, 0);
});

