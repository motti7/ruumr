const { base44 } = require('@base44/backend-sdk');

module.exports = async function(params) {
    try {
        // Fetch all profiles
        const profiles = await base44.entities.Profile.list(1000); 
        let sentCount = 0;
        
        for (const p of profiles) {
            const photos = p.photos || [];
            // Check if photos array is effectively empty or contains only invalid blobs
            // Logic: Filter out nulls and blobs
            const validPhotos = photos.filter(ph => ph && typeof ph === 'string' && !ph.startsWith('blob:'));
            
            if (validPhotos.length === 0) {
                 if (p.created_by) {
                     try {
                         await base44.integrations.Core.SendEmail({
                             to: p.created_by,
                             subject: "Roomi: חסרות תמונות בפרופיל שלך 📸",
                             body: `היי ${p.name || 'חבר/ה'},

שמנו לב שאין תמונות בפרופיל שלך ב-Roomi (או שהן לא תקינות).
כדי שמשתמשים אחרים יוכלו לראות אותך ולעשות לך לייק, חייבים להעלות תמונות ברורות.

אנא היכנס/י לאפליקציה והעלה תמונות חדשות בהקדם!

נתראה באפליקציה,
צוות Roomi`
                         });
                         sentCount++;
                     } catch (err) {
                         console.error(`Failed to send email to ${p.created_by}`, err);
                     }
                 }
            }
        }
        
        return { success: true, sent_count: sentCount };
    } catch (error) {
        console.error("Admin function error:", error);
        return { success: false, error: error.message };
    }
};