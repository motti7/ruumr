import { base44 } from '@/api/base44Client';

// Persists the language chosen from the header toggle onto the user's profile so
// emails and push notifications are sent in the language the app is used in.
// Best-effort: a guest or a failed call never blocks switching language.
export async function persistLanguagePreference(lng) {
  if (lng !== 'he' && lng !== 'en') return;

  try {
    const user = await base44.auth.me();
    if (!user?.id) return;

    const profiles = await base44.entities.Profile.filter({ user_id: user.id });
    const profile = Array.isArray(profiles) ? profiles[0] : profiles?.items?.[0];
    if (!profile?.id || profile.language === lng) return;

    await base44.entities.Profile.update(profile.id, { language: lng });
  } catch {
    // Language still applies in the app; only the stored preference is missed.
  }
}