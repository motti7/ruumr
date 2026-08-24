import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Public, unauthenticated endpoint: returns a curated, safe subset of a
// profile so it can be shared outside the app. Never exposes phone_number,
// the raw user_id, invite_email, or internal/system fields.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { userId } = body || {};

    if (!userId) {
      return Response.json({ error: 'Missing userId' }, { status: 400 });
    }

    const profiles = await base44.asServiceRole.entities.Profile.filter({ user_id: userId });
    if (!profiles || profiles.length === 0) {
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }

    const profile = profiles[0];

    // Hidden or placeholder identities are never shareable publicly.
    if (profile.is_visible === false || profile.is_virtual === true) {
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }

    const publicProfile = {
      name: profile.name,
      age: typeof profile.age === 'number' ? profile.age : null,
      gender: profile.gender || null,
      photos: Array.isArray(profile.photos) ? profile.photos.filter(Boolean) : [],
      video_url: profile.video_url || null,
      about_me: profile.about_me || '',
      looking_for_description: profile.looking_for_description || '',
      interests: Array.isArray(profile.interests) ? profile.interests : [],
      vibe_level: typeof profile.vibe_level === 'number' ? profile.vibe_level : null,
      religion: profile.religion || null,
      kosher_preference: profile.kosher_preference || null,
      shabbat_preference: profile.shabbat_preference || null,
      pet_type: profile.pet_type || 'none',
      pet_other_description: profile.pet_other_description || '',
      current_status: profile.current_status || 'seeking_apartment',
      team_target: typeof profile.team_target === 'number' ? profile.team_target : null,
      search_cities: Array.isArray(profile.search_cities) ? profile.search_cities : [],
      budget_max: typeof profile.budget_max === 'number' ? profile.budget_max : null,
      budget_min: typeof profile.budget_min === 'number' ? profile.budget_min : 0,
      apartment_photos: Array.isArray(profile.apartment_photos) ? profile.apartment_photos.filter(Boolean) : [],
      is_verified: profile.is_verified === true,
    };

    return Response.json(publicProfile);
  } catch (error) {
    console.error('Error in getPublicProfile:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}