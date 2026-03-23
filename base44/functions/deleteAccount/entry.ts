import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = user.id;
        const userEmail = user.email;

        // Delete Profile
        const profiles = await base44.asServiceRole.entities.Profile.filter({ user_id: userId });
        for (const p of profiles) {
            await base44.asServiceRole.entities.Profile.delete(p.id);
        }

        // Delete Swipes (as swiper or swiped)
        const swipesAsSwiper = await base44.asServiceRole.entities.Swipe.filter({ swiper_id: userId });
        for (const s of swipesAsSwiper) {
            await base44.asServiceRole.entities.Swipe.delete(s.id);
        }
        const swipesAsSwiped = await base44.asServiceRole.entities.Swipe.filter({ swiped_id: userId });
        for (const s of swipesAsSwiped) {
            await base44.asServiceRole.entities.Swipe.delete(s.id);
        }

        // Delete Matches (as user1 or user2)
        const matchesAsUser1 = await base44.asServiceRole.entities.Match.filter({ user1_id: userId });
        for (const m of matchesAsUser1) {
            // Delete messages in this match
            const msgs = await base44.asServiceRole.entities.Message.filter({ match_id: m.id });
            for (const msg of msgs) {
                await base44.asServiceRole.entities.Message.delete(msg.id);
            }
            await base44.asServiceRole.entities.Match.delete(m.id);
        }
        const matchesAsUser2 = await base44.asServiceRole.entities.Match.filter({ user2_id: userId });
        for (const m of matchesAsUser2) {
            const msgs = await base44.asServiceRole.entities.Message.filter({ match_id: m.id });
            for (const msg of msgs) {
                await base44.asServiceRole.entities.Message.delete(msg.id);
            }
            await base44.asServiceRole.entities.Match.delete(m.id);
        }

        // Delete CharterAnswers
        const charterAnswers = await base44.asServiceRole.entities.CharterAnswer.filter({ user_id: userId });
        for (const ca of charterAnswers) {
            await base44.asServiceRole.entities.CharterAnswer.delete(ca.id);
        }

        // Delete the User record itself (removes from admin users page + auth)
        await base44.asServiceRole.entities.User.delete(userId);

        console.log(`✅ Account fully deleted for user ${userEmail} (${userId})`);
        return Response.json({ success: true });
    } catch (error) {
        console.error("Error deleting account:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});