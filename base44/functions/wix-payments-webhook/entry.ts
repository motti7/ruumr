import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import * as jose from 'npm:jose@5.9.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        const WEBHOOK_PUBLIC_KEY = Deno.env.get("PAYMENTS_BY_WIX_WEBHOOK_PUBLIC_KEY");
        if (!WEBHOOK_PUBLIC_KEY) {
            console.error("Missing PAYMENTS_BY_WIX_WEBHOOK_PUBLIC_KEY");
            return new Response("Missing public key", { status: 500 });
        }

        const requestBody = await req.text();

        // Verify JWT signature
        let rawPayload;
        try {
            const publicKey = await jose.importSPKI(WEBHOOK_PUBLIC_KEY, "RS256");
            const { payload } = await jose.jwtVerify(requestBody, publicKey, { algorithms: ["RS256"] });
            rawPayload = payload;
        } catch (e) {
            console.error("JWT verification failed:", e.message);
            return new Response("Invalid signature", { status: 401 });
        }

        // Double-nested JSON parsing
        const event = JSON.parse(rawPayload.data);
        const eventData = JSON.parse(event.data);
        const eventType = event.eventType;

        console.log(`📩 Webhook received: ${eventType}`);

        if (eventType === "wix.ecom.v1.order_approved") {
            const order = eventData.actionEvent.body.order;
            const checkoutId = order.checkoutId;

            console.log(`✅ Order approved, checkoutId: ${checkoutId}`);

            // Find pending subscription by checkoutId
            const pending = await base44.asServiceRole.entities.PendingSubscription.filter({ checkout_id: checkoutId });
            if (!pending || pending.length === 0) {
                console.error(`No pending subscription found for checkoutId: ${checkoutId}`);
                return new Response("OK", { status: 200 });
            }

            const record = pending[0];
            if (!record.user_email) {
                console.error("Pending record has no user_email, skipping");
                return new Response("OK", { status: 200 });
            }

            // Extract subscription ID from line items
            let subscriptionId = null;
            for (const lineItem of (order.lineItems || [])) {
                if (lineItem.subscriptionInfo?.id) {
                    subscriptionId = lineItem.subscriptionInfo.id;
                    break;
                }
            }

            // Update pending record to active
            await base44.asServiceRole.entities.PendingSubscription.update(record.id, {
                status: "active",
                subscription_id: subscriptionId,
            });

            // Find the user and grant Plus entitlement
            const allUsers = await base44.asServiceRole.entities.User.list();
            const targetUser = allUsers.find(u => u.email === record.user_email);

            if (!targetUser) {
                console.error(`User not found for email: ${record.user_email}`);
                return new Response("OK", { status: 200 });
            }

            await base44.asServiceRole.entities.User.update(targetUser.id, {
                is_ruumr_plus: true,
                ruumr_plus_source: "wix_paid",
                ruumr_plus_subscription_id: subscriptionId,
            });

            console.log(`🎉 Ruumr Plus granted to user ${targetUser.id} (${record.user_email})`);

        } else if (
            eventType === "wix.ecom.subscription_contracts.v1.subscription_contract_canceled" ||
            eventType === "wix.ecom.subscription_contracts.v1.subscription_contract_expired"
        ) {
            const subscriptionContract = eventData.actionEvent.body.subscriptionContract;
            const subscriptionId = subscriptionContract.id;

            console.log(`❌ Subscription ended: ${subscriptionId} (${eventType})`);

            // Find the subscription record
            const records = await base44.asServiceRole.entities.PendingSubscription.filter({ subscription_id: subscriptionId });
            if (!records || records.length === 0) {
                console.error(`No subscription record found for id: ${subscriptionId}`);
                return new Response("OK", { status: 200 });
            }

            const record = records[0];

            await base44.asServiceRole.entities.PendingSubscription.update(record.id, {
                status: "canceled",
            });

            // Revoke Plus entitlement
            const allUsers = await base44.asServiceRole.entities.User.list();
            const targetUser = allUsers.find(u => u.email === record.user_email);

            if (targetUser) {
                const source = String(targetUser.ruumr_plus_source || '').trim();
                if (!source || source === "wix_paid") {
                    await base44.asServiceRole.entities.User.update(targetUser.id, {
                        is_ruumr_plus: false,
                        ruumr_plus_source: "none",
                        ruumr_plus_subscription_id: null,
                    });
                    console.log(`🔒 Ruumr Plus revoked from user ${targetUser.id}`);
                } else {
                    console.log(`ℹ️ Skipped Wix revocation for user ${targetUser.id}; current source is ${source}`);
                }
            }
        }

        return new Response("OK", { status: 200 });

    } catch (error) {
        console.error("Error in wix-payments-webhook:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
});
