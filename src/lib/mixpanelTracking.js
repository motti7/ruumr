import mixpanel from 'mixpanel-browser';

const MIXPANEL_TOKEN = (import.meta.env.VITE_MIXPANEL_TOKEN || '').trim();

const EXCLUDED_EMAILS = [
  'mottishif7@gmail.com',
  'orlin1133@gmail.com',
  'sbhtktchr582@gmail.com',
  'oroscar8642@gmail.com',
  'eitansolow@gmail.com',
];

let _currentUserEmail = null;

export const setMixpanelUserEmail = (email) => {
  _currentUserEmail = email ? email.toLowerCase().trim() : null;
};

export const isExcludedUser = () =>
  _currentUserEmail !== null && EXCLUDED_EMAILS.includes(_currentUserEmail);

export const isMixpanelHostAllowed = (hostname = '') => {
  const normalizedHostname = hostname.toLowerCase();

  return (
    !normalizedHostname.includes('localhost') &&
    !normalizedHostname.includes('preview-sandbox') &&
    !normalizedHostname.includes('base44')
  );
};

export const shouldUseMixpanel = () => (
  typeof window !== 'undefined' &&
  Boolean(MIXPANEL_TOKEN) &&
  isMixpanelHostAllowed(window.location.hostname)
);

export const initMixpanel = () => {
  if (!shouldUseMixpanel()) {
    return false;
  }

  try {
    mixpanel.init(MIXPANEL_TOKEN, {
      debug: true,
      autocapture: true,
      record_sessions_percent: 100,
      api_host: 'https://api-eu.mixpanel.com',
    });
    return true;
  } catch (error) {
    console.warn('Mixpanel initialization failed:', error);
    return false;
  }
};

export const trackMixpanel = (eventName, properties) => {
  if (!shouldUseMixpanel() || isExcludedUser()) {
    return false;
  }

  try {
    mixpanel.track(eventName, properties);
    return true;
  } catch (error) {
    console.warn(`Mixpanel track failed for "${eventName}":`, error);
    return false;
  }
};

export const identifyMixpanelUser = (userId, properties) => {
  if (!userId || !shouldUseMixpanel()) {
    return false;
  }

  if (properties?.email) {
    setMixpanelUserEmail(properties.email);
  }

  if (isExcludedUser()) {
    return false;
  }

  try {
    mixpanel.identify(String(userId));
    mixpanel.people.set(properties);
    return true;
  } catch (error) {
    console.warn('Mixpanel identify failed:', error);
    return false;
  }
};