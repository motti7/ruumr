import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const secretKey = Deno.env.get('REVENUECAT_SECRET_API_KEY');
    if (!secretKey) {
      console.error('Missing REVENUECAT_SECRET_API_KEY');
      return Response.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    // The frontend configures RevenueCat with appUserID = base44 user.id,
    // so we can verify the subscriber directly by that id.
    const rcRes = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(user.id)}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });

    if (!rcRes.ok) {
      const errText = await rcRes.text();
      console.error('RevenueCat subscriber fetch failed:', rcRes.status, errText);
      return Response.json({ error: 'Failed to verify subscription' }, { status: 502 });
    }

    const rcData = await rcRes.json();
    const entitlement = rcData?.subscriber?.entitlements?.['Plus'];
    const isActive = Boolean(entitlement) && (!entitlement.expires_date || new Date(entitlement.expires_date) > new Date());

    if (!isActive) {
      console.error('Plus entitlement not active for user:', user.id);
      return Response.json({ error: 'Plus entitlement is not active' }, { status: 403 });
    }

    await base44.asServiceRole.entities.User.update(user.id, {
      is_ruumr_plus: true,
      ruumr_plus_source: 'revenuecat',
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error in activateRevenueCatPlus:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});