import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { isRuumrSimulatorMode } from '@/lib/simulatorMode';

const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID || '3a9b850f-9934-49fe-8862-4776d1dc36e3';
const ONESIGNAL_REST_API_KEY = import.meta.env.VITE_ONESIGNAL_REST_API_KEY;
const ONESIGNAL_SCRIPT_ID = 'ruumr-onesignal-web-sdk';
const ONESIGNAL_SCRIPT_SRC = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
const NATIVE_ONE_SIGNAL_PLATFORMS = new Set(['android', 'ios']);
const PUSH_PERMISSION_REQUESTED_KEY = 'ruumr_push_permission_requested';

let nativeOneSignalSdkPromise = null;
let nativeOneSignalInitPromise = null;

function isDesktopBrowserContext() {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return false;
    }

    return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

function isIosLikeBrowserContext() {
    if (typeof navigator === 'undefined') {
        return false;
    }

    const ua = navigator.userAgent || '';
    const platform = navigator.platform || '';
    return /iPad|iPhone|iPod/.test(ua) || (platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function canUseWebOneSignal() {
    return (
        typeof window !== 'undefined' &&
        isDesktopBrowserContext() &&
        !isIosLikeBrowserContext() &&
        !Capacitor.isNativePlatform() &&
        !isRuumrSimulatorMode() &&
        window.location.protocol.startsWith('http')
    );
}

function canUseNativeOneSignal() {
    return typeof window !== 'undefined' && !isRuumrSimulatorMode() && !window.location.protocol.startsWith('http') && NATIVE_ONE_SIGNAL_PLATFORMS.has(Capacitor.getPlatform());
}

function loadOneSignalWebSdk() {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined') {
            resolve(null);
            return;
        }

        if (window.OneSignal) {
            resolve(window.OneSignal);
            return;
        }

        const existingScript = document.getElementById(ONESIGNAL_SCRIPT_ID);
        if (existingScript) {
            existingScript.addEventListener('load', () => resolve(window.OneSignal), { once: true });
            existingScript.addEventListener('error', () => reject(new Error('Failed to load OneSignal web SDK')), { once: true });
            return;
        }

        const script = document.createElement('script');
        script.id = ONESIGNAL_SCRIPT_ID;
        script.src = ONESIGNAL_SCRIPT_SRC;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve(window.OneSignal);
        script.onerror = () => reject(new Error('Failed to load OneSignal web SDK'));
        document.head.appendChild(script);
    });
}

async function loadOneSignalNativeSdk() {
    if (!canUseNativeOneSignal()) {
        return null;
    }

    if (window.plugins?.OneSignal) {
        return window.plugins.OneSignal;
    }

    if (!nativeOneSignalSdkPromise) {
        nativeOneSignalSdkPromise = import('onesignal-cordova-plugin')
            .then((module) => module?.default ?? module ?? window.plugins?.OneSignal ?? null)
            .catch((error) => {
                nativeOneSignalSdkPromise = null;
                throw error;
            });
    }

    const module = await nativeOneSignalSdkPromise;
    return module?.default ?? module ?? window.plugins?.OneSignal ?? null;
}

async function initializeNativeOneSignal() {
    if (!canUseNativeOneSignal()) {
        return null;
    }

    if (nativeOneSignalInitPromise) {
        return nativeOneSignalInitPromise;
    }

    nativeOneSignalInitPromise = (async () => {
        const OneSignal = await loadOneSignalNativeSdk();
        if (!OneSignal) {
            return null;
        }

        if (window.__ruumrOneSignalInitialized) {
            return OneSignal;
        }

        if (import.meta.env.DEV && OneSignal.Debug?.setLogLevel) {
            OneSignal.Debug.setLogLevel(6);
        }

        OneSignal.initialize(ONESIGNAL_APP_ID);
        window.__ruumrOneSignalInitialized = true;

        try {
            const alreadyAsked = window.localStorage.getItem(PUSH_PERMISSION_REQUESTED_KEY) === '1';
            if (!alreadyAsked && OneSignal.Notifications?.requestPermission) {
                await OneSignal.Notifications.requestPermission(true);
                window.localStorage.setItem(PUSH_PERMISSION_REQUESTED_KEY, '1');
            }
        } catch (error) {
            console.warn('OneSignal permission prompt skipped:', error);
        }

        return OneSignal;
    })().catch((error) => {
        nativeOneSignalInitPromise = null;
        throw error;
    });

    return nativeOneSignalInitPromise;
}

async function loginNativeOneSignal(userId) {
    if (!userId || !canUseNativeOneSignal()) {
        return null;
    }

    const OneSignal = await initializeNativeOneSignal();
    if (!OneSignal) {
        return null;
    }

    try {
        await OneSignal.login(userId);
    } catch (error) {
        console.warn('OneSignal native login skipped:', error);
    }
}

