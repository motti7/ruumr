import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const APP_URL = 'https://app.ruumrapp.com';
const TEAM_URL = `${APP_URL}/GroupTracker`;

function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase();
}

function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function findUserByEmail(sr, email) {
    // User.list() is the established service-role pattern (see sendMatchNotificationEmail).
    const users = await sr.User.list();
    return users.find((u) => normalizeEmail(u.email) === email) || null;
}

async function findUserById(sr, userId) {
    const users = await sr.User.list();
    return users.find((u) => String(u.id) === String(userId)) || null;
}

async function sendPush({ userId, title, message, data }) {
    const appId = Deno.env.get('ONESIGNAL_APP_ID');
    const apiKey = Deno.env.get('ONESIGNAL_REST_API_KEY');
    if (!appId || !apiKey) {
        console.warn('OneSignal not configured, skipping push');
        return;
    }
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
        if (!res.ok) console.error('Team invite push failed:', await res.text());
    } catch (err) {
        console.error('Team invite push error:', err?.message);
    }
}

function buildInviteEmailHtml({ inviterName, inviteeName }) {
    return `<!doctype html><html dir="rtl"><body style="font-family:Arial,sans-serif;background:#f9fafb;padding:24px;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:28px;text-align:center;">
    <h1 style="color:#FA3803;margin:0 0 12px;">${inviterName} רוצה אותך בצוות! 🏠</h1>
    <p style="color:#374151;font-size:16px;line-height:1.6;">
      היי ${inviteeName || ''}, ${inviterName} מחפש/ת דירה ב-Ruumr ורוצה שתהיו שותפים.
      הצטרף/י ל-Ruumr כדי לאשר ולמצוא דירה ביחד.
    </p>
    <a href="${APP_URL}" style="display:inline-block;margin-top:16px;background:#FA3803;color:#fff;text-decoration:none;font-weight:bold;padding:12px 28px;border-radius:999px;">
      הצטרף/י ל-Ruumr
    </a>
  </div>
</body></html>`;
}

