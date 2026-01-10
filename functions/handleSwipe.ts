export default async function(context) {
    const { swiper_id, swiped_id, action, origin } = context.body;
    const { base44 } = context;

    if (action !== 'like') {
        return { match: false };
    }

    try {
        // Check for reverse like
        // Using asServiceRole to ensure we can see all swipes regardless of RLS
        const reverseSwipes = await base44.asServiceRole.entities.Swipe.filter({
            swiper_id: swiped_id,
            swiped_id: swiper_id,
            action: 'like'
        });

        if (reverseSwipes && reverseSwipes.length > 0) {
            // It's a match!
            
            // 1. Create Match
            // Check if match already exists to avoid duplicates
            const existingMatches = await base44.asServiceRole.entities.Match.filter({
                $or: [
                    { user1_id: swiper_id, user2_id: swiped_id },
                    { user1_id: swiped_id, user2_id: swiper_id }
                ]
            });

            // Get profile names first
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

            // 2. Send Emails
            console.log("🔵 Starting email sending process...");
            console.log("User IDs:", { swiper_id, swiped_id });
            
            const appUrl = origin || "https://roomi.me";
            
            // Get users with more detailed logging
            const allUsers = await base44.asServiceRole.entities.User.list();
            console.log("📧 Total users in system:", allUsers.length);
            console.log("User IDs in system:", allUsers.map(u => u.id));
            
            const u1 = allUsers.find(u => u.id === swiper_id);
            const u2 = allUsers.find(u => u.id === swiped_id);
            
            console.log("Found User 1:", u1 ? { id: u1.id, email: u1.email } : "NOT FOUND");
            console.log("Found User 2:", u2 ? { id: u2.id, email: u2.email } : "NOT FOUND");
            console.log("Profile 1:", p1 ? { name: p1.name } : "NOT FOUND");
            console.log("Profile 2:", p2 ? { name: p2.name } : "NOT FOUND");

            // Send emails with error handling
            try {
                if (u1?.email && p1 && p2) {
                    console.log(`📨 Sending email to User 1: ${u1.email}`);
                    await base44.integrations.Core.SendEmail({
                        to: u1.email,
                        subject: `🎉 יש לך התאמה חדשה עם ${p2.name}!`,
                        body: `היי ${p1.name},<br><br>יש לך התאמה חדשה ב-Roomi עם ${p2.name}!<br><br>היכנס/י לאפליקציה כדי להתחיל לצ'וטט:<br><a href="${appUrl}" style="display:inline-block;background:#FF5722;color:white;padding:12px 24px;text-decoration:none;border-radius:25px;font-weight:bold;margin-top:10px;">פתח את Roomi</a>`
                    });
                    console.log("✅ Email sent to User 1");
                } else {
                    console.log("⚠️ Cannot send email to User 1:", { hasUser: !!u1, hasEmail: !!u1?.email, hasProfile1: !!p1, hasProfile2: !!p2 });
                }
            } catch (emailError) {
                console.error("❌ Failed to send email to User 1:", emailError);
            }

            try {
                if (u2?.email && p1 && p2) {
                    console.log(`📨 Sending email to User 2: ${u2.email}`);
                    await base44.integrations.Core.SendEmail({
                        to: u2.email,
                        subject: `🎉 יש לך התאמה חדשה עם ${p1.name}!`,
                        body: `היי ${p2.name},<br><br>יש לך התאמה חדשה ב-Roomi עם ${p1.name}!<br><br>היכנס/י לאפליקציה כדי להתחיל לצ'וטט:<br><a href="${appUrl}" style="display:inline-block;background:#FF5722;color:white;padding:12px 24px;text-decoration:none;border-radius:25px;font-weight:bold;margin-top:10px;">פתח את Roomi</a>`
                    });
                    console.log("✅ Email sent to User 2");
                } else {
                    console.log("⚠️ Cannot send email to User 2:", { hasUser: !!u2, hasEmail: !!u2?.email, hasProfile1: !!p1, hasProfile2: !!p2 });
                }
            } catch (emailError) {
                console.error("❌ Failed to send email to User 2:", emailError);
            }

            return { match: true, match_id };
        } else {
            // No match, but check if we should send likes notification to swiped user
            try {
                // Count how many likes the swiped user has received
                const allLikesForSwipedUser = await base44.asServiceRole.entities.Swipe.filter({
                    swiped_id: swiped_id,
                    action: 'like'
                });
                
                const totalLikes = allLikesForSwipedUser.length;
                
                // Get the user to check last notification count
                const allUsers = await base44.asServiceRole.entities.User.list();
                const swipedUser = allUsers.find(u => u.id === swiped_id);
                
                if (swipedUser) {
                    const lastNotificationCount = swipedUser.last_likes_notification_count || 0;
                    const newLikesSinceLastNotification = totalLikes - lastNotificationCount;
                    
                    console.log(`💕 Likes check for ${swiped_id}: Total=${totalLikes}, LastNotified=${lastNotificationCount}, New=${newLikesSinceLastNotification}`);
                    
                    // Send notification every 2 new likes
                    if (newLikesSinceLastNotification >= 2) {
                        const swipedProfile = await base44.asServiceRole.entities.Profile.filter({ user_id: swiped_id });
                        const profile = swipedProfile[0];
                        
                        if (swipedUser.email && profile) {
                            const appUrl = origin || "https://roomi.me";
                            const likeWord = newLikesSinceLastNotification === 2 ? 'שני פרופילים' : `${newLikesSinceLastNotification} פרופילים`;
                            
                            await base44.integrations.Core.SendEmail({
                                to: swipedUser.email,
                                subject: `💫 ${likeWord} סימנו התעניינות בך!`,
                                body: `היי ${profile.name} 👋<br><br>${likeWord} סימנו התעניינות בך לאחרונה ב-Roomi! 😍<br><br>בוא/י לגלות מי מחכה לך 💕<br><br><a href="${appUrl}" style="display:inline-block;background:#FF5722;color:white;padding:12px 24px;text-decoration:none;border-radius:25px;font-weight:bold;margin-top:10px;">גלה מי זה ✨</a>`
                            });
                            
                            // Update the notification counter
                            await base44.asServiceRole.entities.User.update(swipedUser.id, {
                                last_likes_notification_count: totalLikes
                            });
                            
                            console.log(`✅ Likes notification sent to ${swipedUser.email}`);
                        }
                    }
                }
            } catch (notificationError) {
                console.error("❌ Failed to send likes notification:", notificationError);
            }
        }
    } catch (e) {
        console.error("CRITICAL ERROR in handleSwipe:", e, e.stack);
        // Log all data for debugging
        console.error("Failed swipe data:", { swiper_id, swiped_id, action });
        throw e; // Re-throw so we can see the error in logs
    }

    return { match: false };
}