export default function OneSignalSetup({ userId }) {
    useEffect(() => {
        try {
            window.localStorage.setItem('ruumr_debug_protocol', window.location.protocol);
            window.localStorage.setItem('ruumr_debug_href', window.location.href);
            window.localStorage.setItem('ruumr_debug_platform', Capacitor.getPlatform());
            window.localStorage.setItem('ruumr_debug_has_bridge', String(Boolean(window.webkit?.messageHandlers?.bridge)));
            window.localStorage.setItem('ruumr_debug_simulator_mode', String(isRuumrSimulatorMode()));
            window.localStorage.setItem('ruumr_debug_can_web', String(canUseWebOneSignal()));
            window.localStorage.setItem('ruumr_debug_can_native', String(canUseNativeOneSignal()));
        } catch {
            // Debug-only values; ignore storage failures.
        }

        console.info('[ruumr] OneSignalSetup', {
            protocol: typeof window !== 'undefined' ? window.location.protocol : 'n/a',
            href: typeof window !== 'undefined' ? window.location.href : 'n/a',
            simulatorMode: isRuumrSimulatorMode(),
            canUseWeb: canUseWebOneSignal(),
            canUseNative: canUseNativeOneSignal(),
            platform: Capacitor.getPlatform(),
        });

        if (canUseWebOneSignal()) {
            if (window.__ruumrOneSignalInitQueued || window.__ruumrOneSignalInitialized) return;

            window.__ruumrOneSignalInitQueued = true;

            window.OneSignalDeferred = window.OneSignalDeferred || [];

            window.OneSignalDeferred.push(async function(OneSignal) {
                if (window.__ruumrOneSignalInitialized) {
                    return;
                }

                await OneSignal.init({
                    appId: ONESIGNAL_APP_ID,
                    notifyButton: { enable: false },
                    allowLocalhostAsSecureOrigin: true,
                });

                window.__ruumrOneSignalInitialized = true;

            });

            void loadOneSignalWebSdk().catch((error) => {
                console.warn('OneSignal web SDK could not be loaded:', error);
            });
            return;
        }

        if (!canUseNativeOneSignal()) {
            return;
        }

        void initializeNativeOneSignal().catch((error) => {
            console.warn('OneSignal native SDK could not be initialized:', error);
        });
    }, []);

    // כאשר יש userId — מגדירים External User ID כדי שנוכל לשלוח לו התראות
    useEffect(() => {
        if (!userId) return;

        if (canUseWebOneSignal()) {
            window.OneSignalDeferred = window.OneSignalDeferred || [];
            window.OneSignalDeferred.push(async function(OneSignal) {
                try {
                    await OneSignal.login(userId);
                } catch (error) {
                    console.warn('OneSignal login skipped:', error);
                }
            });
            return;
        }

        if (!canUseNativeOneSignal()) {
            return;
        }

        void loginNativeOneSignal(userId);
    }, [userId]);

    return null;
}

// פונקציות עזר לשימוש בכל האפליקציה
export const OneSignalHelpers = {
    // בקשת הרשאות
    async requestPermission() {
        if (canUseWebOneSignal() && window.OneSignal) {
            await window.OneSignal.push(function() {
                window.OneSignal.showNativePrompt();
            });
            return true;
        }

        if (canUseNativeOneSignal()) {
            const OneSignal = await initializeNativeOneSignal();
            if (!OneSignal?.Notifications?.requestPermission) {
                return null;
            }

            await OneSignal.Notifications.requestPermission(true);
            try {
                window.localStorage.setItem(PUSH_PERMISSION_REQUESTED_KEY, '1');
            } catch {
                // ignore storage failure
            }
            return true;
        }

        return null;
    },

    // שליחת notification
    async sendNotification(userId, title, message, url) {
        // זה צריך להיעשות מהצד server
        // אבל אפשר להשתמש ב-OneSignal REST API
        if (!ONESIGNAL_REST_API_KEY) {
            console.error('OneSignal: Missing VITE_ONESIGNAL_REST_API_KEY');
            return null;
        }

        try {
            const response = await fetch('https://api.onesignal.com/notifications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Key ${ONESIGNAL_REST_API_KEY}`
                },
                body: JSON.stringify({
                    app_id: ONESIGNAL_APP_ID,
                    target_channel: 'push',
                    include_aliases: {
                        external_id: [String(userId)],
                    },
                    headings: { en: title },
                    contents: { en: message },
                    url
                })
            });
            return await response.json();
        } catch (e) {
            console.error('Error sending notification:', e);
        }
    },

    // קבלת Player ID של המשתמש הנוכחי
    async getPlayerId() {
        if (canUseWebOneSignal() && window.OneSignal) {
            return (
                window.OneSignal?.User?.pushSubscription?.id ??
                window.OneSignal?.User?.PushSubscription?.id ??
                window.OneSignal?.User?.onesignalId ??
                null
            );
        }

        if (canUseNativeOneSignal()) {
            const OneSignal = await loadOneSignalNativeSdk();
            return (
                OneSignal?.User?.pushSubscription?.id ??
                OneSignal?.User?.PushSubscription?.id ??
                OneSignal?.User?.onesignalId ??
                null
            );
        }

        return null;
    },

    // הגדרת External User ID (ID מהמערכת שלנו)
    async setExternalUserId(userId) {
        if (!userId) {
            return null;
        }

        if (canUseWebOneSignal() && window.OneSignal) {
            await window.OneSignal.login(userId);
            return true;
        }

        if (canUseNativeOneSignal()) {
            await loginNativeOneSignal(userId);
            return true;
        }

        return null;
    }
};
