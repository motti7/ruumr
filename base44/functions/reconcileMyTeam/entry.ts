import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

async function getProfile(sr, userId) {
    const ps = await sr.Profile.filter({ user_id: userId });
    return ps[0] || null;
}

function pendingEntries(profile) {
    return (profile?.team_members || []).filter((m) => m?.pending);
}

async function resolveMemberUserId(sr, selfId, entry) {
    if (entry?.user_id) return entry.user_id;
    if (entry?.match_id) {
        const ms = await sr.Match.filter({ id: entry.match_id });
        const m = ms[0];
        if (m) return String(m.user1_id) === String(selfId) ? m.user2_id : m.user1_id;
    }
    return null;
}

async function rosterUserIds(sr, selfId, profile) {
    const ids = [String(selfId)];
    for (const entry of profile?.team_members || []) {
        if (entry?.pending) continue;
        const uid = await resolveMemberUserId(sr, selfId, entry);
        if (uid) ids.push(String(uid));
    }
    return [...new Set(ids)];
}

async function ensureMatch(sr, a, b, profA, profB) {
    const f1 = await sr.Match.filter({ user1_id: a, user2_id: b });
    const f2 = await sr.Match.filter({ user1_id: b, user2_id: a });
    const existing = f1[0] || f2[0];
    if (existing) return existing;
    return await sr.Match.create({
        user1_id: a,
        user1_name: profA?.name || '',
        user2_id: b,
        user2_name: profB?.name || '',
        status: 'active',
        match_type: 'team',
    });
}

// Rewrite every member's match-based team_members so they all share one roster.
// Pending invite entries on each profile are preserved.
async function writeRoster(sr, memberIds) {
    const ids = [...new Set(memberIds.map(String))];
    const profiles = {};
    for (const id of ids) profiles[id] = await getProfile(sr, id);

    for (const id of ids) {
        const prof = profiles[id];
        if (!prof) continue;
        const matchEntries = [];
        for (const other of ids) {
            if (other === id) continue;
            const oProf = profiles[other];
            const match = await ensureMatch(sr, id, other, prof, oProf);
            matchEntries.push({
                user_id: other,
                match_id: match.id,
                name: oProf?.name || '',
                photo: oProf?.photos?.[0] || null,
            });
        }
        await sr.Profile.update(prof.id, { team_members: [...pendingEntries(prof), ...matchEntries] });
    }
}

// Self-heals legacy / one-sided team membership: takes the caller's current
// teammates and re-syncs the whole roster so every member appears on every
// other member's team. Idempotent.
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        let user = null;
        try { user = await base44.auth.me(); } catch (_) { user = null; }
        if (!user?.id) {
            return Response.json({ error: 'Authentication required' }, { status: 401 });
        }

        const sr = base44.asServiceRole.entities;
        const me = await getProfile(sr, user.id);
        if (!me) {
            return Response.json({ error: 'Profile not found' }, { status: 404 });
        }

        const roster = await rosterUserIds(sr, user.id, me);
        if (roster.length < 2) {
            return Response.json({ success: true, roster, reconciled: false });
        }

        await writeRoster(sr, roster);
        return Response.json({ success: true, roster, reconciled: true });
    } catch (error) {
        console.error('reconcileMyTeam error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});
