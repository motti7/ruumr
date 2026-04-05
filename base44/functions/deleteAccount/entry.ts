import { createClientFromRequest } from 'npm:@base44/sdk@0.8.24';

const safeDelete = async (entity, id) => {
    try { await entity.delete(id); } catch (_) {}
};

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = user.id;
        const userEmail = user.email;
        const sr = base44.asServiceRole.entities;

        // Delete Profile
        const profiles = await sr.Profile.filter({ user_id: userId });
        for (const p of profiles) await safeDelete(sr.Profile, p.id);

        // Delete Swipes
        const swipesAsSwiper = await sr.Swipe.filter({ swiper_id: userId });
        for (const s of swipesAsSwiper) await safeDelete(sr.Swipe, s.id);

        const swipesAsSwiped = await sr.Swipe.filter({ swiped_id: userId });
        for (const s of swipesAsSwiped) await safeDelete(sr.Swipe, s.id);

        // Delete Matches + Messages
        const matchesAsUser1 = await sr.Match.filter({ user1_id: userId });
        for (const m of matchesAsUser1) {
            const msgs = await sr.Message.filter({ match_id: m.id });
            for (const msg of msgs) await safeDelete(sr.Message, msg.id);
            await safeDelete(sr.Match, m.id);
        }
        const matchesAsUser2 = await sr.Match.filter({ user2_id: userId });
        for (const m of matchesAsUser2) {
            const msgs = await sr.Message.filter({ match_id: m.id });
            for (const msg of msgs) await safeDelete(sr.Message, msg.id);
            await safeDelete(sr.Match, m.id);
        }

        // Delete CharterAnswers
        const charterAnswers = await sr.CharterAnswer.filter({ user_id: userId });
        for (const ca of charterAnswers) await safeDelete(sr.CharterAnswer, ca.id);

        // Delete the User record — this permanently removes the account
        await sr.User.delete(userId);

        console.log(`✅ Account fully deleted for user ${userEmail} (${userId})`);
        return Response.json({ success: true });
    } catch (error) {
        console.error("Error deleting account:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});