import React, { useState, useEffect, useRef } from "react";
import { ImageOff } from "lucide-react";

const premiumLoaderStyle = {
    backgroundImage: [
        "radial-gradient(circle at 18% 18%, rgba(255, 122, 69, 0.22), transparent 26%)",
        "radial-gradient(circle at 82% 82%, rgba(255, 255, 255, 0.72), transparent 24%)",
        "linear-gradient(180deg, rgba(15, 23, 42, 0.12) 0%, rgba(15, 23, 42, 0.03) 100%)",
    ].join(", "),
};

/**
 * SmartImage — reliable lazy-loading image component.
 * Uses IntersectionObserver to defer loading until near viewport.
 * Falls back to immediate loading for priority images.
 */
export default function SmartImage({
    src,
    alt,
    className = "",
    priority = false,
    onClick = undefined,
    showSkeleton = false,
    ...props
}) {
    const [status, setStatus] = useState('idle'); // idle | loading | loaded | error
    const containerRef = useRef(null);
    const imgRef = useRef(null);

    useEffect(() => {
        if (!src) {
            setStatus('error');
            return;
        }

        setStatus('idle');
        let cancelled = false;

        const loadImage = (url) => {
            setStatus('loading');
            const img = new window.Image();
            img.onload = () => { if (!cancelled) setStatus('loaded'); };
            img.onerror = () => { if (!cancelled) setStatus('error'); };
            img.src = url;
        };

        if (priority) {
            loadImage(src);
            return () => { cancelled = true; };
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    observer.disconnect();
                    loadImage(src);
                }
            },
            { rootMargin: '300px' }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => {
            cancelled = true;
            observer.disconnect();
        };
    }, [src, priority]);

    if (!src || status === 'error') {
        return (
            <div ref={containerRef} {...props} className={`relative overflow-hidden bg-gray-100 flex items-center justify-center ${className}`} onClick={onClick}>
                <ImageOff className="w-8 h-8 text-gray-300" />
            </div>
        );
    }

    return (
        <div ref={containerRef} {...props} className={`relative overflow-hidden bg-gray-200 ${className}`} onClick={onClick}>
            {(status === 'idle' || status === 'loading') && (
                showSkeleton ? (
                    <div className="absolute inset-0 animate-pulse bg-gray-200" />
                ) : (
                    <div
                        className="absolute inset-0 overflow-hidden"
                        style={premiumLoaderStyle}
                        aria-hidden="true"
                    >
                        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0.03)_58%,rgba(15,23,42,0.10)_100%)]" />
                        <div className="absolute -left-8 top-10 h-20 w-20 rounded-full bg-white/20 blur-3xl animate-pulse" />
                        <div className="absolute right-6 top-6 h-10 w-10 rounded-full bg-white/25 blur-xl animate-pulse" />
                        <div className="absolute bottom-4 left-4 h-16 w-16 rounded-full bg-[--theme-orange]/10 blur-2xl" />
                        <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                )
            )}
            {status === 'loaded' && (
                <img
                    ref={imgRef}
                    src={src}
                    alt={alt || "תמונה"}
                    className="w-full h-full object-cover"
                    loading={priority ? "eager" : "lazy"}
                />
            )}
        </div>
    );
}
