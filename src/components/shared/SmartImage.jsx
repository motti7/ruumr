import React, { useState } from "react";
import { Loader2, ImageOff } from "lucide-react";

export default function SmartImage({ 
    src, 
    alt, 
    className = "", 
    priority = false, 
    onClick,
    ...props 
}) {
    const [status, setStatus] = useState('loading'); // loading, loaded, error

    // If no src provided, show placeholder/error immediately
    if (!src) {
        return (
            <div className={`relative overflow-hidden bg-gray-100 flex items-center justify-center ${className}`}>
                <ImageOff className="w-8 h-8 text-gray-300" />
            </div>
        );
    }

    return (
        <div 
            className={`relative overflow-hidden bg-gray-100 ${className}`} 
            onClick={onClick}
        >
            {/* Loading Skeleton */}
            {status === 'loading' && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-200 animate-pulse z-0">
                    <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                </div>
            )}

            {/* Error State */}
            {status === 'error' && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-0">
                    <ImageOff className="w-8 h-8 text-gray-300" />
                </div>
            )}

            {/* The Image */}
            <img 
                src={src}
                alt={alt || "תמונה"}
                className={`w-full h-full object-cover transition-opacity duration-500 ease-in-out ${status === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setStatus('loaded')}
                onError={() => setStatus('error')}
                loading={priority ? "eager" : "lazy"}
                decoding={priority ? "sync" : "async"}
                fetchPriority={priority ? "high" : "auto"}
                {...props}
            />
        </div>
    );
}