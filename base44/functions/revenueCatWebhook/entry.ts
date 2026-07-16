import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const PURCHASE_EVENT_TYPES = new Set(['INITIAL_PURCHASE', 'NON_RENEWING_PURCHASE']);
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

Deno.serve(async (req) => {
  try {
    const webhookSecret = Deno.env.get('REVENUECAT_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.error('Missing REVENUECAT_WEBHOOK_SECRET');
      return Response.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    const authHeader = req.headers.get('authorization') || '';
    if (authHeader !== webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
      console.error('RevenueCat webhook: invalid Authorization header');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const event = body?.event;
    if (!event) {
      console.error('RevenueCat webhook: missing event in payload');
      return Response.json({ error: 'Missing event' }, { status: 400 });
    }

    const userId = event.app_user_id;
    const eventType = event.type;
    console.log(`RevenueCat webhook received: type=${eventType}, app_user_id=${userId}`);

    if (!userId) {
      console.error('RevenueCat webhook: missing app_user_id');
      return Response.json({ error: 'Missing app_user_id' }, { status: 400 });
    }

    if (!PURCHASE_EVENT_TYPES.has(eventType)) {
      console.log(`RevenueCat webhook: ignoring event type ${eventType}`);
      return Response.json({ received: true });
    }

    const entitlementIds = event.entitlement_ids || [];
    if (Array.isArray(entitlementIds) && entitlementIds.length > 0 && !entitlementIds.includes('ruumr_plus')) {
      console.log('RevenueCat webhook: ignoring event, no ruumr_plus entitlement', entitlementIds);
      return Response.json({ received: true });
    }

    const base44 = createClientFromRequest(req);

    const eventDateMs = event.event_timestamp_ms || Date.now();
    const expiresAt = new Date(eventDateMs + NINETY_DAYS_MS).toISOString();

    await base44.asServiceRole.entities.User.update(userId, {
      is_ruumr_plus: true,
      ruumr_plus_source: 'revenuecat',
      ruumr_plus_expires_at: expiresAt,
    });

    console.log(`RevenueCat webhook: granted Plus to user ${userId}, expires_at=${expiresAt}`);

    return Response.json({ received: true });
  } catch (error) {
    console.error('Error in revenueCatWebhook:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});