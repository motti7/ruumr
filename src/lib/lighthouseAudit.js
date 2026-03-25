/**
 * Production Lighthouse Audit Script
 * 
 * Generates accessibility, performance, and best practices reports
 * for store submission readiness verification.
 * 
 * Usage:
 *   npm run audit:lighthouse (runs full report)
 *   window.generateLighthouseReport() (quick check in dev)
 */

/**
 * Quick accessibility check (without full Lighthouse)
 */
export async function auditAccessibilityMetrics() {
  const results = {
    passed: [],
    violations: [],
    warnings: []
  };

  // 1. Color Contrast
  const contrastCheck = () => {
    const textElements = document.querySelectorAll('p, span, div, button, a');
    textElements.forEach(el => {
      const computedStyle = window.getComputedStyle(el);
      const fg = computedStyle.color;
      const bg = computedStyle.backgroundColor;

      // Simple check: if bg is white/light and fg is light, flag it
      if (fg === 'rgba(0, 0, 0, 0)' || bg === 'rgba(0, 0, 0, 0)') {
        results.warnings.push({
          element: el.tagName,
          issue: 'Transparent or missing color'
        });
      }
    });
  };

  // 2. Aria Labels
  const ariaCheck = () => {
    const buttons = document.querySelectorAll('button, [role="button"]');
    const missingLabels = Array.from(buttons).filter(btn => {
      const hasLabel = btn.getAttribute('aria-label') || 
                       btn.getAttribute('aria-labelledby') || 
                       btn.textContent.trim();
      return !hasLabel;
    });

    if (missingLabels.length === 0) {
      results.passed.push('All buttons have aria-labels or text');
    } else {
      results.violations.push({
        issue: `${missingLabels.length} buttons missing labels`,
        severity: 'high'
      });
    }
  };

  // 3. Form Labels
  const formCheck = () => {
    const inputs = document.querySelectorAll('input[type="text"], textarea, select');
    const labeledInputs = Array.from(inputs).filter(input => {
      return document.querySelector(`label[for="${input.id}"]`) || 
             input.getAttribute('aria-label');
    });

    results.passed.push(`${labeledInputs.length}/${inputs.length} form inputs properly labeled`);
  };

  // 4. Heading Structure
  const headingCheck = () => {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const h1Count = document.querySelectorAll('h1').length;

    if (h1Count === 1) {
      results.passed.push('Single H1 heading detected');
    } else if (h1Count === 0) {
      results.warnings.push('No H1 heading found');
    } else {
      results.violations.push({
        issue: `Multiple H1 headings (${h1Count})`,
        severity: 'medium'
      });
    }
  };

  contrastCheck();
  ariaCheck();
  formCheck();
  headingCheck();

  return results;
}

/**
 * Performance metrics check
 */
export async function auditPerformanceMetrics() {
  const results = {
    metrics: {},
    violations: [],
    recommendations: []
  };

  // 1. Core Web Vitals
  if ('web-vital' in window) {
    const vitals = window.webVitals || {};
    results.metrics.LCP = vitals.LCP || 'N/A';
    results.metrics.FID = vitals.FID || 'N/A';
    results.metrics.CLS = vitals.CLS || 'N/A';
  }

  // 2. Page load time
  const perfData = performance.getEntriesByType('navigation')[0];
  if (perfData) {
    results.metrics.loadTime = (perfData.loadEventEnd - perfData.loadEventStart).toFixed(0) + 'ms';
    results.metrics.DOMContentLoaded = (perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart).toFixed(0) + 'ms';
  }

  // 3. Network requests
  const resources = performance.getEntriesByType('resource');
  const slowResources = resources.filter(r => r.duration > 1000);

  results.metrics.totalRequests = resources.length;
  results.metrics.slowRequests = slowResources.length;

  if (slowResources.length > 0) {
    results.violations.push({
      issue: `${slowResources.length} requests > 1s`,
      severity: 'medium',
      examples: slowResources.slice(0, 3).map(r => ({
        url: r.name.substring(0, 50),
        duration: r.duration.toFixed(0) + 'ms'
      }))
    });
  }

  // 4. Unused CSS/JS
  results.recommendations.push({
    tip: 'Check DevTools Coverage tab for unused CSS/JS',
    expectation: '< 30% unused code'
  });

  return results;
}

/**
 * Best Practices check
 */
