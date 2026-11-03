import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { sendServerPush } from '../../shared/serverPush.ts';
import { resolveRecipientLanguage, languageDirection } from '../../shared/recipientLanguage.ts';

const ORANGE = '#FF5722';
const ORANGE_DARK = '#E64A19';
const ORANGE_LIGHT = '#FFF3F0';
const APP_URL = 'https://app.ruumrapp.com';

// Copy for both languages. Emails and pushes go out in the recipient's language.
function buildCopy(lang, { name, gender, likesCount }) {
  const isFemale = gender === 'female';

  if (lang === 'en') {
    return {
      docTitle: 'You have new likes!',
      greeting: `Hi ${name} 👋`,
      bodyLine1: `You got interest from ${likesCount} people who want you as their roommate 🏠`,
      bodyLine2: 'Maybe one of them is the perfect roommate you were looking for? 👀',
      ctaText: 'Open the app for more details 🔥',
      btnText: 'Open the app ←',
      footer: "You received this email because you're a Ruumr user.<br/>© 2026 Ruumr · All rights reserved",
      subject: `🏠 You have ${likesCount} new likes on Ruumr!`,
      pushTitle: `🏠 You have ${likesCount} new likes!`,
      pushBody: `You got likes from ${likesCount} people who want you as their roommate. Open the app for details.`,
    };
  }

  return {
    docTitle: 'יש לך לייקים חדשים!',
    greeting: `שלום ${name} 👋`,
    bodyLine1: isFemale
      ? `קיבלת התעניינות מ-${likesCount} אנשים שמעוניינים להיכנס איתך שותפות 🏠`
      : `קיבלת התעניינות מ-${likesCount} אנשים שמעוניינים להיכנס איתך שותפים 🏠`,
    bodyLine2: 'אולי אחד מהם הוא השותף/ה המושלם/ת שחיפשת? 👀',
    ctaText: isFemale ? 'כנסי לאפליקציה לפרטים נוספים 🔥' : 'כנס לאפליקציה לפרטים נוספים 🔥',
    btnText: isFemale ? 'כנסי לאפליקציה ←' : 'כנס לאפליקציה ←',
    footer: 'קיבלת מייל זה כי אתה/את משתמש/ת ב-Ruumr.<br/>© 2026 Ruumr · כל הזכויות שמורות',
    subject: `🏠 יש לך ${likesCount} התעניינויות חדשות ב-Ruumr!`,
    pushTitle: `🏠 יש לך ${likesCount} התעניינויות חדשות!`,
    pushBody: `קיבלת התעניינויות מ-${likesCount} אנשים שמעוניינים להיכנס איתך שותפים. כנס לאפליקציה לפרטים נוספים.`,
  };
}

function buildEmailHtml({ lang, name, gender, likesCount }) {
  const c = buildCopy(lang, { name, gender, likesCount });
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
              <div style="font-size:42px;margin-bottom:8px;">🏠</div>
              <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:800;letter-spacing:-0.5px;">Ruumr</h1>
              <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px;letter-spacing:1px;">find your perfect roommates</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 32px;text-align:${align};">
              <h2 style="color:#1a1a1a;font-size:22px;font-weight:700;margin:0 0 12px;">${c.greeting}</h2>
              <p style="color:#444;font-size:16px;line-height:1.7;margin:0 0 24px;">
                <strong style="color:${ORANGE};">${lang === 'en' ? 'The Ruumr community' : 'קהילת Ruumr'}</strong> ${lang === 'en' ? 'is here! 🎉' : 'כאן! 🎉'}<br/><br/>
                ${c.bodyLine1}<br/><br/>
                ${c.bodyLine2}
              </p>

              <!-- Highlight box -->
              <div style="background:${ORANGE_LIGHT};${accentSide}:4px solid ${ORANGE};border-radius:12px;padding:18px 20px;margin-bottom:28px;">
                <p style="color:${ORANGE_DARK};font-size:15px;font-weight:600;margin:0;">
                  💌 ${c.ctaText}
                </p>
              </div>

              <!-- CTA Button -->
              <div style="text-align:center;margin-bottom:8px;">
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

    // payload: { swiped_id, swiped_email, swiped_name, likes_count }
    const { swiped_id, swiped_email, swiped_name, likes_count } = payload;

    if (!swiped_id || !swiped_email) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check user notification preferences
    const allUsers = await base44.asServiceRole.entities.User.list();
    const receiverUser = allUsers.find(u => u.id === swiped_id);
    if (receiverUser?.notify_likes === false) {
      console.log(`🔕 User ${swiped_id} has disabled likes notifications, skipping email`);
      return Response.json({ success: true, skipped: true });
    }

    // Fetch profile to get gender, name and language
    const profiles = await base44.asServiceRole.entities.Profile.filter({ user_id: swiped_id });
    const profile = profiles[0];
    const gender = profile?.gender || 'male';
    const lang = resolveRecipientLanguage(profile);
    const name = profile?.name || swiped_name || (lang === 'en' ? 'there' : 'חבר/ה');
    const likesCount = likes_count || 2;
    const copy = buildCopy(lang, { name, gender, likesCount });

    const html = buildEmailHtml({ lang, name, gender, likesCount });

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: swiped_email,
      from_name: 'Ruumr 🏠',
      subject: copy.subject,
      body: html,
    });

    // Also send a mobile push (same trigger/gate as the email — notify_likes
    // was already checked above, so a user who disabled likes notifications
    // gets neither email nor push).
    try {
      await sendServerPush(base44, swiped_id, copy.pushTitle, copy.pushBody);
    } catch (e) {
      console.error('❌ Failed to send likes push:', e);
    }

    console.log(`✅ Likes notification email sent to ${swiped_email} (lang=${lang})`);
    return Response.json({ success: true });
  } catch (error) {
    console.error('❌ Error sending likes email:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});