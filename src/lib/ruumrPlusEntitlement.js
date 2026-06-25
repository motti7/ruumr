import { isRuumrSimulatorMode, isRuumrSimulatorPlusLocked } from "@/lib/simulatorMode";
import { isNativeIOSApp } from "@/lib/nativeEnvironment";

export function isNativeIOSPlusEntitled(user) {
  void user;
  return false;
}

/**
 * Canonical client-side Ruumr Plus entitlement check.
 *
 * Production: the backend sets `is_ruumr_plus` to true on the Base44 User when a
 * subscription is active (via the payment webhook). `User.me()` returns it, so
 * the entry point can route synchronously.
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
    // App Review Guideline 3.1.1/3.1.3(b): until Ruumr Plus is available via
    // Apple In-App Purchase, the native iOS app must not unlock the Plus
    // digital feature from web/external/admin entitlements.
    return isNativeIOSPlusEntitled(user);
  }

  if (isRuumrSimulatorMode()) {
    return !isRuumrSimulatorPlusLocked();
  }
  return Boolean(user?.is_ruumr_plus);
}

export const RUUMR_PLUS_PRICE_ILS = 25;
