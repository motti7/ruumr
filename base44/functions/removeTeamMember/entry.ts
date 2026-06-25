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
        if (!res.ok) console.error('removeTeamMember push failed:', await res.text());
    } catch (err) {
        console.error('removeTeamMember push error:', err?.message);
    }
}

async function getProfile(sr, userId) {
    const ps = await sr.Profile.filter({ user_id: userId });
    return ps[0] || null;
}

function pendingEntries(profile) {
    return (profile?.team_members || []).filter((m) => m?.pending);
}

// Resolve a team_members entry to the teammate's user_id, falling back to the Match
// for legacy entries that predate the user_id field.
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

        const sr = base44.asServiceRole.entities;
        const callerProfile = await getProfile(sr, user.id);
        if (!callerProfile) {
            return Response.json({ error: 'Profile not found' }, { status: 404 });
        }

        const roster = await rosterUserIds(sr, user.id, callerProfile);
        const isLeaving = targetId === String(user.id);
        if (!isLeaving && !roster.includes(targetId)) {
            return Response.json({ error: 'Target is not on your team' }, { status: 403 });
        }

        const remaining = roster.filter((id) => id !== targetId);

        // Re-sync the members who stay.
        await writeRoster(sr, remaining);

        // Drop the shared teammates from the removed person, keep their pending invites.
        const targetProfile = await getProfile(sr, targetId);
        if (targetProfile) {
            await sr.Profile.update(targetProfile.id, { team_members: pendingEntries(targetProfile) });
        }

        // Notify the removed person (not when someone leaves on their own).
        if (!isLeaving) {
            const removerName = callerProfile.name || user.full_name || 'מישהו';
            await sendPush({
                userId: targetId,
                title: 'הוסרת מהצוות',
                message: `${removerName} הסיר/ה אותך מהצוות`,
                data: { type: 'team_removed' },
            });
        }

        return Response.json({ success: true, removed: targetId, remaining });
    } catch (error) {
        console.error('removeTeamMember error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});
