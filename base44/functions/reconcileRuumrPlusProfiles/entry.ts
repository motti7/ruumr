import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Periodic reconciliation between Base44 (source of truth) and the Ruumr Plus
// service. Profiles deleted in Base44 can linger in Plus if the per-delete
// webhook never fired (service downtime, a delete path that didn't notify Plus,
// etc.). This sweep snapshots every live Base44 profile to the service with
// replace_existing=true, and the service prunes any visible profile that is no
// longer present. Runs as a service-role scheduled automation (no user context).

const FUNCTION_NAME = 'reconcileRuumrPlusProfiles';
const DEFAULT_SERVICE_URL = 'http://127.0.0.1:8787';
const PAGE_SIZE = 500;
const SYSTEM_USER_ID = 'system-reconcile';

function getServiceUrl() {
    return (Deno.env.get('RUUMR_PLUS_SERVICE_URL') || DEFAULT_SERVICE_URL).trim().replace(/\/+$/, '');
}

function isLoopbackServiceUrl(serviceUrl: string) {
    try {
        const { hostname } = new URL(serviceUrl);
        const normalized = String(hostname || '').trim().toLowerCase();
        return normalized === 'localhost' || normalized === '127.0.0.1' || normalized === '::1' || normalized.endsWith('.local');
    } catch {
        return false;
    }
}

function getApiKey() {
    const value = (Deno.env.get('RUUMR_PLUS_API_KEY') || '').trim();
    return value && value !== 'replace-me' ? value : null;
}

function getWebhookSecret() {
    const value = (Deno.env.get('RUUMR_PLUS_WEBHOOK_SECRET') || '').trim();
    return value && value !== 'replace-me' ? value : null;
}

function cleanObject(value: Record<string, unknown>) {
    return Object.fromEntries(
        Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== null)
    );
}

function normalizeCityValues(value: unknown) {
    const values = Array.isArray(value) ? value.flat(Infinity) : value == null ? [] : [value];
    const seen = new Set<string>();
    const result: string[] = [];

    for (const entry of values) {
        const parts = String(entry ?? '')
            .split(/[,\n\r|]+/g)
            .map((part) => part.trim())
            .filter(Boolean);

        for (const city of parts) {
            const key = city.toLowerCase();
            if (seen.has(key)) {
                continue;
            }
            seen.add(key);
            result.push(city);
        }
    }

    return result;
}

function makeEventId(prefix: string) {
    return `${prefix}_${Date.now()}_${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`;
}