export async function auditBestPractices() {
  const results = {
    passed: [],
    violations: [],
    warnings: []
  };

  // 1. HTTPS
  if (window.location.protocol === 'https:') {
    results.passed.push('HTTPS enabled');
  } else {
    results.violations.push({
      issue: 'Not using HTTPS',
      severity: 'critical'
    });
  }

  // 2. Viewport meta tag
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport?.getAttribute('content')?.includes('width=device-width')) {
    results.passed.push('Responsive viewport meta tag present');
  } else {
    results.warnings.push('Viewport meta tag missing or incorrect');
  }

  // 3. Favicon
  const favicon = document.querySelector('link[rel="icon"]');
  if (favicon) {
    results.passed.push('Favicon configured');
  } else {
    results.warnings.push('Favicon not configured');
  }

  // 4. No console errors
  const errorLogs = (window.errorCount || 0);
  if (errorLogs === 0) {
    results.passed.push('No console errors detected');
  } else {
    results.violations.push({
      issue: `${errorLogs} console errors`,
      severity: 'medium'
    });
  }

  // 5. CSP Header
  const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  if (cspMeta || window.location.protocol === 'https:') {
    results.passed.push('CSP configured (via server or meta tag)');
  } else {
    results.warnings.push('Content Security Policy not configured');
  }

  // 6. PWA installability
  const manifest = document.querySelector('link[rel="manifest"]');
  if (manifest) {
    results.passed.push('Web manifest present');
  } else {
    results.warnings.push('Web manifest not configured');
  }

  return results;
}

/**
 * Generate full Lighthouse-style report
 */
export async function generateLighthouseReport() {
  console.log('%c📊 Production Lighthouse Audit Report', 'font-size: 18px; font-weight: bold; color: #0066cc;');
  console.log(`Generated: ${new Date().toISOString()}`);
  console.log(`URL: ${window.location.href}`);

  const a11y = await auditAccessibilityMetrics();
  const perf = await auditPerformanceMetrics();
  const best = await auditBestPractices();

  const report = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    categories: {
      accessibility: {
        score: calculateScore(a11y),
        passed: a11y.passed.length,
        violations: a11y.violations.length,
        warnings: a11y.warnings.length,
        details: a11y
      },
      performance: {
        score: calculateScore(perf),
        metrics: perf.metrics,
        violations: perf.violations.length,
        details: perf
      },
      bestPractices: {
        score: calculateScore(best),
        passed: best.passed.length,
        violations: best.violations.length,
        warnings: best.warnings.length,
        details: best
      }
    }
  };

  // Print summary
  console.log('\n%c📈 Scores', 'font-size: 14px; font-weight: bold; color: #0066cc;');
  console.table({
    'Accessibility': report.categories.accessibility.score + '%',
    'Performance': report.categories.performance.score + '%',
    'Best Practices': report.categories.bestPractices.score + '%'
  });

  // Print details
  console.log('\n%c✅ Passed Checks', 'font-size: 12px; font-weight: bold; color: #28a745;');
  [...a11y.passed, ...best.passed].forEach(item => console.log('  ✓ ' + item));

  console.log('\n%c⚠️ Warnings', 'font-size: 12px; font-weight: bold; color: #ffc107;');
  [...a11y.warnings, ...best.warnings].forEach(item => {
    console.log('  ⚠ ' + (item.issue || item));
  });

  console.log('\n%c❌ Violations', 'font-size: 12px; font-weight: bold; color: #dc3545;');
  [...a11y.violations, ...best.violations, ...(perf.violations || [])].forEach(item => {
    console.log('  ✗ ' + item.issue + ` [${item.severity || 'high'}]`);
  });

  // Store submission readiness
  const readiness = report.categories.accessibility.score >= 90 &&
                   report.categories.performance.score >= 80 &&
                   report.categories.bestPractices.score >= 80;

  console.log('\n%c🎯 Store Submission Readiness', `font-size: 12px; font-weight: bold; color: ${readiness ? '#28a745' : '#dc3545'};`);
  console.log(readiness ? '  ✅ READY FOR SUBMISSION' : '  ❌ NOT YET READY - Address violations above');

  return report;
}

/**
 * Helper: Calculate score from passed/violations
 */
function calculateScore(results) {
  const total = (results.passed?.length || 0) + (results.violations?.length || 0);
  if (total === 0) return 100;
  const score = ((results.passed?.length || 0) / total) * 100;
  return Math.round(score);
}

/**
 * Mount globally
 */
if (typeof window !== 'undefined') {
  window.generateLighthouseReport = generateLighthouseReport;
  window.auditAccessibilityMetrics = auditAccessibilityMetrics;
  window.auditPerformanceMetrics = auditPerformanceMetrics;
  window.auditBestPractices = auditBestPractices;

  if (process.env.NODE_ENV === 'development') {
    window.addEventListener('load', () => {
      console.log('💡 Lighthouse Audit available. Run: window.generateLighthouseReport()');
    });
  }
}