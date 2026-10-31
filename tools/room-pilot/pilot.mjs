import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const api = 'https://api.apify.com/v2';
export const actor = 'apify~facebook-groups-scraper';
const cities = ['tel_aviv', 'jerusalem', 'haifa', 'beer_sheva'];

export function groupUrl(value) {
  const u = new URL(value);
  if (u.protocol !== 'https:' || !['facebook.com', 'www.facebook.com'].includes(u.hostname)
      || u.username || u.password || u.port || !/^\/groups\/[a-zA-Z0-9._-]+\/?$/.test(u.pathname)) {
    throw new Error('Use a public Facebook group URL, not a post or profile URL.');
  }
  return `https://www.facebook.com${u.pathname.replace(/\/$/, '')}`;
}

export function prepare(config, now = new Date()) {
  if (!Array.isArray(config.groups) || config.groups.length < 1 || config.groups.length > 8) {
    throw new Error('Configure 1–8 public groups before starting.');
  }
  const groups = config.groups.map(g => {
    if (!cities.includes(g.city)) throw new Error('Unsupported city.');
    return { url: groupUrl(g.url), city: g.city };
  });
  if (new Set(groups.map(g => g.url)).size !== groups.length) throw new Error('Duplicate group.');
  const count = config.postsPerGroup ?? 20;
  const days = config.lookbackDays ?? 2;
  const cap = config.maxRunUsd ?? 1;
  if (!Number.isInteger(count) || count < 1 || count > 50) throw new Error('postsPerGroup must be 1–50.');
  if (!Number.isInteger(days) || days < 1 || days > 7) throw new Error('lookbackDays must be 1–7.');
  if (!Number.isFinite(cap) || cap <= 0 || cap > 1) throw new Error('maxRunUsd must be greater than 0 and at most 1.');
  return {
    groups,
    input: { startUrls: groups.map(({ url }) => ({ url })), resultsLimit: count,
      viewOption: 'CHRONOLOGICAL', onlyPostsNewerThan: new Date(now.getTime() - days * 86400000).toISOString() },
    query: { maxTotalChargeUsd: String(cap), timeout: '600', restartOnError: 'false' },
  };
}

export async function request(path, token, { method = 'GET', body, fetchFn = fetch } = {}) {
  if (!token) throw new Error('Set APIFY_TOKEN in a local environment file, never in source control.');
  let response;
  try {
    response = await fetchFn(`${api}/${path}`, {
      method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(30000), redirect: 'error',
    });
  } catch {
    // Never retry a paid POST: the server may have started it despite a lost response.
    throw new Error('Apify connection failed. Check the console for an existing run before starting again.');
  }
  if (!response.ok) throw new Error(`Apify HTTP ${response.status}. Check the console; do not blindly restart.`);
  return response.json();
}

export async function start(plan, token, fetchFn) {
  const result = await request(`actors/${actor}/runs?${new URLSearchParams(plan.query)}`, token,
    { method: 'POST', body: plan.input, fetchFn });
  if (!result.data?.id) throw new Error('Missing run ID. Check Apify console before retrying.');
  return result.data;
}

function safeSource(value) {
  try {
    const u = new URL(value);
    if (u.protocol !== 'https:' || !['www.facebook.com', 'facebook.com'].includes(u.hostname)) return null;
    u.search = ''; u.hash = '';
    return u.href.replace(/\/$/, '');
  } catch { return null; }
}

export function normalize(items) {
  const seen = new Set();
  const rows = [];
  let duplicates = 0;
  for (const item of items) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error('Unexpected dataset item.');
    const sourceUrl = safeSource(item.url);
    const sourceGroupUrl = safeSource(item.facebookUrl || item.inputUrl);
    const text = typeof item.text === 'string' ? item.text : '';
    const sourceId = item.legacyId || item.id;
    const key = sourceId ? `facebook:${sourceId}` : sourceUrl || createHash('sha256').update(`${sourceGroupUrl}\n${text}\n${item.time}`).digest('hex');
    if (seen.has(key)) { duplicates++; continue; }
    seen.add(key);
    rows.push({ key, sourceUrl, sourceGroupUrl, publishedAt: item.time || null, text,
      status: 'needs_review', listingKind: null, rentalType: null, city: null,
      monthlyRentIls: null, entryDate: null, endDate: null, roommateCount: null,
      furnished: null, shabbatPolicy: null,
      reviewNote: text ? 'Confirm room offer versus search/whole apartment; classify regular/sublet/unknown.' : 'No text returned; investigate missing or inaccessible post.' });
  }
  return { fetched: items.length, unique: rows.length, duplicates, rows };
}

export async function collect(runId, token, fetchFn) {
  if (!/^[a-zA-Z0-9]+$/.test(runId)) throw new Error('Invalid Apify run ID.');
  const { data: run } = await request(`actor-runs/${runId}`, token, { fetchFn });
  if (run.status !== 'SUCCEEDED') throw new Error(`Run ${runId}: ${run.status}. Inspect in Apify; no new run was started.`);
  if (!/^[a-zA-Z0-9]+$/.test(run.defaultDatasetId)) throw new Error('Missing dataset ID.');
  const items = [];
  for (let offset = 0; ; offset += 250) {
    if (offset >= 10000) throw new Error('Unexpected dataset size. Inspect the run in Apify.');
    const page = await request(`datasets/${run.defaultDatasetId}/items?format=json&offset=${offset}&limit=250`, token, { fetchFn });
    if (!Array.isArray(page)) throw new Error('Expected a JSON dataset array.');
    items.push(...page);
    if (page.length < 250) break;
  }
  return { runId, buildId: run.buildId, usageTotalUsd: run.usageTotalUsd ?? null,
    generatedAt: new Date().toISOString(), ...normalize(items) };
}

async function main() {
  const [command, arg] = process.argv.slice(2);
  if (!['preview', 'start', 'collect', 'import'].includes(command) || !arg) {
    throw new Error('Usage: node pilot.mjs preview|start <config.json> OR collect <runId> OR import <dataset.json>');
  }
  if (command === 'preview' || command === 'start') {
    const plan = prepare(JSON.parse(await readFile(resolve(arg), 'utf8')));
    if (command === 'preview') { console.log(JSON.stringify(plan, null, 2)); return; }
    await mkdir(resolve(root, 'output'), { recursive: true });
    const run = await start(plan, process.env.APIFY_TOKEN);
    console.log(`Started ${run.id}. Collect later with: node tools/room-pilot/pilot.mjs collect ${run.id}`);
    await writeFile(resolve(root, 'output', `${run.id}.run.json`), JSON.stringify({ runId: run.id, plan }, null, 2));
    return;
  }
  const report = command === 'collect' ? await collect(arg, process.env.APIFY_TOKEN)
    : normalize(JSON.parse(await readFile(resolve(arg), 'utf8')));
  await mkdir(resolve(root, 'output'), { recursive: true });
  const output = resolve(root, 'output', `${command === 'collect' ? arg : 'import'}.review.json`);
  await writeFile(output, JSON.stringify(report, null, 2));
  console.log(`Saved ${report.unique} review rows (${report.duplicates} duplicates) to ${output}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
