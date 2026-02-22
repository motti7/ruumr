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

        // Send push notification to receiver
        try {
            await base44.functions.invoke('sendPushNotification', {
                user_id: receiver_id,
                title: `💬 הודעה חדשה מ-${senderName}`,
                message: content.substring(0, 100), // First 100 chars
                data: { 
                    type: 'message', 
                    match_id,
                    sender_id
                }
            });
            
            console.log(`✅ Message notification sent to user ${receiver_id}`);
            return Response.json({ success: true });
        } catch (e) {
            console.error(`❌ Failed to send message notification:`, e);
            return Response.json({ success: false, error: e.message }, { status: 500 });
        }
    } catch (error) {
        console.error("Error in sendMessageNotification:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});