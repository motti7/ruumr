import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Triggered by entity automation on Match create
// Sends email notification to both users in the match
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const match = payload.data;
    if (!match || !match.user1_id || !match.user2_id) {
      return Response.json({ skipped: true, reason: 'invalid match data' });
    }

    const { user1_id, user2_id, user1_name, user2_name } = match;

    // Fetch both users
    const [users1, users2] = await Promise.all([
      base44.asServiceRole.entities.User.filter({ id: user1_id }),
      base44.asServiceRole.entities.User.filter({ id: user2_id }),
    ]);

    const user1 = users1[0];
    const user2 = users2[0];

    const promises = [];

    if (user1?.email) {
      promises.push(
        base44.asServiceRole.functions.invoke('sendMatchNotificationEmail', {
          user_id: user1_id,
          user_email: user1.email,
          user_name: user1_name || user1.full_name,
          match_user_name: user2_name || user2?.full_name || 'מישהו',
        })
      );
    }

    if (user2?.email) {
      promises.push(
        base44.asServiceRole.functions.invoke('sendMatchNotificationEmail', {
          user_id: user2_id,
          user_email: user2.email,
          user_name: user2_name || user2.full_name,
          match_user_name: user1_name || user1?.full_name || 'מישהו',
        })
      );
    }

    await Promise.all(promises);

    console.log(`✅ Match emails sent for match ${match.id || 'new'}`);
    return Response.json({ success: true });
  } catch (error) {
    console.error('❌ onMatchCreated error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});