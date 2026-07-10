import { isRuumrSimulatorMode, isRuumrSimulatorPlusLocked } from "@/lib/simulatorMode";
import { isNativeIOSApp } from "@/lib/nativeEnvironment";

export function isNativeIOSPlusEntitled(user) {
  return Boolean(user?.is_ruumr_plus);
}

/**
 * Canonical client-side Ruumr Plus entitlement check.
 *
 * Production: the backend sets `is_ruumr_plus` to true on the Base44 User when
 * Plus access is active. `User.me()` returns it, so the entry point can route
 * synchronously.
 *
 * Simulator: entitlement is driven by the `simulator_plus_locked` toggle so both
 * the paywall and the entitled flow are testable locally
 * (?simulator_plus_locked=1 → not entitled → paywall).
 *
 * @param {{ is_ruumr_plus?: boolean } | null | undefined} user
 * @returns {boolean}
 */
export function isPlusEntitled(user) {
  if (isNativeIOSApp()) {
    // Native iOS uses the same canonical Base44 entitlement flag as the rest of
    // the app. Non-entitled users are routed to the coming-soon screen.
    return isNativeIOSPlusEntitled(user);
  }

  if (isRuumrSimulatorMode()) {
    return !isRuumrSimulatorPlusLocked();
  }
  return Boolean(user?.is_ruumr_plus);
}

export const RUUMR_PLUS_PRICE_ILS = 25;
export const RUUMR_PLUS_DURATION_MONTHS = 3;
export const RUUMR_PLUS_ORIGINAL_MONTHLY_ILS = 50;