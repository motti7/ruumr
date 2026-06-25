import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Triggered by entity automation on Match create
// Sends email notification to both users in the match
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const match = payload.data;
    if (!match || !match.user1_id || !match.user2_id) {
      console.log('Skipping: invalid match data', JSON.stringify(payload));
      return Response.json({ skipped: true, reason: 'invalid match data' });
    }

    // Team-formed matches (created when building a shared roster) are not swipe
    // matches — don't send "new match" emails for them.
    if (match.match_type === 'team') {
      console.log(`Skipping match email for team-formed match ${match.id || 'new'}`);
      return Response.json({ skipped: true, reason: 'team match' });
    }

    const { user1_id, user2_id, user1_name, user2_name } = match;

    // Fetch users by listing all (User.filter by id doesn't work due to RLS)
    const allUsers = await base44.asServiceRole.entities.User.list('-created_date', 2000);
    console.log(`Total users fetched: ${allUsers.length}`);

    const user1 = allUsers.find(u => u.id === user1_id);
    const user2 = allUsers.find(u => u.id === user2_id);

    console.log(`Match: user1=${user1_id} email=${user1?.email}, user2=${user2_id} email=${user2?.email}`);

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