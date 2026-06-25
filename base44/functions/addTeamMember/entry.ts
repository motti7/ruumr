import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const APP_URL = 'https://app.ruumrapp.com';
const TEAM_URL = `${APP_URL}/GroupTracker`;

async function sendPush({ userId, title, message, data }) {
    const appId = Deno.env.get('ONESIGNAL_APP_ID');
    const apiKey = Deno.env.get('ONESIGNAL_REST_API_KEY');
    if (!appId || !apiKey) return;
    try {
        const res = await fetch('https://api.onesignal.com/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Key ${apiKey}` },
            body: JSON.stringify({
                app_id: appId,
                target_channel: 'push',
                include_aliases: { external_id: [String(userId)] },
                headings: { en: title, he: title },
                contents: { en: message, he: message },
                data: data || {},
                url: TEAM_URL,
                ios_sound: 'default',
                android_sound: 'default',
            }),
        });
        if (!res.ok) console.error('addTeamMember push failed:', await res.text());
    } catch (err) {
        console.error('addTeamMember push error:', err?.message);
    }
}

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

async function writeRoster(sr, uc, selfId, memberIds) {
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
            const match = await ensureMatch(sr, uc, selfId, id, other, prof, oProf);
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

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        let user = null;
        try { user = await base44.auth.me(); } catch (_) { user = null; }
        if (!user?.id) {
            return Response.json({ error: 'Authentication required' }, { status: 401 });
        }

        const { target_user_id } = await req.json();
        const targetId = String(target_user_id || '');
        if (!targetId) {
            return Response.json({ error: 'target_user_id is required' }, { status: 400 });
        }
        if (targetId === String(user.id)) {
            return Response.json({ error: 'Cannot add yourself' }, { status: 400 });
        }

        const sr = base44.asServiceRole.entities;
        const callerProfile = await getProfile(sr, user.id);
        if (!callerProfile) {
            return Response.json({ error: 'Profile not found' }, { status: 404 });
        }

        const roster = await rosterUserIds(sr, user.id, callerProfile);
        const newRoster = [...new Set([...roster, targetId])];

        // Connect the new member to the whole existing team, not just the adder.
        await writeRoster(sr, base44.entities, String(user.id), newRoster);

        const adderName = callerProfile.name || user.full_name || 'מישהו';
        await sendPush({
            userId: targetId,
            title: '👋 צורפת לצוות',
            message: `${adderName} צירף/ה אותך לצוות`,
            data: { type: 'team_added' },
        });

        return Response.json({ success: true, roster: newRoster });
    } catch (error) {
        console.error('addTeamMember error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});
