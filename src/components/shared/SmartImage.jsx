import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
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
    onClick = undefined,
    showSkeleton = false,
    ...props
}) {
    const { t } = useTranslation();
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
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                        <div className="h-8 w-8 rounded-full border-4 border-gray-200 border-t-[--theme-orange] animate-spin" />
                    </div>
                )
            )}
            {status === 'loaded' && (
                <img
                    ref={imgRef}
                    src={src}
                    alt={alt || t("image_alt")}
                    className="w-full h-full object-cover"
                    loading={priority ? "eager" : "lazy"}
                />
            )}
        </div>
    );
}
