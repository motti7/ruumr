import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action, userId } = body || {};

    if (!userId) {
      return Response.json({ error: 'Missing userId' }, { status: 400 });
    }

    if (action === 'get_target') {
      const profiles = await base44.asServiceRole.entities.Profile.filter({ user_id: userId });
      if (!profiles || profiles.length === 0) {
        return Response.json({ error: 'Profile not found' }, { status: 404 });
      }
      const profile = profiles[0];
      return Response.json({ name: profile.name, photo: profile.photos?.[0] || null });
    }

    if (action === 'submit') {
      const rating = Number(body.rating);
      const text = String(body.text || '').trim();
      const reviewerName = String(body.reviewerName || '').trim().slice(0, 60);

      if (!rating || rating < 1 || rating > 5) {
        return Response.json({ error: 'Invalid rating' }, { status: 400 });
      }
      if (!reviewerName) {
        return Response.json({ error: 'Missing reviewer name' }, { status: 400 });
      }

      const profiles = await base44.asServiceRole.entities.Profile.filter({ user_id: userId });
      if (!profiles || profiles.length === 0) {
        return Response.json({ error: 'Profile not found' }, { status: 404 });
      }

      await base44.asServiceRole.entities.Review.create({
        reviewer_id: `external_${Date.now()}`,
        reviewed_id: userId,
        rating,
        text: text.slice(0, 1000),
        reviewer_name: reviewerName,
        is_external: true,
      });

      return Response.json({ success: true });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in submitExternalReview:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}