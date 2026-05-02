import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
        return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const { old_url, new_url } = await req.json();

    if (!old_url || !new_url) {
        return Response.json({ error: 'old_url and new_url are required' }, { status: 400 });
    }

    const sr = base44.asServiceRole.entities;

    // Find all profiles and scan for the old URL
    let skip = 0;
    const pageSize = 500;
    const updated = [];

    while (true) {
        const profiles = await sr.Profile.list('-created_date', pageSize, skip);
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

    return Response.json({ ok: true, updated_profiles: updated, count: updated.length });
});