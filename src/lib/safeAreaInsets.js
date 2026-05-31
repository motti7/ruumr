// Resolves the bottom safe-area inset and publishes it as the CSS variable
// --app-safe-area-bottom on the document root.
//
// Why this exists: the production Android wrapper (Base44 RN WebView) draws
// edge-to-edge but does NOT report the 3-button system navigation bar height
// through CSS env(safe-area-inset-bottom) — it resolves to 0px, so the custom
// bottom nav renders behind the OS nav buttons. (env(safe-area-inset-top) IS
// reported by the same WebView, which is why only the bottom is affected.)
// When we detect that broken case on Android we fall back to the standard
// 48dp navigation-bar height. Gesture-nav devices report a non-zero inset, so
// they keep using the real env() value and are unaffected.

const FALLBACK_ANDROID_NAV_BAR_PX = 48;

// Measures the live value of env(safe-area-inset-bottom) in CSS pixels by
// reading it back off a hidden probe element (it cannot be read directly).
function measureEnvInsetBottom() {
  if (typeof document === "undefined" || !document.body) return 0;
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:fixed;left:0;bottom:0;width:0;visibility:hidden;pointer-events:none;height:env(safe-area-inset-bottom,0px);";
  document.body.appendChild(probe);
  const measured = probe.getBoundingClientRect().height;
  probe.remove();
  return Number.isFinite(measured) ? measured : 0;
}

function isAndroid() {
  return typeof navigator !== "undefined" && /android/i.test(navigator.userAgent || "");
}

import { Capacitor } from '@capacitor/core';

function isNativeApp() {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export function resolveBottomInset() {
  const envInset = measureEnvInsetBottom();
  if (envInset > 0) return envInset;
  // env() reported 0: on Android native WebView this is the 3-button-nav bug,
  // so we reserve the standard nav-bar height.
  // In a regular browser (not native app), 0 is correct — no fallback needed.
  return (isAndroid() && isNativeApp()) ? FALLBACK_ANDROID_NAV_BAR_PX : 0;
}

function applySafeAreaInsets() {
  if (typeof document === "undefined") return;
  document.documentElement.style.setProperty(
    "--app-safe-area-bottom",
    `${resolveBottomInset()}px`,
  );
}

export function initSafeAreaInsets() {
  if (typeof window === "undefined") return;
  const apply = () => applySafeAreaInsets();
  if (document.body) {
    apply();
  } else {
    window.addEventListener("DOMContentLoaded", apply, { once: true });
  }
  // Re-resolve when the viewport changes (rotation, nav-bar show/hide).
  window.addEventListener("resize", apply);
  window.addEventListener("orientationchange", apply);
}