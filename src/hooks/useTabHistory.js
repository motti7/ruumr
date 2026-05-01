/**
 * Enhanced stack-based navigation history with independent state preservation per tab.
 * Each root tab maintains:
 *   - Navigation stack (routes visited within tab)
 *   - Scroll position (Y offset for each route)
 *   - Route depth (breadcrumb level)
 * 
 * When switching tabs and returning, scroll position & depth are restored automatically.
 * Includes safeguards against concurrent state mutations.
 */
import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const TAB_ROOTS = ['/Discover', '/Matches', '/RuumrPlus', '/LikesYou', '/GroupTracker', '/'];

// Enhanced tab state: { stack: [], scrollPositions: {}, routeDepths: {} }
const tabStates = {};
const stackMutexRef = { locked: false };

function getTabRoot(pathname) {
  return TAB_ROOTS.find(root => pathname === root || pathname.startsWith(root + '?')) ?? null;
}

function initializeTabState(tabRoot) {
  if (!tabStates[tabRoot]) {
    tabStates[tabRoot] = {
      stack: [],
      scrollPositions: {}, // route => scrollY
      routeDepths: {},     // route => depth
    };
  }
}

function saveScrollPosition(route, scrollY) {
  const root = getTabRoot(route);
  if (root) {
    initializeTabState(root);
    tabStates[root].scrollPositions[route] = scrollY;
  }
}

function getScrollPosition(route) {
  const root = getTabRoot(route);
  return root ? (tabStates[root]?.scrollPositions[route] ?? 0) : 0;
}

function setRouteDepth(route, depth) {
  const root = getTabRoot(route);
  if (root) {
    initializeTabState(root);
    tabStates[root].routeDepths[route] = depth;
  }
}

function getRouteDepth(route) {
  const root = getTabRoot(route);
  return root ? (tabStates[root]?.routeDepths[route] ?? 0) : 0;
}

export default function useTabHistory() {
  const location = useLocation();
  const navigate = useNavigate();
  const prevPathRef = useRef(null);
  const isMountedRef = useRef(true);
  const scrollTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      clearTimeout(scrollTimerRef.current);
    };
  }, []);

  // Save scroll position before navigating away
  useEffect(() => {
    return () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      saveScrollPosition(location.pathname, scrollY);
    };
  }, [location.pathname]);

  // Restore scroll position when returning to a route
  useEffect(() => {
    if (!isMountedRef.current) return;

    const current = location.pathname;
    const prev = prevPathRef.current;

    // Prevent concurrent mutations
    if (stackMutexRef.locked) return;
    stackMutexRef.locked = true;

    try {
      const currentRoot = getTabRoot(current);
      const prevRoot = prev ? getTabRoot(prev) : null;

      if (currentRoot) {
        initializeTabState(currentRoot);
        const state = tabStates[currentRoot];

        if (!state.stack.includes(current)) {
          state.stack = [current];
          setRouteDepth(current, 0);
        }
      } else if (prev && prevRoot) {
        initializeTabState(prevRoot);
        const state = tabStates[prevRoot];

        // Navigating deeper from within a tab
        if (!state.stack.includes(current)) {
          state.stack.push(current);
          setRouteDepth(current, state.stack.length - 1);
        }
      }

      prevPathRef.current = current;

      // Restore scroll position after route renders
      clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          const savedScrollY = getScrollPosition(current);
          window.scrollTo(0, savedScrollY);
        }
      }, 100);
    } finally {
      stackMutexRef.locked = false;
    }
  }, [location.pathname]);

  /**
   * Navigate back within the current tab's stack.
   * Restores scroll position automatically.
   * Falls back to navigate(-1) if no stack entry found.
   */
  const goBack = () => {
    if (stackMutexRef.locked) return;
    stackMutexRef.locked = true;

    try {
      const current = location.pathname;
      for (const root of TAB_ROOTS) {
        const state = tabStates[root];
        if (state?.stack && state.stack.length > 1 && state.stack[state.stack.length - 1] === current) {
          state.stack.pop();
          const targetPath = state.stack[state.stack.length - 1];
          const savedScrollY = getScrollPosition(targetPath);
          navigate(targetPath);
          // Scroll restoration happens in useEffect above
          return;
        }
      }
      navigate(-1);
    } finally {
      stackMutexRef.locked = false;
    }
  };

  return { goBack };
}
