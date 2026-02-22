import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { user_id, title, message, data } = await req.json();

        const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID");
        const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY");

        if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
            console.error("OneSignal credentials not set");
            return Response.json({ error: 'OneSignal not configured' }, { status: 500 });
        }

        // Send push notification via OneSignal API
        const response = await fetch('https://onesignal.com/api/v1/notifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`
            },
            body: JSON.stringify({
                app_id: ONESIGNAL_APP_ID,
                include_external_user_ids: [user_id],
                headings: { he: title, en: title },
                contents: { he: message, en: message },
                data: data || {},
                ios_sound: "default",
                android_sound: "default"
            })
        });

        const result = await response.json();
        
        if (response.ok) {
            console.log(`✅ Push notification sent to user ${user_id}`);
            return Response.json({ success: true, result });
        } else {
            console.error(`❌ Failed to send push notification:`, result);
            return Response.json({ success: false, error: result }, { status: response.status });
        }
    } catch (error) {
        console.error("Error sending push notification:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});