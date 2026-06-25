import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase();
}

// When a user signs up / completes onboarding, any "pending_signup" invites that were
// addressed to their email are linked to them and flipped to "pending_approval" so they
// can approve or decline. The virtual placeholder profile is then removed.
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

        const email = normalizeEmail(user.email);
        if (!email) {
            return Response.json({ success: true, claimed: 0 });
        }

        const sr = base44.asServiceRole.entities;
        const invites = await sr.TeamInvite.filter({ invitee_email: email, status: 'pending_signup' });

        const virtualProfileIds = new Set();
        let claimed = 0;

        for (const invite of invites) {
            // Guard against an inviter being the same person (shouldn't happen, but safe).
            if (invite.inviter_user_id === user.id) continue;
            await sr.TeamInvite.update(invite.id, {
                invitee_user_id: user.id,
                status: 'pending_approval',
            });
            if (invite.virtual_profile_id) virtualProfileIds.add(invite.virtual_profile_id);
            claimed += 1;
        }

        // Remove the now-redundant virtual placeholder profiles (the real user exists now).
        for (const profileId of virtualProfileIds) {
            try {
                await sr.Profile.delete(profileId);
            } catch (err) {
                console.error('Failed to delete claimed virtual profile:', err?.message);
            }
        }

        return Response.json({ success: true, claimed });
    } catch (error) {
        console.error('claimTeamInvites error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});
