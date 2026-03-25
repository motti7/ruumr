#!/usr/bin/env node

/**
 * Production Lighthouse Audit Script
 * 
 * Runs full Lighthouse audit on production build
 * Generates reports for: Accessibility, Performance, Best Practices
 * 
 * Usage:
 *   npm run audit:lighthouse
 *   node scripts/lighthouse-audit.mjs [url]
 */

import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const AUDIT_URL = process.argv[2] || 'http://localhost:5173';
const REPORT_DIR = path.join(__dirname, '../lighthouse-reports');

// Ensure report directory exists
if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

/**
 * Run Lighthouse audit
 */
async function runLighthouseAudit() {
  console.log('🚀 Starting Lighthouse Audit...');
  console.log(`📍 URL: ${AUDIT_URL}`);

  let chrome;

  try {
    // Launch Chrome with disabled features for testing
    chrome = await chromeLauncher.launch({
      chromeFlags: [
        '--headless',
        '--no-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-extensions',
        '--disable-sync',
        '--disable-default-apps',
        '--disable-background-timer-throttling',
        '--mute-audio'
      ]
    });

    const options = {
      logLevel: 'info',
      output: 'json',
      port: chrome.port,
      onlyCategories: ['accessibility', 'performance', 'best-practices']
    };

    console.log('⏳ Running audit (this may take 1-2 minutes)...\n');

    const runnerResult = await lighthouse(AUDIT_URL, options);

    // Extract results
    const lhr = runnerResult.lhr;
    const categories = lhr.categories;

    // Generate report
    const report = {
      timestamp: new Date().toISOString(),
      url: AUDIT_URL,
      categories: {
        accessibility: {
          score: Math.round(categories.accessibility.score * 100),
          scoreDisplayMode: categories.accessibility.scoreDisplayMode,
          description: categories.accessibility.description,
          passed: countPassed(lhr.audits, 'accessibility'),
          failed: countFailed(lhr.audits, 'accessibility'),
          warnings: countWarnings(lhr.audits, 'accessibility')
        },
        performance: {
          score: Math.round(categories.performance.score * 100),
          scoreDisplayMode: categories.performance.scoreDisplayMode,
          description: categories.performance.description,
          metrics: extractMetrics(lhr.audits),
          passed: countPassed(lhr.audits, 'performance'),
          failed: countFailed(lhr.audits, 'performance'),
          warnings: countWarnings(lhr.audits, 'performance')
        },
        bestPractices: {
          score: Math.round(categories['best-practices'].score * 100),
          scoreDisplayMode: categories['best-practices'].scoreDisplayMode,
          description: categories['best-practices'].description,
          passed: countPassed(lhr.audits, 'best-practices'),
          failed: countFailed(lhr.audits, 'best-practices'),
          warnings: countWarnings(lhr.audits, 'best-practices')
        }
      },
      storeSubmissionReadiness: {
        accessibility: Math.round(categories.accessibility.score * 100) >= 90,
        performance: Math.round(categories.performance.score * 100) >= 80,
        bestPractices: Math.round(categories['best-practices'].score * 100) >= 80,
        overallReady: Math.round(categories.accessibility.score * 100) >= 90 &&
                     Math.round(categories.performance.score * 100) >= 80 &&
                     Math.round(categories['best-practices'].score * 100) >= 80
      }
    };

    // Print results
    printReport(report);

    // Save JSON report
    const jsonReportPath = path.join(REPORT_DIR, `lighthouse-${Date.now()}.json`);
    fs.writeFileSync(jsonReportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Full report saved: ${jsonReportPath}`);

    // Save summary
    const summaryPath = path.join(REPORT_DIR, 'latest-summary.txt');
    fs.writeFileSync(summaryPath, formatSummary(report));
    console.log(`📄 Summary saved: ${summaryPath}`);

    // Exit with appropriate code
    process.exit(report.storeSubmissionReadiness.overallReady ? 0 : 1);

  } catch (error) {
    console.error('❌ Audit failed:', error.message);
    process.exit(1);
  } finally {
    if (chrome) {
      await chrome.kill();
    }
  }
}

/**
 * Count passed audits
 */
function countPassed(audits, category) {
  return Object.values(audits).filter(audit => {
    return audit.group?.includes(category) && audit.score === 1;
  }).length;
}

/**
 * Count failed audits
 */
function countFailed(audits, category) {
  return Object.values(audits).filter(audit => {
    return audit.group?.includes(category) && audit.score === 0;
  }).length;
}

/**
 * Count warning audits
 */
function countWarnings(audits, category) {
  return Object.values(audits).filter(audit => {
    return audit.group?.includes(category) && audit.score > 0 && audit.score < 1;
  }).length;
}

/**
 * Extract key metrics
 */
function extractMetrics(audits) {
  const metrics = {};
  const metricNames = ['largest-contentful-paint', 'first-input-delay', 'cumulative-layout-shift'];

  metricNames.forEach(name => {
    const audit = audits[name];
    if (audit?.displayValue) {
      metrics[name] = audit.displayValue;
    }
  });

  return metrics;
}

/**
 * Print formatted report to console
 */
function printReport(report) {
  console.log('\n' + '='.repeat(70));
  console.log('📊 LIGHTHOUSE AUDIT REPORT');
  console.log('='.repeat(70));

  console.log(`\n🕐 Timestamp: ${report.timestamp}`);
  console.log(`📍 URL: ${report.url}`);

  console.log('\n%c📈 SCORES', 'color: #0066cc; font-weight: bold;');
  console.log('─'.repeat(70));
  console.log(
    `Accessibility:    ${report.categories.accessibility.score}/100 ${'█'.repeat(report.categories.accessibility.score / 5)}${'░'.repeat((100 - report.categories.accessibility.score) / 5)}`
  );
  console.log(
    `Performance:      ${report.categories.performance.score}/100 ${'█'.repeat(report.categories.performance.score / 5)}${'░'.repeat((100 - report.categories.performance.score) / 5)}`
  );
  console.log(
    `Best Practices:   ${report.categories.bestPractices.score}/100 ${'█'.repeat(report.categories.bestPractices.score / 5)}${'░'.repeat((100 - report.categories.bestPractices.score) / 5)}`
  );

  console.log('\n%c✅ RESULTS SUMMARY', 'color: #28a745; font-weight: bold;');
  console.log('─'.repeat(70));
  console.log(`Accessibility:  ${report.categories.accessibility.passed} passed, ${report.categories.accessibility.failed} failed, ${report.categories.accessibility.warnings} warnings`);
  console.log(`Performance:    ${report.categories.performance.passed} passed, ${report.categories.performance.failed} failed, ${report.categories.performance.warnings} warnings`);
  console.log(`Best Practices: ${report.categories.bestPractices.passed} passed, ${report.categories.bestPractices.failed} failed, ${report.categories.bestPractices.warnings} warnings`);

  console.log('\n%c📱 STORE SUBMISSION READINESS', `color: ${report.storeSubmissionReadiness.overallReady ? '#28a745' : '#dc3545'}; font-weight: bold;`);
  console.log('─'.repeat(70));
  console.log(
    `Accessibility (≥90):  ${report.storeSubmissionReadiness.accessibility ? '✅ PASS' : '❌ FAIL'} (${report.categories.accessibility.score}/100)`
  );
  console.log(
    `Performance (≥80):    ${report.storeSubmissionReadiness.performance ? '✅ PASS' : '❌ FAIL'} (${report.categories.performance.score}/100)`
  );
  console.log(
    `Best Practices (≥80): ${report.storeSubmissionReadiness.bestPractices ? '✅ PASS' : '❌ FAIL'} (${report.categories.bestPractices.score}/100)`
  );

  console.log('\n' + '='.repeat(70));
  if (report.storeSubmissionReadiness.overallReady) {
    console.log('✅ APPLICATION READY FOR APP STORE SUBMISSION');
  } else {
    console.log('❌ APPLICATION NOT YET READY - Address failures above');
  }
  console.log('='.repeat(70) + '\n');
}

/**
 * Format summary for text file
 */
function formatSummary(report) {
  return `
LIGHTHOUSE AUDIT SUMMARY
Generated: ${report.timestamp}
URL: ${report.url}

SCORES:
  Accessibility:   ${report.categories.accessibility.score}/100
  Performance:     ${report.categories.performance.score}/100
  Best Practices:  ${report.categories.bestPractices.score}/100

RESULTS:
  Accessibility:   ${report.categories.accessibility.passed} passed, ${report.categories.accessibility.failed} failed, ${report.categories.accessibility.warnings} warnings
  Performance:     ${report.categories.performance.passed} passed, ${report.categories.performance.failed} failed, ${report.categories.performance.warnings} warnings
  Best Practices:  ${report.categories.bestPractices.passed} passed, ${report.categories.bestPractices.failed} failed, ${report.categories.bestPractices.warnings} warnings

STORE SUBMISSION READINESS:
  Accessibility (≥90):  ${report.storeSubmissionReadiness.accessibility ? 'PASS' : 'FAIL'}
  Performance (≥80):    ${report.storeSubmissionReadiness.performance ? 'PASS' : 'FAIL'}
  Best Practices (≥80): ${report.storeSubmissionReadiness.bestPractices ? 'PASS' : 'FAIL'}
  Overall:              ${report.storeSubmissionReadiness.overallReady ? 'READY' : 'NOT READY'}
`;
}

// Run audit
runLighthouseAudit();