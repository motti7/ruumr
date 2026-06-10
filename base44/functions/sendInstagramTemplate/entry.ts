import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const photoUrl = 'https://base44.app/api/apps/68c919adff6ac6fafb51bed6/files/mp/public/68c919adff6ac6fafb51bed6/3898da58e_IMG_3306.jpeg';

    const html = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>טמפלייט אינסטגרם - שני</title>
  <style>
    body { margin: 0; padding: 20px; background: #f0f0f0; font-family: 'Arial', sans-serif; }
    .container { max-width: 600px; margin: 0 auto; }
    h2 { color: #333; text-align: center; margin-bottom: 20px; }
    .note { background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 12px; margin-bottom: 20px; font-size: 14px; color: #856404; text-align: center; }

    /* ── POST TEMPLATE 1:1 ── */
    .post {
      width: 540px;
      height: 540px;
      margin: 0 auto 30px;
      position: relative;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 8px 30px rgba(0,0,0,0.2);
    }
    .post img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .post .overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.1) 55%, transparent 100%);
    }
    .post .content {
      position: absolute;
      bottom: 0;
      right: 0;
      left: 0;
      padding: 24px 28px;
      color: white;
      text-align: right;
    }
    .post .logo {
      position: absolute;
      top: 16px;
      left: 16px;
      background: #FF5722;
      color: white;
      font-weight: 900;
      font-size: 20px;
      padding: 6px 14px;
      border-radius: 30px;
      letter-spacing: 0.5px;
    }
    .post .verified {
      position: absolute;
      top: 16px;
      right: 16px;
      background: rgba(255,255,255,0.15);
      backdrop-filter: blur(6px);
      color: white;
      font-size: 12px;
      padding: 5px 10px;
      border-radius: 20px;
      border: 1px solid rgba(255,255,255,0.3);
    }
    .post .name {
      font-size: 30px;
      font-weight: 800;
      margin-bottom: 6px;
      text-shadow: 0 2px 8px rgba(0,0,0,0.4);
    }
    .post .tagline {
      font-size: 14px;
      opacity: 0.9;
      margin-bottom: 12px;
      line-height: 1.5;
    }
    .post .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      justify-content: flex-end;
    }
    .post .tag {
      background: rgba(255,87,34,0.85);
      color: white;
      font-size: 12px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 20px;
    }
    .post .tag.light {
      background: rgba(255,255,255,0.2);
      backdrop-filter: blur(4px);
      border: 1px solid rgba(255,255,255,0.3);
    }

    /* ── CAPTION BOX ── */
    .caption-box {
      background: white;
      border-radius: 12px;
      padding: 20px 24px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
      margin-bottom: 20px;
    }
    .caption-box h3 { margin: 0 0 10px; color: #FF5722; font-size: 15px; }
    .caption-box pre {
      white-space: pre-wrap;
      font-family: Arial, sans-serif;
      font-size: 14px;
      color: #333;
      line-height: 1.7;
      margin: 0;
      direction: rtl;
      text-align: right;
    }
    .copy-btn {
      display: inline-block;
      margin-top: 12px;
      background: #FF5722;
      color: white;
      border: none;
      padding: 8px 18px;
      border-radius: 20px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
    }
    .copy-btn:hover { background: #e64a19; }
  </style>
</head>
<body>
<div class="container">
  <h2>📸 טמפלייט אינסטגרם מוכן לפרסום</h2>
  <div class="note">💡 צלם/י screenshot על הפוסט למטה (540×540px) או שמור/י את הדפדפן כ-PDF</div>

  <!-- POST VISUAL -->
  <div class="post">
    <img src="${photoUrl}" alt="שני" />
    <div class="overlay"></div>
    <div class="logo">ruumr</div>
    <div class="verified">✓ מאומת</div>
    <div class="content">
      <div class="name">שני, 21 📍פתח תקווה</div>
      <div class="tagline">מחפשת בית עם אווירה נעימה — שותפים זורמים ומכבדים 🏠</div>
      <div class="tags">
        <span class="tag">עד 3,000₪</span>
        <span class="tag light">פתח תקווה</span>
        <span class="tag light">הוד השרון</span>
        <span class="tag light">ראש העין</span>
      </div>
    </div>
  </div>

  <!-- CAPTION -->
  <div class="caption-box">
    <h3>📝 קפטשן מוכן להעתקה:</h3>
    <pre id="caption">✨ היכרו עם שני, 21 מפתח תקווה!

🏠 מחפשת שותף/ה לדירה באזור פתח תקווה, הוד השרון וראש העין
💰 תקציב: עד 3,000₪
💬 "מחפשת בית עם אווירה נעימה — שותפים זורמים ומכבדים שיהיה כיף לגור ביחד"

רוצה להתחבר עם שני? הורד/י את ruumr עכשיו 👇

🔗 ruumr.app | הלינק בביו

#שותפים #דירת_שותפים #פתח_תקווה #הוד_השרון #ראש_העין #ruumr #שותפות #דירה</pre>
    <button class="copy-btn" onclick="navigator.clipboard.writeText(document.getElementById('caption').innerText).then(()=>this.innerText='✓ הועתק!')">📋 העתק קפטשן</button>
  </div>
</div>
</body>
</html>`;

    console.log('📧 Sending email to mottishif7@gmail.com...');
    const emailResult = await base44.integrations.Core.SendEmail({
      to: 'mottishif7@gmail.com',
      subject: 'טמפלייט אינסטגרם - שני ruumr',
      body: html,
    });
    console.log('✅ Email result:', JSON.stringify(emailResult));

    return Response.json({ success: true, message: 'מייל נשלח!', emailResult });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});