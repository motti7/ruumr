/**
 * Stack-based navigation history per tab.
 * Each root tab maintains its own history stack so that switching tabs
 * and pressing back returns you to where you were within that tab.
 */
import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const TAB_ROOTS = ['/Discover', '/Matches', '/LikesYou', '/GroupTracker', '/'];

// Shared stacks object (module-level, survives re-renders)
const tabStacks = {};

function getTabRoot(pathname) {
  return TAB_ROOTS.find(root => pathname === root || pathname.startsWith(root + '?')) ?? null;
}

export default function useTabHistory() {
  const location = useLocation();
  const navigate = useNavigate();
  const prevPathRef = useRef(null);

  useEffect(() => {
    const current = location.pathname;
    const prev = prevPathRef.current;

    // Determine if we're entering a tab root
    const currentRoot = getTabRoot(current);
    const prevRoot = prev ? getTabRoot(prev) : null;

    if (currentRoot) {
      // We just landed on a tab root — don't push, just mark this as tab start
      tabStacks[currentRoot] = [current];
    } else if (prev && prevRoot === null) {
      // Navigating deeper from within a tab — push to the active tab stack
      const activeTab = TAB_ROOTS.find(root =>
        prev === root || (tabStacks[root] && tabStacks[root].includes(prev))
      );
      if (activeTab) {
        if (!tabStacks[activeTab]) tabStacks[activeTab] = [];
        tabStacks[activeTab].push(current);
      }
    }

    prevPathRef.current = current;
  }, [location.pathname]);

  /**
   * Navigate back within the current tab's stack.
   * Falls back to navigate(-1) if no stack entry found.
   */
  const goBack = () => {
    // Find which tab stack contains current page
    const current = location.pathname;
    for (const root of TAB_ROOTS) {
      const stack = tabStacks[root];
      if (stack && stack.length > 1 && stack[stack.length - 1] === current) {
        stack.pop();
        navigate(stack[stack.length - 1]);
        return;
      }
    }
    navigate(-1);
  };

  return { goBack };
}