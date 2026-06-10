import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ORANGE = '#FF5722';
const ORANGE_DARK = '#E64A19';
const ORANGE_LIGHT = '#FFF3F0';

function buildMatchEmailHtml({ name, gender, matchName }) {
  const isFemale = gender === 'female';
  const greeting = `שלום ${name} 👋`;
  const bodyLine = isFemale
    ? `ישנה התעניינות הדדית בינך לבין <strong style="color:${ORANGE};">${matchName}</strong>!`
    : `ישנה התעניינות הדדית בינך לבין <strong style="color:${ORANGE};">${matchName}</strong>!`;
  const subLine = isFemale
    ? 'שניכם הראתם התעניינות אחד בשני — זה הזמן לדבר! 🎉'
    : 'שניכם הראתם התעניינות אחד בשני — זה הזמן לדבר! 🎉';
  const ctaLine = isFemale
    ? 'זמן להיכנסי לאפליקציה ולהתחיל לדבר! 💬'
    : 'זמן להיכנס לאפליקציה ולהתחיל לדבר! 💬';
  const btnText = isFemale ? 'כנסי ותתחילי לדבר ←' : 'כנס ותתחיל לדבר ←';

  return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>יש לך התאמה חדשה!</title>
</head>
<body style="margin:0;padding:0;background:#f7f7f7;font-family:'Segoe UI',Arial,sans-serif;direction:rtl;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f7;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(255,87,34,0.10);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,${ORANGE} 0%,${ORANGE_DARK} 100%);padding:36px 32px;text-align:center;">
              <div style="font-size:48px;margin-bottom:8px;">🤝</div>
              <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:800;letter-spacing:-0.5px;">Ruumr</h1>
              <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px;letter-spacing:1px;">find your perfect roommates</p>
            </td>
          </tr>

          <!-- Match badge -->
          <tr>
            <td style="padding:0 32px;">
              <div style="background:linear-gradient(135deg,${ORANGE} 0%,${ORANGE_DARK} 100%);border-radius:0 0 16px 16px;padding:14px;text-align:center;margin-bottom:0;">
                <span style="color:#fff;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">✨ התאמה חדשה ✨</span>
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 32px 36px;">
              <h2 style="color:#1a1a1a;font-size:22px;font-weight:700;margin:0 0 16px;">${greeting}</h2>
              <p style="color:#444;font-size:16px;line-height:1.8;margin:0 0 8px;">
                ${bodyLine}
              </p>
              <p style="color:#666;font-size:15px;line-height:1.7;margin:0 0 28px;">
                ${subLine}
              </p>

              <!-- Highlight box -->
              <div style="background:${ORANGE_LIGHT};border-right:4px solid ${ORANGE};border-radius:12px;padding:18px 20px;margin-bottom:28px;">
                <p style="color:${ORANGE_DARK};font-size:15px;font-weight:600;margin:0;line-height:1.6;">
                  🏠 ${ctaLine}<br/>
                  <span style="font-weight:400;color:#777;font-size:13px;">אל תחכו יותר מדי — השותף/ה המושלם/ת מחכה 😊</span>
                </p>
              </div>

              <!-- CTA Button -->
              <div style="text-align:center;">
                <a href="https://app.ruumrapp.com" 
                   style="display:inline-block;background:linear-gradient(135deg,${ORANGE} 0%,${ORANGE_DARK} 100%);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:50px;font-size:17px;font-weight:700;letter-spacing:0.3px;box-shadow:0 4px 16px rgba(255,87,34,0.35);">
                  ${btnText}
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#fafafa;border-top:1px solid #f0f0f0;padding:20px 32px;text-align:center;">
              <p style="color:#aaa;font-size:12px;margin:0;">
                קיבלת מייל זה כי אתה/את משתמש/ת ב-Ruumr.<br/>
                © 2026 Ruumr · כל הזכויות שמורות
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    // payload: { user_id, user_email, user_name, match_user_name }
    const { user_id, user_email, user_name, match_user_name } = payload;

    if (!user_id || !user_email) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check user notification preferences
    const allUsers = await base44.asServiceRole.entities.User.list();
    const receiverUser = allUsers.find(u => u.id === user_id);
    if (receiverUser?.notify_matches === false) {
      console.log(`🔕 User ${user_id} has disabled match notifications, skipping email`);
      return Response.json({ success: true, skipped: true });
    }

    // Fetch profile to get gender
    const profiles = await base44.asServiceRole.entities.Profile.filter({ user_id });
    const profile = profiles[0];
    const gender = profile?.gender || 'male';
    const name = profile?.name || user_name || 'חבר/ה';

    const html = buildMatchEmailHtml({ name, gender, matchName: match_user_name || 'מישהו' });

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: user_email,
      from_name: 'Ruumr 🏠',
      subject: `🤝 יש לך התאמה חדשה ב-Ruumr!`,
      body: html,
    });

    console.log(`✅ Match notification email sent to ${user_email}`);
    return Response.json({ success: true });
  } catch (error) {
    console.error('❌ Error sending match email:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});