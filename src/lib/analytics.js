import posthog from 'posthog-js';

export const analytics = {
  // Identify user (call after login)
  identify(userId, properties = {}) {
    posthog.identify(userId, properties);
  },

  // Step 2 events
  userSignedUp(signUpMethod = 'email') {
    posthog.capture('user_signed_up', { sign_up_method: signUpMethod });
  },

  profileCompleted({ budget, city, vibe_level }) {
    posthog.capture('profile_completed', { budget, city, vibe_level });
  },

  swipeAction(direction, targetUserId) {
    posthog.capture('swipe_action', { direction, target_user_id: targetUserId });
  },

  matchCreated(userA, userB) {
    posthog.capture('match_created', { user_a: userA, user_b: userB });
  },

  premiumUpgradeClick(locationInApp) {
    posthog.capture('premium_upgrade_click', { location_in_app: locationInApp });
  },
};