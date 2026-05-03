/**
 * Enhanced in-memory + IndexedDB image cache service.
 * Stores image status in memory, persists loaded images in IndexedDB for retrieval across app restarts.
 */

const CACHE_DB_NAME = 'RuumrImageCache';
const CACHE_STORE_NAME = 'images';
const cache = new Map(); // url → 'loading' | 'loaded' | 'error'
const listeners = new Map(); // url → Set of callbacks
let dbPromise = null; // Lazy-initialize IndexedDB

/**
 * Initialize IndexedDB for persistent image storage
 */
function initDB() {
  if (dbPromise) return dbPromise;
  
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(CACHE_DB_NAME, 1);
    
    request.onerror = () => {
      console.warn('IndexedDB initialization failed, using memory cache only');
      resolve(null);
    };
    
    request.onupgradeneeded = (e) => {
      const db = /** @type {IDBOpenDBRequest} */ (e.target).result;
      if (!db.objectStoreNames.contains(CACHE_STORE_NAME)) {
        db.createObjectStore(CACHE_STORE_NAME, { keyPath: 'url' });
      }
    };
    
    request.onsuccess = () => resolve(request.result);
  });
  
  return dbPromise;
}

/**
 * Store image blob in IndexedDB
 */
async function storeImageBlob(url, blob) {
  try {
    const db = await initDB();
    if (!db) return;
    
    const tx = db.transaction([CACHE_STORE_NAME], 'readwrite');
    const store = tx.objectStore(CACHE_STORE_NAME);
    const timestamp = Date.now();
    
    store.put({ url, blob, timestamp });
  } catch (error) {
    console.warn('Failed to store image in IndexedDB:', error);
  }
}

/**
 * Retrieve image blob from IndexedDB
 */
async function getImageBlob(url) {
  try {
    const db = await initDB();
    if (!db) return null;
    
    return new Promise((resolve) => {
      const tx = db.transaction([CACHE_STORE_NAME], 'readonly');
      const store = tx.objectStore(CACHE_STORE_NAME);
      const request = store.get(url);
      
      request.onsuccess = () => resolve(request.result?.blob || null);
      request.onerror = () => resolve(null);
    });
  } catch (error) {
    console.warn('Failed to retrieve image from IndexedDB:', error);
    return null;
  }
}

/**
 * Clear old cached images (older than 7 days)
 */
async function cleanupOldImages() {
  try {
    const db = await initDB();
    if (!db) return;
    
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const tx = db.transaction([CACHE_STORE_NAME], 'readwrite');
    const store = tx.objectStore(CACHE_STORE_NAME);
    const allRecords = await new Promise((resolve) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
    });
    
    allRecords.forEach((record) => {
      if (record.timestamp < sevenDaysAgo) {
        store.delete(record.url);
      }
    });
  } catch (error) {
    console.warn('Failed to cleanup old images:', error);
  }
}

/**
 * Preload an image and add it to the cache.
 * @param {string} url
 * @param {'high'|'low'|'auto'} priority
 * @returns {Promise<void>}
 */
export function preloadImage(url, priority = 'auto') {
  if (!url || cache.get(url) === 'loaded') return Promise.resolve();
  if (cache.get(url) === 'loading') {
    return new Promise((resolve) => {
      const cbs = listeners.get(url) || new Set();
      cbs.add(resolve);
      listeners.set(url, cbs);
    });
  }

  cache.set(url, 'loading');

  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.fetchPriority = priority;
    img.onload = async () => {
      cache.set(url, 'loaded');
      
      // Attempt to store in IndexedDB for future app restarts
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) storeImageBlob(url, blob);
        });
      } catch (error) {
        console.warn('Could not cache image blob:', error);
      }
      
      resolve();
      listeners.get(url)?.forEach(cb => cb());
      listeners.delete(url);
    };
    img.onerror = () => {
      cache.set(url, 'error');
      resolve();
      listeners.get(url)?.forEach(cb => cb());
      listeners.delete(url);
    };
    img.src = url;
  });
}

/**
 * Get cached status for a URL (memory check first)
 * @param {string} url
 * @returns {'loaded'|'loading'|'error'|null}
 */
export function getCacheStatus(url) {
  return cache.get(url) ?? null;
}

/**
 * Preload an array of image URLs in the background (fire-and-forget)
 * @param {string[]} urls
 * @param {'high'|'low'|'auto'} priority
 */
export function preloadImages(urls, priority = 'low') {
  urls.filter(Boolean).forEach(url => preloadImage(url, priority));
}

/**
 * Attempt to restore image from IndexedDB cache on app start
 * @param {string} url
 * @returns {Promise<boolean>} true if image was restored
 */
export async function restoreFromIndexedDB(url) {
  if (!url || cache.get(url)) return false;
  
  try {
    const blob = await getImageBlob(url);
    if (!blob) return false;
    
    const blobUrl = URL.createObjectURL(blob);
    const img = new window.Image();
    
    return new Promise((resolve) => {
      img.onload = () => {
        cache.set(url, 'loaded');
        URL.revokeObjectURL(blobUrl);
        resolve(true);
      };
      img.onerror = () => {
        URL.revokeObjectURL(blobUrl);
        resolve(false);
      };
      img.src = blobUrl;
    });
  } catch (error) {
    console.warn('Failed to restore image from IndexedDB:', error);
    return false;
  }
}

/**
 * Bulk restore images from IndexedDB (call on app startup)
 * @param {string[]} urls
 */
export async function restoreMultipleFromIndexedDB(urls) {
  const validUrls = urls.filter(Boolean);
  await Promise.all(validUrls.map(url => restoreFromIndexedDB(url)));
}

/**
 * Clear all IndexedDB cached images
 */
export async function clearIndexedDBCache() {
  try {
    const db = await initDB();
    if (!db) return;
    
    const tx = db.transaction([CACHE_STORE_NAME], 'readwrite');
    const store = tx.objectStore(CACHE_STORE_NAME);
    store.clear();
  } catch (error) {
    console.warn('Failed to clear IndexedDB cache:', error);
  }
}

// Cleanup old images on initialization
initDB().then(() => {
  // Stagger cleanup to avoid startup slowdown
  setTimeout(cleanupOldImages, 5000);
});
