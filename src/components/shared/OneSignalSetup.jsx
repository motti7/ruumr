import { useEffect } from 'react';

export default function OneSignalSetup() {
    useEffect(() => {
        // Initialize OneSignal
        if (typeof window !== 'undefined' && window.OneSignal) {
            window.OneSignal = window.OneSignal || [];
            
            window.OneSignal.push(function() {
                window.OneSignal.init({
                    appId: "YOUR_ONESIGNAL_APP_ID", // צריך להחליף ב-App ID אמיתי מ-OneSignal
                    safari_web_id: "web.onesignal.auto.xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                    notifyButton: {
                        enable: false, // לא מציגים את הכפתור המובנה
                    },
                    allowLocalhostAsSecureOrigin: true, // לפיתוח מקומי
                });
            });
        }
    }, []);

    return null;
}

// פונקציות עזר לשימוש בכל האפליקציה
export const OneSignalHelpers = {
    // בקשת הרשאות
    async requestPermission() {
        if (window.OneSignal) {
            await window.OneSignal.push(function() {
                window.OneSignal.showNativePrompt();
            });
        }
    },

    // שליחת notification
    async sendNotification(userId, title, message, url) {
        // זה צריך להיעשות מהצד server
        // אבל אפשר להשתמש ב-OneSignal REST API
        try {
            const response = await fetch('https://onesignal.com/api/v1/notifications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Basic YOUR_REST_API_KEY' // מפתח REST API מ-OneSignal
                },
                body: JSON.stringify({
                    app_id: 'YOUR_ONESIGNAL_APP_ID',
                    include_external_user_ids: [userId],
                    headings: { en: title },
                    contents: { en: message },
                    url: url
                })
            });
            return await response.json();
        } catch (e) {
            console.error('Error sending notification:', e);
        }
    },

    // קבלת Player ID של המשתמש הנוכחי
    async getPlayerId() {
        if (window.OneSignal) {
            return await window.OneSignal.getUserId();
        }
        return null;
    },

    // הגדרת External User ID (ID מהמערכת שלנו)
    async setExternalUserId(userId) {
        if (window.OneSignal) {
            await window.OneSignal.setExternalUserId(userId);
        }
    }
};