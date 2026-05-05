import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin check
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { userId } = await req.json();

    if (!userId) {
      return Response.json({ error: 'userId is required' }, { status: 400 });
    }

    // Get profile
    const profiles = await base44.asServiceRole.entities.Profile.filter({ user_id: userId });

    if (profiles.length === 0) {
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }

    const profile = profiles[0];
    const brokenPhotos = [];
    const brokenApartmentPhotos = [];

    // Check profile photos
    if (profile.photos && Array.isArray(profile.photos)) {
      profile.photos.forEach((photo, index) => {
        if (photo && typeof photo === 'string' && (photo.toLowerCase().endsWith('.heic') || photo.toLowerCase().endsWith('.heif'))) {
          brokenPhotos.push({ index, url: photo });
        }
      });
    }

    // Check apartment photos
    if (profile.apartment_photos && Array.isArray(profile.apartment_photos)) {
      profile.apartment_photos.forEach((photo, index) => {
        if (photo && typeof photo === 'string' && (photo.toLowerCase().endsWith('.heic') || photo.toLowerCase().endsWith('.heif'))) {
          brokenApartmentPhotos.push({ index, url: photo });
        }
      });
    }

    return Response.json({
      success: true,
      userId,
      profileName: profile.name,
      brokenPhotosCount: brokenPhotos.length,
      brokenApartmentPhotosCount: brokenApartmentPhotos.length,
      brokenPhotos,
      brokenApartmentPhotos,
      message: `Found ${brokenPhotos.length} broken profile photos and ${brokenApartmentPhotos.length} broken apartment photos`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});