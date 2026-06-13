import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const safeDelete = async (entity, id) => {
    try {
        await entity.delete(id);
        await sleep(50); // small delay to avoid rate limiting
    } catch (e) {
        console.warn(`⚠️ safeDelete failed for id ${id}:`, e?.message);
    }
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

        console.log(`🗑️ Starting full account deletion for user ${userEmail} (${userId})`);

        // Sync deletion to Ruumr Plus
        try {
            await base44.functions.invoke('ruumrPlusBridge', { action: 'profile.delete_current' });
        } catch (syncError) {
            console.error('⚠️ Failed to sync profile deletion to Ruumr Plus:', syncError);
        }

        // 1. Profile — CRITICAL: fetch ALL profiles (high limit) to find user's records
        const allProfiles = await sr.Profile.list('-created_date', 2000);
        const myProfiles = allProfiles.filter(p => p.user_id === userId);
        console.log(`  🔍 Found ${myProfiles.length} profile(s) for user ${userId} (scanned ${allProfiles.length} total): ${JSON.stringify(myProfiles.map(p => p.id))}`);

        let deletedCount = 0;
        for (const p of myProfiles) {
            let deleted = false;
            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    await sr.Profile.delete(p.id);
                    console.log(`  ✅ Profile ${p.id} deleted (attempt ${attempt})`);
                    deleted = true;
                    deletedCount++;
                    break;
                } catch (e) {
                    const errMsg = e?.message || '';
                    if (errMsg.includes('not found')) {
                        // Already deleted — treat as success
                        console.log(`  ⚠️ Profile ${p.id} already deleted (stale reference), skipping`);
                        deletedCount++;
                        deleted = true;
                        break;
                    }
                    console.error(`  ❌ Attempt ${attempt} failed for profile ${p.id}:`, errMsg);
                    await sleep(300 * attempt);
                }
            }
            if (!deleted) {
                console.error(`  💀 CRITICAL: Failed to delete profile ${p.id} after 3 attempts`);
            }
        }
        console.log(`  ✓ Profiles processed: ${deletedCount}/${myProfiles.length}`);

        // VERIFY deletion — scan ALL profiles again
        await sleep(1000);
        const remainingCheck = await sr.Profile.list('-created_date', 2000);
        const stillThere = remainingCheck.filter(p => p.user_id === userId);
        if (stillThere.length > 0) {
            console.error(`  ❌ VERIFICATION FAILED: ${stillThere.length} profile(s) still exist! IDs: ${JSON.stringify(stillThere.map(p => p.id))}`);
            // One last desperate attempt — delete by exact ID
            for (const p of stillThere) {
                try {
                    await sr.Profile.delete(p.id);
                    console.log(`  ✅ Desperate delete succeeded for ${p.id}`);
                } catch (e) {
                    console.error(`  💀 Desperate delete also failed for ${p.id}:`, e?.message);
                }
            }
            const finalCheck = await sr.Profile.list('-created_date', 2000);
            const finalStill = finalCheck.filter(p => p.user_id === userId);
            if (finalStill.length > 0) {
                console.error(`  ❌ FINAL VERIFICATION FAILED: ${finalStill.length} profiles remain`);
                return Response.json({ error: `Profile deletion completely failed: ${finalStill.length} profiles remain` }, { status: 500 });
            }
        }
        console.log(`  ✓ Profile cleanup verified complete`);

        // 2. Swipes (both directions)
        const [swipesAsSwiper, swipesAsSwiped] = await Promise.all([
            sr.Swipe.filter({ swiper_id: userId }),
            sr.Swipe.filter({ swiped_id: userId }),
        ]);
        for (const s of swipesAsSwiper) await safeDelete(sr.Swipe, s.id);
        for (const s of swipesAsSwiped) await safeDelete(sr.Swipe, s.id);
        console.log(`  ✓ Swipes deleted: ${swipesAsSwiper.length + swipesAsSwiped.length}`);

        // 3. Matches + Messages + TypingStatus per match
        const [matchesAsUser1, matchesAsUser2] = await Promise.all([
            sr.Match.filter({ user1_id: userId }),
            sr.Match.filter({ user2_id: userId }),
        ]);
        const allMatches = [...matchesAsUser1, ...matchesAsUser2];
        for (const m of allMatches) {
            const [msgs, typings] = await Promise.all([
                sr.Message.filter({ match_id: m.id }),
                sr.TypingStatus.filter({ match_id: m.id }),
            ]);
            for (const msg of msgs) await safeDelete(sr.Message, msg.id);
            for (const t of typings) await safeDelete(sr.TypingStatus, t.id);
            await safeDelete(sr.Match, m.id);
        }
        console.log(`  ✓ Matches deleted: ${allMatches.length}`);

        // 4. Orphaned TypingStatus by this user (outside matches already deleted)
        const userTypings = await sr.TypingStatus.filter({ user_id: userId });
        for (const t of userTypings) await safeDelete(sr.TypingStatus, t.id);
        console.log(`  ✓ TypingStatus deleted: ${userTypings.length}`);

        // 5. CharterAnswers
        const charterAnswers = await sr.CharterAnswer.filter({ user_id: userId });
        for (const ca of charterAnswers) await safeDelete(sr.CharterAnswer, ca.id);
        console.log(`  ✓ CharterAnswers deleted: ${charterAnswers.length}`);

        // 6. QuestionnairePreferences
        const questPrefs = await sr.QuestionnairePreference.filter({ user_id: userId });
        for (const pref of questPrefs) await safeDelete(sr.QuestionnairePreference, pref.id);
        console.log(`  ✓ QuestionnairePreferences deleted: ${questPrefs.length}`);

        // 7. Reviews (as reviewer and as reviewed)
        const [reviewsAsReviewer, reviewsAsReviewed] = await Promise.all([
            sr.Review.filter({ reviewer_id: userId }),
            sr.Review.filter({ reviewed_id: userId }),
        ]);
        for (const r of reviewsAsReviewer) await safeDelete(sr.Review, r.id);
        for (const r of reviewsAsReviewed) await safeDelete(sr.Review, r.id);
        console.log(`  ✓ Reviews deleted: ${reviewsAsReviewer.length + reviewsAsReviewed.length}`);

        // 8. GroupMessages
        const groupMsgs = await sr.GroupMessage.filter({ sender_id: userId });
        for (const gm of groupMsgs) await safeDelete(sr.GroupMessage, gm.id);
        console.log(`  ✓ GroupMessages deleted: ${groupMsgs.length}`);

        // 9. PageViews
        const pageViews = await sr.PageView.filter({ user_id: userId });
        for (const pv of pageViews) await safeDelete(sr.PageView, pv.id);
        console.log(`  ✓ PageViews deleted: ${pageViews.length}`);

        // 10. PendingSubscriptions
        const pendingSubs = await sr.PendingSubscription.filter({ user_id: userId });
        for (const ps of pendingSubs) await safeDelete(sr.PendingSubscription, ps.id);
        console.log(`  ✓ PendingSubscriptions deleted: ${pendingSubs.length}`);

        // 11. Delete the User record itself (removes from users list in dashboard)
        await safeDelete(sr.User, userId);
        console.log(`  ✓ User record deleted`);

        console.log(`✅ Account fully deleted for user ${userEmail} (${userId})`);
        return Response.json({ success: true });
    } catch (error) {
        console.error("❌ Error deleting account:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});