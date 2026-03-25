import React, { useState, useEffect } from "react";
import { Loader2, ImageOff } from "lucide-react";
import { getCacheStatus, preloadImage } from "@/lib/imageCache";

/**
 * SmartImage — image renderer backed by the central imageCache service.
 * If the URL is already in the cache it renders instantly (no flash).
 * Otherwise it triggers a load, shows a skeleton, then fades in.
 */
export default function SmartImage({
    src,
    alt,
    className = "",
    priority = false,
    onClick,
    ...props
}) {
    const initialStatus = src ? (getCacheStatus(src) ?? 'loading') : 'error';
    const [status, setStatus] = useState(initialStatus);

    useEffect(() => {
        if (!src) { setStatus('error'); return; }

        const cached = getCacheStatus(src);
        if (cached === 'loaded') { setStatus('loaded'); return; }
        if (cached === 'error')  { setStatus('error');  return; }

        setStatus('loading');
        preloadImage(src, priority ? 'high' : 'auto').then(() => {
            const result = getCacheStatus(src);
            setStatus(result === 'loaded' ? 'loaded' : 'error');
        });
    }, [src, priority]);

    if (!src || status === 'error') {
        return (
            <div className={`relative overflow-hidden bg-gray-100 flex items-center justify-center ${className}`}>
                <ImageOff className="w-8 h-8 text-gray-300" />
            </div>
        );
    }

    return (
        <div className={`relative overflow-hidden bg-gray-100 ${className}`} onClick={onClick}>
            {status === 'loading' && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-200 animate-pulse z-0">
                    <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                </div>
            )}
            <img
                src={src}
                alt={alt || "תמונה"}
                className={`w-full h-full object-cover transition-opacity duration-500 ease-in-out ${status === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
                loading={priority ? "eager" : "lazy"}
                decoding={priority ? "sync" : "async"}
                fetchPriority={priority ? "high" : "auto"}
                {...props}
            />
        </div>
    );
}