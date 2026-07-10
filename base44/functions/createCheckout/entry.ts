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

        const origin = req.headers.get("Origin") || "https://app.ruumrapp.com";
        const thankYouUrl = `${origin}/RuumrPlusThankYou`;
        const postFlowUrl = `${origin}/RuumrPlusPricing`;

        // Create checkout session with Wix
        const response = await fetch(
            "https://www.wixapis.com/payments/platform/v1/checkout-sessions/construct",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": WIX_API_KEY,
                    "wix-site-id": WIX_SITE_ID,
                },
                body: JSON.stringify({
                    cart: {
                        items: [
                            {
                                name: "Ruumr Plus - מנוי ל-3 חודשים",
                                quantity: 1,
                                price: "25",
                                subscriptionInfo: {
                                    subscriptionSettings: {
                                        frequency: "MONTH",
                                        interval: 3,
                                        billingCycles: 1,
                                    },
                                    title: "Ruumr Plus",
                                    description: "25 ₪ לשלושה חודשים, חיוב חד-פעמי ללא חידוש אוטומטי: התאמות חכמות מבוססות AI ופתיחת שיחה מיידית עם כל התאמה, כל אורך הדרך למציאת הדירה והשותפים.",
                                },
                            },
                        ],
                        customerInfo: {
                            email: user.email,
                            firstName: user.full_name?.split(" ")[0] || "",
                            lastName: user.full_name?.split(" ").slice(1).join(" ") || "",
                        },
                    },
                    callbackUrls: {
                        thankYouPageUrl: thankYouUrl,
                        postFlowUrl: postFlowUrl,
                    },
                }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("Wix API error:", JSON.stringify(data));
            return Response.json({ error: data.message || "Failed to create checkout" }, { status: 500 });
        }

        const checkoutId = data.checkoutSession.id;
        const redirectUrl = data.checkoutSession.redirectUrl;

        // Store pending subscription record so webhook can correlate
        await base44.asServiceRole.entities.PendingSubscription.create({
            user_id: user.id,
            user_email: user.email,
            checkout_id: checkoutId,
            status: "pending",
        });

        console.log(`✅ Checkout created for user ${user.id}, checkoutId: ${checkoutId}`);
        return Response.json({ redirectUrl, checkoutId });

    } catch (error) {
        console.error("Error in createCheckout:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});