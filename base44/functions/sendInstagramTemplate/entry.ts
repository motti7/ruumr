import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// gender: 'male' | 'female' | 'other' | undefined
// looking_for_gender: 'male' | 'female' | 'any' | undefined
function getThinkingText(lookingForGender) {
  if (lookingForGender === 'male') return 'חושב שאתה יכול להסתדר טוב ביחד? 🤝';
  if (lookingForGender === 'female') return 'חושבת שאת יכולה להסתדר טוב ביחד? 🤝';
  return 'חושב/ת שאתם יכולים להסתדר טוב ביחד? 🤝';
}

function buildHtml({ name, age, location, about_me, looking_for_description, budget_max, search_cities, looking_for_gender, photoUrl }) {
  const cities = (search_cities || []).join(', ') || location || '';
  const thinkingText = getThinkingText(looking_for_gender);
  const captionText = `✨ הכירו את ${name}, ${age}, מ${location}!

🏠 מחפש/ת שותף/ה לדירה באזור: ${cities}
💰 תקציב: עד ${budget_max ? budget_max.toLocaleString() : '?'}₪

📖 קצת עליי:
"${about_me || ''}"

🔍 מה אני מחפש/ת:
"${looking_for_description || ''}"

${thinkingText}
הורד/י את ruumr עכשיו 👇

🔗 www.ruumrapp.com | הלינק בביו

#שותפים #דירת_שותפים #${(location||'').replace(/ /g,'_')} #ruumrapp #שותפות #דירה`;

  return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>טמפלייט אינסטגרם - ${name}</title>
  <style>
    body { margin: 0; padding: 20px; background: #f0f0f0; font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; }
    h2 { color: #333; text-align: center; margin-bottom: 20px; }
    .note { background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 12px; margin-bottom: 20px; font-size: 14px; color: #856404; text-align: center; }
    .post {
      width: 540px; height: 540px; margin: 0 auto 30px;
      position: relative; border-radius: 16px; overflow: hidden;
      box-shadow: 0 8px 30px rgba(0,0,0,0.2);
    }
    .post img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .post .overlay {
      position: absolute; inset: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.1) 55%, transparent 100%);
    }
    .post .content {
      position: absolute; bottom: 0; right: 0; left: 0;
      padding: 24px 28px; color: white; text-align: right;
    }
    .post .logo {
      position: absolute; top: 16px; left: 16px;
      background: #FF5722; color: white; font-weight: 900;
      font-size: 20px; padding: 6px 14px; border-radius: 30px;
    }
    .post .verified {
      position: absolute; top: 16px; right: 16px;
      background: rgba(255,255,255,0.15); color: white; font-size: 12px;
      padding: 5px 10px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.3);
    }
    .post .name { font-size: 28px; font-weight: 800; margin-bottom: 6px; text-shadow: 0 2px 8px rgba(0,0,0,0.4); }
    .post .tagline { font-size: 14px; opacity: 0.9; margin-bottom: 10px; line-height: 1.5; }
    .post .thinking { font-size: 13px; opacity: 0.85; margin-bottom: 10px; font-style: italic; }
    .post .tags { display: flex; flex-wrap: wrap; gap: 6px; justify-content: flex-end; }
    .post .tag { background: rgba(255,87,34,0.85); color: white; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 20px; }
    .post .tag.light { background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); }
    .caption-box {
      background: white; border-radius: 12px; padding: 20px 24px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08); margin-bottom: 20px;
    }
    .caption-box h3 { margin: 0 0 10px; color: #FF5722; font-size: 15px; }
    #caption-text {
      white-space: pre-wrap; font-family: Arial, sans-serif; font-size: 14px;
      color: #333; line-height: 1.7; direction: rtl; text-align: right;
      background: #f9f9f9; padding: 12px; border-radius: 8px; border: 1px solid #eee;
    }
    #caption-textarea {
      width: 100%; box-sizing: border-box; height: 220px;
      font-family: Arial, sans-serif; font-size: 14px; color: #333;
      line-height: 1.7; direction: rtl; text-align: right;
      background: #f9f9f9; padding: 12px; border-radius: 8px;
      border: 1px solid #eee; resize: none; margin-top: 8px;
    }
  </style>
</head>
<body>
<div class="container">
  <h2>📸 טמפלייט אינסטגרם מוכן לפרסום — ${name}</h2>
  <div class="note">💡 צלם/י screenshot על הפוסט למטה (540×540px) או שמור/י את הדפדפן כ-PDF</div>

  <div class="post">
    <img src="${photoUrl}" alt="${name}" />
    <div class="overlay"></div>
    <div class="logo">ruumrapp</div>
    <div class="verified">✓ מאומת</div>
    <div class="content">
      <div class="name">הכירו את ${name}, ${age}, מ${location} 📍</div>
      <div class="tagline">מחפש/ת: "${looking_for_description || about_me || ''}"</div>
      <div class="thinking">${thinkingText} הורד/י את ruumr עכשיו ← www.ruumrapp.com</div>
      <div class="tags">
        <span class="tag">עד ${budget_max ? budget_max.toLocaleString() : '?'}₪</span>
        ${(search_cities || []).map(c => `<span class="tag light">${c}</span>`).join('')}
      </div>
    </div>
  </div>

  <div class="caption-box">
  <h3>📝 קפטשן — סמן הכל והעתק (Ctrl+A / Cmd+A):</h3>
  <textarea id="caption-textarea" readonly onclick="this.select()">${captionText.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</textarea>
  <div style="font-size:12px;color:#888;margin-top:6px;text-align:center;">לחץ על הטקסט ← Ctrl+A ← Ctrl+C</div>
  </div>
</div>
</body>
</html>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Support explicit payload OR trigger from automation (entity event)
    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    
    // If called from automation, body.data contains the profile record
    const profileData = body.data || body;
    
    const name = profileData.name;
    const age = profileData.age;
    const location = profileData.location;
    const about_me = profileData.about_me;
    const looking_for_description = profileData.looking_for_description;
    const budget_max = profileData.budget_max;
    const search_cities = profileData.search_cities;
    const looking_for_gender = profileData.looking_for_gender;
    const photoUrl = (profileData.photos && profileData.photos[0]) || '';

    const html = buildHtml({
      name, age, location, about_me, looking_for_description,
      budget_max, search_cities, looking_for_gender, photoUrl,
    });

    console.log(`📧 Sending email for profile: ${name}`);
    const emailResult = await base44.integrations.Core.SendEmail({
      to: 'oroscar8642@gmail.com',
      subject: `טמפלייט אינסטגרם - ${name} ruumr`,
      body: html,
    });
    console.log('✅ Email result:', JSON.stringify(emailResult));

    return Response.json({ success: true, message: 'מייל נשלח!', emailResult });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});