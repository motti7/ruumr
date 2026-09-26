import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { cleanupBlock } from '../../shared/userSafety.ts';

Deno.serve(async req => {
  if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me().catch(() => null);
  if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
  const sr = base44.asServiceRole.entities;
  const blocks = await sr.UserBlock.filter({ cleanup_pending: true }, 'updated_date', 20);
  let pending = 0;
  for (const block of blocks) {
    try { await cleanupBlock(sr, block); } catch { pending++; }
  }
  return Response.json({ processed: blocks.length, pending });
});

