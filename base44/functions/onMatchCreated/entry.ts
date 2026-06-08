import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Triggered by entity automation on Match create
// Sends email notification to both users in the match
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const match = payload.data;
    if (!match || !match.user1_id || !match.user2_id) {
      console.log('Skipping: invalid match data', payload);
      return Response.json({ skipped: true, reason: 'invalid match data' });
    }

    const { user1_id, user2_id, user1_name, user2_name } = match;

    // Fetch all users and find the matching ones
    // Note: User.filter({id}) doesn't work — must list and find by id
    const [allUsers1, allUsers2] = await Promise.all([
      base44.asServiceRole.entities.User.filter({ email: { $exists: true } }, null, 1000),
      Promise.resolve([]), // will reuse allUsers1
    ]);

    const user1 = allUsers1.find(u => u.id === user1_id);
    const user2 = allUsers1.find(u => u.id === user2_id);

    console.log(`Match created: user1=${user1_id} (${user1?.email}), user2=${user2_id} (${user2?.email})`);

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
    } else {
      console.warn(`No email for user1: ${user1_id}`);
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
    } else {
      console.warn(`No email for user2: ${user2_id}`);
    }

    await Promise.all(promises);

    console.log(`✅ Match emails sent for match ${match.id || 'new'}`);
    return Response.json({ success: true });
  } catch (error) {
    console.error('❌ onMatchCreated error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});