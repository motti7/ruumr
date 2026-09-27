import test from 'node:test';
import assert from 'node:assert/strict';
import { prepare, groupUrl, start, collect, normalize } from './pilot.mjs';

const config = { groups: [{ url: 'https://www.facebook.com/groups/example/', city: 'tel_aviv' }] };
const response = data => ({ ok: true, json: async () => data });

test('paid starts carry a dollar cap, timeout, date window and no automatic restarts', async () => {
  const plan = prepare(config, new Date('2026-09-23T00:00:00Z'));
  let calls = 0;
  await start(plan, 'test-secret', async (url, options) => {
    calls++;
    assert.equal(new URL(url).searchParams.get('maxTotalChargeUsd'), '1');
    assert.equal(new URL(url).searchParams.get('restartOnError'), 'false');
    assert.equal(options.headers.Authorization, 'Bearer test-secret');
    assert.ok(!url.includes('test-secret'));
    const body = JSON.parse(options.body);
    assert.equal(body.onlyPostsNewerThan, '2026-09-21T00:00:00.000Z');
    assert.equal(body.resultsLimit, 20);
    return response({ data: { id: 'run123' } });
  });
  assert.equal(calls, 1);
});

test('rejects missing groups, unsafe URLs and unbounded configuration', () => {
  for (const bad of ['https://facebook.com.evil.test/groups/a', 'http://facebook.com/groups/a',
    'https://www.facebook.com/groups/a/posts/b', 'https://user:pass@facebook.com/groups/a']) {
    assert.throws(() => groupUrl(bad));
  }
  for (const patch of [{ groups: [] }, { postsPerGroup: 1000 }, { lookbackDays: 30 }, { maxRunUsd: 2 }]) {
    assert.throws(() => prepare({ ...config, ...patch }));
  }
  assert.throws(() => prepare({ groups: [...config.groups, ...config.groups] }));
});

test('uncertain start is never retried and does not expose provider error secrets', async () => {
  let calls = 0;
  await assert.rejects(start(prepare(config), 'secret', async () => {
    calls++; throw new Error('secret provider data');
  }), /Check the console/);
  assert.equal(calls, 1);
});

test('collect resumes existing run and paginates without launching paid work', async () => {
  const paths = [];
  const report = await collect('run123', 'secret', async (url, options) => {
    assert.equal(options.method, 'GET');
    paths.push(url);
    if (url.endsWith('/actor-runs/run123')) return response({ data: { status: 'SUCCEEDED', defaultDatasetId: 'data123', usageTotalUsd: 0.1 } });
    if (url.includes('offset=0')) return response(Array.from({ length: 250 }, (_, i) => ({ id: String(i), text: 'sample' })));
    return response([{ id: '250', text: 'sample' }]);
  });
  assert.equal(report.unique, 251);
  assert.equal(paths.length, 3);
});

test('failed or running collections are reported rather than treated as empty success', async () => {
  for (const status of ['RUNNING', 'FAILED', 'TIMED-OUT', 'ABORTED']) {
    await assert.rejects(collect('run123', 'secret', async () => response({ data: { status } })), new RegExp(status));
  }
});

test('review preserves Hebrew, deduplicates IDs and never invents classification or personal traits', () => {
  const report = normalize([
    { id: '1', text: 'חדר בדירת שותפים לסאבלט בחיפה', user: { name: 'not exported' }, topComments: [{ text: 'not exported' }] },
    { id: '1', text: 'same post' },
    { id: '2', text: 'מחפש חדר בתל אביב' },
    { id: '3', text: 'דירה שלמה להשכרה בירושלים' },
  ]);
  assert.equal(report.unique, 3);
  assert.equal(report.duplicates, 1);
  assert.ok(report.rows[0].text.includes('סאבלט'));
  for (const row of report.rows) {
    assert.equal(row.status, 'needs_review');
    assert.equal(row.rentalType, null);
    assert.equal(row.shabbatPolicy, null);
    assert.equal(row.user, undefined);
    assert.equal(row.topComments, undefined);
  }
});
