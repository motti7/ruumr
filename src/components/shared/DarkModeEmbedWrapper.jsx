/**
 * DarkModeEmbedWrapper — Handles third-party embeds (Spotify, Apple Music, etc.)
 * with forced dark-mode styles and fallback UI for dark-mode users.
 */

import React, { useState, useEffect } from 'react';
import { AlertCircle, Music } from 'lucide-react';

export default function DarkModeEmbedWrapper({
  type = 'spotify', // 'spotify', 'apple_music', 'youtube', etc.
  embedUrl,
  fallbackTitle,
  fallbackArtist,
  fallbackImage,
  embedHTML, // For iframe embeds
  className = '',
}) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showFallback, setShowFallback] = useState(!embedUrl && !embedHTML);

  useEffect(() => {
    // Detect dark mode
    const isDark = document.documentElement.classList.contains('dark') ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(isDark);

    // Listen for dark mode toggle
    const observer = new MutationObserver(() => {
      const nowDark = document.documentElement.classList.contains('dark');
      if (nowDark !== isDarkMode) setIsDarkMode(nowDark);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, [isDarkMode]);

  // Spotify embed with dark-mode handling
  if (type === 'spotify' && embedUrl) {
    return (
      <div className={`relative rounded-lg overflow-hidden ${className}`}>
        {isDarkMode && (
          <div className="absolute inset-0 bg-black/40 z-0 pointer-events-none" />
        )}
        <iframe
          style={{
            borderRadius: '12px',
            position: isDarkMode ? 'relative' : 'static',
            zIndex: isDarkMode ? 10 : 'auto',
            filter: isDarkMode ? 'brightness(0.85) contrast(1.1)' : 'none',
          }}
          src={embedUrl}
          width="100%"
          height="80"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          onError={() => setShowFallback(true)}
        />
      </div>
    );
  }

  // Fallback UI (dark-mode friendly)
  if (showFallback && (fallbackTitle || fallbackImage)) {
    return (
      <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-gray-50 border border-gray-200'} ${className}`}>
        <div className="flex items-center gap-3">
          {fallbackImage ? (
            <img
              src={fallbackImage}
              alt={fallbackTitle}
              className="w-16 h-16 rounded-lg object-cover shadow-sm"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
              <Music className={`w-8 h-8 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {fallbackTitle || 'שיר'}
            </p>
            <p className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {fallbackArtist || 'אומן'}
            </p>
          </div>
        </div>
        {!embedUrl && (
          <p className={`text-xs mt-3 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            לא ניתן לטעון את ההטמעה בעכו"ם זה
          </p>
        )}
      </div>
    );
  }

  // Error state
  return (
    <div className={`rounded-lg p-4 flex items-center gap-3 ${isDarkMode ? 'bg-red-950/30 border border-red-900/50' : 'bg-red-50 border border-red-200'} ${className}`}>
      <AlertCircle className={`w-5 h-5 flex-shrink-0 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
      <p className={`text-sm ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>
        לא ניתן לטעון את ההטמעה
      </p>
    </div>
  );
}