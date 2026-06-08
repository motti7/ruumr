import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const ORANGE = '#FF5722';
const ORANGE_DARK = '#E64A19';
const ORANGE_LIGHT = '#FFF3F0';

function buildReminderHtml({ name, gender, partnerName }) {
  const isFemale = gender === 'female';
  const greeting = `שלום ${name} 👋`;
  const bodyLine = `<strong style="color:${ORANGE};">${partnerName}</strong> כבר מילא/ה את שאלון ההעדפות ומחכה לך!`;
  const subLine = isFemale
    ? 'כשגם את תמלאי את השאלון, תוכלו לראות כמה אתם מתאימים אחד לשני ולהתחיל לדסקס 🏠'
    : 'כשגם אתה תמלא את השאלון, תוכלו לראות כמה אתם מתאימים אחד לשני ולהתחיל לדסקס 🏠';
  const btnText = isFemale ? 'מלאי את השאלון עכשיו ←' : 'מלא את השאלון עכשיו ←';

  return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>מחכים לך!</title>
</head>
<body style="margin:0;padding:0;background:#f7f7f7;font-family:'Segoe UI',Arial,sans-serif;direction:rtl;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f7;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(255,87,34,0.10);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,${ORANGE} 0%,${ORANGE_DARK} 100%);padding:36px 32px;text-align:center;">
              <div style="font-size:48px;margin-bottom:8px;">🧩</div>
              <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:800;letter-spacing:-0.5px;">Ruumr</h1>
              <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px;letter-spacing:1px;">find your perfect roommates</p>
            </td>
          </tr>

          <!-- Badge -->
          <tr>
            <td style="padding:0 32px;">
              <div style="background:linear-gradient(135deg,${ORANGE} 0%,${ORANGE_DARK} 100%);border-radius:0 0 16px 16px;padding:14px;text-align:center;">
                <span style="color:#fff;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">⏳ מחכים לך ⏳</span>
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
                  📋 זה לוקח רק 2 דקות!<br/>
                  <span style="font-weight:400;color:#777;font-size:13px;">8 שאלות פשוטות על סגנון חיים ודרך דירה 🏠</span>
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

    // payload: { user_id, partner_name }
    const { user_id, partner_name } = payload;

    if (!user_id) {
      return Response.json({ error: 'Missing user_id' }, { status: 400 });
    }

    // Get user email by listing all users and finding by id
    const allUsers = await base44.asServiceRole.entities.User.filter({ email: { $exists: true } }, null, 1000);
    const user = allUsers.find(u => u.id === user_id);

    if (!user?.email) {
      console.warn(`No email found for user ${user_id}`);
      return Response.json({ skipped: true, reason: 'user not found or no email' });
    }

    // Get gender from profile
    const profiles = await base44.asServiceRole.entities.Profile.filter({ user_id });
    const profile = profiles[0];
    const gender = profile?.gender || 'male';
    const name = profile?.name || user.full_name || 'חבר/ה';

    const html = buildReminderHtml({ name, gender, partnerName: partner_name || 'ההתאמה שלך' });

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: user.email,
      from_name: 'Ruumr 🏠',
      subject: `🧩 ${partner_name || 'ההתאמה שלך'} מחכה לך ב-Ruumr!`,
      body: html,
    });

    console.log(`✅ Questionnaire reminder email sent to ${user.email}`);
    return Response.json({ success: true });
  } catch (error) {
    console.error('❌ Error sending questionnaire reminder email:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});