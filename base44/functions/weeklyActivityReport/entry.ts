import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const RECIPIENT_EMAIL = 'mottishif7@gmail.com';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const currentUser = await base44.auth.me();

    if (!currentUser?.id) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (currentUser.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Calculate date 7 days ago
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weekAgoISO = oneWeekAgo.toISOString();

    // Fetch all relevant data
    const [allUsers, allProfiles, allSwipes, allMatches, allMessages] = await Promise.all([
      base44.asServiceRole.entities.User.list('-created_date', 500),
      base44.asServiceRole.entities.Profile.list('-created_date', 500),
      base44.asServiceRole.entities.Swipe.list('-created_date', 500),
      base44.asServiceRole.entities.Match.list('-created_date', 500),
      base44.asServiceRole.entities.Message.list('-created_date', 500),
    ]);

    // Filter to last 7 days
    const newUsers = allUsers.filter(u => u.created_date && new Date(u.created_date) >= oneWeekAgo && u.role !== 'admin');
    const newProfiles = allProfiles.filter(p => p.created_date && new Date(p.created_date) >= oneWeekAgo);
    const newSwipes = allSwipes.filter(s => s.created_date && new Date(s.created_date) >= oneWeekAgo);
    const newMatches = allMatches.filter(m => m.created_date && new Date(m.created_date) >= oneWeekAgo);
    const newMessages = allMessages.filter(m => m.created_date && new Date(m.created_date) >= oneWeekAgo);

    const likes = newSwipes.filter(s => s.action === 'like' || (s.data && s.data.action === 'like'));
    const dislikes = newSwipes.filter(s => s.action === 'dislike' || (s.data && s.data.action === 'dislike'));

    const fromDate = oneWeekAgo.toLocaleDateString('he-IL');
    const toDate = new Date().toLocaleDateString('he-IL');

    // Build user rows
    const userRows = newUsers.map(u => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${u.full_name || '—'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#888;">${u.email || '—'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#888;">${new Date(u.created_date).toLocaleDateString('he-IL')}</td>
      </tr>`).join('');

    const emailBody = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px; direction: rtl;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    
    <div style="background: linear-gradient(135deg, #FF5722, #E64A19); padding: 24px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 26px;">📊 סיכום שבועי — ruumr</h1>
      <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0;">${fromDate} עד ${toDate}</p>
    </div>

    <div style="padding: 24px;">
      
      <!-- Stats Grid -->
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 28px;">
        <div style="background:#fff8f6;border:1px solid #ffe0d6;border-radius:10px;padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:bold;color:#FF5722;">${newUsers.length}</div>
          <div style="font-size:13px;color:#888;margin-top:4px;">משתמשים חדשים</div>
        </div>
        <div style="background:#fff8f6;border:1px solid #ffe0d6;border-radius:10px;padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:bold;color:#FF5722;">${newProfiles.length}</div>
          <div style="font-size:13px;color:#888;margin-top:4px;">פרופילים חדשים</div>
        </div>
        <div style="background:#fff8f6;border:1px solid #ffe0d6;border-radius:10px;padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:bold;color:#FF5722;">${newMatches.length}</div>
          <div style="font-size:13px;color:#888;margin-top:4px;">התאמות חדשות</div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 28px;">
        <div style="background:#f0fff4;border:1px solid #c6f6d5;border-radius:10px;padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:bold;color:#22c55e;">${likes.length}</div>
          <div style="font-size:13px;color:#888;margin-top:4px;">❤️ לייקים</div>
        </div>
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:bold;color:#ef4444;">${dislikes.length}</div>
          <div style="font-size:13px;color:#888;margin-top:4px;">👎 דיסלייקים</div>
        </div>
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:bold;color:#3b82f6;">${newMessages.length}</div>
          <div style="font-size:13px;color:#888;margin-top:4px;">💬 הודעות</div>
        </div>
      </div>

      <!-- New Users Table -->
      ${newUsers.length > 0 ? `
      <h3 style="color:#FF5722;margin-bottom:12px;">👤 משתמשים חדשים</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#fff8f6;">
            <th style="padding:10px 12px;text-align:right;color:#FF5722;font-weight:600;">שם</th>
            <th style="padding:10px 12px;text-align:right;color:#FF5722;font-weight:600;">אימייל</th>
            <th style="padding:10px 12px;text-align:right;color:#FF5722;font-weight:600;">תאריך הצטרפות</th>
          </tr>
        </thead>
        <tbody>${userRows}</tbody>
      </table>
      ` : '<p style="color:#888;text-align:center;">לא נרשמו משתמשים חדשים השבוע</p>'}

    </div>

    <div style="background:#f9f9f9;padding:16px;text-align:center;border-top:1px solid #eee;">
      <p style="color:#bbb;font-size:12px;margin:0;">סיכום אוטומטי שבועי של ruumr 🏠</p>
    </div>
  </div>
</body>
</html>`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: RECIPIENT_EMAIL,
      subject: `📊 סיכום שבועי ruumr | ${fromDate} – ${toDate}`,
      body: emailBody,
    });

    return Response.json({ success: true, stats: {
      newUsers: newUsers.length,
      newProfiles: newProfiles.length,
      likes: likes.length,
      dislikes: dislikes.length,
      newMatches: newMatches.length,
      newMessages: newMessages.length,
    }});
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
