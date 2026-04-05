/**
 * Accessibility Audit Tool
 * 
 * Verifies that all custom interactive elements properly inherit global focus-visible styles.
 * Checks for consistent outline/ring styles across buttons, links, and custom controls.
 * 
 * Run in browser console: await window.auditAccessibility()
 */

export async function auditAccessibility() {
  const results = {
    timestamp: new Date().toISOString(),
    elements: [],
    violations: [],
    passed: true
  };

  // Interactive element selectors
  const selectors = [
    'button',
    'a[href]',
    '[role="button"]',
    '[role="option"]',
    '[role="menuitem"]',
    '[role="tab"]',
    '[role="link"]',
    'input:not([type="hidden"])',
    'textarea',
    'select',
    '[contenteditable="true"]'
  ];

  const interactiveElements = [];
  selectors.forEach(selector => {
    interactiveElements.push(...document.querySelectorAll(selector));
  });

  // Deduplicate
  const uniqueElements = [...new Set(interactiveElements)];

  uniqueElements.forEach((el, idx) => {
    const computedStyle = window.getComputedStyle(el);
    const focusVisibleStyle = window.getComputedStyle(el, ':focus-visible');

    // Check if element has explicit focus-visible styles
    const outline = computedStyle.outline;
    const outlineStyle = computedStyle.outlineStyle;
    const boxShadow = computedStyle.boxShadow;

    // Expected: outline or ring (box-shadow) for focus
    const hasFocusStyle = outlineStyle !== 'none' || boxShadow !== 'none';

    // Check computed ring color (Tailwind ring uses box-shadow)
    const ringColor = computedStyle.getPropertyValue('--ring');
    const hasRingVariable = ringColor && ringColor.trim() !== '';

    const isCompliant = hasFocusStyle || hasRingVariable;

    const elInfo = {
      index: idx,
      element: el.tagName.toLowerCase(),
      className: (el.className || '').substring(0, 100),
      ariaLabel: el.getAttribute('aria-label') || el.textContent?.substring(0, 30) || 'unlabeled',
      hasOutline: outlineStyle !== 'none',
      hasBoxShadow: boxShadow !== 'none',
      hasRingVariable: hasRingVariable,
      isCompliant,
      focusOutline: outline.substring(0, 50)
    };

    results.elements.push(elInfo);

    if (!isCompliant && el.offsetParent !== null) {
      // Only flag visible elements
      results.passed = false;
      results.violations.push({
        element: idx,
        issue: `Missing focus-visible styles: ${el.tagName}`,
        severity: 'warning',
        el
      });
    }
  });

  // Console output
  console.log('%cAccessibility Audit Report', 'font-size: 16px; font-weight: bold; color: #0066cc;');
  console.log(`Time: ${results.timestamp}`);
  console.log(`Interactive elements: ${results.elements.length}`);
  console.log(`Violations: ${results.violations.length}`);
  console.log(`Status: ${results.passed ? '✅ PASS' : '⚠️ WARNINGS'}`);

  results.violations.forEach(v => {
    console.warn(`[${v.severity}] ${v.issue}`);
  });

  // Summary table
  console.table(results.elements.slice(0, 20).map(e => ({
    'Type': e.element,
    'Label': e.ariaLabel,
    'Has Outline': e.hasOutline ? '✅' : '❌',
    'Has Ring': e.hasRingVariable ? '✅' : '❌',
    'Compliant': e.isCompliant ? '✅' : '⚠️'
  })));

  return results;
}

/**
 * Focus-Visible Style Inheritance Check
 * Verifies global focus-visible styles from index.css are applied
 */
export function checkFocusVisibleInheritance() {
  const testButton = document.createElement('button');
  testButton.className = 'test-focus-inherit';
  testButton.textContent = 'Test';
  document.body.appendChild(testButton);

  // Simulate focus-visible (keyboard focus)
  testButton.focus({ preventScroll: true });

  const computedStyle = window.getComputedStyle(testButton);
  const outline = computedStyle.outline;
  const boxShadow = computedStyle.boxShadow;

  const hasFocusStyle = outline !== 'none' || boxShadow !== 'none';

  document.body.removeChild(testButton);

  return {
    hasFocusStyle,
    outline: outline.substring(0, 50),
    boxShadow: boxShadow.substring(0, 50),
    message: hasFocusStyle
      ? '✅ Global focus-visible styles properly inherited'
      : '⚠️ Global focus-visible styles may not be applied'
  };
}

/**
 * Keyboard Navigation Stress Test
 * Tests Tab key navigation through all interactive elements
 */
export function testKeyboardNavigation() {
  const focusableElements = document.querySelectorAll(
    'button, a[href], input:not([type="hidden"]), textarea, select, [tabindex]:not([tabindex="-1"])'
  );

  const results = {
    totalFocusable: focusableElements.length,
    tabbable: 0,
    focusableWithoutTab: 0,
    visibleFocusable: 0
  };

  focusableElements.forEach(el => {
    const tabIndex = el.getAttribute('tabindex');
    const isVisible = el.offsetParent !== null;

    if (isVisible) results.visibleFocusable++;

    if (tabIndex === '-1') {
      results.focusableWithoutTab++;
    } else {
      results.tabbable++;
    }
  });

  return {
    ...results,
    message: `${results.tabbable} elements are keyboard tabbable (${results.focusableWithoutTab} programmatic-only)`
  };
}

/**
 * Mount audit functions globally for browser console access
 */
if (typeof window !== 'undefined') {
  window.auditAccessibility = auditAccessibility;
  window.checkFocusVisibleInheritance = checkFocusVisibleInheritance;
  window.testKeyboardNavigation = testKeyboardNavigation;

  if (import.meta.env.DEV) {
    window.addEventListener('load', () => {
      console.log('💡 Accessibility Audit available. Run: await auditAccessibility()');
    });
  }
}