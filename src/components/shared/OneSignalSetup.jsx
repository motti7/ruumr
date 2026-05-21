import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { isRuumrSimulatorMode } from '@/lib/simulatorMode';

const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID;
const ONESIGNAL_SCRIPT_ID = 'ruumr-onesignal-web-sdk';
const ONESIGNAL_SCRIPT_SRC = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
const PUSH_PERMISSION_REQUESTED_KEY = 'ruumr_push_permission_requested';

let nativeInitPromise = null;

function isDesktopBrowserContext() {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

function isIosLikeBrowserContext() {
    if (typeof navigator === 'undefined') return false;
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

// ב-Wix/Base44 native wrapper הפלאגין חי ב-window.plugins.OneSignal
// גם כאשר Capacitor.isNativePlatform() לא מחזיר true
function getNativeOneSignal() {
    return window?.plugins?.OneSignal ?? null;
}

function canUseNativeOneSignal() {
    if (isRuumrSimulatorMode()) return false;
    if (typeof window === 'undefined') return false;
    // תמיכה גם ב-Capacitor native וגם ב-Wix/Cordova WebView
    if (getNativeOneSignal()) return true;
    if (Capacitor.isNativePlatform()) {
        const platform = Capacitor.getPlatform();
        return platform === 'android' || platform === 'ios';
    }
    return false;
}

// ממתין עד ש-window.plugins.OneSignal יהיה זמין (עד 5 שניות)
function waitForNativePlugin(timeoutMs = 5000) {
    return new Promise((resolve) => {
        if (getNativeOneSignal()) {
            resolve(getNativeOneSignal());
            return;
        }

        const start = Date.now();
        const check = () => {
            const plugin = getNativeOneSignal();
            if (plugin) {
                resolve(plugin);
                return;
            }
            if (Date.now() - start > timeoutMs) {
                resolve(null);
                return;
            }
            setTimeout(check, 100);
        };

        // deviceready event (Cordova/Wix WebView)
        document.addEventListener('deviceready', () => resolve(getNativeOneSignal()), { once: true });
        check();
    });
}

async function initializeNativeOneSignal() {
    if (!canUseNativeOneSignal()) return null;

    if (nativeInitPromise) return nativeInitPromise;

    nativeInitPromise = (async () => {
        // נסה לטעון את הפלאגין — קודם window.plugins, אחר כך npm
        let OneSignal = await waitForNativePlugin();

        if (!OneSignal) {
            try {
                const mod = await import('onesignal-cordova-plugin');
                OneSignal = mod?.default ?? mod ?? null;
            } catch {
                // npm package לא זמין — מסתמכים על window.plugins בלבד
            }
        }

        if (!OneSignal) {
            console.warn('[OneSignal] Native plugin not found (window.plugins.OneSignal is null)');
            return null;
        }

        if (window.__ruumrOneSignalInitialized) return OneSignal;

        console.info('[OneSignal] Initializing native with App ID:', ONESIGNAL_APP_ID);

        try {
            OneSignal.initialize(ONESIGNAL_APP_ID);
        } catch (e) {
            // ייתכן שהפלאגין כבר אותחל
            console.warn('[OneSignal] initialize() threw:', e);
        }

        window.__ruumrOneSignalInitialized = true;

        // בקשת הרשאה — תמיד לאחר initialize, ללא בדיקת localStorage
        // כדי לוודא רישום תקין מול OneSignal
        try {
            if (OneSignal.Notifications?.requestPermission) {
                await OneSignal.Notifications.requestPermission(true);
                window.localStorage.setItem(PUSH_PERMISSION_REQUESTED_KEY, '1');
                console.info('[OneSignal] Permission requested successfully');
            }
        } catch (error) {
            console.warn('[OneSignal] Permission request failed:', error);
        }

        return OneSignal;
    })().catch((error) => {
        nativeInitPromise = null;
        console.warn('[OneSignal] Native init failed:', error);
        return null;
    });

    return nativeInitPromise;
}

async function loginNativeOneSignal(userId) {
    if (!userId) return;
    const OneSignal = await initializeNativeOneSignal();
    if (!OneSignal) return;
    try {
        await OneSignal.login(String(userId));
        console.info('[OneSignal] Native login set for userId:', userId);
    } catch (error) {
        console.warn('[OneSignal] Native login failed:', error);
    }
}

function loadOneSignalWebSdk() {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined') { resolve(null); return; }
        if (window.OneSignal) { resolve(window.OneSignal); return; }
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

export default function OneSignalSetup({ userId }) {
    useEffect(() => {
        const platform = Capacitor.getPlatform();
        const hasWindowPlugin = Boolean(window?.plugins?.OneSignal);

        console.info('[ruumr] OneSignalSetup', {
            protocol: window.location.protocol,
            platform,
            isNative: Capacitor.isNativePlatform(),
            hasWindowPlugin,
            simulatorMode: isRuumrSimulatorMode(),
            canUseWeb: canUseWebOneSignal(),
            canUseNative: canUseNativeOneSignal(),
            appId: ONESIGNAL_APP_ID,
        });

        if (canUseWebOneSignal()) {
            if (window.__ruumrOneSignalInitQueued || window.__ruumrOneSignalInitialized) return;
            window.__ruumrOneSignalInitQueued = true;
            window.OneSignalDeferred = window.OneSignalDeferred || [];
            window.OneSignalDeferred.push(async function(OneSignal) {
                if (window.__ruumrOneSignalInitialized) return;
                await OneSignal.init({
                    appId: ONESIGNAL_APP_ID,
                    notifyButton: { enable: false },
                    allowLocalhostAsSecureOrigin: true,
                });
                window.__ruumrOneSignalInitialized = true;
            });
            void loadOneSignalWebSdk().catch((e) => console.warn('[OneSignal] Web SDK load failed:', e));
            return;
        }

        // Native (Capacitor / Wix WebView / Cordova)
        void initializeNativeOneSignal();
    }, []);

    useEffect(() => {
        if (!userId) return;

        if (canUseWebOneSignal()) {
            window.OneSignalDeferred = window.OneSignalDeferred || [];
            window.OneSignalDeferred.push(async function(OneSignal) {
                try { await OneSignal.login(String(userId)); } catch (e) { console.warn('[OneSignal] Web login failed:', e); }
            });
            return;
        }

        void loginNativeOneSignal(userId);
    }, [userId]);

    return null;
}

export const OneSignalHelpers = {
    async requestPermission() {
        if (canUseNativeOneSignal()) {
            const OneSignal = await initializeNativeOneSignal();
            if (OneSignal?.Notifications?.requestPermission) {
                await OneSignal.Notifications.requestPermission(true);
                return true;
            }
        }
        if (canUseWebOneSignal() && window.OneSignal) {
            await window.OneSignal.push(() => window.OneSignal.showNativePrompt());
            return true;
        }
        return null;
    },

    async getPlayerId() {
        if (canUseNativeOneSignal()) {
            const OneSignal = await initializeNativeOneSignal();
            return OneSignal?.User?.pushSubscription?.id ?? OneSignal?.User?.onesignalId ?? null;
        }
        if (canUseWebOneSignal() && window.OneSignal) {
            return window.OneSignal?.User?.pushSubscription?.id ?? window.OneSignal?.User?.onesignalId ?? null;
        }
        return null;
    },

    async setExternalUserId(userId) {
        if (!userId) return null;
        if (canUseNativeOneSignal()) { await loginNativeOneSignal(userId); return true; }
        if (canUseWebOneSignal() && window.OneSignal) { await window.OneSignal.login(String(userId)); return true; }
        return null;
    }
};