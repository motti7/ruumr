import { base44 } from "@base44/backend-sdk";

export default async function searchSong({ query }: { query: string }) {
    if (!query) throw new Error("Query is required");

    // Use LLM to search the internet for the song details
    // We ask for Spotify ID specifically to use with the Embed as fallback
    // And preview_url if possible (though often hard to get via scraping without API)
    const prompt = `
    Search for the song "${query}" on Spotify.
    Find the following details:
    1. Exact Song Name
    2. Artist Name
    3. Spotify Track ID (The alphanumeric ID part of the URL, e.g. from open.spotify.com/track/ID)
    4. Album Art URL
    5. A 30-second preview MP3 URL if you can find one (from Spotify or other reliable source). If not found, return null.

    Return ONLY a JSON object with this schema:
    {
        "name": "string",
        "artist": "string",
        "spotify_id": "string",
        "image_url": "string",
        "preview_url": "string | null"
    }
    `;

    const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: true, // Crucial for "searching" without API key
        response_json_schema: {
            type: "object",
            properties: {
                name: { type: "string" },
                artist: { type: "string" },
                spotify_id: { type: "string" },
                image_url: { type: "string" },
                preview_url: { type: ["string", "null"] }
            },
            required: ["name", "artist", "spotify_id", "image_url"]
        }
    });

    return result;
}