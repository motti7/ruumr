import React, { useState, useEffect, useRef } from 'react';
import { Search, Music, Play, Pause, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import SmartImage from '@/components/shared/SmartImage';
import { toast } from 'sonner';

export default function SongSelector({ selectedSong, onSelect }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [playingPreview, setPlayingPreview] = useState(null);
    const audioRef = useRef(null);

    const handleSearch = async () => {
        if (!query.trim()) return;
        setIsLoading(true);
        setPlayingPreview(null);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }

        try {
            // Using InvokeLLM to simulate Spotify Search since we don't have direct backend access to Spotify API in this environment yet.
            // In a full production env, this would call a backend function that uses the Spotify Web API.
            const response = await base44.integrations.Core.InvokeLLM({
                prompt: `Search for songs matching "${query}" on Spotify/Apple Music. 
                Return a JSON object with a "tracks" array containing exactly 10 best matching songs.
                
                Each track object MUST have:
                - id (unique string)
                - name (song title)
                - artist (artist name)
                - image (URL to the album artwork - MUST BE A VALID IMAGE URL from a reliable source like spotify cdn or similar)
                - preview_url (URL to a 30s mp3 preview if available, otherwise null)

                CRITICAL: ensure image URLs are real and working.`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        tracks: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    id: { type: "string" },
                                    name: { type: "string" },
                                    artist: { type: "string" },
                                    image: { type: "string" },
                                    preview_url: { type: "string" }
                                }
                            }
                        }
                    }
                },
                add_context_from_internet: true
            });

            if (response && response.tracks) {
                setResults(response.tracks);
            } else {
                setResults([]);
                toast.error("לא נמצאו תוצאות");
            }
        } catch (error) {
            console.error("Search failed:", error);
            toast.error("חיפוש נכשל");
        } finally {
            setIsLoading(false);
        }
    };

    const togglePreview = (url, e) => {
        e.stopPropagation();
        if (!url) {
            toast.error("אין דוגמית לשיר זה");
            return;
        }

        if (playingPreview === url) {
            audioRef.current.pause();
            setPlayingPreview(null);
        } else {
            if (audioRef.current) {
                audioRef.current.pause();
            }
            const audio = new Audio(url);
            audio.volume = 0.5;
            audio.play().catch(e => console.error("Play failed", e));
            audio.onended = () => setPlayingPreview(null);
            audioRef.current = audio;
            setPlayingPreview(url);
        }
    };

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
            }
        };
    }, []);

    return (
        <div className="w-full space-y-4 text-right">
            <div className="relative">
                <Input 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="חפש שיר או אמן..."
                    className="pl-20 h-12 text-lg bg-gray-50 border-gray-200 focus:ring-[--theme-orange]"
                />
                <Button 
                    onClick={handleSearch}
                    className="absolute left-1 top-1 bottom-1 rounded-lg bg-[--theme-orange] hover:bg-orange-600 text-white px-6 h-auto shadow-sm"
                    disabled={isLoading}
                >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "חפש"}
                </Button>
            </div>

            <div className="space-y-2 mt-4">
                {results.map((track) => (
                    <div 
                        key={track.id}
                        onClick={() => onSelect(track)}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer hover:bg-orange-50 ${selectedSong?.id === track.id ? 'border-[--theme-orange] bg-orange-50 ring-1 ring-[--theme-orange]' : 'border-gray-100 bg-white'}`}
                    >
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200 group">
                            <SmartImage src={track.image} alt={track.name} className="w-full h-full object-cover" />
                            {track.preview_url && (
                                <button 
                                    onClick={(e) => togglePreview(track.preview_url, e)}
                                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    {playingPreview === track.preview_url ? 
                                        <Pause className="w-5 h-5 text-white fill-current" /> : 
                                        <Play className="w-5 h-5 text-white fill-current" />
                                    }
                                </button>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 truncate">{track.name}</h4>
                            <p className="text-sm text-gray-500 truncate">{track.artist}</p>
                        </div>
                        {selectedSong?.id === track.id && (
                            <div className="w-6 h-6 bg-[--theme-orange] rounded-full flex items-center justify-center">
                                <Music className="w-3 h-3 text-white" />
                            </div>
                        )}
                    </div>
                ))}
            </div>
            
            {results.length === 0 && !isLoading && query && (
                <div className="text-center text-gray-400 py-8">
                    <Music className="w-12 h-12 mx-auto mb-2 opacity-20" />
                    <p>לא נמצאו שירים</p>
                </div>
            )}
        </div>
    );
}