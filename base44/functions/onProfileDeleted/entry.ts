import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const FUNCTION_NAME = 'onProfileDeleted';

function getServiceUrl() {
    return (Deno.env.get('RUUMR_PLUS_SERVICE_URL') || 'http://127.0.0.1:8787').trim().replace(/\/+$/, '');
}

function getApiKey() {
    const value = (Deno.env.get('RUUMR_PLUS_API_KEY') || '').trim();
    return value && value !== 'replace-me' ? value : null;
}

function getWebhookSecret() {
    const value = (Deno.env.get('RUUMR_PLUS_WEBHOOK_SECRET') || '').trim();
    return value && value !== 'replace-me' ? value : null;
}

function cleanObject(value) {
    return Object.fromEntries(
        Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== null)
    );
}

function makeIdempotencyKey(prefix, userId) {
    return `${prefix}:${userId}:${Date.now()}:${crypto.randomUUID().slice(0, 8)}`;
}

function makeEventId(prefix, userId) {
    return `${prefix}_${userId}_${Date.now()}_${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`;
}

async function signBody(rawBody, secret) {
    if (!secret) return null;

    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
    );

    const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody));
    return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function serviceRequest(path, { method = 'POST', body = null, signWebhook = false } = {}) {
    const serviceUrl = getServiceUrl();
    const apiKey = getApiKey();
    const secret = getWebhookSecret();
    const rawBody = body ? JSON.stringify(body) : null;
    const headers = {};

    if (rawBody) headers['Content-Type'] = 'application/json';
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    if (signWebhook && rawBody && secret) {
        const signature = await signBody(rawBody, secret);
        if (signature) headers['x-ruumr-signature'] = signature;
    }

    const response = await fetch(`${serviceUrl}${path}`, {
        method,
        headers,
        body: rawBody ?? undefined,
    });

    const text = await response.text();
    let json = null;
    if (text) {
        try { json = JSON.parse(text); } catch { json = text; }
    }

    if (!response.ok) {
        const error = new Error(`Ruumr Plus request to ${path} failed with status ${response.status}: ${text}`);
        error.status = response.status;
        error.payload = json;
        throw error;
    }

    return json;
}

Deno.serve(async (req) => {
    try {
        // Parse the automation entity event payload
        const payload = await req.json().catch(() => ({}));

        // Extract user_id from the deleted profile data
        // Base44 entity automations provide old_data for delete events
        const profileData = payload?.old_data ?? payload?.data ?? {};
        const userId = profileData?.user_id || profileData?.id || payload?.user_id;

        if (!userId) {
            console.warn(`[${FUNCTION_NAME}] Could not extract user_id from payload:`, JSON.stringify(payload));
            return Response.json({
                ok: false,
                error: 'Could not extract user_id from deleted profile payload',
            }, { status: 400 });
        }

        const userIdStr = String(userId);
        console.info(`[${FUNCTION_NAME}] Notifying Ruumr Plus of profile deletion for user_id: ${userIdStr}`);

        const requestBody = cleanObject({
            event_id: makeEventId('evt_profile_delete', userIdStr),
            event_type: 'profile.delete',
            source: 'base44',
            user_id: userIdStr,
            deleted_user_id: userIdStr,
            idempotency_key: makeIdempotencyKey('profile-delete-automation', userIdStr),
            occurred_at: new Date().toISOString(),
            signed_at: new Date().toISOString(),
            deleted_at: new Date().toISOString(),
        });

        const result = await serviceRequest('/profile/delete', {
            body: requestBody,
            signWebhook: true,
        });

        console.info(`[${FUNCTION_NAME}] Successfully notified Ruumr Plus for user_id: ${userIdStr}`);
        return Response.json({ ok: true, user_id: userIdStr, result });

    } catch (error) {
        console.error(`[${FUNCTION_NAME}] Error:`, error?.message, error?.payload ?? '');
        const status = error?.status || 500;
        return Response.json({
            ok: false,
            error: error?.message || 'Unknown error',
            details: error?.payload ?? null,
        }, { status });
    }
});