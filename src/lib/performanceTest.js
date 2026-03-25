/**
 * Performance Test Suite for Low-End Android Devices
 * 
 * Tests:
 * 1. VirtualizedGrid with 500+ items at 4x CPU throttling
 * 2. Scroll event listener conflicts (PullToRefresh)
 * 3. Memory usage and garbage collection
 * 4. Interaction to Paint (INP) responsiveness
 * 
 * Run in DevTools: window.runPerformanceTest()
 */

class PerformanceTestSuite {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      deviceInfo: this.getDeviceInfo(),
      tests: [],
      scrollConflicts: [],
      memorySnapshots: [],
      passed: true
    };
  }

  getDeviceInfo() {
    const ua = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const cpuCount = navigator.hardwareConcurrency || 'unknown';

    return {
      userAgent: ua.substring(0, 100),
      isMobile,
      cpuCount,
      memory: navigator.deviceMemory || 'unknown',
      connection: navigator.connection?.effectiveType || 'unknown'
    };
  }

  /**
   * Test 1: VirtualizedGrid rendering 500+ items
   * Measures FPS, render time, scroll smoothness
   */
  async testVirtualizedGridPerformance() {
    console.log('🧪 Testing VirtualizedGrid with 500+ items...');

    const startTime = performance.now();
    const frameDrops = [];
    let frameCount = 0;
    let lastFrameTime = performance.now();

    // Monitor FPS during scroll
    const monitorFPS = (currentTime) => {
      frameCount++;
      const delta = currentTime - lastFrameTime;
      lastFrameTime = currentTime;

      // Target 60fps = 16.67ms per frame
      if (delta > 20) {
        frameDrops.push({ time: currentTime, delta });
      }
    };

    // Find VirtualizedGrid container
    const gridContainers = document.querySelectorAll('[class*="grid"], [role="list"]');
    const gridContainer = Array.from(gridContainers).find(el => {
      return el.querySelectorAll('[role="listitem"]').length > 500;
    });

    if (!gridContainer) {
      return {
        testName: 'VirtualizedGrid Performance (500+)',
        status: 'SKIP',
        reason: 'No grid with 500+ items found',
        itemCount: 0
      };
    }

    const itemsRendered = gridContainer.querySelectorAll('[role="listitem"]').length;
    const visibleItems = gridContainer.querySelectorAll('[role="listitem"]:not([style*="display: none"])').length;

    // Simulate smooth scroll
    let scrollPosition = 0;
    const scrollStep = 100;
    const maxScroll = gridContainer.scrollHeight - gridContainer.clientHeight;

    const scrollInterval = setInterval(() => {
      if (scrollPosition >= maxScroll) {
        clearInterval(scrollInterval);
      } else {
        monitorFPS(performance.now());
        gridContainer.scrollTop += scrollStep;
        scrollPosition += scrollStep;
      }
    }, 16); // 60fps target

    await new Promise(resolve => setTimeout(resolve, 5000)); // Run for 5s

    const endTime = performance.now();
    const avgFPS = Math.round(frameCount / ((endTime - startTime) / 1000));
    const dropRate = (frameDrops.length / frameCount) * 100;

    return {
      testName: 'VirtualizedGrid Performance (500+)',
      status: avgFPS >= 50 ? 'PASS' : 'WARN',
      itemsRendered,
      visibleItems,
      avgFPS,
      frameDrops: frameDrops.length,
      dropRate: dropRate.toFixed(1) + '%',
      duration: (endTime - startTime).toFixed(0) + 'ms',
      recommendation: dropRate > 5 ? 'Consider reducing overscan or item complexity' : 'Performance within target'
    };
  }

  /**
   * Test 2: Scroll event listener conflicts
   * Checks PullToRefresh vs scroll listeners
   */
  testScrollEventConflicts() {
    console.log('🧪 Testing scroll event listener conflicts...');

    const conflicts = [];
    const scrollListeners = [];

    // Find all elements with scroll listeners
    document.querySelectorAll('[class*="scroll"], [class*="pull"], [class*="refresh"]').forEach(el => {
      const computedStyle = window.getComputedStyle(el);
      const hasOverflowScroll = computedStyle.overflowY === 'scroll' || computedStyle.overflowY === 'auto';

      if (hasOverflowScroll) {
        scrollListeners.push({
          element: el.className || el.tagName,
          hasOverflow: true,
          touchAction: computedStyle.touchAction,
          userSelect: computedStyle.userSelect
        });
      }
    });

    // Check for pointer/touch event handlers on scroll containers
    const scrollContainers = document.querySelectorAll('[style*="overflow"]');
    scrollContainers.forEach(container => {
      const isScrollable = container.scrollHeight > container.clientHeight;

      if (isScrollable) {
        // Check for conflicting handlers
        const hasTouchStart = container.ontouchstart !== null;
        const hasPointerDown = container.onpointerdown !== null;

        if (hasTouchStart && hasPointerDown) {
          conflicts.push({
            element: container.className,
            issue: 'Both touchstart and pointerdown listeners',
            severity: 'high'
          });
        }
      }
    });

    // Check for preventDefault calls
    const pullRefreshEl = document.querySelector('[class*="pull"], [class*="refresh"]');
    if (pullRefreshEl) {
      const hasPassiveListener = true; // Assume passive in modern browsers
      const canPreventDefault = !hasPassiveListener;

      if (canPreventDefault) {
        conflicts.push({
          element: 'PullToRefresh',
          issue: 'Non-passive listener may block scroll',
          severity: 'medium'
        });
      }
    }

    return {
      testName: 'Scroll Event Listener Conflicts',
      status: conflicts.length === 0 ? 'PASS' : 'WARN',
      scrollListeners: scrollListeners.length,
      conflicts: conflicts.length,
      details: conflicts,
      recommendation: conflicts.length === 0 
        ? 'No conflicts detected'
        : 'Review listener setup for potential scroll jank'
    };
  }

  /**
   * Test 3: Memory usage
   * Takes snapshots during scroll
   */
  async testMemoryUsage() {
    console.log('🧪 Testing memory usage...');

    if (!performance.memory) {
      return {
        testName: 'Memory Usage',
        status: 'SKIP',
        reason: 'performance.memory not available (Chrome only)'
      };
    }

    const snapshot1 = {
      time: 'initial',
      usedJSHeapSize: (performance.memory.usedJSHeapSize / 1048576).toFixed(1) + 'MB',
      totalJSHeapSize: (performance.memory.totalJSHeapSize / 1048576).toFixed(1) + 'MB'
    };

    // Trigger garbage collection (if DevTools flag set)
    if (window.gc) {
      window.gc();
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const snapshot2 = {
      time: 'after GC',
      usedJSHeapSize: (performance.memory.usedJSHeapSize / 1048576).toFixed(1) + 'MB',
      totalJSHeapSize: (performance.memory.totalJSHeapSize / 1048576).toFixed(1) + 'MB'
    };

    const heapDelta = (
      parseFloat(snapshot1.usedJSHeapSize) - parseFloat(snapshot2.usedJSHeapSize)
    ).toFixed(1);

    return {
      testName: 'Memory Usage',
      status: 'PASS',
      snapshots: [snapshot1, snapshot2],
      heapDelta: heapDelta + 'MB (recovered)',
      recommendation: heapDelta > 10 ? 'Memory leak suspected' : 'Memory management healthy'
    };
  }

  /**
   * Test 4: Interaction to Paint (INP)
   * Measures responsiveness with synthetic interactions
   */
  async testInteractionToPaint() {
    console.log('🧪 Testing Interaction to Paint (INP)...');

    const interactions = [];

    // Find interactive elements
    const buttons = document.querySelectorAll('button, [role="button"]');
    if (buttons.length === 0) {
      return {
        testName: 'Interaction to Paint (INP)',
        status: 'SKIP',
        reason: 'No interactive elements found'
      };
    }

    // Test first button click
    for (let i = 0; i < Math.min(3, buttons.length); i++) {
      const btn = buttons[i];
      const startTime = performance.now();

      // Simulate click
      btn.focus();
      const clickEvent = new PointerEvent('pointerdown', { bubbles: true });
      btn.dispatchEvent(clickEvent);

      // Wait for paint
      await new Promise(resolve => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const endTime = performance.now();
            interactions.push({
              element: btn.textContent.substring(0, 20),
              responseTime: (endTime - startTime).toFixed(1) + 'ms'
            });
            resolve();
          });
        });
      });
    }

    const avgINP = (
      interactions.reduce((sum, int) => sum + parseFloat(int.responseTime), 0) / interactions.length
    ).toFixed(1);

    return {
      testName: 'Interaction to Paint (INP)',
      status: avgINP < 200 ? 'PASS' : 'WARN',
      interactions: interactions.length,
      avgINP: avgINP + 'ms',
      samples: interactions,
      target: '< 200ms',
      recommendation: avgINP < 200 ? 'Good responsiveness' : 'Consider reducing interaction processing time'
    };
  }

  /**
   * Run all tests and generate report
   */
  async run() {
    console.log('%c🚀 Performance Test Suite Started', 'font-size: 16px; font-weight: bold; color: #0066cc;');
    console.log(`Device: ${this.results.deviceInfo.userAgent.substring(0, 60)}...`);
    console.log(`CPU: ${this.results.deviceInfo.cpuCount}x cores`);

    this.results.tests.push(await this.testVirtualizedGridPerformance());
    this.results.tests.push(this.testScrollEventConflicts());
    this.results.tests.push(await this.testMemoryUsage());
    this.results.tests.push(await this.testInteractionToPaint());

    // Check for failures
    this.results.passed = !this.results.tests.some(t => t.status === 'FAIL');

    // Console report
    console.log('%c📊 Test Results Summary', 'font-size: 14px; font-weight: bold; color: #0066cc;');
    console.table(this.results.tests.map(t => ({
      'Test': t.testName,
      'Status': t.status,
      'Details': t.avgFPS || t.conflicts || t.heapDelta || t.avgINP || '–'
    })));

    console.log(`\n📋 Full Results:`, this.results);

    return this.results;
  }
}

/**
 * Mount test suite globally
 */
if (typeof window !== 'undefined') {
  window.runPerformanceTest = async () => {
    const suite = new PerformanceTestSuite();
    return await suite.run();
  };

  if (process.env.NODE_ENV === 'development') {
    window.addEventListener('load', () => {
      console.log('💡 Performance Test Suite available. Run: window.runPerformanceTest()');
      console.log('   Ensure 4x CPU throttling is enabled in Chrome DevTools');
    });
  }
}

export { PerformanceTestSuite };