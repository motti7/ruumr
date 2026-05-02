import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        let user = null;
        try { user = await base44.auth.me(); } catch (_) {}

        if (user && user.role !== 'admin') {
            return Response.json({ error: 'Admin only' }, { status: 403 });
        }

        const body = await req.json();
        const { old_url, new_url } = body;

        if (!old_url || !new_url) {
            return Response.json({ error: 'old_url and new_url are required' }, { status: 400 });
        }

        console.log('Starting replacePhoto:', { old_url, new_url });

        const sr = base44.asServiceRole.entities;

        let skip = 0;
        const pageSize = 200;
        const updated = [];

        while (true) {
            console.log('Fetching profiles, skip:', skip);
            const profiles = await sr.Profile.list('-created_date', pageSize, skip);
            console.log('Got profiles:', profiles?.length);
            if (!profiles || profiles.length === 0) break;

            for (const profile of profiles) {
                let changed = false;
                const newPhotos = (profile.photos || []).map(p => {
                    if (p === old_url) { changed = true; return new_url; }
                    return p;
                });
                const newApartmentPhotos = (profile.apartment_photos || []).map(p => {
                    if (p === old_url) { changed = true; return new_url; }
                    return p;
                });

                if (changed) {
                    console.log('Updating profile:', profile.id);
                    await sr.Profile.update(profile.id, {
                        photos: newPhotos,
                        apartment_photos: newApartmentPhotos
                    });
                    updated.push(profile.id);
                }
            }

            if (profiles.length < pageSize) break;
            skip += pageSize;
        }

        console.log('Done. Updated:', updated.length);
        return Response.json({ ok: true, updated_profiles: updated, count: updated.length });
    } catch (error) {
        console.error('replacePhoto error:', error.message, error.status);
        return Response.json({ error: error.message, status: error.status }, { status: 500 });
    }
});