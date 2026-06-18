import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const BGU_EMAIL_DOMAIN = '@post.bgu.ac.il';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
        }

        const email = String(user.email || '').trim().toLowerCase();
        const isBguStudent = email.endsWith(BGU_EMAIL_DOMAIN);

        if (!isBguStudent) {
            return Response.json({ 
                ok: true, 
                is_bgu_student: false,
                message: 'Not a BGU student email' 
            });
        }

        // Already has Plus – nothing to do
        if (user.is_ruumr_plus) {
            return Response.json({ 
                ok: true, 
                is_bgu_student: true,
                already_entitled: true,
                message: 'BGU student already has Ruumr Plus' 
            });
        }

        // Grant Ruumr Plus via service role
        await base44.asServiceRole.entities.User.update(user.id, { is_ruumr_plus: true });

        console.log(`✅ Granted free Ruumr Plus to BGU student: ${email} (${user.id})`);

        return Response.json({ 
            ok: true, 
            is_bgu_student: true,
            already_entitled: false,
            granted: true,
            message: 'Ruumr Plus granted for free as BGU student!' 
        });
    } catch (error) {
        console.error('ensureBguPlusEntitlement error:', error);
        return Response.json({ ok: false, error: error.message }, { status: 500 });
    }
});