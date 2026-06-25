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
        if (!res.ok) console.error('respondToTeamInvite push failed:', await res.text());
    } catch (err) {
        console.error('respondToTeamInvite push error:', err?.message);
    }
}

function profilePhoto(profile) {
    return profile?.photos?.[0] || null;
}

// Remove a pending member entry (matched by invite_id) from a team_members array.
function removePendingMember(members, inviteId) {
    return (Array.isArray(members) ? members : []).filter((m) => m?.invite_id !== inviteId);
}

async function deleteVirtualIfUnused(sr, invite) {
    if (!invite.virtual_profile_id) return;
    // Don't delete if another still-open invite references the same virtual profile.
    const others = await sr.TeamInvite.filter({ virtual_profile_id: invite.virtual_profile_id });
    const stillOpen = others.some(
        (i) => i.id !== invite.id && (i.status === 'pending_approval' || i.status === 'pending_signup')
    );
    if (stillOpen) return;
    try {
        await sr.Profile.delete(invite.virtual_profile_id);
    } catch (err) {
        console.error('Failed to delete virtual profile:', err?.message);
    }
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        let user = null;
        try {
            user = await base44.auth.me();
        } catch (_) {
            user = null;
        }
        if (!user?.id) {
            return Response.json({ error: 'Authentication required' }, { status: 401 });
        }

        const { invite_id, action } = await req.json();
        if (!invite_id || !['accept', 'decline', 'cancel'].includes(action)) {
            return Response.json({ error: 'invite_id and a valid action are required' }, { status: 400 });
        }

        const sr = base44.asServiceRole.entities;
        const invites = await sr.TeamInvite.filter({ id: invite_id });
        const invite = invites[0];
        if (!invite) {
            return Response.json({ error: 'Invite not found' }, { status: 404 });
        }

        const inviterProfiles = await sr.Profile.filter({ user_id: invite.inviter_user_id });
        const inviterProfile = inviterProfiles[0] || null;

        // Inviter cancels a pending invite.
        if (action === 'cancel') {
            if (invite.inviter_user_id !== user.id) {
                return Response.json({ error: 'Not authorized' }, { status: 403 });
            }
            if (invite.status !== 'pending_approval' && invite.status !== 'pending_signup') {
                return Response.json({ error: 'Invite is no longer pending' }, { status: 409 });
            }
            await sr.TeamInvite.update(invite.id, { status: 'cancelled', responded_at: new Date().toISOString() });
            if (inviterProfile) {
                await sr.Profile.update(inviterProfile.id, {
                    team_members: removePendingMember(inviterProfile.team_members, invite.id),
                });
            }
            await deleteVirtualIfUnused(sr, invite);
            return Response.json({ success: true, status: 'cancelled' });
        }

        // Invitee accepts / declines.
        if (invite.status !== 'pending_approval' || invite.invitee_user_id !== user.id) {
            return Response.json({ error: 'Not authorized for this invite' }, { status: 403 });
        }

        if (action === 'decline') {
            await sr.TeamInvite.update(invite.id, { status: 'declined', responded_at: new Date().toISOString() });
            if (inviterProfile) {
                await sr.Profile.update(inviterProfile.id, {
                    team_members: removePendingMember(inviterProfile.team_members, invite.id),
                });
            }
            await deleteVirtualIfUnused(sr, invite);

            await sendPush({
                userId: invite.inviter_user_id,
                title: 'בקשת צוות נדחתה',
                message: `${invite.invitee_name || 'החבר/ה שלך'} דחה/תה את ההצטרפות לצוות`,
                data: { type: 'team_invite_response', invite_id: invite.id, result: 'declined' },
            });
            return Response.json({ success: true, status: 'declined' });
        }

        // action === 'accept' → create a real Match and link both teams.
        const inviteeProfiles = await sr.Profile.filter({ user_id: user.id });
        const inviteeProfile = inviteeProfiles[0] || null;
        const inviterName = invite.inviter_name || inviterProfile?.name || 'מישהו';
        const inviteeName = inviteeProfile?.name || user.full_name || invite.invitee_name || 'מישהו';

        const match = await sr.Match.create({
            user1_id: invite.inviter_user_id,
            user1_name: inviterName,
            user2_id: user.id,
            user2_name: inviteeName,
            status: 'active',
        });

        await sr.TeamInvite.update(invite.id, {
            status: 'accepted',
            match_id: match.id,
            responded_at: new Date().toISOString(),
        });

        // Inviter team: swap the pending entry for a real match-based member.
        if (inviterProfile) {
            const members = removePendingMember(inviterProfile.team_members, invite.id);
            members.push({ match_id: match.id, name: inviteeName, photo: profilePhoto(inviteeProfile) });
            await sr.Profile.update(inviterProfile.id, { team_members: members });
        }
        // Invitee team: add the inviter.
        if (inviteeProfile) {
            const members = Array.isArray(inviteeProfile.team_members) ? [...inviteeProfile.team_members] : [];
            members.push({ match_id: match.id, name: inviterName, photo: profilePhoto(inviterProfile) });
            await sr.Profile.update(inviteeProfile.id, { team_members: members });
        }

        await sendPush({
            userId: invite.inviter_user_id,
            title: '🎉 הצטרפו לצוות שלך!',
            message: `${inviteeName} אישר/ה והצטרף/ה לצוות`,
            data: { type: 'team_invite_response', invite_id: invite.id, result: 'accepted', match_id: match.id },
        });

        return Response.json({ success: true, status: 'accepted', match_id: match.id });
    } catch (error) {
        console.error('respondToTeamInvite error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});
