export const BOOST_MS = 24 * 60 * 60 * 1000;
export const COOLDOWN_MS = 7 * BOOST_MS;
export function boostStatus(record, now = Date.now()) {
 const started = Date.parse(record?.started_at);
 if (!Number.isFinite(started)) return { active: false, eligible: true, expiresAt: null, nextEligibleAt: null };
 return { active: now >= started && now < started + BOOST_MS, eligible: now >= started + COOLDOWN_MS, expiresAt: new Date(started + BOOST_MS).toISOString(), nextEligibleAt: new Date(started + COOLDOWN_MS).toISOString() };
}
export function createBoostHandler(createClient, clock = Date.now) {
 return async req => {
  if (req.method !== 'POST') return Response.json({ error: 'method_not_allowed' }, { status: 405 });
  try {
   const client = createClient(req);
   let user;
   try { user = await client.auth.me(); } catch (error) {
    if ([401, 403].includes(error?.status ?? error?.response?.status)) return Response.json({ error: 'unauthorized' }, { status: 401 });
    throw error;
   }
   if (!user?.id) return Response.json({ error: 'unauthorized' }, { status: 401 });
   let body;
   try { body = await req.json(); } catch { return Response.json({ error: 'invalid_request' }, { status: 400 }); }
   const now = clock(), sr = client.asServiceRole.entities;
   if (body.action === 'active') {
    const records = await sr.ProfileBoost.filter({ expires_at: { $gt: new Date(now).toISOString() } }, '-created_date', 5000);
    return Response.json({ userIds: [...new Set(records.filter(r => boostStatus(r, now).active).map(r => r.user_id))] });
   }
   if (!['status', 'claim'].includes(body.action)) return Response.json({ error: 'invalid_action' }, { status: 400 });
   const profiles = await client.entities.Profile.filter({ user_id: user.id });
   if (!profiles.some(p => p.is_visible !== false && !p.is_virtual)) return Response.json({ error: 'profile_required' }, { status: 403 });
   const records = await sr.ProfileBoost.filter({ user_id: user.id }, '-started_at', 1);
   const status = boostStatus(records[0], now);
   if (body.action === 'status' || !status.eligible) return Response.json(status);
   const record = await sr.ProfileBoost.create({ user_id: user.id, started_at: new Date(now).toISOString(), expires_at: new Date(now + BOOST_MS).toISOString() });
   return Response.json(boostStatus(record, now));
  } catch (error) {
   console.error('Profile boost request failed', error?.message);
   return Response.json({ error: 'boost_unavailable' }, { status: 503 });
  }
 };
}