function buildRequestEmailHtml({ inviterName, inviteeName }) {
    return `<!doctype html><html dir="rtl"><body style="font-family:Arial,sans-serif;background:#f9fafb;padding:24px;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:28px;text-align:center;">
    <h1 style="color:#FA3803;margin:0 0 12px;">בקשה חדשה לצוות 🤝</h1>
    <p style="color:#374151;font-size:16px;line-height:1.6;">
      היי ${inviteeName || ''}, ${inviterName} רוצה להוסיף אותך לצוות שלו/ה ב-Ruumr.
      פתח/י את האפליקציה כדי לאשר או לדחות.
    </p>
    <a href="${TEAM_URL}" style="display:inline-block;margin-top:16px;background:#FA3803;color:#fff;text-decoration:none;font-weight:bold;padding:12px 28px;border-radius:999px;">
      צפה/י בבקשה
    </a>
  </div>
</body></html>`;
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        let inviter = null;
        try {
            inviter = await base44.auth.me();
        } catch (_) {
            inviter = null;
        }
        if (!inviter?.id) {
            return Response.json({ error: 'Authentication required' }, { status: 401 });
        }

        const { email, name, target_user_id } = await req.json();
        const sr = base44.asServiceRole.entities;

        let inviteeEmail = normalizeEmail(email);
        let inviteeName = String(name || '').trim();

        // Inviting a known user (e.g. an existing match) by id — resolve their email.
        if (target_user_id) {
            const targetUser = await findUserById(sr, target_user_id);
            if (!targetUser) {
                return Response.json({ error: 'User not found' }, { status: 404 });
            }
            inviteeEmail = normalizeEmail(targetUser.email);
            if (!inviteeName) {
                const tp = await sr.Profile.filter({ user_id: targetUser.id });
                inviteeName = tp[0]?.name || targetUser.full_name || '';
            }
        }

        if (!isValidEmail(inviteeEmail)) {
            return Response.json({ error: 'Valid email is required' }, { status: 400 });
        }
        if (normalizeEmail(inviter.email) === inviteeEmail) {
            return Response.json({ error: 'You cannot invite yourself' }, { status: 400 });
        }

        const inviterProfiles = await sr.Profile.filter({ user_id: inviter.id });
        const inviterProfile = inviterProfiles[0] || null;
        const inviterName = inviterProfile?.name || inviter.full_name || 'מישהו';

        // Idempotency: don't create a second open invite for the same pair.
        const existingInvites = await sr.TeamInvite.filter({
            inviter_user_id: inviter.id,
            invitee_email: inviteeEmail,
        });
        const openInvite = existingInvites.find((i) =>
            i.status === 'pending_approval' || i.status === 'pending_signup'
        );
        if (openInvite) {
            return Response.json({ success: true, status: 'already_pending' });
        }

        const existingUser = await findUserByEmail(sr, inviteeEmail);

        if (existingUser && existingUser.id !== inviter.id) {
            // Already on the inviter's team → nothing to request.
            const alreadyTeammate = (inviterProfile?.team_members || []).some(
                (m) => !m?.pending && String(m?.user_id) === String(existingUser.id)
            );
            if (alreadyTeammate) {
                return Response.json({ success: true, status: 'already_member' });
            }

            // Friend is already on Ruumr → request approval, don't add to team yet.
            const invite = await sr.TeamInvite.create({
                inviter_user_id: inviter.id,
                inviter_name: inviterName,
                invitee_email: inviteeEmail,
                invitee_name: inviteeName,
                invitee_user_id: existingUser.id,
                status: 'pending_approval',
            });

            await sendPush({
                userId: existingUser.id,
                title: '🤝 בקשה חדשה לצוות',
                message: `${inviterName} רוצה להוסיף אותך לצוות`,
                data: { type: 'team_invite', invite_id: invite.id },
            });

            if (existingUser.notify_matches !== false) {
                try {
                    await base44.asServiceRole.integrations.Core.SendEmail({
                        to: existingUser.email,
                        from_name: 'Ruumr 🏠',
                        subject: `${inviterName} רוצה אותך בצוות ב-Ruumr`,
                        body: buildRequestEmailHtml({ inviterName, inviteeName }),
                    });
                } catch (err) {
                    console.error('Team request email failed:', err?.message);
                }
            }

            return Response.json({ success: true, status: 'sent' });
        }

        // Friend is not on Ruumr → create/reuse a hidden virtual identity and invite by email.
        const existingVirtual = await sr.Profile.filter({ invite_email: inviteeEmail, is_virtual: true });
        let virtualProfile = existingVirtual[0] || null;
        if (!virtualProfile) {
            virtualProfile = await sr.Profile.create({
                user_id: `virtual:${inviteeEmail}`,
                name: inviteeName || inviteeEmail.split('@')[0],
                age: 0,
                gender: 'other',
                is_virtual: true,
                is_claimed: false,
                is_visible: false,
                invite_email: inviteeEmail,
                invited_by_user_id: inviter.id,
            });
        }

        const invite = await sr.TeamInvite.create({
            inviter_user_id: inviter.id,
            inviter_name: inviterName,
            invitee_email: inviteeEmail,
            invitee_name: inviteeName,
            status: 'pending_signup',
            virtual_profile_id: virtualProfile.id,
        });

        // Attach the pending member to the inviter's team immediately.
        if (inviterProfile) {
            const members = Array.isArray(inviterProfile.team_members) ? inviterProfile.team_members : [];
            members.push({
                invite_id: invite.id,
                name: inviteeName || inviteeEmail.split('@')[0],
                pending: true,
            });
            await sr.Profile.update(inviterProfile.id, { team_members: members });
        }

        try {
            await base44.asServiceRole.integrations.Core.SendEmail({
                to: inviteeEmail,
                from_name: 'Ruumr 🏠',
                subject: `${inviterName} רוצה אותך בצוות ב-Ruumr`,
                body: buildInviteEmailHtml({ inviterName, inviteeName }),
            });
        } catch (err) {
            console.error('Team invite email failed:', err?.message);
        }

        return Response.json({ success: true, status: 'sent' });
    } catch (error) {
        console.error('createTeamInvite error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});
