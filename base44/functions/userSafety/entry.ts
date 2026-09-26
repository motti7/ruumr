import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { allRows, cleanupBlock, pairKey, requireOpenChat, safetyError } from '../../shared/userSafety.ts';

const REASONS = ['harassment', 'fake_profile', 'inappropriate_content', 'spam', 'other'];

Deno.serve(async req => {
  if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user?.id) throw safetyError('Authentication required', 401);
    const sr = base44.asServiceRole.entities;
    const body = await req.json();

    if (body.action === 'blocked_users') {
      const blocks = [...await allRows(sr.UserBlock, { blocker_id: user.id }),
        ...await allRows(sr.UserBlock, { blocked_id: user.id })];
      return Response.json({ user_ids: [...new Set(blocks.map(b => b.blocker_id === user.id ? b.blocked_id : b.blocker_id))] });
    }

    if (body.action === 'report') {
      if (!REASONS.includes(body.reason) || typeof body.profile_id !== 'string' ||
        (body.details != null && (typeof body.details !== 'string' || body.details.length > 2000))) {
        throw safetyError('Invalid report');
      }
      const profiles = await sr.Profile.filter({ id: body.profile_id }, 'id', 1);
      const profile = profiles[0];
      if (!profile?.user_id || profile.user_id === user.id) throw safetyError('Invalid profile');
      const existing = await sr.UserReport.filter({ reporter_id: user.id, profile_id: profile.id, status: 'new' }, 'id', 1);
      if (existing.length) return Response.json({ success: true });
      await sr.UserReport.create({
        reporter_id: user.id, reported_user_id: profile.user_id, profile_id: profile.id,
        reason: body.reason, details: (body.details || '').trim(), status: 'new',
        // Snapshot only public profile evidence, not unrelated conversations.
        profile_snapshot: { name: profile.name || '', about_me: profile.about_me || '', looking_for_description: profile.looking_for_description || '', photos: (profile.photos || []).slice(0, 10) },
      });
      return Response.json({ success: true });
    }

    if (body.action === 'block') {
      if (typeof body.match_id !== 'string' || body.confirm !== true) throw safetyError('Confirmation required');
      const matches = await sr.Match.filter({ id: body.match_id }, 'id', 1);
      const match = matches[0];
      let block;
      if (match) {
        if (![match.user1_id, match.user2_id].includes(user.id)) throw safetyError('Chat unavailable', 404);
        const other = match.user1_id === user.id ? match.user2_id : match.user1_id;
        if (!other || other === user.id) throw safetyError('Invalid chat');
        block = (await sr.UserBlock.filter({ pair_key: pairKey(user.id, other) }, 'id', 1))[0];
        if (!block) block = await sr.UserBlock.create({
          pair_key: pairKey(user.id, other), blocker_id: user.id, blocked_id: other,
          match_ids: [match.id], cleanup_pending: true,
        });
      } else {
        // Retrying the same request must not require a conversation already deleted.
        block = (await allRows(sr.UserBlock, { blocker_id: user.id })).find(b => b.match_ids?.includes(body.match_id));
        if (!block) throw safetyError('Chat unavailable', 404);
      }
      try {
        await cleanupBlock(sr, block);
        return Response.json({ success: true, cleanup_pending: false });
      } catch {
        // Blocking has succeeded; scheduled cleanup will retry physical deletion.
        return Response.json({ success: true, cleanup_pending: true });
      }
    }

    if (body.action === 'unread') {
      const matches = [...await allRows(sr.Match, { user1_id: user.id, status: 'active' }),
        ...await allRows(sr.Match, { user2_id: user.id, status: 'active' })];
      const records = [];
      for (const match of matches) {
        try { await requireOpenChat(sr, match.id, user.id); } catch (error) {
          if ([403, 404].includes(error.status)) continue;
          throw error;
        }
        const unread = await allRows(sr.Message, { match_id: match.id, is_read: false });
        records.push(...unread.filter(m => m.sender_id !== user.id).map(m => ({ id: m.id, match_id: m.match_id, sender_id: m.sender_id, is_read: false })));
      }
      return Response.json({ records });
    }

    if (['send', 'typing', 'chat_status', 'messages'].includes(body.action)) {
      if (typeof body.match_id !== 'string') throw safetyError('Invalid chat');
      const match = await requireOpenChat(sr, body.match_id, user.id);
      if (body.action === 'chat_status') return Response.json({ available: true });
      if (body.action === 'messages') {
        const records = await allRows(sr.Message, { match_id: match.id });
        await requireOpenChat(sr, match.id, user.id);
        records.sort((a, b) => String(a.created_date).localeCompare(String(b.created_date)));
        return Response.json({ records });
      }
      if (body.action === 'send' && (typeof body.content !== 'string' || !body.content.trim() || body.content.length > 10000)) {
        throw safetyError('Invalid message');
      }
      const entity = body.action === 'send' ? sr.Message : sr.TypingStatus;
      const data = body.action === 'send' ? {
        match_id: match.id, sender_id: user.id, content: body.content.trim(), is_read: false,
        user1_id: match.user1_id, user2_id: match.user2_id,
      } : { match_id: match.id, user_id: user.id };
      const record = await entity.create(data);
      try {
        // Compensate for blocking/deletion racing an in-flight send.
        await requireOpenChat(sr, match.id, user.id);
      } catch (error) {
        await entity.delete(record.id);
        throw error;
      }
      return Response.json({ record });
    }

    if (body.action === 'stop_typing') {
      if (typeof body.typing_id !== 'string') throw safetyError('Invalid typing status');
      const row = (await sr.TypingStatus.filter({ id: body.typing_id, user_id: user.id }, 'id', 1))[0];
      if (row) await sr.TypingStatus.delete(row.id);
      return Response.json({ success: true });
    }

    if (body.action === 'mark_read') {
      if (typeof body.message_id !== 'string') throw safetyError('Invalid message');
      const message = (await sr.Message.filter({ id: body.message_id }, 'id', 1))[0];
      if (!message) throw safetyError('Message unavailable', 404);
      await requireOpenChat(sr, message.match_id, user.id);
      if (message.sender_id === user.id) throw safetyError('Cannot mark own message read');
      return Response.json({ record: await sr.Message.update(message.id, { is_read: true }) });
    }
    throw safetyError('Unsupported action');
  } catch (error) {
    const status = Number(error?.status) || 500;
    return Response.json({ error: status >= 500 ? 'Please try again' : error.message }, { status });
  }
});

