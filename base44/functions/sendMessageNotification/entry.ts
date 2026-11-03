import { isBlocked } from '../../shared/userSafety.ts';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { sendServerPush } from '../../shared/serverPush.ts';
import { resolveRecipientLanguage } from '../../shared/recipientLanguage.ts';

// Copy for both languages. Emails and pushes go out in the receiver's language.
function buildMessageCopy(lang, { senderName, content }) {
  if (lang === 'en') {
    return {
      pushTitle: `💬 New message from ${senderName}`,
      subject: `💬 New message from ${senderName} on Ruumr`,
      body: `Hi!<br><br>${senderName} sent you a message on Ruumr:<br><br><strong>"${content.substring(0, 200)}"</strong><br><br>Open the app to reply 🏠<br><br>The Ruumr team`,
    };
  }

  return {
    pushTitle: `💬 הודעה חדשה מ-${senderName}`,
    subject: `💬 הודעה חדשה מ-${senderName} ב-Ruumr`,
    body: `שלום!<br><br>${senderName} שלח/ה לך הודעה ב-Ruumr:<br><br><strong>"${content.substring(0, 200)}"</strong><br><br>היכנס/י לאפליקציה כדי לענות 🏠<br><br>צוות Ruumr`,
  };
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        let currentUser = null;
        try {
            currentUser = await base44.auth.me();
        } catch (_) {
            currentUser = null;
        }
        if (!currentUser?.id) {
            return Response.json({ error: 'Authentication required' }, { status: 401 });
        }

        const { event, data } = await req.json();

        if (event?.type !== 'create' || !data) {
            return Response.json({ success: false, reason: 'Not a create event' });
        }

        const message = data;
        const { match_id, sender_id, content } = message;

        if (String(sender_id) !== String(currentUser.id) && currentUser.role !== 'admin') {
            return Response.json({ error: 'Not authorized to notify for this message' }, { status: 403 });
        }

        // Get the match to find the receiver
        const matches = await base44.asServiceRole.entities.Match.filter({ id: match_id });
        if (!matches || matches.length === 0) {
            console.log("Match not found");
            return Response.json({ success: false, reason: 'Match not found' });
        }

        const match = matches[0];
        if (match.status === 'blocked' || await isBlocked(base44.asServiceRole.entities, match.user1_id, match.user2_id)) {
            return Response.json({ success: true, skipped: true });
        }
        const receiver_id = match.user1_id === sender_id ? match.user2_id : match.user1_id;

        // Denormalize the match participants onto the messages so the Message
        // read/update RLS can authorize the counterparty via a direct field
        // equality check instead of the unreliable Match subquery. This is a
        // server-side backstop so every message is stamped regardless of which
        // client (or bundle version) created it.
        //
        // The entity-automation payload does NOT reliably include the new
        // message's id (cf. onMatchCreated's `match.id || 'new'`), so we can't
        // target a single record. Instead we stamp every message in this match
        // that is missing or has stale participant ids. Idempotent and scoped
        // to one match, so the cost stays small.
        if (match.user1_id && match.user2_id) {
            try {
                const matchMessages = await base44.asServiceRole.entities.Message.filter({ match_id });
                const stale = matchMessages.filter(
                    m => m.user1_id !== match.user1_id || m.user2_id !== match.user2_id
                );
                await Promise.all(
                    stale.map(m =>
                        base44.asServiceRole.entities.Message.update(m.id, {
                            user1_id: match.user1_id,
                            user2_id: match.user2_id,
                        })
                    )
                );
                if (stale.length > 0) {
                    console.log(`🩹 Stamped participants on ${stale.length} message(s) in match ${match_id}`);
                }
            } catch (e) {
                console.error(`❌ Failed to stamp participants for match ${match_id}:`, e);
            }
        }

        // Receiver profile drives the notification language (their saved choice,
        // otherwise their marketplace: Israel = Hebrew, everywhere else = English).
        const receiverProfiles = await base44.asServiceRole.entities.Profile.filter({ user_id: receiver_id });
        const receiverProfile = receiverProfiles[0];
        const lang = resolveRecipientLanguage(receiverProfile);

        // Get sender profile for name
        const senderProfiles = await base44.asServiceRole.entities.Profile.filter({ user_id: sender_id });
        const senderName = senderProfiles[0]?.name || (lang === 'en' ? 'Someone' : 'מישהו');

        // Get receiver email
        const allUsers = await base44.asServiceRole.entities.User.list();
        const receiverUser = allUsers.find(u => u.id === receiver_id);

        // Respect notify_matches setting for message notifications
        if (receiverUser?.notify_matches === false) {
            console.log(`🔕 User ${receiver_id} has disabled match/message notifications`);
            return Response.json({ success: true, skipped: true });
        }

        const copy = buildMessageCopy(lang, { senderName, content });

        // Send push notification (platform built-in SendPushNotification)
        try {
            await sendServerPush(
                base44,
                receiver_id,
                copy.pushTitle,
                content.substring(0, 100)
            );
        } catch (e) {
            console.error(`❌ Failed to send push notification:`, e);
        }

        // Send email notification (respect notify_matches setting)
        if (receiverUser?.email && receiverUser?.notify_matches !== false) {
            try {
                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: receiverUser.email,
                    subject: copy.subject,
                    body: copy.body
                });
                console.log(`✅ Email notification sent to ${receiverUser.email} (lang=${lang})`);
            } catch (e) {
                console.error(`❌ Failed to send email:`, e);
            }
        }

        console.log(`✅ Message notification sent to user ${receiver_id}`);
        return Response.json({ success: true });
    } catch (error) {
        console.error("Error in sendMessageNotification:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});