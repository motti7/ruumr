export default async function(context) {
    const { base44 } = context;
    
    try {
        // Get all likes
        const allSwipes = await base44.asServiceRole.entities.Swipe.filter({ action: 'like' });
        
        let matchesCreated = 0;
        let emailsSent = 0;
        const processedPairs = new Set();
        
        for (const swipe of allSwipes) {
            const pairKey = [swipe.swiper_id, swipe.swiped_id].sort().join('-');
            
            if (processedPairs.has(pairKey)) continue;
            processedPairs.add(pairKey);
            
            // Check for mutual like
            const reverseSwipe = allSwipes.find(s => 
                s.swiper_id === swipe.swiped_id && 
                s.swiped_id === swipe.swiper_id &&
                s.action === 'like'
            );
            
            if (!reverseSwipe) continue;
            
            // Check if match already exists
            const existingMatches = await base44.asServiceRole.entities.Match.filter({
                $or: [
                    { user1_id: swipe.swiper_id, user2_id: swipe.swiped_id },
                    { user1_id: swipe.swiped_id, user2_id: swipe.swiper_id }
                ]
            });
            
            if (existingMatches.length > 0) continue;
            
            // Get profiles for names
            const [profile1List, profile2List] = await Promise.all([
                base44.asServiceRole.entities.Profile.filter({ user_id: swipe.swiper_id }),
                base44.asServiceRole.entities.Profile.filter({ user_id: swipe.swiped_id })
            ]);
            
            const p1 = profile1List[0];
            const p2 = profile2List[0];
            
            if (!p1 || !p2) continue;
            
            // Create match
            const match = await base44.asServiceRole.entities.Match.create({
                user1_id: swipe.swiper_id,
                user2_id: swipe.swiped_id,
                user1_name: p1.name || '',
                user2_name: p2.name || '',
                status: 'active'
            });
            
            matchesCreated++;
            
            // Send emails
            const [user1List, user2List] = await Promise.all([
                base44.asServiceRole.entities.User.list(),
                base44.asServiceRole.entities.User.list()
            ]);
            
            const u1 = user1List.find(u => u.id === swipe.swiper_id);
            const u2 = user2List.find(u => u.id === swipe.swiped_id);
            const origin = context.body?.origin || "https://roomi.me";
            const chatUrl = `${origin}/chat?matchId=${match.id}`;
            
            if (u1?.email) {
                try {
                    await base44.integrations.Core.SendEmail({
                        to: u1.email,
                        subject: `🎉 יש לך התאמה חדשה עם ${p2.name}!`,
                        body: `היי ${p1.name},<br><br>יש לך התאמה ב-Roomi עם ${p2.name}!<br><br>היכנס/י לאפליקציה כדי להתחיל לצ'וטט:<br>${chatUrl}`
                    });
                    emailsSent++;
                } catch (e) {
                    console.error("Email send failed", e);
                }
            }
            
            if (u2?.email) {
                try {
                    await base44.integrations.Core.SendEmail({
                        to: u2.email,
                        subject: `🎉 יש לך התאמה חדשה עם ${p1.name}!`,
                        body: `היי ${p2.name},<br><br>יש לך התאמה ב-Roomi עם ${p1.name}!<br><br>היכנס/י לאפליקציה כדי להתחיל לצ'וטט:<br>${chatUrl}`
                    });
                    emailsSent++;
                } catch (e) {
                    console.error("Email send failed", e);
                }
            }
        }
        
        return { 
            success: true, 
            matchesCreated,
            emailsSent,
            message: `נוצרו ${matchesCreated} התאמות ונשלחו ${emailsSent} מיילים`
        };
    } catch (error) {
        console.error("Error fixing matches:", error);
        return { success: false, error: error.message };
    }
}