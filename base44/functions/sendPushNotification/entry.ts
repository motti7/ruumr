import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        createClientFromRequest(req);
        const { user_id, title, message, data, url } = await req.json();

        if (!user_id || !title || !message) {
            return Response.json({ error: 'user_id, title, and message are required' }, { status: 400 });
        }

        const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID");
        const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY");

        if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
            console.error("OneSignal credentials not set");
            return Response.json({ error: 'OneSignal not configured' }, { status: 500 });
        }

        const response = await fetch('https://api.onesignal.com/notifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Key ${ONESIGNAL_REST_API_KEY}`
            },
            body: JSON.stringify({
                app_id: ONESIGNAL_APP_ID,
                target_channel: 'push',
                include_aliases: { external_id: [String(user_id)] },
                headings: { en: title, he: title },
                contents: { en: message, he: message },
                data: data || {},
                url,
                ios_sound: 'default',
                android_sound: 'default'
            })
        });

        const result = await response.json();

        if (response.ok) {
            console.log(`✅ Push sent user=${user_id} id=${result?.id} recipients=${result?.recipients ?? 0}`);
            return Response.json({ success: true, id: result?.id, recipients: result?.recipients ?? 0, result });
        }

        console.error(`❌ OneSignal push failed user=${user_id}:`, result);
        return Response.json({ success: false, error: result }, { status: response.status });
    } catch (error) {
        console.error("Error sending push notification:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});
