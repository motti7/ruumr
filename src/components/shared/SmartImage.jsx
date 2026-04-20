import React, { useState, useEffect, useRef } from "react";
import { ImageOff } from "lucide-react";

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
    onClick,
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

        if (priority) {
            // Load immediately
            loadImage(src);
            return;
        }

        // Lazy load via IntersectionObserver
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

        return () => observer.disconnect();
    }, [src, priority]);

    const loadImage = (url) => {
        setStatus('loading');
        const img = new window.Image();
        img.onload = () => setStatus('loaded');
        img.onerror = () => setStatus('error');
        img.src = url;
    };

    if (!src || status === 'error') {
        return (
            <div ref={containerRef} className={`relative overflow-hidden bg-gray-100 flex items-center justify-center ${className}`} onClick={onClick}>
                <ImageOff className="w-8 h-8 text-gray-300" />
            </div>
        );
    }

    return (
        <div ref={containerRef} className={`relative overflow-hidden bg-gray-200 ${className}`} onClick={onClick}>
            {(status === 'idle' || status === 'loading') && (
                <div className="absolute inset-0 animate-pulse bg-gray-200" />
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