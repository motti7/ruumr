import { base44 } from '@/api/base44Client';
import { Swipe } from '@/entities/Swipe';
import { isRuumrSimulatorMode } from '@/lib/simulatorMode';
import { createRuumrPlusMatch } from '@/api/ruumrPlus';

export async function processSwipeMatch({ swiperId, swipedId, action, origin, source = 'discover' }) {
  if (action !== 'like') {
    return { match: false };
  }

  if (source === 'ruumr_plus') {
    return createRuumrPlusMatch({ targetUserId: swipedId });
  }

  if (isRuumrSimulatorMode()) {
    const reverseSwipes = await Swipe.filter({
      swiper_id: swipedId,
      swiped_id: swiperId,
      action: 'like',
    });

    return { match: reverseSwipes?.length > 0 };
  }

  const result = await base44.functions.invoke('handleSwipe', {
    swiper_id: swiperId,
    swiped_id: swipedId,
    action,
    origin,
  });

  return result?.data || result;
}