import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { sendServerPush } from '../../shared/serverPush.ts';
import { resolveRecipientLanguage, languageDirection } from '../../shared/recipientLanguage.ts';

const ORANGE = '#FF5722';
const ORANGE_DARK = '#E64A19';
const ORANGE_LIGHT = '#FFF3F0';
const APP_URL = 'https://app.ruumrapp.com';

// All copy in both languages. The email and the push notification are sent in
// the recipient's language (their saved choice, otherwise their marketplace).
function buildCopy(lang, { name, gender, matchName }) {
  const isFemale = gender === 'female';

  if (lang === 'en') {
    return {
      docTitle: 'You have a new match!',
      badge: '✨ NEW MATCH ✨',
      greeting: `Hi ${name} 👋`,
      bodyLine: `There is a mutual interest between you and <strong style="color:${ORANGE};">${matchName}</strong>!`,
      subLine: 'You both showed interest in each other — time to talk! 🎉',
      ctaLine: 'Time to open the app and start chatting! 💬',
      ctaHint: "Don't wait too long — your perfect roommate is waiting 😊",
      btnText: 'Open the app and say hi →',
      footer: "You received this email because you're a Ruumr user.<br/>© 2026 Ruumr · All rights reserved",
      subject: '🤝 You have a new match on Ruumr!',
      pushTitle: '🎉 You have a new match!',
      pushBody: `There is a mutual interest between you and ${matchName}! Time to talk.`,
    };
  }

  return {
    docTitle: 'יש לך התאמה חדשה!',
    badge: '✨ התאמה חדשה ✨',
    greeting: `שלום ${name} 👋`,
    bodyLine: `ישנה התעניינות הדדית בינך לבין <strong style="color:${ORANGE};">${matchName}</strong>!`,
    subLine: 'שניכם הראתם התעניינות אחד בשני — זה הזמן לדבר! 🎉',
    ctaLine: 'זמן להיכנס לאפליקציה ולהתחיל לדבר! 💬',
    ctaHint: 'אל תחכו יותר מדי — השותף/ה המושלם/ת מחכה 😊',
    btnText: isFemale ? 'כנסי ותתחילי לדבר ←' : 'כנס ותתחיל לדבר ←',
    footer: 'קיבלת מייל זה כי אתה/את משתמש/ת ב-Ruumr.<br/>© 2026 Ruumr · כל הזכויות שמורות',
    subject: '🤝 יש לך התאמה חדשה ב-Ruumr!',
    pushTitle: '🎉 יש לך התאמה חדשה!',
    pushBody: `ישנה התעניינות הדדית בינך לבין ${matchName}! זה הזמן לדבר.`,
  };
}

function buildMatchEmailHtml({ lang, name, gender, matchName }) {
  const c = buildCopy(lang, { name, gender, matchName });
  const dir = languageDirection(lang);
  const align = lang === 'he' ? 'right' : 'left';
  const accentSide = lang === 'he' ? 'border-right' : 'border-left';

  return `
<!DOCTYPE html>
<html dir="${dir}" lang="${lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${c.docTitle}</title>
</head>
<body style="margin:0;padding:0;background:#f7f7f7;font-family:'Segoe UI',Arial,sans-serif;direction:${dir};">
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
                <span style="color:#fff;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">${c.badge}</span>
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 32px 36px;text-align:${align};">
              <h2 style="color:#1a1a1a;font-size:22px;font-weight:700;margin:0 0 16px;">${c.greeting}</h2>
              <p style="color:#444;font-size:16px;line-height:1.8;margin:0 0 8px;">
                ${c.bodyLine}
              </p>
              <p style="color:#666;font-size:15px;line-height:1.7;margin:0 0 28px;">
                ${c.subLine}
              </p>

              <!-- Highlight box -->
              <div style="background:${ORANGE_LIGHT};${accentSide}:4px solid ${ORANGE};border-radius:12px;padding:18px 20px;margin-bottom:28px;">
                <p style="color:${ORANGE_DARK};font-size:15px;font-weight:600;margin:0;line-height:1.6;">
                  🏠 ${c.ctaLine}<br/>
                  <span style="font-weight:400;color:#777;font-size:13px;">${c.ctaHint}</span>
                </p>
              </div>

              <!-- CTA Button -->
              <div style="text-align:center;">
                <a href="${APP_URL}"
                   style="display:inline-block;background:linear-gradient(135deg,${ORANGE} 0%,${ORANGE_DARK} 100%);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:50px;font-size:17px;font-weight:700;letter-spacing:0.3px;box-shadow:0 4px 16px rgba(255,87,34,0.35);">
                  ${c.btnText}
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#fafafa;border-top:1px solid #f0f0f0;padding:20px 32px;text-align:center;">
              <p style="color:#aaa;font-size:12px;margin:0;">
                ${c.footer}
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

    // Fetch profile to get gender, name and language
    const profiles = await base44.asServiceRole.entities.Profile.filter({ user_id });
    const profile = profiles[0];
    const gender = profile?.gender || 'male';
    const lang = resolveRecipientLanguage(profile);
    const fallbackName = lang === 'en' ? 'there' : 'חבר/ה';
    const name = profile?.name || user_name || fallbackName;
    const matchName = match_user_name || (lang === 'en' ? 'someone' : 'מישהו');
    const copy = buildCopy(lang, { name, gender, matchName });

    const html = buildMatchEmailHtml({ lang, name, gender, matchName });

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: user_email,
      from_name: 'Ruumr 🏠',
      subject: copy.subject,
      body: html,
    });

    // Also send a mobile push (same trigger/gate as the email — notify_matches
    // was already checked above, so a user who disabled match notifications
    // gets neither email nor push).
    try {
      await sendServerPush(base44, user_id, copy.pushTitle, copy.pushBody);
    } catch (e) {
      console.error('❌ Failed to send match push:', e);
    }

    console.log(`✅ Match notification email sent to ${user_email} (lang=${lang})`);
    return Response.json({ success: true });
  } catch (error) {
    console.error('❌ Error sending match email:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});