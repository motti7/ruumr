/**
 * useImageCacheRestore — Hook to restore cached images from IndexedDB on app startup.
 * Improves loading performance on low-end devices by reusing cached image blobs.
 */

import { useEffect } from 'react';
import { restoreMultipleFromIndexedDB } from '@/lib/imageCache';

export default function useImageCacheRestore(imageUrls = []) {
  useEffect(() => {
    if (!imageUrls || imageUrls.length === 0) return;

    // Filter out invalid URLs
    const validUrls = imageUrls.filter(
      (url) => url && typeof url === 'string' && (url.startsWith('http') || url.startsWith('blob:'))
    );

    if (validUrls.length === 0) return;

    // Batch restore from IndexedDB (fire-and-forget)
    restoreMultipleFromIndexedDB(validUrls).catch((error) => {
      console.warn('Error restoring images from IndexedDB:', error);
    });
  }, [imageUrls]);
}