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

            let match_id;
            if (existingMatches.length === 0) {
                const match = await base44.asServiceRole.entities.Match.create({
                    user1_id: swiper_id,
                    user2_id: swiped_id,
                    status: 'active'
                });
                match_id = match.id;
            } else {
                match_id = existingMatches[0].id;
            }

            // 2. Send Emails
            // We do this asynchronously without awaiting to not block the response too much, 
            // but in serverless usually we should await.
            
            const [user1, user2, profile1List, profile2List] = await Promise.all([
                base44.asServiceRole.entities.User.filter({ id: swiper_id }),
                base44.asServiceRole.entities.User.filter({ id: swiped_id }),
                base44.asServiceRole.entities.Profile.filter({ user_id: swiper_id }),
                base44.asServiceRole.entities.Profile.filter({ user_id: swiped_id })
            ]);

            const u1 = user1[0];
            const u2 = user2[0];
            const p1 = profile1List[0];
            const p2 = profile2List[0];
            const appUrl = origin || "https://roomi.me";
            const chatUrl = `${appUrl}/chat?matchId=${match_id}`;

            if (u1 && u2 && p1 && p2) {
                // Email to Swiper (User 1)
                if (u1.email) {
                    await base44.integrations.Core.SendEmail({
                        to: u1.email,
                        subject: `🎉 יש לך התאמה חדשה עם ${p2.name}!`,
                        body: `היי ${p1.name},\n\nיש לך התאמה חדשה ב-Roomi עם ${p2.name}!\n\nהיכנס/י לאפליקציה כדי להתחיל לצ'וטט:\n${chatUrl}`
                    });
                }

                // Email to Swiped (User 2)
                if (u2.email) {
                    await base44.integrations.Core.SendEmail({
                        to: u2.email,
                        subject: `🎉 יש לך התאמה חדשה עם ${p1.name}!`,
                        body: `היי ${p2.name},\n\nיש לך התאמה חדשה ב-Roomi עם ${p1.name}!\n\nהיכנס/י לאפליקציה כדי להתחיל לצ'וטט:\n${chatUrl}`
                    });
                }
            }

            return { match: true, match_id };
        }
    } catch (e) {
        console.error("Error in handleSwipe:", e);
        // Even if error, if we found match logic, we might want to return true? 
        // But safe to return false or rethrow. 
        // Returning false prevents UI match screen but keeps app stable.
    }

    return { match: false };
}