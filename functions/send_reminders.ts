const { base44 } = require('@base44/backend-sdk');

module.exports = async function(params) {
    // This function runs on the backend
    try {
        // Fetch all profiles
        const profiles = await base44.entities.Profile.list(1000); // Fetch up to 1000
        let sentCount = 0;
        
        for (const p of profiles) {
            // Check for missing or bad photos
            // Logic: No photos array, empty array, or contains blob/nulls exclusively?
            // User specifically said "users that don't have photos (because I deleted them)"
            const photos = p.photos || [];
            const validPhotos = photos.filter(ph => ph && !ph.startsWith('blob:'));
            
            if (validPhotos.length === 0) {
                 // Try to send email
                 // We use p.created_by which stores the creator's email
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