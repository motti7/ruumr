import { fetch } from 'undici'; // Base44 functions environment usually supports fetch, but importing just in case or relying on global. 
// Assuming global fetch is available in Base44 backend environment (Node 18+).

export default async function(input) {
    const { query } = input;
    if (!query) return { error: "Query is required" };

    const clientId = 'eb6ba9e897e14d43b4c8fb4165c56b46';
    const clientSecret = '9832c946b9b34d2595f2ef1cb00becba';

    try {
        // 1. Get Access Token
        const authString = btoa(`${clientId}:${clientSecret}`);
        const tokenParams = new URLSearchParams();
        tokenParams.append('grant_type', 'client_credentials');

        const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${authString}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: tokenParams
        });

        if (!tokenRes.ok) {
            throw new Error(`Failed to get token: ${tokenRes.statusText}`);
        }

        const tokenData = await tokenRes.json();
        const accessToken = tokenData.access_token;

        // 2. Search for track
        const searchRes = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!searchRes.ok) {
            throw new Error(`Search failed: ${searchRes.statusText}`);
        }

        const searchData = await searchRes.json();

        if (searchData.tracks && searchData.tracks.items.length > 0) {
            const track = searchData.tracks.items[0];
            return {
                spotify_id: track.id,
                preview_url: track.preview_url, // Note: Spotify often returns null for preview_url nowadays
                name: track.name,
                artist: track.artists.map(a => a.name).join(', '),
                image_url: track.album.images[0]?.url
            };
        } else {
            return { error: "No tracks found" };
        }

    } catch (error) {
        return { error: error.message };
    }
}