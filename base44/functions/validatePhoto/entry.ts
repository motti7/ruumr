import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// AI photo moderation for the roommate-finding app.
// Checks whether an uploaded image actually contains what it should:
//   - photo_type "person"    → must contain a real human being
//   - photo_type "apartment" → must show an interior living space
// Uses the platform's built-in InvokeLLM integration with vision (file_urls).
// Fails OPEN: if the AI call errors out, returns approved=true so a service
// hiccup never blocks all uploads — the frontend allows the photo in that case.

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { file_url, photo_type } = body || {};
    if (!file_url) return Response.json({ error: 'Missing file_url' }, { status: 400 });

    const type = photo_type === 'apartment' ? 'apartment' : 'person';

    const prompt = type === 'person'
      ? 'You are a photo moderator for a roommate-finding app. Look at this image and decide whether it is a valid PROFILE photo of a real person. A valid profile photo MUST contain at least one real human being whose face or body is clearly visible. REJECT (approved=false) if the image shows: no person at all, only a landscape or scenery, only an object or food, a screenshot of text or an app, a meme, a cartoon or illustration (not a real photo), or anything that is not a real photograph of a person. APPROVE (approved=true) only if a real living person is clearly visible. The "reason" field MUST be a short explanation written in HEBREW.'
      : 'You are a photo moderator for a roommate-finding app. Look at this image and decide whether it is a valid photo of an APARTMENT or room interior. A valid apartment photo MUST show the interior of a living space (walls, furniture, kitchen, bedroom, living room, bathroom, balcony, or similar). REJECT (approved=false) if the image shows: only a person with no visible room, an outdoor landscape with no interior, a screenshot or text, a meme, a cartoon or illustration, or anything that is not a real photo of a room interior. APPROVE (approved=true) only if an interior living space is clearly visible. The "reason" field MUST be a short explanation written in HEBREW.';

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            approved: { type: "boolean" },
            reason: { type: "string" }
          },
          required: ["approved", "reason"]
        }
      });

      return Response.json({
        approved: !!result?.approved,
        reason: (result?.reason || "").toString(),
        photo_type: type
      });
    } catch (aiError) {
      console.error('validatePhoto AI error:', aiError?.message || aiError);
      // Fail open: allow the upload when the AI service is unavailable.
      return Response.json({
        approved: true,
        reason: "",
        validation_error: true
      });
    }
  } catch (error) {
    console.error('validatePhoto error:', error?.message || error);
    return Response.json({ error: error?.message || 'Validation failed' }, { status: 500 });
  }
}