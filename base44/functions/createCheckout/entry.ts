import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const TRANZILA_TERMINAL_NAME = Deno.env.get("TRANZILA_TERMINAL_NAME");
const TRANZILA_WEBHOOK_SECRET = Deno.env.get("TRANZILA_WEBHOOK_SECRET");

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!TRANZILA_TERMINAL_NAME || !TRANZILA_WEBHOOK_SECRET) {
            console.error("Missing TRANZILA_TERMINAL_NAME or TRANZILA_WEBHOOK_SECRET");
            return Response.json({ error: "Payment provider not configured" }, { status: 500 });
        }

        const origin = req.headers.get("Origin") || "https://app.ruumrapp.com";
        const checkoutId = crypto.randomUUID();
        // The server-to-server notify webhook must hit the base44.app functions
        // endpoint directly — custom domains only serve the static frontend and
        // reject POST requests to /functions/* with "Method Not Allowed".
        const appId = Deno.env.get("BASE44_APP_ID");
        const notifyBase = appId ? `https://${appId}.base44.app` : origin;

        const successUrl = `${origin}/TranzilaReturn?status=success`;
        const failUrl = `${origin}/TranzilaReturn?status=fail`;
        const notifyUrl = `${notifyBase}/functions/tranzilaWebhook?ref=${checkoutId}&secret=${encodeURIComponent(TRANZILA_WEBHOOK_SECRET)}`;

        // Store pending record so the notify webhook can correlate the transaction back to this user
        await base44.asServiceRole.entities.PendingSubscription.create({
            user_id: user.id,
            user_email: user.email,
            checkout_id: checkoutId,
            status: "pending",
        });

        const nameParts = String(user.full_name || "").trim().split(" ");
        const contact = user.full_name || user.email;

        console.log(`✅ Tranzila checkout prepared for user ${user.id}, checkoutId: ${checkoutId}`);

        return Response.json({
            checkoutId,
            terminalName: TRANZILA_TERMINAL_NAME,
            sum: "24.90",
            currency: "1",
            cred_type: "1",
            tranmode: "A",
            contact,
            company: "Ruumr",
            email: user.email,
            country: "IL",
            city: "N/A",
            address: "N/A",
            zip: "0000",
            pdesc: "Ruumr Plus - מנוי לשלושה חודשים",
            lang: "il",
            success_url_address: successUrl,
            fail_url_address: failUrl,
            notify_url_address: notifyUrl,
        });

    } catch (error) {
        console.error("Error in createCheckout:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});