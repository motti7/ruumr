// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { BOOST_MS, COOLDOWN_MS, boostStatus, createBoostHandler } from '../../base44/functions/profileBoosts/handler.js';
import { prioritizeBoostedProfiles } from '../../src/lib/profileBoostRanking.js';

const now = Date.parse('2026-10-25T10:00:00Z');
function setup({ user = { id: 'owner' }, profiles = [{ is_visible: true }], records = [] } = {}) {
 const create = vi.fn(async row => row);
 const filter = vi.fn(async () => records);
 const client = { auth: { me: vi.fn(async () => user) }, entities: { Profile: { filter: vi.fn(async () => profiles) } }, asServiceRole: { entities: { ProfileBoost: { filter, create } } } };
 const handler = createBoostHandler(() => client, () => now);
 return { client, create, call: body => handler(new Request('https://example.com', { method: 'POST', body: JSON.stringify(body) })) };
}
describe('free profile boosts', () => {
 it('requires authentication and a visible roommate profile', async () => {
  expect((await setup({ user: null }).call({ action: 'claim', confirmedShared: true })).status).toBe(401);
  for (const profiles of [[], [{ is_visible: false }], [{ is_virtual: true }]]) {
   const x = setup({ profiles });
   expect((await x.call({ action: 'claim', confirmedShared: true })).status).toBe(403);
   expect(x.create).not.toHaveBeenCalled();
  }
 });
 it('does not reward merely opening the share sheet', async () => {
  const x=setup(); expect((await x.call({ action: 'claim' })).status).toBe(400);
  expect(x.create).not.toHaveBeenCalled();
 });
 it('uses the authenticated account and server time, ignoring client overrides', async () => {
  const x=setup(); const res=await x.call({ action: 'claim', confirmedShared: true, user_id: 'victim', expires_at: '2099-01-01' });
  expect(x.create).toHaveBeenCalledWith({ user_id: 'owner', started_at: new Date(now).toISOString(), expires_at: new Date(now+BOOST_MS).toISOString() });
  expect(await res.json()).toMatchObject({ active: true, eligible: false });
 });
 it('repeated confirmation does not extend the boost or weekly cooldown', async () => {
  const x=setup({ records: [{ started_at: new Date(now-BOOST_MS*2).toISOString() }] });
  const res=await x.call({ action: 'claim', confirmedShared: true });
  expect(await res.json()).toMatchObject({ active: false, eligible: false });
  expect(x.create).not.toHaveBeenCalled();
 });
 it('expires at 24 hours and permits a new claim after seven days', () => {
  const r={ started_at: new Date(now).toISOString() };
  expect(boostStatus(r,now+BOOST_MS)).toMatchObject({ active:false,eligible:false });
  expect(boostStatus(r,now+COOLDOWN_MS)).toMatchObject({ active:false,eligible:true });
 });
 it('ranks only existing candidates, preserving relative order and the source list', () => {
  const rows=[{user_id:'a'},{user_id:'b'},{user_id:'c'},{user_id:'d'}];
  expect(prioritizeBoostedProfiles(rows,['d','b','blocked-user']).map(x=>x.user_id)).toEqual(['b','d','a','c']);
  expect(rows.map(x=>x.user_id)).toEqual(['a','b','c','d']);
 });
 it('returns only currently active boost IDs', async () => {
  const x=setup({records:[{user_id:'a',started_at:new Date(now-1000).toISOString()},{user_id:'b',started_at:new Date(now-BOOST_MS).toISOString()}]});
  expect(await (await x.call({action:'active'})).json()).toEqual({userIds:['a']});
 });
});
