import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const WIX_API_KEY = Deno.env.get("PAYMENTS_BY_WIX_API_KEY");
const WIX_SITE_ID = Deno.env.get("PAYMENTS_BY_WIX_SITE_ID");

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Find the user's subscription record
        const records = await base44.asServiceRole.entities.PendingSubscription.filter({
            user_email: user.email,
        });

        if (!records || records.length === 0) {
            return Response.json({ found: false });
        }

        // Get the most recent record
        const record = records.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];

        if (!record.subscription_id) {
            return Response.json({ found: true, record_status: record.status, wix_status: null });
        }

        // Fetch live status from Wix
        const response = await fetch(
            `https://www.wixapis.com/payments/base44/v1/subscriptions/${record.subscription_id}`,
            {
                method: "GET",
                headers: {
                    "Authorization": WIX_API_KEY,
                    "wix-site-id": WIX_SITE_ID,
                },
            }
        );

        if (!response.ok) {
            console.error("Failed to fetch subscription from Wix:", response.status);
            return Response.json({ found: true, record_status: record.status, wix_status: null });
        }

        const data = await response.json();
        return Response.json({
            found: true,
            record_status: record.status,
            wix_status: data.subscription?.status || null,
            subscription_id: record.subscription_id,
        });

    } catch (error) {
        console.error("Error in getSubscriptionStatus:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});