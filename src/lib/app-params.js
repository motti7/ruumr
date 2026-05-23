import { getSafeAuthReturnUrl } from '@/lib/auth-return-url';
import {
	captureAuthCallbackHints,
	clearAuthCallbackHints,
	getStoredAuthCallbackHints,
	persistAuthCallbackHints,
} from '@/lib/authCallbackHints';

const isNode = typeof window === 'undefined';
const storage = isNode ? null : window.localStorage;

// These are public Base44 routing identifiers, not credentials. Keep fallbacks
// so previews that do not inject VITE_* env vars still resolve Ruumr.
const DEFAULT_BASE44_APP_ID = import.meta.env.VITE_BASE44_APP_ID || '68c919adff6ac6fafb51bed6';
const DEFAULT_BASE44_SERVER_URL = import.meta.env.VITE_BASE44_BACKEND_URL || 'https://api.base44.app';
const DEFAULT_BASE44_APP_BASE_URL = import.meta.env.VITE_BASE44_APP_BASE_URL || 'https://app.ruumrapp.com';

const toSnakeCase = (str) => {
	return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

const getAppParamValue = (paramName, { defaultValue = undefined, removeFromUrl = false } = {}) => {
	if (isNode) {
		return defaultValue;
	}
	const storageKey = `base44_${toSnakeCase(paramName)}`;
	const urlParams = new URLSearchParams(window.location.search);
	const searchParam = urlParams.get(paramName);
	if (removeFromUrl) {
		urlParams.delete(paramName);
		const newUrl = `${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ""
			}${window.location.hash}`;
		window.history.replaceState({}, document.title, newUrl);
	}
	if (searchParam) {
		// שומרים רק access_token ב-localStorage, לא app_id/server_url
		// כי הם מגיעים מ-URL של פריוויו ויגרמו לבעיות בפתיחה הבאה
		if (paramName !== 'app_id' && paramName !== 'server_url' && paramName !== 'app_base_url') {
			storage?.setItem(storageKey, searchParam);
		}
		return searchParam;
	}
	// app_id, server_url ו-app_base_url תמיד מה-env בלבד — לא מה-localStorage
	if (paramName === 'app_id' || paramName === 'server_url' || paramName === 'app_base_url') {
		// מנקים ערכים ישנים שאולי נשמרו בעבר
		storage?.removeItem(storageKey);
		return defaultValue || null;
	}
	if (defaultValue) {
		storage?.setItem(storageKey, defaultValue);
		return defaultValue;
	}
	const storedValue = storage?.getItem(storageKey);
	if (storedValue) {
		return storedValue;
	}
	return null;
}

const getAppParams = () => {
	const urlParams = isNode ? null : new URLSearchParams(window.location.search);
	const incomingAccessToken = urlParams?.get('access_token') || null;
	const shouldClearAuthHints = getAppParamValue("clear_access_token") === 'true';

	if (shouldClearAuthHints) {
		storage?.removeItem('base44_access_token');
		storage?.removeItem('token');
		clearAuthCallbackHints();
	}

	let authHints = null;
	if (!isNode) {
		authHints = shouldClearAuthHints
			? null
			: (incomingAccessToken ? captureAuthCallbackHints(urlParams) : getStoredAuthCallbackHints());
		if (incomingAccessToken && authHints) {
			Object.keys(authHints).forEach((key) => urlParams.delete(key));
			const cleanedUrl = `${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ""}${window.location.hash}`;
			window.history.replaceState({}, document.title, cleanedUrl);
		}
		persistAuthCallbackHints(authHints);
	}

	// ניקוי ערכים ישנים של server_url/app_id שנשמרו מסשן פריוויו
	try {
		storage?.removeItem('base44_server_url');
		storage?.removeItem('base44_app_id');
		storage?.removeItem('base44_app_base_url');
	} catch (_) {}

	return {
		appId: DEFAULT_BASE44_APP_ID,
		serverUrl: DEFAULT_BASE44_SERVER_URL,
		appBaseUrl: DEFAULT_BASE44_APP_BASE_URL,
		token: getAppParamValue("access_token", { removeFromUrl: true }),
		fromUrl: getAppParamValue("from_url", { defaultValue: getSafeAuthReturnUrl() }),
		functionsVersion: getAppParamValue("functions_version"),
		authHints,
	}
}


export const appParams = {
	...getAppParams()
}
