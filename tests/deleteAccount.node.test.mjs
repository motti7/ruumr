import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = readFileSync(new URL('../base44/functions/deleteAccount/entry.ts', import.meta.url), 'utf8')
  .replace(/^import .*;\r?\n/, '');
const names = ['User', 'Profile', 'Match', 'Message', 'TypingStatus', 'Swipe', 'CharterAnswer',
  'QuestionnairePreference', 'Review', 'GroupMessage', 'PageView', 'PendingSubscription', 'TeamInvite'];

function fixture(options = {}) {
  const rows = Object.fromEntries(names.map(name => [name, []]));
  rows.User.push({ id: 'self', email: 'self@example.com' }, { id: 'other' });
  const events = [];
  const entities = Object.fromEntries(names.map(name => [name, {
    filter: async (query, sort, limit, skip) => {
      assert.equal(skip, 0);
      return rows[name].filter(row => Object.entries(query).every(([key, value]) => row[key] === value))
        .slice(0, Math.min(limit, options.cap ?? limit)).map(row => ({ ...row }));
    },
    delete: async (id) => {
      events.push(`${name}:${id}`);
      const behavior = options.onDelete?.(name, id);
      if (behavior === 'throw') throw Object.assign(new Error('temporary'), { status: 503 });
      if (behavior === 'forbidden') throw Object.assign(new Error('forbidden'), { status: 403 });
      if (behavior === 'false') return { success: false };
      if (behavior === 'noop') return { success: true };
      rows[name] = rows[name].filter(row => row.id !== id);
      if (behavior === '404') throw Object.assign(new Error('gone'), { status: 404 });
      return { success: true };
    },
  }]));
  let handler;
  vm.runInNewContext(source, {
    Response, Date, console: { error() {} }, setTimeout: fn => fn(),
    createClientFromRequest: () => ({
      auth: { me: async () => options.anonymous ? null : rows.User.find(row => row.id === 'self') },
      asServiceRole: { entities },
      functions: { invoke: async () => {
        events.push('external');
        if (options.externalThrows) throw new Error('offline');
        return options.externalResult ?? { data: { ok: true } };
      } },
    }),
    Deno: { serve(fn) { handler = fn; } },
  });
  return { rows, events, call: (method = 'POST') => handler(new Request('https://test/delete', {
    method, ...(method === 'POST' ? { body: JSON.stringify({ userId: 'other' }) } : {}),
  })) };
}

test('deletes only authenticated user data across capped pages, including old profiles', async () => {
  const f = fixture({ cap: 7 });
  f.rows.Profile.push(...Array.from({ length: 2100 }, (_, i) => ({ id: `other-${i}`, user_id: 'other' })),
    { id: 'old-self', user_id: 'self' });
  f.rows.PageView.push(...Array.from({ length: 215 }, (_, i) => ({ id: `view-${i}`, user_id: 'self' })));
  f.rows.TeamInvite.push({ id: 'invite', invitee_email: 'self@example.com' });
  const response = await f.call();
  assert.equal(response.status, 200);
  assert.equal((await response.json()).success, true);
  assert.equal(f.rows.Profile.length, 2100);
  assert.equal(f.rows.PageView.length, 0);
  assert.equal(f.rows.TeamInvite.length, 0);
  assert.deepEqual(f.rows.User, [{ id: 'other' }]);
  assert.equal(f.events.at(-1), 'User:self');
});

test('child failure preserves parent match and user; retry completes remaining cleanup', async () => {
  let fail = true;
  const f = fixture({ onDelete: name => fail && name === 'Message' ? 'throw' : undefined });
  f.rows.Match.push({ id: 'm', user1_id: 'self', user2_id: 'other' });
  f.rows.Message.push({ id: 'msg', match_id: 'm' });
  assert.equal((await f.call()).status, 503);
  assert.equal(f.rows.Match.length, 1);
  assert.equal(f.rows.User.length, 2);
  fail = false;
  assert.equal((await f.call()).status, 200);
  assert.equal(f.rows.Match.length, 0);
  assert.equal(f.rows.Message.length, 0);
});

for (const behavior of ['throw', 'false', 'noop', 'forbidden']) {
  test(`User deletion ${behavior} never reports success`, async () => {
    const f = fixture({ onDelete: name => name === 'User' ? behavior : undefined });
    const response = await f.call();
    assert.equal(response.status, 503);
    assert.equal((await response.json()).success, false);
    assert.equal(f.rows.User.length, 2);
  });
}

test('unacknowledged or unavailable external cleanup keeps account retryable', async () => {
  for (const options of [{ externalThrows: true }, { externalResult: { data: { ok: false } } },
    { externalResult: { data: { ok: true, result: { success: false } } } }]) {
    const f = fixture(options);
    assert.equal((await f.call()).status, 503);
    assert.equal(f.rows.User.length, 2);
  }
});

test('concurrent deletion returning HTTP 404 is idempotent', async () => {
  const f = fixture({ onDelete: () => '404' });
  f.rows.Profile.push({ id: 'p', user_id: 'self' });
  assert.equal((await f.call()).status, 200);
});

test('rejects anonymous and non-POST requests without side effects', async () => {
  const f = fixture({ anonymous: true });
  assert.equal((await f.call()).status, 401);
  assert.equal((await f.call('GET')).status, 405);
  assert.deepEqual(f.events, []);
});