async function signBody(rawBody: string, secret: string | null) {
    if (!secret) {
        return null;
    }

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

// Kept in sync with ruumrPlusBridge.normalizeProfile so the reconciliation
// snapshot carries the same shape as live profile upserts.
function normalizeProfile(profile: Record<string, unknown>) {
    const searchCities = normalizeCityValues(profile.search_cities);
    const locationCities = normalizeCityValues(profile.location);
    const normalizedSearchCities = normalizeCityValues([...searchCities, ...locationCities]);

    return cleanObject({
        user_id: profile.user_id,
        name: profile.name,
        age: profile.age,
        gender: profile.gender,
        location: normalizedSearchCities[0] ?? profile.location,
        search_cities: normalizedSearchCities,
        search_area: profile.search_area,
        budget_min: profile.budget_min,
        budget_max: profile.budget_max,
        vibe_level: profile.vibe_level,
        smoking_preference: profile.smoking_preference,
        pet_preference: profile.pet_preference,
        pet_type: profile.pet_type,
        pet_other_description: profile.pet_other_description,
        looking_for_gender: profile.looking_for_gender,
        religion: profile.religion,
        kosher_preference: profile.kosher_preference,
        shabbat_preference: profile.shabbat_preference,
        current_status: profile.current_status,
        cleanliness: profile.cleanliness,
        shopping: profile.shopping,
        ac_wars: profile.ac_wars,
        dishes_in_sink: profile.dishes_in_sink,
        friends_and_parties: profile.friends_and_parties,
        about_me: profile.about_me,
        looking_for_description: profile.looking_for_description,
        social_link: profile.social_link,
        itunes_track_id: profile.itunes_track_id,
        song_preview_url: profile.song_preview_url,
        song_name: profile.song_name,
        song_artist: profile.song_artist,
        song_image: profile.song_image,
        photos: Array.isArray(profile.photos) ? profile.photos.filter(Boolean) : profile.photos,
        apartment_photos: Array.isArray(profile.apartment_photos) ? profile.apartment_photos.filter(Boolean) : profile.apartment_photos,
        existing_roommates: profile.existing_roommates,
        apartment_total_budget: profile.apartment_total_budget,
        interests: Array.isArray(profile.interests) ? profile.interests.filter(Boolean) : profile.interests,
        team_members: profile.team_members,
        team_target: profile.team_target,
        is_visible: profile.is_visible,
        is_verified: profile.is_verified,
        location_lat: profile.location_lat,
        location_lng: profile.location_lng,
        location_radius_km: profile.location_radius_km,
        video_url: profile.video_url,
    });
}

async function loadAllProfiles(base44: ReturnType<typeof createClientFromRequest>) {
    const sr = base44.asServiceRole.entities;
    const profiles: Record<string, unknown>[] = [];
    let skip = 0;

    while (true) {
        const page = await sr.Profile.list('-created_date', PAGE_SIZE, skip);
        const batch = Array.isArray(page) ? page : [];
        profiles.push(...batch);

        if (batch.length < PAGE_SIZE) {
            break;
        }
        skip += PAGE_SIZE;
    }

    return profiles;
}

Deno.serve(async (req) => {
    try {
        const serviceUrl = getServiceUrl();
        if (isLoopbackServiceUrl(serviceUrl)) {
            return Response.json({
                ok: false,
                error: 'RUUMR_PLUS_SERVICE_URL still points to localhost; set the deployed service URL before reconciling.',
            }, { status: 503 });
        }

        const base44 = createClientFromRequest(req);

        // Only allow admin users or platform automations (no user context)
        try {
            const user = await base44.auth.me();
            if (user && user.role !== 'admin') {
                return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
            }
        } catch {
            // No user context = called by platform automation, allow
        }

        const rawProfiles = await loadAllProfiles(base44);

        // Safety guard: never send a destructive replace_existing snapshot if we
        // failed to read any profiles. An empty snapshot with replace_existing
        // would prune every visible profile from the service on a transient read
        // error. A genuinely empty database is also a no-op worth skipping.
        if (rawProfiles.length === 0) {
            return Response.json({
                ok: true,
                skipped: true,
                reason: 'no_profiles_loaded',
                profile_count: 0,
            });
        }

        const normalizedProfiles = rawProfiles.map((profile) => normalizeProfile(profile));
        const now = new Date().toISOString();
        const eventId = makeEventId('evt_profile_reconcile');

        const payload = cleanObject({
            event_id: eventId,
            event_type: 'profile.snapshot',
            source: 'base44-reconcile',
            user_id: SYSTEM_USER_ID,
            activation_user_id: SYSTEM_USER_ID,
            idempotency_key: `reconcile:${Date.now()}:${crypto.randomUUID().slice(0, 8)}`,
            snapshot_id: `reconcile_${Date.now()}`,
            occurred_at: now,
            signed_at: now,
            replace_existing: true,
            profiles: normalizedProfiles,
            deleted_user_ids: [],
        });

        const rawBody = JSON.stringify(payload);
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };

        const apiKey = getApiKey();
        if (apiKey) {
            headers.Authorization = `Bearer ${apiKey}`;
        }

        const signature = await signBody(rawBody, getWebhookSecret());
        if (signature) {
            headers['x-ruumr-signature'] = signature;
        }

        const response = await fetch(`${serviceUrl}/profile/snapshot`, {
            method: 'POST',
            headers,
            body: rawBody,
        });

        const text = await response.text();
        let json: unknown = text;
        try {
            json = text ? JSON.parse(text) : null;
        } catch {
            // leave json as the raw text
        }

        if (!response.ok) {
            console.error(`[${FUNCTION_NAME}] snapshot failed with status ${response.status}`, json);
            return Response.json({
                ok: false,
                error: `profile/snapshot failed with status ${response.status}`,
                profile_count: normalizedProfiles.length,
            }, { status: 502 });
        }

        const summary = (json as Record<string, unknown>)?.result ?? json;
        console.log(`[${FUNCTION_NAME}] reconciled`, {
            profile_count: normalizedProfiles.length,
            replaced_count: (summary as Record<string, unknown>)?.replaced_count ?? null,
            deleted_count: (summary as Record<string, unknown>)?.deleted_count ?? null,
        });

        return Response.json({
            ok: true,
            profile_count: normalizedProfiles.length,
            result: summary,
        });
    } catch (error) {
        console.error(`[${FUNCTION_NAME}]`, error);
        const message = error instanceof Error ? error.message : String(error);
        return Response.json({ ok: false, error: message }, { status: 500 });
    }
});