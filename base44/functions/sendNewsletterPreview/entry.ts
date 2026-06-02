import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const emailHtml = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>חדשות מ-Ruumr 🏠</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:'Helvetica Neue',Arial,sans-serif;direction:rtl;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#FF5722 0%,#E64A19 100%);padding:40px 32px;text-align:center;">
              <h1 style="margin:0;font-size:48px;font-weight:800;color:#ffffff;letter-spacing:-1px;">Ruumr</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:16px;letter-spacing:0.5px;">find your perfect roommates</p>
            </td>
          </tr>

          <!-- Intro -->
          <tr>
            <td style="padding:36px 40px 24px;">
              <h2 style="margin:0 0 12px;font-size:24px;color:#1a1a1a;font-weight:700;">היי רומרים, יש לנו כמה עדכונים 🎉😊</h2>
              <p style="margin:0;font-size:16px;color:#555;line-height:1.7;">
                עברו כמה שבועות מהשקת Ruumr, ורצינו לעדכן אתכם בכמה דברים מרגשים שקורים פה 🔥<br/>
                אגב - Ruumr זמין לשימוש גם מהדפדפן, לא רק מהאפליקציה!
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid #f0f0f0;"/></td></tr>

          <!-- News 1: 150 downloads -->
          <tr>
            <td style="padding:28px 40px 20px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:36px;padding-left:16px;vertical-align:top;">🚀</td>
                  <td>
                    <h3 style="margin:0 0 8px;font-size:20px;color:#FF5722;font-weight:700;">150+ הורדות באנדרואיד - ובקרוב גם iOS!</h3>
                    <p style="margin:0;font-size:15px;color:#555;line-height:1.7;">
                      עברנו את ה-150 הורדות באנדרואיד תוך זמן קצר - תודה ענקית לכולכם! 🙏<br/>
                      ואם אתם על iPhone — בשורות טובות: <strong>בקרוב אנחנו משיקים גם לאייפון</strong>. נעדכן ברגע שזה קורה!
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid #f0f0f0;"/></td></tr>

          <!-- News 2: Ruumr Plus -->
          <tr>
            <td style="padding:28px 40px 20px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:36px;padding-left:16px;vertical-align:top;">✨</td>
                  <td>
                    <h3 style="margin:0 0 8px;font-size:20px;color:#FF5722;font-weight:700;">Ruumr Plus - בקרוב מאוד</h3>
                    <p style="margin:0;font-size:15px;color:#555;line-height:1.7;">
                      אנחנו ממש עוד מעט משיקים את <strong>Ruumr Plus</strong> - חוויית חיפוש שותפים ברמה אחרת לגמרי.<br/>
                      AI שמוצא את ההתאמות הטובות ביותר עבורכם, תכונות בלעדיות ועוד. נפרסם פרטים בקרוב 🎉
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid #f0f0f0;"/></td></tr>

          <!-- News 3: WhatsApp Premium Group -->
          <tr>
            <td style="padding:28px 40px 36px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:36px;padding-left:16px;vertical-align:top;">💬</td>
                  <td>
                    <h3 style="margin:0 0 8px;font-size:20px;color:#FF5722;font-weight:700;">קבוצת פרימיום בווצאפ - הצטרפו!</h3>
                    <p style="margin:0;font-size:15px;color:#555;line-height:1.7;">
                      פותחים קבוצת ווצאפ בלעדית עם <strong>הטבות, עדכונים ראשונים ותכנים בלעדיים</strong> לחברי הקהילה.<br/>
                      <strong>מבטיחים לא לחפור</strong> 😄 - רק דברים שווים ורלוונטיים.<br/><br/>
                      <a href="https://chat.whatsapp.com/LINK_PLACEHOLDER" 
                         style="display:inline-block;background:#25D366;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:50px;font-weight:700;font-size:15px;">
                        הצטרפו לקבוצה 👈
                      </a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="background:#fff8f6;padding:32px 40px;text-align:center;border-top:1px solid #f0f0f0;">
              <p style="margin:0 0 20px;font-size:16px;color:#555;">מוכנים למצוא שותפים מעולים? 🏠</p>
              <a href="https://app.ruumrapp.com" 
                 style="display:inline-block;background:linear-gradient(135deg,#FF5722,#E64A19);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:50px;font-weight:700;font-size:16px;letter-spacing:0.3px;">
                פתחו את Ruumr
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;text-align:center;background:#fafafa;">
              <p style="margin:0;font-size:13px;color:#aaa;">
                קיבלתם מייל זה כי נרשמתם ל-Ruumr 🏠<br/>
                © 2024 Ruumr · <a href="https://app.ruumrapp.com" style="color:#FF5722;text-decoration:none;">ruumrapp.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Send preview only to the provided email (not to all users!)
    await base44.integrations.Core.SendEmail({
      to: 'mottishif7@gmail.com',
      subject: '🎉 היי רומרים, יש לנו כמה עדכונים 😊',
      body: emailHtml,
      content_type: 'text/html',
    });

    return Response.json({ success: true, message: 'Preview email sent to mottishif7@gmail.com' });
  } catch (error) {
    console.error('Error sending preview email:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});