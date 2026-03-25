/**
 * Central in-memory image cache service.
 * Stores fully-loaded HTMLImageElement objects keyed by URL so they are
 * never fetched or decoded twice within the same session.
 */

const cache = new Map(); // url → 'loading' | 'loaded' | 'error'
const listeners = new Map(); // url → Set of callbacks

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
    img.fetchPriority = priority;
    img.onload = () => {
      cache.set(url, 'loaded');
      resolve();
      listeners.get(url)?.forEach(cb => cb());
      listeners.delete(url);
    };
    img.onerror = () => {
      cache.set(url, 'error');
      resolve(); // still resolve so callers don't hang
      listeners.get(url)?.forEach(cb => cb());
      listeners.delete(url);
    };
    img.src = url;
  });
}

/**
 * Returns the cached status for a URL.
 * @param {string} url
 * @returns {'loaded'|'loading'|'error'|null}
 */
export function getCacheStatus(url) {
  return cache.get(url) ?? null;
}

/**
 * Preload an array of image URLs in the background (fire-and-forget).
 * @param {string[]} urls
 * @param {'high'|'low'|'auto'} priority
 */
export function preloadImages(urls, priority = 'low') {
  urls.filter(Boolean).forEach(url => preloadImage(url, priority));
}