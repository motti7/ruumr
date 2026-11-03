// Language used for everything we send to a user (emails and push
// notifications). Israel works in Hebrew; every other marketplace works in
// English. An explicit language choice made in the app (Profile.language, saved
// by the header language toggle) always wins over the regional default.

export type RecipientLanguage = 'he' | 'en';

export function resolveRecipientLanguage(profile: any): RecipientLanguage {
  const explicit = String(profile?.language || '').toLowerCase();
  if (explicit === 'he' || explicit === 'en') return explicit;
  const region = String(profile?.region || 'IL').toUpperCase();
  return region === 'IL' ? 'he' : 'en';
}

// Text direction for the email shell.
export function languageDirection(lang: RecipientLanguage): 'rtl' | 'ltr' {
  return lang === 'he' ? 'rtl' : 'ltr';
}