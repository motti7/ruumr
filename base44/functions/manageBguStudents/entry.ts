import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const BGU_EMAIL_DOMAIN = '@post.bgu.ac.il';
const PAGE_SIZE = 500;

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user || user.role !== 'admin') {
            return Response.json({ ok: false, error: 'Admin access required' }, { status: 403 });
        }

        const body = await req.json().catch(() => ({}));
        const action = String(body.action || '').trim();

        if (!action || (action !== 'grant_all' && action !== 'revoke_all')) {
            return Response.json({ ok: false, error: 'Action must be "grant_all" or "revoke_all"' }, { status: 400 });
        }

        const isGrant = action === 'grant_all';
        const sr = base44.asServiceRole.entities;
        
        let bguStudents = 0;
        let updated = 0;
        let skip = 0;

        // Paginate through all users
        while (true) {
            const page = await sr.User.list('-created_date', PAGE_SIZE, skip);
            const batch = Array.isArray(page) ? page : [];
            
            for (const u of batch) {
                const email = String(u.email || '').trim().toLowerCase();
                if (email.endsWith(BGU_EMAIL_DOMAIN)) {
                    bguStudents++;
                    const currentFlag = Boolean(u.is_ruumr_plus);
                    const currentSource = String(u.ruumr_plus_source || '').trim();
                    if (currentFlag !== isGrant || (isGrant && currentSource !== 'bgu_free')) {
                        try {
                            await sr.User.update(u.id, {
                                is_ruumr_plus: isGrant,
                                ruumr_plus_source: isGrant ? 'bgu_free' : 'none',
                            });
                            updated++;
                        } catch (err) {
                            console.error(`Failed to update user ${u.id}:`, err.message);
                        }
                    }
                }
            }

            if (batch.length < PAGE_SIZE) break;
            skip += PAGE_SIZE;
        }

        const actionLabel = isGrant ? 'granted' : 'revoked';
        console.log(`📋 BGU Students: ${bguStudents} found, ${updated} ${actionLabel} Ruumr Plus`);

        return Response.json({
            ok: true,
            action,
            bgu_students_found: bguStudents,
            users_updated: updated,
            message: `Found ${bguStudents} BGU students. ${actionLabel} Ruumr Plus for ${updated} users.`
        });
    } catch (error) {
        console.error('manageBguStudents error:', error);
        return Response.json({ ok: false, error: error.message }, { status: 500 });
    }
});
