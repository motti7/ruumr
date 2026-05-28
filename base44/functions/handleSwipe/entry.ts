import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { swiper_id, swiped_id, action, origin } = await req.json();

        if (!swiper_id || !swiped_id || !action) {
            return Response.json({ error: 'swiper_id, swiped_id, and action are required' }, { status: 400 });
        }

        let currentUser;
        try {
            currentUser = await base44.auth.me();
        } catch (_) {
            return Response.json({ error: 'Authentication required' }, { status: 401 });
        }

        if (String(currentUser?.id || '') !== String(swiper_id)) {
            return Response.json({ error: 'Cannot process a swipe for another user' }, { status: 403 });
        }

        if (action !== 'like' && action !== 'dislike') {
            return Response.json({ error: 'Unsupported swipe action' }, { status: 400 });
        }

        if (action !== 'like') {
            return Response.json({ match: false });
        }

        const sr = base44.asServiceRole.entities;

        // Use the user-context client for Swipe + Match operations the caller is a
        // party to. The service-role view of these entities lags behind writes in
        // this app — freshly created rows are not always visible to asServiceRole
        // filter(), which silently dropped matches. RLS allows the caller to read
        // swipes targeting them and to create/read matches they are in, so the
        // user-context path is both sufficient and consistent.
        const reverseSwipes = await base44.entities.Swipe.filter({
            swiper_id: swiped_id,
            swiped_id: swiper_id,
            action: 'like'
        });

        if (reverseSwipes && reverseSwipes.length > 0) {
            const existingMatches = await base44.entities.Match.filter({
                $or: [
                    { user1_id: swiper_id, user2_id: swiped_id },
                    { user1_id: swiped_id, user2_id: swiper_id }
                ]
            });

            const [profile1List, profile2List] = await Promise.all([
                sr.Profile.filter({ user_id: swiper_id }),
                sr.Profile.filter({ user_id: swiped_id })
            ]);

            const p1 = profile1List[0];
            const p2 = profile2List[0];

            let match_id;
            if (existingMatches.length === 0) {
                const match = await base44.entities.Match.create({
                    user1_id: swiper_id,
                    user2_id: swiped_id,
                    user1_name: p1?.name || '',
                    user2_name: p2?.name || '',
                    status: 'active'
                });
                match_id = match.id;
            } else {
                match_id = existingMatches[0].id;
            }

            // Get user emails for email notifications
            const allUsers = await sr.User.list();
            const user1 = allUsers.find(u => u.id === swiper_id);
            const user2 = allUsers.find(u => u.id === swiped_id);

            // Send push + email notifications to both users (respect notify_matches setting)
            console.log("🔔 Sending match notifications...");
            
            if (user1?.notify_matches !== false) {
                try {
                    await base44.functions.invoke('sendPushNotification', {
                        user_id: swiper_id,
                        title: "🎉 יש לך התאמה חדשה!",
                        message: `מאץ' עם ${p2?.name || 'מישהו'}! זה הזמן לשוחח ולתכנן את החיים המשותפים`,
                        data: { type: 'match', match_id }
                    });
                } catch (e) {
                    console.error(`❌ Push to swiper failed:`, e);
                }

                if (user1?.email) {
                    try {
                        await base44.asServiceRole.integrations.Core.SendEmail({
                            to: user1.email,
                            subject: `🎉 יש לך התאמה חדשה ב-Ruumr!`,
                            body: `שלום ${p1?.name || ''}!<br><br>מזל טוב! יש לך התאמה חדשה עם <strong>${p2?.name || 'מישהו'}</strong> ב-Ruumr 🏠<br><br>היכנס/י לאפליקציה ותתחילו לשוחח!<br><br>צוות Ruumr`
                        });
                        console.log(`✅ Match email sent to ${user1.email}`);
                    } catch (e) {
                        console.error(`❌ Email to swiper failed:`, e);
                    }
                }
            }

            if (user2?.notify_matches !== false) {
                try {
                    await base44.functions.invoke('sendPushNotification', {
                        user_id: swiped_id,
                        title: "🎉 יש לך התאמה חדשה!",
                        message: `מאץ' עם ${p1?.name || 'מישהו'}! זה הזמן לשוחח ולתכנן את החיים המשותפים`,
                        data: { type: 'match', match_id }
                    });
                } catch (e) {
                    console.error(`❌ Push to swiped failed:`, e);
                }

                if (user2?.email) {
                    try {
                        await base44.asServiceRole.integrations.Core.SendEmail({
                            to: user2.email,
                            subject: `🎉 יש לך התאמה חדשה ב-Ruumr!`,
                            body: `שלום ${p2?.name || ''}!<br><br>מזל טוב! יש לך התאמה חדשה עם <strong>${p1?.name || 'מישהו'}</strong> ב-Ruumr 🏠<br><br>היכנס/י לאפליקציה ותתחילו לשוחח!<br><br>צוות Ruumr`
                        });
                        console.log(`✅ Match email sent to ${user2.email}`);
                    } catch (e) {
                        console.error(`❌ Email to swiped failed:`, e);
                    }
                }
            }

            return Response.json({ match: true, match_id });
        } else {
            // No match, but check if we should send likes notification
            try {
                const allLikesForSwipedUser = await sr.Swipe.filter({
                    swiped_id: swiped_id,
                    action: 'like'
                });
                
                const totalLikes = allLikesForSwipedUser.length;
                
                const allUsers = await sr.User.list();
                const swipedUser = allUsers.find(u => u.id === swiped_id);
                
                if (swipedUser) {
                    const lastNotificationCount = swipedUser.last_likes_notification_count || 0;
                    const newLikesSinceLastNotification = totalLikes - lastNotificationCount;
                    
                    console.log(`💕 Likes check for ${swiped_id}: Total=${totalLikes}, LastNotified=${lastNotificationCount}, New=${newLikesSinceLastNotification}`);
                    
                    // Send notification every 3 new likes (respect notify_likes setting)
                    if (newLikesSinceLastNotification >= 3 && swipedUser?.notify_likes !== false) {
                        try {
                            await base44.functions.invoke('sendPushNotification', {
                                user_id: swiped_id,
                                title: "🔥 הופה, התעניינו בך!",
                                message: `${newLikesSinceLastNotification} אנשים אהבו את הפרופיל שלך לאחרונה!`,
                                data: { type: 'likes', count: newLikesSinceLastNotification }
                            });
                        } catch (e) {
                            console.error(`❌ Failed to send likes push:`, e);
                        }

                        // Send email for likes too
                        if (swipedUser?.email) {
                            try {
                                await base44.asServiceRole.integrations.Core.SendEmail({
                                    to: swipedUser.email,
                                    subject: `🔥 ${newLikesSinceLastNotification} אנשים אהבו אותך ב-Ruumr!`,
                                    body: `שלום!<br><br>🔥 <strong>${newLikesSinceLastNotification} אנשים</strong> אהבו את הפרופיל שלך לאחרונה ב-Ruumr!<br><br>היכנס/י לאפליקציה לראות מי אוהב אותך 👀<br><br>צוות Ruumr`
                                });
                                console.log(`✅ Likes email sent to ${swipedUser.email}`);
                            } catch (e) {
                                console.error(`❌ Failed to send likes email:`, e);
                            }
                        }

                        // Update the notification counter
                        await sr.User.update(swipedUser.id, {
                            last_likes_notification_count: totalLikes
                        });
                        
                        console.log(`✅ Likes notification sent to user ${swiped_id}`);
                    }
                }
            } catch (notificationError) {
                console.error("❌ Failed to check likes notification:", notificationError);
            }
        }

        return Response.json({ match: false });
    } catch (error) {
        console.error("CRITICAL ERROR in handleSwipe:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});
