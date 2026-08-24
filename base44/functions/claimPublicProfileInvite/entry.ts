import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Called by a freshly-registered user who arrived from a shared public
// profile (?invited_by_user_id=...). Creates a pending_approval TeamInvite
// from the profile owner (inviter) to the new user (invitee) so the two can
// be connected / form a team. Idempotent: a second call for the same pair is
// a no-op. Best-effort: failures must never block the user from entering the app.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { invited_by_user_id } = body || {};

    let me = null;
    try {
      me = await base44.auth.me();
    } catch (_) {
      me = null;
    }
    if (!me?.id) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (!invited_by_user_id || String(invited_by_user_id) === String(me.id)) {
      return Response.json({ success: true, status: 'noop' });
    }

    const sr = base44.asServiceRole.entities;

    // The inviter must be a real, visible, claimed user.
    const inviterProfiles = await sr.Profile.filter({ user_id: invited_by_user_id });
    const inviterProfile = inviterProfiles[0] || null;
    if (!inviterProfile || inviterProfile.is_visible === false || inviterProfile.is_virtual === true) {
      return Response.json({ success: true, status: 'noop' });
    }

    const inviteeEmail = String(me.email || '').trim().toLowerCase();

    // Already an open invite for the same pair — don't duplicate.
    const existing = await sr.TeamInvite.filter({
      inviter_user_id: invited_by_user_id,
      invitee_email: inviteeEmail,
    });
    const open = existing.find((i) => i.status === 'pending_approval' || i.status === 'pending_signup');
    if (open) {
      return Response.json({ success: true, status: 'already_pending' });
    }

    // Already teammates — nothing to do.
    const alreadyTeammate = (Array.isArray(inviterProfile.team_members) ? inviterProfile.team_members : []).some(
      (m) => !m?.pending && String(m?.user_id) === String(me.id)
    );
    if (alreadyTeammate) {
      return Response.json({ success: true, status: 'already_member' });
    }

    await sr.TeamInvite.create({
      inviter_user_id: invited_by_user_id,
      inviter_name: inviterProfile.name || 'מישהו',
      invitee_email: inviteeEmail,
      invitee_name: me.full_name || '',
      invitee_user_id: me.id,
      status: 'pending_approval',
    });

    return Response.json({ success: true, status: 'sent' });
  } catch (error) {
    console.error('Error in claimPublicProfileInvite:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}