const { base44 } = require('@base44/backend-sdk');

module.exports = async function(params) {
    // params: { swiper_id, swiped_id, action }
    const { swiper_id, swiped_id, action } = params;

    if (action !== 'like') {
        return { match: false };
    }

    // Check if the other person liked me
    // We look for a swipe where swiper = swiped_id AND swiped = swiper_id AND action = 'like'
    const otherSwipe = await base44.entities.Swipe.filter({
        swiper_id: swiped_id,
        swiped_id: swiper_id,
        action: 'like'
    });

    if (otherSwipe.length > 0) {
        // IT'S A MATCH!
        
        // 1. Create Match Entity
        await base44.entities.Match.create({
            user1_id: swiper_id,
            user2_id: swiped_id,
            status: 'active'
        });

        // 2. Notify users via SMS (if they have phone numbers)
        try {
            const swiperProfile = (await base44.entities.Profile.filter({ user_id: swiper_id }))[0];
            const swipedProfile = (await base44.entities.Profile.filter({ user_id: swiped_id }))[0];

            if (swiperProfile?.phone_number) {
                 // Send SMS to Swiper
                 console.log(`[SMS Notification] To ${swiperProfile.phone_number}: יש לך התאמה חדשה עם ${swipedProfile?.name || 'מישהו'}!`);
                 // Example: await sendSMS(swiperProfile.phone_number, "New Match!");
            }

            if (swipedProfile?.phone_number) {
                 // Send SMS to Swiped
                 console.log(`[SMS Notification] To ${swipedProfile.phone_number}: יש לך התאמה חדשה עם ${swiperProfile?.name || 'מישהו'}!`);
            }
            
        } catch (e) {
            console.error("Failed to send match notifications", e);
        }

        return { match: true };
    }

    return { match: false };
};