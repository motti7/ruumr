import { Capacitor } from "@capacitor/core";
import { Purchases } from "@revenuecat/purchases-capacitor";

// Must match the entitlement identifier configured in the RevenueCat dashboard
// exactly, and the offering/package RevenueCat is set up with for the 3-month
// consumable (Product ID: RUUMR_PLUS_3MO).
const PLUS_ENTITLEMENT_ID = "ruumr_plus";
const PLUS_OFFERING_ID = "default";
const PLUS_PACKAGE_ID = "$rc_three_month";

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
    console.error("[RevenueCat] Missing RevenueCat API key for platform", platform);
    return;
  }

  console.log("[RevenueCat] Initializing for user...", appUserId);
  // Purchases.configure both initializes the SDK and logs in as appUserId, so
  // RevenueCat reports this exact Base44 user id as app_user_id on webhooks.
  await Purchases.configure({ apiKey, appUserID: appUserId });
  configuredForUserId = appUserId;
  console.log("[RevenueCat] Configured, appUserId =", appUserId);
}

async function getPlusPackage() {
  const offerings = await Purchases.getOfferings();
  console.log("[RevenueCat] Offerings fetched successfully");
  const offering = offerings?.all?.[PLUS_OFFERING_ID] ?? offerings?.current;
  const pkg = offering?.availablePackages?.find((p) => p.identifier === PLUS_PACKAGE_ID)
    ?? offering?.availablePackages?.[0];
  if (!pkg) {
    console.error("[RevenueCat] No package found in offering", PLUS_OFFERING_ID);
    throw new Error("no_revenuecat_package_available");
  }
  return pkg;
}

export async function purchasePlusPackage() {
  const pkg = await getPlusPackage();
  try {
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
    console.log("[RevenueCat] Purchase completed");
    return customerInfo;
  } catch (err) {
    if (err?.userCancelled) {
      console.log("[RevenueCat] Purchase cancelled by user");
    } else {
      console.error("[RevenueCat] Purchase failed:", err?.message || err);
    }
    throw err;
  }
}

export function hasPlusEntitlement(customerInfo) {
  return Boolean(customerInfo?.entitlements?.active?.[PLUS_ENTITLEMENT_ID]);
}

export async function getCustomerInfo() {
  const { customerInfo } = await Purchases.getCustomerInfo();
  return customerInfo;
}

export async function restorePurchases() {
  const { customerInfo } = await Purchases.restorePurchases();
  return customerInfo;
}