import { base44 } from "@base44/backend-sdk";

export default async function searchSong({ query }) {
  if (!query) throw new Error("Query is required");

  // Use LLM with internet access to find the song
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `Find the specific Spotify track for: "${query}". 
    Return a JSON object with:
    - spotify_id (the track ID, e.g. "4cOdK2wGLETKBW3PvgPWqT")
    - name (Song Name)
    - artist (Artist Name)
    - image_url (Album Art URL)
    - preview_url (A direct MP3 preview URL if available, usually from Spotify API or similar metadata. If not found, return null).
    
    Search the web to verify the ID and preview URL. Ensure the ID is a valid Spotify Track ID.`,
    add_context_from_internet: true,
    response_json_schema: {
      type: "object",
      properties: {
        spotify_id: { type: "string" },
        name: { type: "string" },
        artist: { type: "string" },
        image_url: { type: "string" },
        preview_url: { type: ["string", "null"] }
      },
      required: ["spotify_id", "name", "artist"]
    }
  });

  return result;
}