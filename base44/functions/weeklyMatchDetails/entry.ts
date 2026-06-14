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

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const fromDate = oneWeekAgo.toLocaleDateString('he-IL');
    const toDate = new Date().toLocaleDateString('he-IL');

    // Fetch all relevant data
    const [allMatches, allMessages, allProfiles] = await Promise.all([
      base44.asServiceRole.entities.Match.list('-created_date', 1000),
      base44.asServiceRole.entities.Message.list('-created_date', 10000),
      base44.asServiceRole.entities.Profile.list('-created_date', 500),
    ]);

    // Filter to last 7 days
    const newMatches = allMatches.filter(m => m.created_date && new Date(m.created_date) >= oneWeekAgo);
    const newMessages = allMessages.filter(m => m.created_date && new Date(m.created_date) >= oneWeekAgo);

    // Build a lookup: profile by user_id
    const profileByUserId = {};
    for (const p of allProfiles) {
      if (p.user_id) profileByUserId[p.user_id] = p;
    }

    // Build match details HTML
    let matchDetailsHTML = '';

    if (newMatches.length === 0) {
      matchDetailsHTML = '<p style="color:#888;text-align:center;padding:20px;">לא נוצרו התאמות חדשות השבוע</p>';
    } else {
      for (const match of newMatches) {
        const p1 = profileByUserId[match.user1_id];
        const p2 = profileByUserId[match.user2_id];
        const name1 = match.user1_name || (p1 ? p1.name : match.user1_id);
        const name2 = match.user2_name || (p2 ? p2.name : match.user2_id);

        // Get messages for this match
        const matchMessages = newMessages.filter(m => m.match_id === match.id).sort((a, b) =>
          new Date(a.created_date) - new Date(b.created_date)
        );

        let messagesHTML = '';
        if (matchMessages.length === 0) {
          messagesHTML = '<p style="color:#999;font-size:13px;padding:8px 0;">💬 טרם התחילו לשוחח</p>';
        } else {
          messagesHTML = matchMessages.map(msg => {
            const senderProfile = profileByUserId[msg.sender_id];
            const senderName = senderProfile ? senderProfile.name : (msg.sender_id === match.user1_id ? name1 : name2);
            const isFirst = matchMessages.indexOf(msg) === 0;
            const dateStr = new Date(msg.created_date).toLocaleString('he-IL');
            return `
              <div style="padding:8px 12px;margin:4px 0;background:${isFirst ? '#fff8f6' : '#f9fafb'};border-radius:8px;border-right:3px solid ${isFirst ? '#FF5722' : '#e5e7eb'};">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                  <strong style="color:#333;font-size:13px;">${senderName}</strong>
                  <span style="color:#aaa;font-size:11px;">${dateStr}</span>
                </div>
                <p style="color:#555;font-size:13px;margin:0;">${msg.content}</p>
                ${isFirst ? '<span style="display:inline-block;margin-top:4px;background:#FF5722;color:white;font-size:10px;padding:2px 8px;border-radius:10px;">הודעה ראשונה</span>' : ''}
              </div>`;
          }).join('');
        }

        matchDetailsHTML += `
          <div style="background:white;border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin-bottom:16px;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
              <div style="background:#FF5722;color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:14px;">♥</div>
              <div>
                <strong style="color:#333;">${name1}</strong>
                <span style="color:#aaa;margin:0 8px;">🤝</span>
                <strong style="color:#333;">${name2}</strong>
              </div>
              <span style="margin-right:auto;color:#aaa;font-size:12px;">${new Date(match.created_date).toLocaleDateString('he-IL')}</span>
            </div>
            ${messagesHTML}
          </div>`;
      }
    }

    // Messages not in new matches (orphaned / old match messages)
    const newMatchIds = new Set(newMatches.map(m => m.id));
    const orphanedMessages = newMessages.filter(m => !newMatchIds.has(m.match_id));
    
    let orphanedHTML = '';
    if (orphanedMessages.length > 0) {
      // Group by match_id
      const byMatch = {};
      for (const m of orphanedMessages) {
        if (!byMatch[m.match_id]) byMatch[m.match_id] = [];
        byMatch[m.match_id].push(m);
      }
      
      orphanedHTML = '<h3 style="color:#888;margin:24px 0 12px;">📨 הודעות בהתאמות קיימות</h3>';
      for (const [matchId, msgs] of Object.entries(byMatch)) {
        const existingMatch = allMatches.find(m => m.id === matchId);
        const u1 = existingMatch ? (profileByUserId[existingMatch.user1_id]) : null;
        const u2 = existingMatch ? (profileByUserId[existingMatch.user2_id]) : null;
        const n1 = existingMatch ? (existingMatch.user1_name || (u1 ? u1.name : '?')) : '?';
        const n2 = existingMatch ? (existingMatch.user2_name || (u2 ? u2.name : '?')) : '?';
        
        orphanedHTML += `
          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:12px;margin-bottom:12px;">
            <div style="color:#666;font-size:13px;margin-bottom:8px;">👥 ${n1} 🤝 ${n2} <span style="color:#aaa;">(${msgs.length} הודעות השבוע)</span></div>
            ${msgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)).map(msg => {
              const sp = profileByUserId[msg.sender_id];
              const sn = sp ? sp.name : '?';
              return `<div style="padding:6px 12px;margin:2px 0;background:white;border-radius:6px;font-size:12px;"><strong style="color:#333;">${sn}:</strong> <span style="color:#555;">${msg.content}</span> <span style="color:#ccc;font-size:10px;">${new Date(msg.created_date).toLocaleString('he-IL')}</span></div>`;
            }).join('')}
          </div>`;
      }
    }

    const emailBody = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px; direction: rtl;">
  <div style="max-width: 650px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    
    <div style="background: linear-gradient(135deg, #FF5722, #E64A19); padding: 24px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">💌 פירוט התאמות והודעות — ruumr</h1>
      <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0;">${fromDate} עד ${toDate}</p>
    </div>

    <div style="padding: 20px;">
      
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px;">
        <div style="background:#fff8f6;border:1px solid #ffe0d6;border-radius:10px;padding:14px;text-align:center;">
          <div style="font-size:24px;font-weight:bold;color:#FF5722;">${newMatches.length}</div>
          <div style="font-size:12px;color:#888;">התאמות חדשות</div>
        </div>
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:14px;text-align:center;">
          <div style="font-size:24px;font-weight:bold;color:#3b82f6;">${newMessages.length}</div>
          <div style="font-size:12px;color:#888;">הודעות חדשות</div>
        </div>
      </div>

      <h2 style="color:#FF5722;margin-bottom:16px;font-size:18px;">🆕 התאמות חדשות</h2>
      ${matchDetailsHTML}

      ${orphanedHTML}

    </div>

    <div style="background:#f9f9f9;padding:16px;text-align:center;border-top:1px solid #eee;">
      <p style="color:#bbb;font-size:12px;margin:0;">פירוט התאמות אוטומטי שבועי של ruumr 🏠</p>
    </div>
  </div>
</body>
</html>`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: RECIPIENT_EMAIL,
      subject: `💌 פירוט התאמות ruumr | ${fromDate} – ${toDate}`,
      body: emailBody,
    });

    return Response.json({
      success: true,
      stats: {
        newMatches: newMatches.length,
        newMessages: newMessages.length,
        matchesWithChat: newMatches.filter(m => newMessages.some(msg => msg.match_id === m.id)).length,
        matchesWithoutChat: newMatches.filter(m => !newMessages.some(msg => msg.match_id === m.id)).length,
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});