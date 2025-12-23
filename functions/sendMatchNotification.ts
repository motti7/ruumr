export default async function(context) {
    const { match_id } = context.body;
    const { base44 } = context;

    try {
        // Get the match
        const matches = await base44.asServiceRole.entities.Match.filter({ id: match_id });
        if (!matches || matches.length === 0) {
            return { success: false, error: "Match not found" };
        }

        const match = matches[0];
        const { user1_id, user2_id } = match;

        // Get profiles and users
        const [profile1List, profile2List, allUsers] = await Promise.all([
            base44.asServiceRole.entities.Profile.filter({ user_id: user1_id }),
            base44.asServiceRole.entities.Profile.filter({ user_id: user2_id }),
            base44.asServiceRole.entities.User.list()
        ]);

        const p1 = profile1List[0];
        const p2 = profile2List[0];
        const u1 = allUsers.find(u => u.id === user1_id);
        const u2 = allUsers.find(u => u.id === user2_id);

        if (!p1 || !p2 || !u1 || !u2) {
            return { success: false, error: "Missing profile or user data" };
        }

        const chatUrl = `https://roomi.me/chat?matchId=${match_id}`;

        // Send emails
        await Promise.all([
            base44.integrations.Core.SendEmail({
                to: u1.email,
                subject: `🎉 יש לך התאמה חדשה עם ${p2.name}!`,
                body: `היי ${p1.name},<br><br>יש לך התאמה חדשה ב-Roomi עם ${p2.name}!<br><br>היכנס/י לאפליקציה כדי להתחיל לצ'וטט:<br><a href="${chatUrl}">${chatUrl}</a>`
            }),
            base44.integrations.Core.SendEmail({
                to: u2.email,
                subject: `🎉 יש לך התאמה חדשה עם ${p1.name}!`,
                body: `היי ${p2.name},<br><br>יש לך התאמה חדשה ב-Roomi עם ${p1.name}!<br><br>היכנס/י לאפליקציה כדי להתחיל לצ'וטט:<br><a href="${chatUrl}">${chatUrl}</a>`
            })
        ]);

        return { success: true, sent_to: [u1.email, u2.email] };
    } catch (e) {
        console.error("Error sending match notification:", e);
        return { success: false, error: e.message };
    }
}