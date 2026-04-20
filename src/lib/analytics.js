import posthog from 'posthog-js';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY || 'phc_placeholder';
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://eu.i.posthog.com';

let initialized = false;

export function initPostHog() {
    if (initialized || typeof window === 'undefined') return;
    posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        autocapture: true,
        capture_pageview: true,
        persistence: 'localStorage',
    });
    initialized = true;
}

export function identifyUser(userId, properties = {}) {
    if (!initialized) return;
    posthog.identify(userId, properties);
}

export function track(event, properties = {}) {
    if (!initialized) return;
    posthog.capture(event, properties);
}

// ─── Custom business events ────────────────────────────────────────────────

export const Analytics = {
    userSignedUp(signUpMethod = 'email') {
        track('user_signed_up', { sign_up_method: signUpMethod });
    },

    profileCompleted({ budget, city, vibe_level }) {
        track('profile_completed', { budget, city, vibe_level });
    },

    swipeAction(direction, targetUserId) {
        // direction: 'right' (like) | 'left' (dislike)
        track('swipe_action', { direction, target_user_id: targetUserId });
    },

    matchCreated(userA, userB) {
        track('match_created', { user_a: userA, user_b: userB });
    },

    premiumUpgradeClick(locationInApp) {
        track('premium_upgrade_click', { location_in_app: locationInApp });
    },
};

export default posthog;