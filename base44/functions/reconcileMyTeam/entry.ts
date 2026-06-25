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

async function ensureMatch(sr, uc, selfId, a, b, profA, profB) {
    // Look for an existing match between the pair in both directions. A mutual
    // match created by handleSwipe is written through the user-context client and
    // is not always visible to the asServiceRole view — so a service-role-only
    // check can miss it and create a duplicate "team" match. When the caller is a
    // party to this pair, also check via the user-context client (uc).
    const queries = [
        sr.Match.filter({ user1_id: a, user2_id: b }),
        sr.Match.filter({ user1_id: b, user2_id: a }),
    ];
    if (uc && (String(a) === String(selfId) || String(b) === String(selfId))) {
        queries.push(uc.Match.filter({ user1_id: a, user2_id: b }));
        queries.push(uc.Match.filter({ user1_id: b, user2_id: a }));
    }
    const existing = (await Promise.all(queries)).flat().find(Boolean);
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

// Additively heal one-sided team membership: ensure every pair in the roster is
// linked in BOTH directions by ADDING missing links only. Never overwrites or
// drops existing entries — a member may have teammates the caller doesn't know
// about, and a full rewrite would silently delete them. Reconcile is a healing
// pass, not the source of truth for removals (removeTeamMember owns that).
async function writeRoster(sr, uc, selfId, memberIds) {
    const ids = [...new Set(memberIds.map(String))];
    const profiles = {};
    for (const id of ids) profiles[id] = await getProfile(sr, id);

    for (const id of ids) {
        const prof = profiles[id];
        if (!prof) continue;

        // Start from this member's existing roster and only append what's missing.
        const members = Array.isArray(prof.team_members) ? [...prof.team_members] : [];

        // Which user_ids this member already links to (skip pending placeholders).
        const linked = new Set();
        for (const entry of members) {
            if (entry?.pending) continue;
            const uid = await resolveMemberUserId(sr, id, entry);
            if (uid) linked.add(String(uid));
        }

        let changed = false;
        for (const other of ids) {
            if (other === id || linked.has(String(other))) continue;
            const oProf = profiles[other];
            const match = await ensureMatch(sr, uc, selfId, id, other, prof, oProf);
            members.push({
                user_id: other,
                match_id: match.id,
                name: oProf?.name || '',
                photo: oProf?.photos?.[0] || null,
            });
            linked.add(String(other));
            changed = true;
        }

        // Only write when we actually added a link — keeps reconcile a true no-op
        // when the roster is already consistent.
        if (changed) {
            await sr.Profile.update(prof.id, { team_members: members });
        }
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

        await writeRoster(sr, base44.entities, String(user.id), roster);
        return Response.json({ success: true, roster, reconciled: true });
    } catch (error) {
        console.error('reconcileMyTeam error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});
