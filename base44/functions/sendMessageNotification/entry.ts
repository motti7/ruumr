import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { event, data } = await req.json();

        if (event.type !== 'create' || !data) {
            return Response.json({ success: false, reason: 'Not a create event' });
        }

        const message = data;
        const { match_id, sender_id, content } = message;

        // Get the match to find the receiver
        const matches = await base44.asServiceRole.entities.Match.filter({ id: match_id });
        if (!matches || matches.length === 0) {
            console.log("Match not found");
            return Response.json({ success: false, reason: 'Match not found' });
        }

        const match = matches[0];
        const receiver_id = match.user1_id === sender_id ? match.user2_id : match.user1_id;

        // Get sender profile for name
        const senderProfiles = await base44.asServiceRole.entities.Profile.filter({ user_id: sender_id });
        const senderName = senderProfiles[0]?.name || 'מישהו';

        // Get receiver email
        const allUsers = await base44.asServiceRole.entities.User.list();
        const receiverUser = allUsers.find(u => u.id === receiver_id);

        // Send push notification
        try {
            await base44.functions.invoke('sendPushNotification', {
                user_id: receiver_id,
                title: `💬 הודעה חדשה מ-${senderName}`,
                message: content.substring(0, 100),
                data: { type: 'message', match_id, sender_id }
            });
        } catch (e) {
            console.error(`❌ Failed to send push notification:`, e);
        }

        // Send email notification
        if (receiverUser?.email) {
            try {
                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: receiverUser.email,
                    subject: `💬 הודעה חדשה מ-${senderName} ב-Ruumr`,
                    body: `שלום!<br><br>${senderName} שלח/ה לך הודעה ב-Ruumr:<br><br><strong>"${content.substring(0, 200)}"</strong><br><br>היכנס/י לאפליקציה כדי לענות 🏠<br><br>צוות Ruumr`
                });
                console.log(`✅ Email notification sent to ${receiverUser.email}`);
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