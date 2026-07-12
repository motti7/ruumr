import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const TRANZILA_WEBHOOK_SECRET = Deno.env.get("TRANZILA_WEBHOOK_SECRET");

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const url = new URL(req.url);
        const ref = url.searchParams.get("ref");
        const secret = url.searchParams.get("secret");

        if (!secret || secret !== TRANZILA_WEBHOOK_SECRET) {
            console.error("Tranzila webhook: invalid or missing secret");
            return new Response("Unauthorized", { status: 401 });
        }

        if (!ref) {
            console.error("Tranzila webhook: missing ref");
            return new Response("Missing ref", { status: 400 });
        }

        // Tranzila posts the transaction result as form-encoded data
        let params;
        const contentType = req.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
            params = await req.json();
        } else {
            const formData = await req.formData();
            params = Object.fromEntries(formData.entries());
        }

        console.log(`📩 Tranzila webhook received for ref ${ref}:`, JSON.stringify(params));

        const records = await base44.asServiceRole.entities.PendingSubscription.filter({ checkout_id: ref });
        if (!records || records.length === 0) {
            console.error(`No pending subscription found for ref: ${ref}`);
            return new Response("OK", { status: 200 });
        }

        const record = records[0];
        const responseCode = String(params.Response ?? "");
        const transactionId = params.transaction_id ? String(params.transaction_id) : null;

        if (responseCode === "000") {
            await base44.asServiceRole.entities.PendingSubscription.update(record.id, {
                status: "active",
                subscription_id: transactionId,
            });

            const allUsers = await base44.asServiceRole.entities.User.list();
            const targetUser = allUsers.find(u => u.email === record.user_email);

            if (!targetUser) {
                console.error(`User not found for email: ${record.user_email}`);
                return new Response("OK", { status: 200 });
            }

            await base44.asServiceRole.entities.User.update(targetUser.id, {
                is_ruumr_plus: true,
                ruumr_plus_source: "tranzila_paid",
                ruumr_plus_subscription_id: transactionId,
            });

            console.log(`🎉 Ruumr Plus granted to user ${targetUser.id} (${record.user_email})`);
        } else {
            await base44.asServiceRole.entities.PendingSubscription.update(record.id, {
                status: "canceled",
            });
            console.log(`❌ Tranzila transaction failed for ref ${ref}, response code: ${responseCode}`);
        }

        return new Response("OK", { status: 200 });

    } catch (error) {
        console.error("Error in tranzilaWebhook:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
});