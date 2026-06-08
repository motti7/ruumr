import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Scheduled cleanup: finds Profile records whose user_id no longer has a
// matching User in the system, and cascades deletion of all related data.
// Runs periodically to catch users deleted directly via the admin dashboard.
// Processes up to MAX_PER_RUN orphans per execution to avoid rate limits.

const MAX_PER_RUN = 3;
const DELAY_MS = 300;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const safeDelete = async (entity, id) => {
    try { await entity.delete(id); } catch (_) {}
    await sleep(DELAY_MS);
};

Deno.serve(async (req) => {
    try {
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

        const sr = base44.asServiceRole.entities;

        // Fetch all profiles and all users
        const [allProfiles, allUsers] = await Promise.all([
            sr.Profile.list(),
            sr.User.list(),
        ]);

        const existingUserIds = new Set(allUsers.map(u => u.id));

        // Find orphaned profiles (user deleted but profile still exists)
        const orphanedProfiles = allProfiles.filter(p => !existingUserIds.has(p.user_id));

        if (orphanedProfiles.length === 0) {
            console.log('✅ No orphaned profiles found.');
            return Response.json({ success: true, cleaned: 0 });
        }

        console.log(`🔍 Found ${orphanedProfiles.length} orphaned profile(s). Processing up to ${MAX_PER_RUN} this run...`);

        const batch = orphanedProfiles.slice(0, MAX_PER_RUN);
        let cleaned = 0;
        for (const profile of batch) {
            const userId = profile.user_id;

            // Delete the profile itself
            await safeDelete(sr.Profile, profile.id);

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

            const questionnairePreferences = await sr.QuestionnairePreference.filter({ user_id: userId });
            for (const preference of questionnairePreferences) await safeDelete(sr.QuestionnairePreference, preference.id);

            // Delete Reviews
            const reviewsAsReviewer = await sr.Review.filter({ reviewer_id: userId });
            for (const r of reviewsAsReviewer) await safeDelete(sr.Review, r.id);

            const reviewsAsReviewed = await sr.Review.filter({ reviewed_id: userId });
            for (const r of reviewsAsReviewed) await safeDelete(sr.Review, r.id);

            console.log(`✅ Cleaned up orphaned data for user_id=${userId} (profile: ${profile.id})`);
            cleaned++;
        }

        return Response.json({ success: true, cleaned, remaining: orphanedProfiles.length - cleaned, total_profiles: allProfiles.length });
    } catch (error) {
        console.error('❌ cleanupOrphanedProfiles error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});
