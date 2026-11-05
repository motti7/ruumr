import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// "Finish your profile" campaign.
// Recipients: registered users who have no Profile record at all, or a Profile
// that is still missing photos / about / search cities (i.e. not a full profile).
// Owner-only. Supports a preview send to the caller's own address, and
// `limit`/`offset` batching so a large audience can be drained in runs.

const TEMPLATE = 'CompleteProfile';
const OWNER_EMAIL = 'mottishif7@gmail.com';
const APP_URL = 'https://app.ruumrapp.com';

function firstNameOf(user, profile) {
  const raw = String(profile?.name || user?.full_name || '').trim();
  const first = raw.split(/\s+/)[0];
  return first || 'חבר';
}

function isProfileComplete(profile) {
  if (!profile) return false;
  const photos = (profile.photos || []).filter(Boolean);
  const cities = (profile.search_cities || []).filter(Boolean);
  return photos.length > 0 && !!profile.about_me && cities.length > 0;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin' && user.email !== OWNER_EMAIL) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const preview = body?.preview === true;
    const dryRun = body?.dry_run === true;
    const limit = Math.min(Math.max(Number(body?.limit) || 60, 1), 120);
    const offset = Math.max(Number(body?.offset) || 0, 0);

    // Preview: one email, to the person running the campaign.
    if (preview) {
      const res = await base44.asServiceRole.integrations.Core.SendEmail({
        to: user.email,
        template_name: TEMPLATE,
        variables: { first_name: firstNameOf(user, null) },
        category: 'marketing',
      });
      return Response.json({ preview: true, to: user.email, result: res });
    }

    const [users, profiles, banned] = await Promise.all([
      base44.asServiceRole.entities.User.list('-created_date', 5000),
      base44.asServiceRole.entities.Profile.list('-created_date', 5000),
      base44.asServiceRole.entities.BannedUser.list('-created_date', 1000).catch(() => []),
    ]);

    const profileByUser = new Map();
    for (const p of profiles) {
      if (!p?.user_id || p.is_virtual) continue;
      const key = String(p.user_id);
      const existing = profileByUser.get(key);
      // Keep the fullest profile per user.
      if (!existing || (isProfileComplete(p) && !isProfileComplete(existing))) {
        profileByUser.set(key, p);
      }
    }

    const bannedEmails = new Set((banned || []).map((b) => String(b?.email || '').toLowerCase()).filter(Boolean));

    const recipients = users.filter((u) => {
      const email = String(u?.email || '').toLowerCase();
      if (!email || bannedEmails.has(email)) return false;
      return !isProfileComplete(profileByUser.get(String(u.id)));
    });

    const batch = recipients.slice(offset, offset + limit);

    if (dryRun) {
      return Response.json({
        dry_run: true,
        total_recipients: recipients.length,
        would_send: batch.length,
        offset,
        next_offset: offset + limit < recipients.length ? offset + limit : null,
        sample: batch.slice(0, 10).map((u) => ({ email: u.email, first_name: firstNameOf(u, profileByUser.get(String(u.id))) })),
      });
    }

    let sent = 0;
    let skipped = 0;
    const failures = [];

    for (let i = 0; i < batch.length; i += 6) {
      const chunk = batch.slice(i, i + 6);
      const results = await Promise.allSettled(
        chunk.map((u) =>
          base44.asServiceRole.integrations.Core.SendEmail({
            to: u.email,
            template_name: TEMPLATE,
            variables: { first_name: firstNameOf(u, profileByUser.get(String(u.id))) },
            category: 'marketing',
          })
        )
      );
      results.forEach((r, idx) => {
        const email = chunk[idx]?.email;
        if (r.status === 'fulfilled' && r.value?.success !== false) {
          sent += 1;
        } else if (r.status === 'fulfilled') {
          skipped += 1;
          if (failures.length < 15) failures.push({ email, reason: r.value?.reason || 'not_sent' });
        } else {
          if (failures.length < 15) failures.push({ email, reason: String(r.reason?.message || r.reason).slice(0, 200) });
        }
      });
    }

    const nextOffset = offset + limit < recipients.length ? offset + limit : null;

    return Response.json({
      total_recipients: recipients.length,
      processed: batch.length,
      sent,
      skipped,
      offset,
      next_offset: nextOffset,
      remaining: Math.max(recipients.length - (offset + batch.length), 0),
      app_url: APP_URL,
      failures,
    });
  } catch (error) {
    console.log('sendCompleteProfileCampaign error', error?.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}