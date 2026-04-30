import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

const ONESIGNAL_APP_ID = '3a9b850f-9934-49fe-8862-4776d1dc36e3';

export default function OneSignalSetup({ userId }) {
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (Capacitor.isNativePlatform?.()) return;

        window.OneSignalDeferred = window.OneSignalDeferred || [];

        window.OneSignalDeferred.push(async function(OneSignal) {
            await OneSignal.init({
                appId: ONESIGNAL_APP_ID,
                notifyButton: { enable: false },
                allowLocalhostAsSecureOrigin: true,
            });

            // בקשת הרשאה אוטומטית
            await OneSignal.Notifications.requestPermission();
        });
    }, []);

    // כאשר יש userId — מגדירים External User ID כדי שנוכל לשלוח לו התראות
    useEffect(() => {
        if (!userId) return;
        window.OneSignalDeferred = window.OneSignalDeferred || [];
        window.OneSignalDeferred.push(async function(OneSignal) {
            await OneSignal.login(userId);
        });
    }, [userId]);

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
