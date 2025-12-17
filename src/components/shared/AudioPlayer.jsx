import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AudioPlayer({ track, autoPlay = true }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(null);

    useEffect(() => {
        if (!track?.preview_url) return;
        
        const audio = new Audio(track.preview_url);
        audio.volume = 0; // Start silent for fade in
        audioRef.current = audio;

        // Auto play with fade in
        if (autoPlay) {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    setIsPlaying(true);
                    // Fade in
                    let vol = 0;
                    const interval = setInterval(() => {
                        if (vol < 0.5) {
                            vol += 0.05;
                            audio.volume = vol;
                        } else {
                            clearInterval(interval);
                        }
                    }, 200);
                }).catch(error => {
                    console.log("Autoplay prevented:", error);
                    setIsPlaying(false);
                });
            }
        }

        audio.onended = () => setIsPlaying(false);

        return () => {
            audio.pause();
            audioRef.current = null;
        };
    }, [track, autoPlay]);

    const togglePlay = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.volume = 0.5;
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    if (!track) return null;

    return (
        <div className="bg-white/90 backdrop-blur-sm rounded-full shadow-lg pl-2 pr-4 py-2 flex items-center gap-3 border border-gray-100 max-w-[200px]">
            <button 
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-gradient-to-r from-[--theme-orange] to-orange-600 flex items-center justify-center text-white shadow-md hover:scale-105 transition-transform flex-shrink-0"
            >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>
            <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
                <span className="text-xs font-bold text-gray-800 truncate">{track.name}</span>
                <span className="text-[10px] text-gray-500 truncate">{track.artist}</span>
            </div>
            {isPlaying && (
                <div className="flex gap-0.5 items-end h-3 mb-1">
                    {[1, 2, 3].map((bar) => (
                        <motion.div
                            key={bar}
                            className="w-0.5 bg-[--theme-orange] rounded-full"
                            animate={{ height: [4, 12, 4] }}
                            transition={{ 
                                duration: 0.8, 
                                repeat: Infinity, 
                                ease: "easeInOut",
                                delay: bar * 0.1 
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}