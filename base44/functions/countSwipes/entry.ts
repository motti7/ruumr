import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    let total = 0;
    let likes = 0;
    let dislikes = 0;
    let skip = 0;
    const limit = 1000;

    while (true) {
      const batch = await base44.asServiceRole.entities.Swipe.list(null, limit, skip);
      if (!batch || batch.length === 0) break;

      total += batch.length;
      for (const swipe of batch) {
        if (swipe.action === 'like') likes++;
        else if (swipe.action === 'dislike') dislikes++;
      }

      if (batch.length < limit) break;
      skip += limit;
    }

    return Response.json({ total, likes, dislikes });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});