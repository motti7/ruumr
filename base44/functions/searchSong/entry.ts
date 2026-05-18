function getRequiredSecret(name) {
    const value = (Deno.env.get(name) || '').trim();
    if (!value) {
        throw new Error(`${name} is not configured`);
    }
    return value;
}

export default async function({ base44, query }) {
    try {
        const currentUser = await base44.auth.me();
        if (!currentUser?.id) {
            return { error: 'Authentication required' };
        }

        if (!query) return { error: "Query is required" };

        const clientId = getRequiredSecret('SPOTIFY_CLIENT_ID');
        const clientSecret = getRequiredSecret('SPOTIFY_CLIENT_SECRET');

        // 1. Get Access Token (Client Credentials Flow)
        // Note: We use global fetch which is available in Node 18+ environments
        const authString = btoa(`${clientId}:${clientSecret}`);
        
        const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${authString}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({ grant_type: 'client_credentials' })
        });

        if (!tokenRes.ok) {
            const errText = await tokenRes.text();
            console.error("Spotify Token Error:", errText);
            throw new Error(`Failed to get token: ${tokenRes.status}`);
        }

        const tokenData = await tokenRes.json();
        const accessToken = tokenData.access_token;

        // 2. Search for tracks (Limit 5)
        const searchRes = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=5`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!searchRes.ok) {
            const errText = await searchRes.text();
            console.error("Spotify Search Error:", errText);
            throw new Error(`Search failed: ${searchRes.status}`);
        }

        const searchData = await searchRes.json();

        if (searchData.tracks && searchData.tracks.items.length > 0) {
            // Return array of tracks
            return {
                tracks: searchData.tracks.items.map(track => ({
                    spotify_id: track.id,
                    preview_url: track.preview_url,
                    name: track.name,
                    artist: track.artists.map(a => a.name).join(', '),
                    image_url: track.album.images[0]?.url // High res
                }))
            };
        } else {
            return { tracks: [] };
        }

    } catch (error) {
        console.error("Spotify Integration Error:", error);
        return { error: error.message || "Unknown error occurred" };
    }
}
