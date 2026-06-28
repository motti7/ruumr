import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// This is the EXACT email that will be sent to all users via sendNewsletterBatch
const emailHtml = `<!DOCTYPE html><html dir="rtl" lang="he"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head><body style="margin:0;padding:0;background-color:#f5f5f5;font-family:'Helvetica Neue',Arial,sans-serif;direction:rtl;"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f5f5;padding:32px 16px;"><tr><td align="center"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border-radius:24px;overflow:hidden;"><tr><td style="background:linear-gradient(135deg,#FF5722 0%,#E64A19 100%);padding:12px 24px;text-align:center;"><p style="margin:0;color:#ffffff;font-size:13px;font-weight:600;">⏰ הצעה לחמישים הראשונים בלבד</p></td></tr><tr><td style="padding:36px 40px 0;text-align:center;"><p style="margin:0;font-size:42px;font-weight:900;color:#FF5722;line-height:1;">ruumr</p><p style="margin:4px 0 0;font-size:13px;font-weight:800;color:#F5C518;letter-spacing:4px;">PLUS</p></td></tr><tr><td style="padding:24px 40px 0;text-align:center;"><h1 style="margin:0;font-size:30px;font-weight:900;color:#1a1a1a;line-height:1.25;">מצאו את השותף המושלם<br/><span style="color:#FF5722;">בלחיצה כפתור אחת</span></h1></td></tr><tr><td style="padding:16px 40px 0;text-align:center;"><p style="margin:0;font-size:15px;color:#555;line-height:1.7;">AI שסורק מאות משתמשים ומגיש לך את <strong>ההתאמות הטובות ביותר</strong> — בדיוק בשבילך.</p></td></tr><tr><td style="padding:28px 32px 0;"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#FFF3EE 0%,#FFE8DC 100%);border:2px solid #FFCCB3;border-radius:20px;"><tr><td style="padding:28px 24px;text-align:center;"><p style="margin:0 0 4px;font-size:13px;color:#999;text-decoration:line-through;">50₪ לחודש</p><p style="margin:0;font-size:52px;font-weight:900;color:#FF5722;line-height:1;">25₪</p><p style="margin:8px 0 4px;font-size:14px;font-weight:700;color:#333;">עד תחילת השנה האקדמית הבאה!</p><p style="margin:0;font-size:12px;color:#888;">תשלום חד פעמי · ללא חיובים נוספים</p></td></tr></table></td></tr><tr><td style="padding:28px 32px 0;text-align:center;"><a href="https://ruumrapp.com/RuumrPlus" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#F5C518 0%,#E6B800 100%);color:#ffffff;font-size:17px;font-weight:800;text-decoration:none;padding:18px 48px;border-radius:100px;">✨ גלה עוד</a></td></tr><tr><td style="padding:12px 32px 0;text-align:center;"><p style="margin:0;font-size:12px;color:#aaa;">הצעה מוגבלת ל-50 הראשונים בלבד</p></td></tr><tr><td style="padding:24px 40px 32px;text-align:center;"><p style="margin:0;font-size:12px;color:#bbb;">לשאלות: <a href="https://wa.me/972548523140" target="_blank" style="color:#25D366;font-weight:700;">💬 WhatsApp</a></p></td></tr></table></td></tr></table></body></html>`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Send preview to admin
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: 'mottishif7@gmail.com',
      subject: '[טיוטה] ✨ רומר פלוס הגיע — הצעה לחמישים הראשונים!',
      body: emailHtml,
      from_name: 'Ruumr'
    });

    return Response.json({ success: true, message: 'Preview sent to mottishif7@gmail.com' });
  } catch (error) {
    console.error('sendNewsletterPreview error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});