/**
 * Stack-based navigation history per tab with state drift protection.
 * Each root tab maintains its own history stack so that switching tabs
 * and pressing back returns you to where you were within that tab.
 * Includes safeguards against concurrent state mutations.
 */
import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const TAB_ROOTS = ['/Discover', '/Matches', '/LikesYou', '/GroupTracker', '/'];

// Shared stacks object (module-level, survives re-renders)
const tabStacks = {};
const stackMutexRef = { locked: false };

function getTabRoot(pathname) {
  return TAB_ROOTS.find(root => pathname === root || pathname.startsWith(root + '?')) ?? null;
}

export default function useTabHistory() {
  const location = useLocation();
  const navigate = useNavigate();
  const prevPathRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isMountedRef.current) return;

    const current = location.pathname;
    const prev = prevPathRef.current;

    // Prevent concurrent mutations
    if (stackMutexRef.locked) return;
    stackMutexRef.locked = true;

    try {
      // Determine if we're entering a tab root
      const currentRoot = getTabRoot(current);
      const prevRoot = prev ? getTabRoot(prev) : null;

      if (currentRoot) {
        // We just landed on a tab root — initialize or reset stack
        if (!tabStacks[currentRoot]) tabStacks[currentRoot] = [];
        tabStacks[currentRoot] = [current];
      } else if (prev && prevRoot === null) {
        // Navigating deeper from within a tab — push to the active tab stack
        const activeTab = TAB_ROOTS.find(root =>
          prev === root || (tabStacks[root] && tabStacks[root].includes(prev))
        );
        if (activeTab) {
          if (!tabStacks[activeTab]) tabStacks[activeTab] = [];
          // Prevent duplicate entries
          if (tabStacks[activeTab][tabStacks[activeTab].length - 1] !== current) {
            tabStacks[activeTab].push(current);
          }
        }
      }

      prevPathRef.current = current;
    } finally {
      stackMutexRef.locked = false;
    }
  }, [location.pathname]);

  /**
   * Navigate back within the current tab's stack.
   * Falls back to navigate(-1) if no stack entry found.
   * Protected against concurrent calls.
   */
  const goBack = () => {
    if (stackMutexRef.locked) return; // Prevent concurrent operations
    stackMutexRef.locked = true;

    try {
      const current = location.pathname;
      for (const root of TAB_ROOTS) {
        const stack = tabStacks[root];
        if (stack && stack.length > 1 && stack[stack.length - 1] === current) {
          stack.pop();
          const targetPath = stack[stack.length - 1];
          navigate(targetPath);
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