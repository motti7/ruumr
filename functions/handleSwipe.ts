import { base44 } from "@base44/backend-sdk";

export default async function handleSwipe({ swiper_id, swiped_id, action }) {
  // 1. Create the swipe record
  const swipe = await base44.entities.Swipe.create({
    swiper_id,
    swiped_id,
    action
  });

  if (action !== 'like') {
    return { status: 'recorded', match: false };
  }

  // 2. Fetch users involved
  const swiperUser = (await base44.entities.User.filter({ id: swiper_id }))[0];
  const swipedUser = (await base44.entities.User.filter({ id: swiped_id }))[0];
  
  if (!swiperUser || !swipedUser) return { status: 'error', message: 'User not found' };

  // 3. Check for Match
  const otherSwipe = await base44.entities.Swipe.filter({
    swiper_id: swiped_id,
    swiped_id: swiper_id,
    action: 'like'
  });

  if (otherSwipe.length > 0) {
    // IT'S A MATCH!
    await base44.entities.Match.create({
      user1_id: swiper_id,
      user2_id: swiped_id
    });

    // Send Email to BOTH
    await base44.integrations.Core.SendEmail({
      to: swiperUser.email,
      subject: "יש לך התאמה חדשה ב-Roomi! 🎉",
      body: `היי ${swiperUser.full_name || 'שותף/ה'},
      
יש לך התאמה חדשה עם ${swipedUser.full_name || 'משתמש/ת ב-Roomi'}!
כנס/י לאפליקציה כדי להתחיל לצ'וטט.

בהצלחה,
צוות Roomi`
    });

    await base44.integrations.Core.SendEmail({
      to: swipedUser.email,
      subject: "יש לך התאמה חדשה ב-Roomi! 🎉",
      body: `היי ${swipedUser.full_name || 'שותף/ה'},
      
יש לך התאמה חדשה עם ${swiperUser.full_name || 'משתמש/ת ב-Roomi'}!
כנס/י לאפליקציה כדי להתחיל לצ'וטט.

בהצלחה,
צוות Roomi`
    });

    return { status: 'match', match: true };
  } else {
    // Just a Like - Send Notification to the swiped person
    // "User X liked you"
    
    // We want to be careful not to spam, but user asked for it.
    await base44.integrations.Core.SendEmail({
      to: swipedUser.email,
      subject: "מישהו עשה לך לייק ב-Roomi! 👍",
      body: `היי ${swipedUser.full_name || 'שותף/ה'},
      
המשתמש/ת ${swiperUser.full_name || 'מ-Roomi'} עשה/תה לך לייק!
כנס/י לאפליקציה, אולי זו ההתאמה הבאה שלך?

צוות Roomi`
    });
    
    return { status: 'liked', match: false };
  }
}