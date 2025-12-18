import { base44 } from "@base44/backend-sdk";

export default async function searchSong({ query }) {
  if (!query) {
    throw new Error("Query is required");
  }

  try {
    // Use LLM to find the song details
    const prompt = `Search for the song "${query}" on Spotify. 
    Return a JSON object with the following fields:
    - name: The name of the song
    - artist: The artist name
    - spotify_id: The Spotify Track ID (e.g. 4iV5W9uYEdYUVa79Axb7Rh)
    - image_url: URL to the album cover image
    - preview_url: URL to a 30s preview mp3 (optional, return null if not sure)
    
    If you can't find a specific song, return null.
    Focus on the most popular/relevant match.
    `;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          name: { type: "string" },
          artist: { type: "string" },
          spotify_id: { type: "string" },
          image_url: { type: "string" },
          preview_url: { type: ["string", "null"] }
        }
      }
    });

    return response;

  } catch (error) {
    console.error("Error searching song:", error);
    throw new Error("Failed to search song");
  }
}