import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// This is the EXACT email that will be sent to all users
// IDENTICAL to sendNewsletterPreview - verified
const emailHtml = `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Ruumr Plus – הצעה לחמישים הראשונים</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:'Helvetica Neue',Arial,sans-serif;direction:rtl;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f5f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
          
          <!-- Header Strip -->
          <tr>
            <td style="background:#F05A28;padding:12px 24px;text-align:center;">
              <p style="margin:0;color:#ffffff;font-size:14px;font-weight:700;">הצעה לחמישים הראשונים בלבד</p>
            </td>
          </tr>

          <!-- Branding -->
          <tr>
            <td style="padding:36px 40px 24px;text-align:center;">
              <p style="margin:0;font-size:44px;font-weight:900;color:#FF5722;line-height:1;">ruumr</p>
              <p style="margin:4px 0 0;font-size:14px;font-weight:800;color:#F5C518;letter-spacing:4px;">PLUS</p>
            </td>
          </tr>

          <!-- Headline -->
          <tr>
            <td style="padding:0 40px 24px;text-align:center;">
              <h1 style="margin:0;font-size:28px;font-weight:800;color:#212121;line-height:1.3;">מצאו את השותף המושלם<br/><span style="color:#F05A28;">בלחיצת כפתור אחת</span></h1>
            </td>
          </tr>

          <!-- Subheadline -->
          <tr>
            <td style="padding:0 40px 24px;text-align:center;">
              <p style="margin:0;font-size:15px;color:#757575;line-height:1.7;">AI שסורק מאות משתמשים ומגיש לך את <strong>ההתאמות הטובות ביותר</strong> — בדיוק בשבילך.<br/>ואז? מתחילים לדבר מיד, ללא צורך בסוויפס הדדיים.</p>
            </td>
          </tr>

          <!-- Feature Grid -->
          <tr>
            <td style="padding:0 40px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="33%" style="text-align:center;vertical-align:top;">
                    <p style="margin:0;font-size:32px;">💬</p>
                    <p style="margin:8px 0 4px;font-size:14px;font-weight:700;color:#212121;">צ'אט מיידי</p>
                    <p style="margin:0;font-size:12px;color:#999;">פתחו שיחה עם ההתאמה</p>
                  </td>
                  <td width="33%" style="text-align:center;vertical-align:top;">
                    <p style="margin:0;font-size:32px;">⚡</p>
                    <p style="margin:8px 0 4px;font-size:14px;font-weight:700;color:#212121;">גישה מיידית</p>
                    <p style="margin:0;font-size:12px;color:#999;">ללא צורך בסוויפס הדדיים</p>
                  </td>
                  <td width="33%" style="text-align:center;vertical-align:top;">
                    <p style="margin:0;font-size:32px;">🤖</p>
                    <p style="margin:8px 0 4px;font-size:14px;font-weight:700;color:#212121;">התאמת AI חכמה</p>
                    <p style="margin:0;font-size:12px;color:#999;">מתוך מאות משתמשים עבורך</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Pricing Block -->
          <tr>
            <td style="padding:0 40px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FDEAE3;border-radius:20px;">
                <tr>
                  <td style="padding:28px 24px;text-align:center;">
                    <p style="margin:0 0 8px;font-size:16px;color:#999;text-decoration:line-through;">₪50 לחודש</p>
                    <p style="margin:0;font-size:56px;font-weight:900;color:#F05A28;line-height:1;">25₪</p>
                    <p style="margin:12px 0 4px;font-size:15px;font-weight:700;color:#212121;">עד תחילת השנה האקדמית הבאה!</p>
                    <p style="margin:0;font-size:13px;color:#757575;">תשלום חד פעמי - ללא חיובים נוספים</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding:0 40px 32px;text-align:center;">
              <a href="https://ruumrapp.com/RuumrPlus" target="_blank" style="display:inline-block;background:#E6B422;color:#ffffff;text-decoration:none;padding:18px 48px;border-radius:100px;font-size:18px;font-weight:800;letter-spacing:0.5px;">✨ גלו עוד</a>
            </td>
          </tr>

          <!-- Limited Offer Text -->
          <tr>
            <td style="padding:0 40px 24px;text-align:center;">
              <p style="margin:0;font-size:13px;color:#aaa;">הצעה מוגבלת ל-50 הראשונים בלבד</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px 32px;text-align:center;background:#fafafa;border-top:1px solid #f0f0f0;">
              <p style="margin:0;font-size:14px;font-weight:800;color:#212121;letter-spacing:2px;">ruumr PLUS</p>
              <p style="margin:16px 0 0;font-size:13px;color:#757575;">לשאלות ופניות <a href="https://wa.me/972548523140" target="_blank" style="color:#25D366;font-weight:700;text-decoration:none;">💬 WhatsApp</a></p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const BATCH_SIZE = 25;
const EMAIL_DELAY_MS = 3000; // 3 seconds between emails to avoid rate limit
const EXCLUDED = ['mottishif7', 'mottishiffer', 'moti dolev'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get or create progress tracker
    let progressRecords = await base44.asServiceRole.entities.NewsletterProgress.filter({});
    let progress = progressRecords.length > 0 ? progressRecords[0] : null;
    if (!progress) {
      progress = await base44.asServiceRole.entities.NewsletterProgress.create({
        offset: 0,
        sent_emails: [],
        started_at: new Date().toISOString()
      });
    }

    // Get all users
    let allUsers = [];
    let skip = 0;
    while (true) {
      const batch = await base44.asServiceRole.entities.User.list('-created_date', 50, skip);
      if (!batch || batch.length === 0) break;
      allUsers = allUsers.concat(batch);
      if (batch.length < 50) break;
      skip += 50;
    }

    const allEmails = allUsers
      .map(u => u.email)
      .filter(e => e && !EXCLUDED.some(kw => e.toLowerCase().includes(kw)));

    // Filter out already sent emails using the LATEST progress data
    const currentProgress = await base44.asServiceRole.entities.NewsletterProgress.get(progress.id);
    const sentEmails = new Set(currentProgress.sent_emails || []);
    const remainingEmails = allEmails.filter(e => !sentEmails.has(e));

    if (remainingEmails.length === 0) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: 'mottishif7@gmail.com',
        subject: '✅ שליחת הניוזלטר הסתיימה!',
        body: `<p dir="rtl">סיימנו לשלוח לכל ${allEmails.length} המשתמשים. הכל עבר בהצלחה!</p>`,
        from_name: 'Ruumr System'
      });
      return Response.json({ done: true, totalSent: allEmails.length, message: 'All emails sent! Admin notified.' });
    }

    // Send batch with delays - save progress after EACH email to prevent duplicates
    const chunk = remainingEmails.slice(0, BATCH_SIZE);
    let sent = 0, failed = 0;

    for (const email of chunk) {
      // Double-check this email wasn't already sent (safety check)
      const latestProgress = await base44.asServiceRole.entities.NewsletterProgress.get(progress.id);
      if ((latestProgress.sent_emails || []).includes(email)) {
        console.log(`Skipping ${email} - already in sent_emails`);
        continue;
      }

      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: email,
          subject: "✨ רומר פלוס הגיע — הצעה לחמישים הראשונים!",
          body: emailHtml,
          from_name: "Ruumr"
        });
        sent++;
        
        // IMMEDIATELY save progress after each successful send
        await base44.asServiceRole.entities.NewsletterProgress.update(progress.id, {
          offset: latestProgress.offset + 1,
          sent_emails: [...(latestProgress.sent_emails || []), email],
          last_updated: new Date().toISOString()
        });
        
        // Wait between emails to avoid rate limit
        if (sent < chunk.length) {
          await new Promise(resolve => setTimeout(resolve, EMAIL_DELAY_MS));
        }
      } catch (e) {
        console.error(`Failed to send to ${email}:`, e.message);
        failed++;
      }
    }

    const finalProgress = await base44.asServiceRole.entities.NewsletterProgress.get(progress.id);
    const remaining = allEmails.length - finalProgress.offset;
    console.log(`Batch done: sent=${sent}, failed=${failed}, totalSent=${finalProgress.offset}, remaining=${remaining}`);
    return Response.json({ 
      done: false, 
      sent, 
      failed, 
      totalSent: finalProgress.offset,
      remaining,
      totalEmails: allEmails.length 
    });
  } catch (error) {
    console.error('sendNewsletterBatch error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});