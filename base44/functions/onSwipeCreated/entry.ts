import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Triggered by entity automation on Swipe create
// Checks if swiped user has accumulated 2+ new "like" swipes, and if so sends email
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const swipe = payload.data;
    if (!swipe || swipe.action !== 'like') {
      return Response.json({ skipped: true, reason: 'not a like' });
    }

    const swipedId = swipe.swiped_id;
    if (!swipedId) {
      return Response.json({ skipped: true, reason: 'no swiped_id' });
    }

    // Count total likes received by this user
    const allLikes = await base44.asServiceRole.entities.Swipe.filter({
      swiped_id: swipedId,
      action: 'like',
    });

    const totalLikes = allLikes.length;
    console.log(`User ${swipedId} has ${totalLikes} total likes`);

    // Fire at 2, 4, 6, 8... (every 2 likes)
    if (totalLikes % 2 !== 0) {
      return Response.json({ skipped: true, reason: `total likes=${totalLikes}, not a multiple of 2` });
    }

    // Get swiped user's email - use filter by id for accuracy
    const users = await base44.asServiceRole.entities.User.filter({ id: swipedId });
    const user = users[0];

    if (!user?.email) {
      console.warn(`No email found for user ${swipedId}`);
      return Response.json({ skipped: true, reason: 'user not found or no email' });
    }

    if (user.notify_likes === false) {
      return Response.json({ skipped: true, reason: 'user disabled likes notifications' });
    }

    // Always send "2 new likes" — this fires every 2nd like
    await base44.asServiceRole.functions.invoke('sendLikesNotificationEmail', {
      swiped_id: swipedId,
      swiped_email: user.email,
      swiped_name: user.full_name,
      likes_count: 2,
    });

    console.log(`✅ Triggered likes email for ${user.email} (total likes: ${totalLikes}, reported: 2)`);
    return Response.json({ success: true, totalLikes, reported: 2 });
  } catch (error) {
    console.error('❌ onSwipeCreated error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});