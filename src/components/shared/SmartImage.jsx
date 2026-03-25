import React, { useState, useEffect, useRef } from "react";
import { Loader2, ImageOff } from "lucide-react";
import { getCacheStatus, preloadImage } from "@/lib/imageCache";

/**
 * SmartImage — image renderer with Intersection Observer lazy loading.
 * Only loads images when within 200px of viewport (significant low-memory savings).
 * Backed by central imageCache service for instant rendering.
 */
export default function SmartImage({
    src,
    alt,
    className = "",
    priority = false,
    onClick,
    showSkeleton = false,
    ...props
}) {
    const initialStatus = src ? (getCacheStatus(src) ?? 'loading') : 'error';
    const [status, setStatus] = useState(initialStatus);
    const [isInViewport, setIsInViewport] = useState(priority); // Priority images always load
    const containerRef = useRef(null);

    // Intersection Observer: trigger load only when 200px near viewport
    useEffect(() => {
        if (priority || !containerRef.current) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInViewport(true);
                    observer.unobserve(entry.target);
                }
            },
            { rootMargin: '200px' }
        );

        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [priority]);

    // Load image only if in viewport or priority
    useEffect(() => {
        if (!src || !isInViewport) return;

        const cached = getCacheStatus(src);
        if (cached === 'loaded') { setStatus('loaded'); return; }
        if (cached === 'error')  { setStatus('error');  return; }

        setStatus('loading');
        preloadImage(src, priority ? 'high' : 'auto').then(() => {
            const result = getCacheStatus(src);
            setStatus(result === 'loaded' ? 'loaded' : 'error');
        });
    }, [src, isInViewport, priority]);

    if (!src || status === 'error') {
        return (
            <div ref={containerRef} className={`relative overflow-hidden bg-gray-100 flex items-center justify-center ${className}`}>
                <ImageOff className="w-8 h-8 text-gray-300" />
            </div>
        );
    }

    return (
        <div ref={containerRef} className={`relative overflow-hidden bg-gray-100 ${className}`} onClick={onClick}>
            {status === 'loading' && (
                showSkeleton ? (
                    <div className="absolute inset-0 z-0">
                        {/* Skeleton component should be imported by parent if used */}
                        <div className="w-full h-full animate-pulse bg-gray-200" />
                    </div>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-200 animate-pulse z-0">
                        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                    </div>
                )
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