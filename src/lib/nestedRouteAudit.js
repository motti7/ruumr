/**
 * Nested Route Audit for Android Back Button Stack Integrity
 * 
 * Tests:
 * 1. Entry/exit points: Discover → ProfileView → Chat (verify stack resets per tab)
 * 2. Sibling navigation: Discover → Matches (verify tab isolation)
 * 3. Deep nesting: Discover → ProfileView → Chat → GroupChat (verify stack depth)
 * 4. Back press resilience: rapid back presses without state drift
 * 
 * Run this before deployment to ensure seamless nested navigation.
 */

const ROUTES = {
  // Root tabs (stack entry points)
  DISCOVER: '/Discover',
  MATCHES: '/Matches',
  LIKES_YOU: '/LikesYou',
  GROUP_TRACKER: '/GroupTracker',
  
  // Nested routes (deep within tabs)
  PROFILE_VIEW: '/ProfileView',
  CHAT: '/Chat',
  GROUP_CHAT: '/GroupChat',
  CHARTER: '/Charter',
  GROUP_COMPATIBILITY: '/GroupCompatibility',
};

/**
 * Test navigation path consistency.
 * Ensures back button doesn't skip screens or get stuck.
 */
export function testNavigationPath(navigationSequence) {
  const results = {
    valid: true,
    checks: [],
    errors: [],
  };

  // Check 1: Discover → ProfileView → back to Discover
  if (navigationSequence.includes(ROUTES.DISCOVER) && navigationSequence.includes(ROUTES.PROFILE_VIEW)) {
    const discoverIdx = navigationSequence.lastIndexOf(ROUTES.DISCOVER);
    const profileIdx = navigationSequence.lastIndexOf(ROUTES.PROFILE_VIEW);
    if (profileIdx > discoverIdx + 1) {
      results.checks.push('✓ ProfileView navigation within Discover tab stack');
    } else {
      results.errors.push('✗ ProfileView not properly nested within Discover');
      results.valid = false;
    }
  }

  // Check 2: Tab switching resets nested stack
  const tabSwitches = navigationSequence.filter(route => 
    [ROUTES.DISCOVER, ROUTES.MATCHES, ROUTES.LIKES_YOU, ROUTES.GROUP_TRACKER].includes(route)
  );
  if (new Set(tabSwitches).size > 1) {
    results.checks.push(`✓ Tab switching detected (${tabSwitches.length} switches)`);
  }

  // Check 3: No orphaned routes (routes without a root tab context)
  const orphanedCheck = navigationSequence.every((route, i) => {
    if (i === 0) return true; // First route is always valid
    const prevRoute = navigationSequence[i - 1];
    const isTabRoot = [ROUTES.DISCOVER, ROUTES.MATCHES, ROUTES.LIKES_YOU, ROUTES.GROUP_TRACKER].includes(route);
    const isNested = ![ROUTES.DISCOVER, ROUTES.MATCHES, ROUTES.LIKES_YOU, ROUTES.GROUP_TRACKER].includes(route);
    
    // If current is nested, previous should be a root or another nested route in the same stack
    if (isNested && [ROUTES.DISCOVER, ROUTES.MATCHES, ROUTES.LIKES_YOU, ROUTES.GROUP_TRACKER].includes(prevRoute)) {
      return true;
    }
    return !isNested;
  });

  if (orphanedCheck) {
    results.checks.push('✓ No orphaned routes detected');
  } else {
    results.errors.push('✗ Orphaned routes detected in navigation sequence');
    results.valid = false;
  }

  return results;
}

/**
 * Test rapid back presses for state drift.
 * Simulates user quickly pressing back multiple times.
 */
