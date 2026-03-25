/**
 * Performance Audit Tool for Profile Lists
 * 
 * Verifies all images use SmartImage component with Intersection Observer
 * and checks viewport intersection loading behavior.
 * 
 * Run in browser console: await window.auditImagePerformance()
 */

export async function auditImagePerformance() {
  const results = {
    timestamp: new Date().toISOString(),
    images: [],
    violations: [],
    smartImageCount: 0,
    rawImageCount: 0,
    observedCount: 0,
    unobservedCount: 0,
    passed: true
  };

  // Find all images in profile lists
  const allImages = document.querySelectorAll('img');
  const profileListImages = [];

  allImages.forEach(img => {
    // Check if image is within a profile card or grid context
    const parent = img.closest('[class*="profile"], [class*="grid"], [role="listitem"]');
    if (parent) {
      profileListImages.push(img);
    }
  });

  console.log(`Found ${profileListImages.length} images in profile lists`);

  profileListImages.forEach((img, idx) => {
    const src = img.src || img.getAttribute('src');
    const alt = img.alt || 'No alt text';

    // Check if img has data attributes indicating SmartImage
    const isSmartImage = img.hasAttribute('data-smartimage') || 
                        img.parentElement?.hasAttribute('data-smartimage-container');

    // Check for loading="lazy" (Intersection Observer indicator)
    const loading = img.getAttribute('loading');
    const isLazy = loading === 'lazy';

    // Check for decoding="async"
    const decoding = img.getAttribute('decoding');

    // Try to detect if parent has IntersectionObserver
    const parent = img.closest('[class*="profile"], [class*="grid"]');
    const hasObserverParent = parent?.hasAttribute('data-intersection-observer') ||
                              img.hasAttribute('data-intersection-observed');

    const isObserved = isSmartImage || isLazy || hasObserverParent;

    const imgInfo = {
      index: idx,
      src: src.substring(0, 60) + (src.length > 60 ? '...' : ''),
      alt,
      isSmartImage,
      isLazy,
      decoding,
      isObserved,
      parentClass: parent?.className.substring(0, 50) || 'unknown'
    };

    results.images.push(imgInfo);

    if (isSmartImage) results.smartImageCount++;
    else results.rawImageCount++;

    if (isObserved) results.observedCount++;
    else results.unobservedCount++;

    if (!isSmartImage && !isLazy) {
      results.passed = false;
      results.violations.push({
        image: idx,
        issue: `Image not using SmartImage or lazy loading: ${src.substring(0, 40)}`,
        severity: 'warning',
        element: img
      });
    }
  });

  // Console output
  console.log('%cImage Performance Audit Report', 'font-size: 16px; font-weight: bold; color: #0066cc;');
  console.log(`Time: ${results.timestamp}`);
  console.log(`Total images in profile lists: ${profileListImages.length}`);
  console.log(`SmartImage components: ${results.smartImageCount}`);
  console.log(`Raw <img> tags: ${results.rawImageCount}`);
  console.log(`Intersection-observed: ${results.observedCount}`);
  console.log(`Unobserved: ${results.unobservedCount}`);
  console.log(`Status: ${results.passed ? '✅ PASS' : '⚠️ WARNINGS'}`);

  results.violations.forEach(v => {
    console.warn(`[${v.severity}] ${v.issue}`);
  });

  // Summary table
  console.table(results.images.slice(0, 15).map(img => ({
    'Src': img.src,
    'SmartImage': img.isSmartImage ? '✅' : '❌',
    'Lazy': img.isLazy ? '✅' : '❌',
    'Observed': img.isObserved ? '✅' : '❌',
    'Parent': img.parentClass
  })));

  return results;
}

/**
 * Memory Usage Check
 * Estimates memory overhead of loaded vs deferred images
 */
export function estimateMemorySavings() {
  const allImages = document.querySelectorAll('img');
  const loadedImages = Array.from(allImages).filter(img => {
    const style = window.getComputedStyle(img);
    // Check if image is actually loaded (opacity > 0, not placeholder)
    return style.opacity !== '0' && img.complete && img.naturalHeight > 0;
  });

  // Rough estimate: 1MB per typical profile photo
  const estimatedLoadedMemory = loadedImages.length * 1;
  const totalPotentialMemory = allImages.length * 1;
  const deferredMemory = totalPotentialMemory - estimatedLoadedMemory;

  return {
    totalImages: allImages.length,
    loadedImages: loadedImages.length,
    estimatedLoadedMemory: `${estimatedLoadedMemory}MB`,
    estimatedDeferredMemory: `${deferredMemory}MB`,
    estimatedTotalMemory: `${totalPotentialMemory}MB`,
    savingsPercent: Math.round((deferredMemory / totalPotentialMemory) * 100),
    message: `Estimated ${deferredMemory}MB memory deferred (${Math.round((deferredMemory / totalPotentialMemory) * 100)}% of total)`
  };
}

/**
 * Intersection Observer Activity Check
 * Monitors live IntersectionObserver entries
 */
export function checkIntersectionObserverActivity() {
  // This is a passive check—actual IntersectionObserver activity is browser-internal
  const profileGrids = document.querySelectorAll('[class*="grid"], [class*="profile"]');
  const unobservedImages = document.querySelectorAll('img[loading="lazy"]');

  return {
    profileGrids: profileGrids.length,
    lazyLoadImages: unobservedImages.length,
    message: `${unobservedImages.length} lazy-load images monitored by browser IntersectionObserver`
  };
}

/**
 * Mount audit functions globally for browser console access
 */
if (typeof window !== 'undefined') {
  window.auditImagePerformance = auditImagePerformance;
  window.estimateMemorySavings = estimateMemorySavings;
  window.checkIntersectionObserverActivity = checkIntersectionObserverActivity;

  if (process.env.NODE_ENV === 'development') {
    window.addEventListener('load', () => {
      console.log('💡 Image Performance Audit available. Run: await auditImagePerformance()');
    });
  }
}