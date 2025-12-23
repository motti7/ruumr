export default async function(context) {
    const { base44 } = context;
    
    try {
        // Get all swipes
        const allSwipes = await base44.asServiceRole.entities.Swipe.list();
        
        // Get all profiles
        const allProfiles = await base44.asServiceRole.entities.Profile.list();
        
        let updated = 0;
        
        for (const swipe of allSwipes) {
            // Find profile names
            const swiperProfile = allProfiles.find(p => p.user_id === swipe.swiper_id);
            const swipedProfile = allProfiles.find(p => p.user_id === swipe.swiped_id);
            
            const swiperName = swiperProfile?.name || 'לא נמצא';
            const swipedName = swipedProfile?.name || 'לא נמצא';
            
            // Update if names are missing
            if (!swipe.swiper_name || !swipe.swiped_name) {
                await base44.asServiceRole.entities.Swipe.update(swipe.id, {
                    swiper_name: swiperName,
                    swiped_name: swipedName
                });
                updated++;
            }
        }
        
        return { success: true, updated, message: `עודכנו ${updated} רשומות` };
    } catch (error) {
        console.error("Error:", error);
        return { success: false, error: error.message };
    }
}