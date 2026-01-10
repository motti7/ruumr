export default async function sendTestEmailToMotti({ base44 }) {
    try {
        // Get Motti's user and profile
        const allUsers = await base44.asServiceRole.entities.User.list();
        const motti = allUsers.find(u => u.email === 'mottishif7@gmail.com');
        
        if (!motti) {
            return { success: false, error: 'משתמש מוטי לא נמצא' };
        }
        
        const profiles = await base44.asServiceRole.entities.Profile.filter({ user_id: motti.id });
        const mottiProfile = profiles[0];
        
        if (!mottiProfile) {
            return { success: false, error: 'פרופיל של מוטי לא נמצא' };
        }
        
        // Send the email
        await base44.integrations.Core.SendEmail({
            to: 'mottishif7@gmail.com',
            subject: '🎉 יש לך התאמה חדשה עם דביר!',
            body: `היי ${mottiProfile.name},<br><br>יש לך התאמה חדשה ב-Roomi עם דביר!<br><br>היכנס/י לאפליקציה כדי להתחיל לצ'וטט:<br><br><a href="https://roomi.me" style="display:inline-block;background:#FF5722;color:white;padding:12px 24px;text-decoration:none;border-radius:25px;font-weight:bold;margin-top:10px;">פתח את Roomi</a>`
        });
        
        return { success: true, message: 'מייל נשלח בהצלחה למוטי!' };
    } catch (error) {
        console.error('Error sending test email:', error);
        return { success: false, error: error.message };
    }
}