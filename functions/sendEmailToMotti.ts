export default async function sendEmailToMotti({ base44 }) {
    try {
        console.log('📧 Starting to send email to Motti...');
        
        // Get Motti's profile
        const profiles = await base44.asServiceRole.entities.Profile.list(1000);
        const mottiProfile = profiles.find(p => p.user_id && p.name);
        
        const mottiName = mottiProfile?.name || 'מוטי';
        
        console.log('📨 Sending email now...');
        
        // Send the email
        const result = await base44.integrations.Core.SendEmail({
            to: 'mottishif7@gmail.com',
            subject: '🎉 יש לך התאמה חדשה עם דביר!',
            body: `היי ${mottiName},<br><br>יש לך התאמה חדשה ב-Roomi עם דביר!<br><br>היכנס/י לאפליקציה כדי להתחיל לצ'וטט:<br><br><div style="text-align:center;margin-top:20px;"><a href="https://roomi.me" style="display:inline-block;background:#FF5722;color:white;padding:12px 24px;text-decoration:none;border-radius:25px;font-weight:bold;">פתח את Roomi</a></div>`
        });
        
        console.log('✅ Email sent successfully to mottishif7@gmail.com:', result);
        
        return { 
            success: true, 
            message: 'מייל נשלח בהצלחה למוטי!',
            result 
        };
    } catch (error) {
        console.error('❌ CRITICAL ERROR sending email:', error);
        return { 
            success: false, 
            error: error.message,
            stack: error.stack
        };
    }
}