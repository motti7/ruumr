import { isRuumrSimulatorMode, isRuumrSimulatorPlusLocked } from "@/lib/simulatorMode";
import { isNativeIOSApp } from "@/lib/nativeEnvironment";

const NATIVE_IOS_ALLOWED_PLUS_SOURCES = new Set([
  "admin_grant",
  "bgu_free",
  "apple_iap",
]);

export function isNativeIOSPlusEntitled(user) {
  if (!isNativeIOSApp() || !user?.is_ruumr_plus) {
    return false;
  }

  if (user?.role === "admin") {
    return true;
  }

  return NATIVE_IOS_ALLOWED_PLUS_SOURCES.has(String(user?.ruumr_plus_source || "").toLowerCase());
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
    return isNativeIOSPlusEntitled(user);
  }

  if (isRuumrSimulatorMode()) {
    return !isRuumrSimulatorPlusLocked();
  }
  return Boolean(user?.is_ruumr_plus);
}

export const RUUMR_PLUS_PRICE_ILS = 25;
