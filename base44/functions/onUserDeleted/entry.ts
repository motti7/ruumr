import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Triggered by entity automation on User delete
// Cascades deletion of all user-related data so no orphaned records remain
// when a user is deleted directly from the admin dashboard.

const safeDelete = async (entity, id) => {
    try { await entity.delete(id); } catch (_) {}
};

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const payload = await req.json();

        const userId = payload?.event?.entity_id || payload?.data?.id;
        if (!userId) {
            console.warn('⚠️ onUserDeleted: no userId in payload', JSON.stringify(payload));
            return Response.json({ skipped: true, reason: 'no user id' });
        }

        const sr = base44.asServiceRole.entities;

        // Delete Profile (the onProfileDeleted automation will fire and sync Ruumr Plus)
        const profiles = await sr.Profile.filter({ user_id: userId });
        for (const p of profiles) await safeDelete(sr.Profile, p.id);
        console.log(`🗑️ Deleted ${profiles.length} profile(s) for user ${userId}`);

        // Delete Swipes
        const swipesAsSwiper = await sr.Swipe.filter({ swiper_id: userId });
        for (const s of swipesAsSwiper) await safeDelete(sr.Swipe, s.id);

        const swipesAsSwiped = await sr.Swipe.filter({ swiped_id: userId });
        for (const s of swipesAsSwiped) await safeDelete(sr.Swipe, s.id);
        console.log(`🗑️ Deleted ${swipesAsSwiper.length + swipesAsSwiped.length} swipe(s) for user ${userId}`);

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
        console.log(`🗑️ Deleted ${matchesAsUser1.length + matchesAsUser2.length} match(es) for user ${userId}`);

        // Delete CharterAnswers
        const charterAnswers = await sr.CharterAnswer.filter({ user_id: userId });
        for (const ca of charterAnswers) await safeDelete(sr.CharterAnswer, ca.id);

        // Delete Reviews
        const reviewsAsReviewer = await sr.Review.filter({ reviewer_id: userId });
        for (const r of reviewsAsReviewer) await safeDelete(sr.Review, r.id);

        const reviewsAsReviewed = await sr.Review.filter({ reviewed_id: userId });
        for (const r of reviewsAsReviewed) await safeDelete(sr.Review, r.id);

        console.log(`✅ onUserDeleted: all data cleaned up for user ${userId}`);
        return Response.json({ success: true, userId });
    } catch (error) {
        console.error('❌ onUserDeleted error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});