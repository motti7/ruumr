import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const PAGE_SIZE = 100;
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const statusOf = (error) => Number(error?.response?.status ?? error?.status);

async function deleteRecord(entity, id) {
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            const result = await entity.delete(id);
            if (result?.success === false) throw new Error('Delete was not acknowledged');
            return;
        } catch (error) {
            const status = statusOf(error);
            // Only an explicit HTTP 404 counts as an already deleted record.
            if (status === 404) return;
            if (attempt === 2 || (status && status !== 429 && status < 500)) throw error;
            await sleep(250 * (attempt + 1));
        }
    }
}

Deno.serve(async (req) => {
    if (req.method !== 'POST') {
        return Response.json({ success: false, error: 'Method not allowed' }, {
            status: 405, headers: { Allow: 'POST' },
        });
    }
    let stage = 'authenticate';
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user?.id) return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        // Never accept a target user ID from the request body.
        const userId = user.id;
        const sr = base44.asServiceRole.entities;
        const deadline = Date.now() + 45000;
        const checks = [];
        const checkTime = () => {
            if (Date.now() > deadline) throw new Error('Cleanup needs another attempt');
        };

        async function remaining(name, query) {
            const rows = await sr[name].filter(query, 'id', PAGE_SIZE, 0);
            if (!Array.isArray(rows)) throw new Error('Invalid entity response');
            return rows;
        }

        async function drain(name, query, beforeDelete = async () => {}) {
            stage = name;
            checks.push({ name, query });
            const seen = new Set();
            // Read offset zero repeatedly; deletion shifts subsequent pages.
            // Continue until empty, including when the server caps the page size.
            for (;;) {
                checkTime();
                const rows = await remaining(name, query);
                if (!rows.length) return;
                for (const row of rows) {
                    checkTime();
                    if (!row.id || seen.has(row.id)) throw new Error('Deletion could not be verified');
                    seen.add(row.id);
                    await beforeDelete(row);
                    stage = name;
                    await deleteRecord(sr[name], row.id);
                }
            }
        }

        // Preserve the match until its children are gone, allowing safe retries.
        const deleteMatchChildren = async (match) => {
            await drain('Message', { match_id: match.id });
            await drain('TypingStatus', { match_id: match.id });
        };
        await drain('Match', { user1_id: userId }, deleteMatchChildren);
        await drain('Match', { user2_id: userId }, deleteMatchChildren);
        const targets = [
            ['Swipe', { swiper_id: userId }],
            ['Swipe', { swiped_id: userId }],
            ['TypingStatus', { user_id: userId }],
            ['CharterAnswer', { user_id: userId }],
            ['QuestionnairePreference', { user_id: userId }],
            ['Review', { reviewer_id: userId }],
            ['Review', { reviewed_id: userId }],
            ['GroupMessage', { sender_id: userId }],
            ['PageView', { user_id: userId }],
            ['PendingSubscription', { user_id: userId }],
            ['TeamInvite', { inviter_user_id: userId }],
            ['TeamInvite', { invitee_user_id: userId }],
        ];
        if (user.email) targets.push(['TeamInvite', { invitee_email: user.email.trim().toLowerCase() }]);
        for (const [name, query] of targets) await drain(name, query);
        await drain('Profile', { user_id: userId });

        // Reconciliation cannot republish profiles once local deletion is complete.
        // Keep User until external cleanup succeeds, allowing authenticated retries.
        stage = 'RuumrPlus';
        checkTime();
        const sync = await base44.functions.invoke('ruumrPlusBridge', { action: 'profile.delete_current' });
        if (sync?.data?.ok !== true || sync?.data?.result?.ok === false || sync?.data?.result?.success === false) {
            throw new Error('External cleanup was not acknowledged');
        }
        stage = 'verify';
        for (const { name, query } of checks) {
            checkTime();
            if ((await remaining(name, query)).length) throw new Error('Related data still exists');
        }
        stage = 'User';
        checkTime();
        await deleteRecord(sr.User, userId);
        if ((await remaining('User', { id: userId })).length) throw new Error('User still exists');
        return Response.json({ success: true });
    } catch (error) {
        // Do not log email, profile content, or raw provider errors.
        console.error('Account deletion incomplete', { stage, status: statusOf(error) || null });
        const unauthorized = stage === 'authenticate' && [401, 403].includes(statusOf(error));
        return Response.json({
            success: false,
            error: unauthorized ? 'Unauthorized' : 'Account deletion incomplete. Please retry or contact support.',
        }, { status: unauthorized ? 401 : 503 });
    }
});
