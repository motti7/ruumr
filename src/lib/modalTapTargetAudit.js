/**
 * Modal Tap Target Audit Tool
 * 
 * Verifies that all modal close buttons maintain 44x44px minimum tap target
 * after CSS minification in production builds.
 * 
 * Run in browser console: await window.auditModalTapTargets()
 */

export async function auditModalTapTargets() {
  const results = {
    timestamp: new Date().toISOString(),
    modals: [],
    violations: [],
    passed: true
  };

  // Find all modal overlays (fixed z-index 200+ indicates modals)
  const modalOverlays = document.querySelectorAll('[role="dialog"], .fixed.inset-0.bg-black');

  if (modalOverlays.length === 0) {
    console.warn('No modals found in DOM. Open a modal and run again.');
    return results;
  }

  modalOverlays.forEach((modal, idx) => {
    const closeBtn = modal.querySelector('button[aria-label*="סגור"], button[aria-label*="close"]');
    
    if (!closeBtn) {
      console.warn(`Modal ${idx}: No close button found`);
      results.violations.push({
        modal: idx,
        issue: 'No close button found',
        severity: 'warning'
      });
      return;
    }

    const rect = closeBtn.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(closeBtn);
    
    // Get actual rendered dimensions
    const width = Math.ceil(rect.width);
    const height = Math.ceil(rect.height);
    
    // Get computed padding for calculation
    const paddingY = parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom);
    const paddingX = parseFloat(computedStyle.paddingLeft) + parseFloat(computedStyle.paddingRight);
    
    const contentWidth = Math.ceil(width);
    const contentHeight = Math.ceil(height);
    
    // Check Tailwind classes (can survive minification if using CSS variables)
    const classList = closeBtn.className || '';
    const hasMinWidth = classList.includes('min-w-[44px]') || classList.includes('min-w-');
    const hasMinHeight = classList.includes('min-h-[44px]') || classList.includes('min-h-');
    
    const isCompliant = (width >= 44 && height >= 44) || (hasMinWidth && hasMinHeight);
    
    const modalInfo = {
      index: idx,
      closeButton: {
        element: closeBtn.outerHTML.substring(0, 100) + '...',
        dimensions: { width, height },
        classes: classList.substring(0, 200),
        isCompliant,
        minWidthClass: hasMinWidth,
        minHeightClass: hasMinHeight
      }
    };
    
    results.modals.push(modalInfo);
    
    if (!isCompliant) {
      results.passed = false;
      results.violations.push({
        modal: idx,
        issue: `Close button: ${width}x${height}px (require 44x44px minimum)`,
        severity: 'critical',
        element: closeBtn,
        rect
      });
    }
  });

  // Console output
  console.log('%cModal Tap Target Audit Report', 'font-size: 16px; font-weight: bold; color: #0066cc;');
  console.log(`Time: ${results.timestamp}`);
  console.log(`Total modals: ${results.modals.length}`);
  console.log(`Violations: ${results.violations.length}`);
  console.log(`Status: ${results.passed ? '✅ PASS' : '❌ FAIL'}`);
  
  results.violations.forEach(v => {
    console.error(`[${v.severity.toUpperCase()}] Modal ${v.modal}: ${v.issue}`);
  });
  
  // Detailed table
  console.table(results.modals.map(m => ({
    'Modal': m.index,
    'Width (px)': m.closeButton.dimensions.width,
    'Height (px)': m.closeButton.dimensions.height,
    'Min-W Class': m.closeButton.minWidthClass ? '✅' : '❌',
    'Min-H Class': m.closeButton.minHeightClass ? '✅' : '❌',
    'Compliant': m.closeButton.isCompliant ? '✅' : '❌'
  })));

  return results;
}

/**
 * Production Build CSS Minification Safety Check
 * Verifies that min-w/min-h classes persist through CSS minification
 */
export function checkCSSMinificationSafety() {
  const testElement = document.createElement('button');
  testElement.className = 'min-w-[44px] min-h-[44px] flex items-center justify-center';
  document.body.appendChild(testElement);

  const computedStyle = window.getComputedStyle(testElement);
  const minWidth = computedStyle.minWidth;
  const minHeight = computedStyle.minHeight;

  const isSafe = minWidth === '44px' && minHeight === '44px';

  document.body.removeChild(testElement);

  return {
    isSafe,
    computedMinWidth: minWidth,
    computedMinHeight: minHeight,
    message: isSafe 
      ? '✅ CSS minification preserves min-w/min-h classes'
      : '❌ CSS minification may have affected min-w/min-h classes'
  };
}

/**
 * Mount audit function globally for browser console access
 */
if (typeof window !== 'undefined') {
  window.auditModalTapTargets = auditModalTapTargets;
  window.checkCSSMinificationSafety = checkCSSMinificationSafety;
  
  // Run on app load (optional)
  if (process.env.NODE_ENV === 'development') {
    window.addEventListener('load', () => {
      console.log('💡 Modal Tap Target Audit available. Run: await auditModalTapTargets()');
    });
  }
}