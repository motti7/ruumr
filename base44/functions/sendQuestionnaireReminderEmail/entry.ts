import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { resolveRecipientLanguage, languageDirection } from '../../shared/recipientLanguage.ts';

const ORANGE = '#FF5722';
const ORANGE_DARK = '#E64A19';
const ORANGE_LIGHT = '#FFF3F0';
const APP_URL = 'https://app.ruumrapp.com';

// Copy for both languages. The reminder is sent in the recipient's language
// (their saved choice, otherwise their marketplace).
function buildCopy(lang, { name, gender, partnerName }) {
  const isFemale = gender === 'female';

  if (lang === 'en') {
    return {
      docTitle: 'Waiting for you!',
      badge: '⏳ WAITING FOR YOU ⏳',
      greeting: `Hi ${name} 👋`,
      bodyLine: `<strong style="color:${ORANGE};">${partnerName}</strong> has already filled in the preferences questionnaire and is waiting for you!`,
      subLine: "Once you fill it in too, you'll both see how well you match 🏠",
      highlight: '📋 It only takes 2 minutes!',
      highlightHint: '8 simple questions about lifestyle and home habits 🏠',
      btnText: 'Fill in the questionnaire now ←',
      footer: "You received this email because you're a Ruumr user.<br/>© 2026 Ruumr · All rights reserved",
      subject: `🧩 ${partnerName} is waiting for you on Ruumr!`,
    };
  }

  return {
    docTitle: 'מחכים לך!',
    badge: '⏳ מחכים לך ⏳',
    greeting: `שלום ${name} 👋`,
    bodyLine: `<strong style="color:${ORANGE};">${partnerName}</strong> כבר מילא/ה את שאלון ההעדפות ומחכה לך!`,
    subLine: isFemale
      ? 'כשגם את תמלאי את השאלון, תוכלו לראות כמה אתם מתאימים אחד לשני 🏠'
      : 'כשגם אתה תמלא את השאלון, תוכלו לראות כמה אתם מתאימים אחד לשני 🏠',
    highlight: '📋 זה לוקח רק 2 דקות!',
    highlightHint: '8 שאלות פשוטות על סגנון חיים ודרך דירה 🏠',
    btnText: isFemale ? 'מלאי את השאלון עכשיו ←' : 'מלא את השאלון עכשיו ←',
    footer: 'קיבלת מייל זה כי אתה/את משתמש/ת ב-Ruumr.<br/>© 2026 Ruumr · כל הזכויות שמורות',
    subject: `🧩 ${partnerName} מחכה לך ב-Ruumr!`,
  };
}

function buildReminderHtml({ lang, name, gender, partnerName }) {
  const c = buildCopy(lang, { name, gender, partnerName });
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
          <tr>
            <td style="background:linear-gradient(135deg,${ORANGE} 0%,${ORANGE_DARK} 100%);padding:36px 32px;text-align:center;">
              <div style="font-size:48px;margin-bottom:8px;">🧩</div>
              <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:800;letter-spacing:-0.5px;">Ruumr</h1>
              <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px;letter-spacing:1px;">find your perfect roommates</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px;">
              <div style="background:linear-gradient(135deg,${ORANGE} 0%,${ORANGE_DARK} 100%);border-radius:0 0 16px 16px;padding:14px;text-align:center;">
                <span style="color:#fff;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">${c.badge}</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 36px;text-align:${align};">
              <h2 style="color:#1a1a1a;font-size:22px;font-weight:700;margin:0 0 16px;">${c.greeting}</h2>
              <p style="color:#444;font-size:16px;line-height:1.8;margin:0 0 8px;">${c.bodyLine}</p>
              <p style="color:#666;font-size:15px;line-height:1.7;margin:0 0 28px;">${c.subLine}</p>
              <div style="background:${ORANGE_LIGHT};${accentSide}:4px solid ${ORANGE};border-radius:12px;padding:18px 20px;margin-bottom:28px;">
                <p style="color:${ORANGE_DARK};font-size:15px;font-weight:600;margin:0;line-height:1.6;">
                  ${c.highlight}<br/>
                  <span style="font-weight:400;color:#777;font-size:13px;">${c.highlightHint}</span>
                </p>
              </div>
              <div style="text-align:center;">
                <a href="${APP_URL}"
                   style="display:inline-block;background:linear-gradient(135deg,${ORANGE} 0%,${ORANGE_DARK} 100%);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:50px;font-size:17px;font-weight:700;letter-spacing:0.3px;box-shadow:0 4px 16px rgba(255,87,34,0.35);">
                  ${c.btnText}
                </a>
              </div>
            </td>
          </tr>
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

    const { user_id, partner_name } = payload;

    if (!user_id) {
      return Response.json({ error: 'Missing user_id' }, { status: 400 });
    }

    // Get user email by listing all users
    const allUsers = await base44.asServiceRole.entities.User.list('-created_date', 2000);
    const user = allUsers.find(u => u.id === user_id);

    if (!user?.email) {
      console.warn(`No email found for user ${user_id}`);
      return Response.json({ skipped: true, reason: 'user not found or no email' });
    }

    // Get gender and language from profile
    const profiles = await base44.asServiceRole.entities.Profile.filter({ user_id });
    const profile = profiles[0];
    const gender = profile?.gender || 'male';
    const lang = resolveRecipientLanguage(profile);
    const name = profile?.name || user.full_name || (lang === 'en' ? 'there' : 'חבר/ה');
    const partnerName = partner_name || (lang === 'en' ? 'Your match' : 'ההתאמה שלך');
    const copy = buildCopy(lang, { name, gender, partnerName });

    const html = buildReminderHtml({ lang, name, gender, partnerName });

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: user.email,
      from_name: 'Ruumr 🏠',
      subject: copy.subject,
      body: html,
    });

    console.log(`✅ Questionnaire reminder email sent to ${user.email} (lang=${lang})`);
    return Response.json({ success: true });
  } catch (error) {
    console.error('❌ Error sending questionnaire reminder email:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});