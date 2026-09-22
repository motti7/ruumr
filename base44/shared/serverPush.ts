// Server-side OneSignal push helper.
//
// Used by entity-automation functions (likes, matches) that run as service
// role and therefore can't go through the user-authenticated sendPushNotification
// backend function. Sends a push to a single app user by their external_id alias
// (set client-side via OneSignal.login(userId)). Non-fatal: callers wrap in
// try/catch so a push failure never blocks the email notification.

export async function sendServerPush(userId, title, message, data = {}) {
  const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID");
  const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY");

  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    console.error("[serverPush] OneSignal credentials not set");
    return { success: false, error: "OneSignal not configured" };
  }

  if (!userId || !title || !message) {
    return { success: false, error: "userId, title, and message are required" };
  }

  try {
    const response = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        target_channel: "push",
        include_aliases: { external_id: [String(userId)] },
        headings: { en: title, he: title },
        contents: { en: message, he: message },
        data,
        ios_sound: "default",
        android_sound: "default",
      }),
    });

    const result = await response.json();
    if (response.ok) {
      console.log(`[serverPush] ✅ Push sent user=${userId} recipients=${result?.recipients ?? 0}`);
      return { success: true, recipients: result?.recipients ?? 0 };
    }
    console.error(`[serverPush] ❌ OneSignal push failed user=${userId}:`, result);
    return { success: false, error: result };
  } catch (error) {
    console.error(`[serverPush] ❌ Error sending push to ${userId}:`, error);
    return { success: false, error: error.message };
  }
}