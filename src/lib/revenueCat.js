import { Capacitor } from "@capacitor/core";
import { Purchases } from "@revenuecat/purchases-capacitor";

const PLUS_ENTITLEMENT_ID = "Plus";

let configuredForUserId = null;

export function isNativePurchaseSupported() {
  return Capacitor.isNativePlatform();
}

export async function configureRevenueCat(appUserId) {
  if (!isNativePurchaseSupported() || !appUserId || configuredForUserId === appUserId) return;

  const platform = Capacitor.getPlatform();
  const apiKey = platform === "ios"
    ? import.meta.env.VITE_REVENUECAT_IOS_API_KEY
    : import.meta.env.VITE_REVENUECAT_ANDROID_API_KEY;

  if (!apiKey) {
    console.error("[ruumr] Missing RevenueCat API key for platform", platform);
    return;
  }

  await Purchases.configure({ apiKey, appUserID: appUserId });
  configuredForUserId = appUserId;
}

export async function purchasePlusPackage() {
  const offerings = await Purchases.getOfferings();
  const pkg = offerings?.current?.availablePackages?.[0];
  if (!pkg) {
    throw new Error("no_revenuecat_package_available");
  }
  const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
  return customerInfo;
}

export function hasPlusEntitlement(customerInfo) {
  return Boolean(customerInfo?.entitlements?.active?.[PLUS_ENTITLEMENT_ID]);
}

export async function restorePurchases() {
  const { customerInfo } = await Purchases.restorePurchases();
  return customerInfo;
}