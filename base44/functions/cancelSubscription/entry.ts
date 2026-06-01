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

        // Find the user's active subscription record
        const records = await base44.asServiceRole.entities.PendingSubscription.filter({
            user_email: user.email,
            status: "active",
        });

        if (!records || records.length === 0) {
            return Response.json({ error: 'לא נמצא מנוי פעיל' }, { status: 404 });
        }

        const record = records[0];
        const subscriptionId = record.subscription_id;

        if (!subscriptionId) {
            return Response.json({ error: 'מזהה מנוי חסר' }, { status: 400 });
        }

        // Soft cancel — subscription stays active until end of billing cycle
        const response = await fetch(
            `https://www.wixapis.com/payments/base44/v1/subscriptions/${subscriptionId}/cancel`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": WIX_API_KEY,
                    "wix-site-id": WIX_SITE_ID,
                },
                body: JSON.stringify({
                    subscription_id: subscriptionId,
                    reason: "User requested cancellation",
                    immediate: false,
                }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            // If soft cancel fails (e.g. auto-renew already off), try immediate
            if (data?.name === "InvalidArgument" || response.status === 400) {
                console.log("Soft cancel failed, trying immediate cancel:", JSON.stringify(data));
                const immediateResponse = await fetch(
                    `https://www.wixapis.com/payments/base44/v1/subscriptions/${subscriptionId}/cancel`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": WIX_API_KEY,
                            "wix-site-id": WIX_SITE_ID,
                        },
                        body: JSON.stringify({
                            subscription_id: subscriptionId,
                            reason: "User requested cancellation",
                            immediate: true,
                        }),
                    }
                );
                const immediateData = await immediateResponse.json();
                if (!immediateResponse.ok) {
                    console.error("Immediate cancel also failed:", JSON.stringify(immediateData));
                    return Response.json({ error: 'שגיאה בביטול המנוי' }, { status: 500 });
                }
                console.log(`✅ Subscription ${subscriptionId} immediately canceled for user ${user.id}`);
                return Response.json({ success: true, status: immediateData.subscription?.status, immediate: true });
            }

            console.error("Cancel subscription failed:", JSON.stringify(data));
            return Response.json({ error: 'שגיאה בביטול המנוי' }, { status: 500 });
        }

        console.log(`✅ Subscription ${subscriptionId} soft-canceled for user ${user.id}, status: ${data.subscription?.status}`);
        return Response.json({ success: true, status: data.subscription?.status, immediate: false });

    } catch (error) {
        console.error("Error in cancelSubscription:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});