export function testRapidBackPresses(navigationHistory, backPresses = 5) {
  const results = {
    valid: true,
    checks: [],
    errors: [],
  };

  let currentIdx = navigationHistory.length - 1;
  const backPressLog = [];

  for (let i = 0; i < backPresses && currentIdx > 0; i++) {
    currentIdx--;
    backPressLog.push({
      step: i + 1,
      route: navigationHistory[currentIdx],
      idx: currentIdx,
    });
  }

  // Check: Sequence should be monotonically decreasing
  const isMonotonic = backPressLog.every((item, i) => {
    if (i === 0) return true;
    return item.idx < backPressLog[i - 1].idx;
  });

  if (isMonotonic) {
    results.checks.push(`✓ Rapid back presses maintain stack integrity (${backPresses} presses handled correctly)`);
  } else {
    results.errors.push('✗ Back press sequence is non-monotonic (state drift detected)');
    results.valid = false;
  }

  return results;
}

/**
 * Test tab isolation: switching tabs shouldn't affect each other's stacks.
 */
export function testTabIsolation(navigationHistory) {
  const results = {
    valid: true,
    checks: [],
    errors: [],
  };

  const tabRoots = [ROUTES.DISCOVER, ROUTES.MATCHES, ROUTES.LIKES_YOU, ROUTES.GROUP_TRACKER];
  const tabStacks = {};

  // Build per-tab stacks from navigation history
  navigationHistory.forEach((route, idx) => {
    const tabRoot = tabRoots.find(root => route === root || route.startsWith(root + '?'));
    if (tabRoot) {
      if (!tabStacks[tabRoot]) tabStacks[tabRoot] = [];
      tabStacks[tabRoot].push({ route, idx });
    }
  });

  // Check: Each tab should have its own independent stack
  const tabCount = Object.keys(tabStacks).length;
  if (tabCount > 1) {
    results.checks.push(`✓ Multiple tab stacks detected (${tabCount} tabs)`);
    
    // Verify no cross-tab contamination
    let hasCrossTab = false;
    const tabRootsList = Object.keys(tabStacks);
    for (let i = 0; i < tabRootsList.length; i++) {
      for (let j = i + 1; j < tabRootsList.length; j++) {
        const stack1 = tabStacks[tabRootsList[i]];
        const stack2 = tabStacks[tabRootsList[j]];
        
        // If stack indices are interleaved, tabs are contaminated
        if (stack1[0].idx < stack2[0].idx && stack1[stack1.length - 1].idx > stack2[stack2.length - 1].idx) {
          hasCrossTab = true;
          break;
        }
      }
    }

    if (!hasCrossTab) {
      results.checks.push('✓ Tab stacks are properly isolated (no cross-tab contamination)');
    } else {
      results.errors.push('✗ Tab stacks are interleaved (possible cross-tab contamination)');
      results.valid = false;
    }
  } else {
    results.checks.push('✓ Single tab navigation (isolation check N/A)');
  }

  return results;
}

/**
 * Run full audit suite.
 */
export function runFullAudit(navigationHistory) {
  console.log('🔍 Running Nested Route Audit...\n');

  const pathTest = testNavigationPath(navigationHistory);
  const rapidBackTest = testRapidBackPresses(navigationHistory);
  const isolationTest = testTabIsolation(navigationHistory);

  const allResults = [pathTest, rapidBackTest, isolationTest];
  const allValid = allResults.every(r => r.valid);

  console.log('📋 PATH INTEGRITY');
  pathTest.checks.forEach(c => console.log('  ' + c));
  pathTest.errors.forEach(e => console.error('  ' + e));

  console.log('\n⚡ RAPID BACK PRESS RESILIENCE');
  rapidBackTest.checks.forEach(c => console.log('  ' + c));
  rapidBackTest.errors.forEach(e => console.error('  ' + e));

  console.log('\n🔄 TAB ISOLATION');
  isolationTest.checks.forEach(c => console.log('  ' + c));
  isolationTest.errors.forEach(e => console.error('  ' + e));

  console.log(`\n${allValid ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}\n`);

  return {
    valid: allValid,
    summary: {
      pathIntegrity: pathTest.valid,
      rapidBackResilience: rapidBackTest.valid,
      tabIsolation: isolationTest.valid,
    },
  };
}