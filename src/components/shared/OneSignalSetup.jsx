import { useEffect } from 'react';

export default function OneSignalSetup() {
    useEffect(() => {
        // OneSignal App ID (hardcoded — update requires new app version)
        const appId = '3a9b850f-9934-49fe-8862-4776d1dc36e3';
        const safariWebId = import.meta.env.VITE_ONESIGNAL_SAFARI_WEB_ID;

        if (typeof window !== 'undefined' && window.OneSignal) {
            window.OneSignal = window.OneSignal || [];
            
            window.OneSignal.push(function() {
                window.OneSignal.init({
                    appId: appId,
                    safari_web_id: safariWebId || "web.onesignal.auto",
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
        const appId = '3a9b850f-9934-49fe-8862-4776d1dc36e3';
        const restApiKey = import.meta.env.VITE_ONESIGNAL_REST_API_KEY;
        
        if (!restApiKey) {
            console.error('OneSignal: Missing VITE_ONESIGNAL_REST_API_KEY');
            return null;
        }

        try {
            const response = await fetch('https://onesignal.com/api/v1/notifications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${restApiKey}`
                },
                body: JSON.stringify({
                    app_id: appId,
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