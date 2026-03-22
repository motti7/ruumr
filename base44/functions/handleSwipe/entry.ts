import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { swiper_id, swiped_id, action, origin } = await req.json();

        if (action !== 'like') {
            return Response.json({ match: false });
        }

        // Check for reverse like
        const reverseSwipes = await base44.asServiceRole.entities.Swipe.filter({
            swiper_id: swiped_id,
            swiped_id: swiper_id,
            action: 'like'
        });

        if (reverseSwipes && reverseSwipes.length > 0) {
            // It's a match!
            
            // Check if match already exists
            const existingMatches = await base44.asServiceRole.entities.Match.filter({
                $or: [
                    { user1_id: swiper_id, user2_id: swiped_id },
                    { user1_id: swiped_id, user2_id: swiper_id }
                ]
            });

            // Get profile names
            const [profile1List, profile2List] = await Promise.all([
                base44.asServiceRole.entities.Profile.filter({ user_id: swiper_id }),
                base44.asServiceRole.entities.Profile.filter({ user_id: swiped_id })
            ]);
            
            const p1 = profile1List[0];
            const p2 = profile2List[0];

            let match_id;
            if (existingMatches.length === 0) {
                const match = await base44.asServiceRole.entities.Match.create({
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
            const allUsers = await base44.asServiceRole.entities.User.list();
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
                const allLikesForSwipedUser = await base44.asServiceRole.entities.Swipe.filter({
                    swiped_id: swiped_id,
                    action: 'like'
                });
                
                const totalLikes = allLikesForSwipedUser.length;
                
                const allUsers = await base44.asServiceRole.entities.User.list();
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
                        await base44.asServiceRole.entities.User.update(swipedUser.id, {
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