// Server-side push helper using the platform's built-in SendPushNotification
// integration (no third-party OneSignal setup required). Called from
// entity-automation functions (likes, matches, messages) that run as service
// role. Non-fatal: callers wrap in try/catch so a push failure never blocks
// the email notification.

export async function sendServerPush(base44, userId, title, message) {
  if (!userId || !title || !message) {
    return { success: false, error: "userId, title, and message are required" };
  }

  try {
    await base44.asServiceRole.integrations.Core.SendPushNotification({
      user_id: String(userId),
      title,
      content: message,
    });
    console.log(`[serverPush] ✅ Push sent user=${userId}`);
    return { success: true };
  } catch (error) {
    console.error(`[serverPush] ❌ Error sending push to ${userId}:`, error);
    return { success: false, error: error?.message || String(error) };
  }
}