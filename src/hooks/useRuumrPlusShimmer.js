import { useState, useEffect } from 'react';

// One shimmer sweep per minute, on a single session-wide clock.
// `nextSweepAt` lives at module scope so it is shared across every mount /
// remount of the Layout — the schedule stays continuous while the app is open
// instead of restarting from zero on each page navigation.
const INTERVAL = 60000;     // a sweep every 60s
const SWEEP_DURATION = 850; // how long (ms) the shimmer visual stays on

let nextSweepAt = 0;

export default function useRuumrPlusShimmer() {
  const [active, setActive] = useState(false);
  const [variant, setVariant] = useState(0);

  useEffect(() => {
    let sweepTimer;
    let hideTimer;

    const fire = () => {
      setActive(true);
      setVariant(Math.floor(Math.random() * 3));
      nextSweepAt = Date.now() + INTERVAL;
      hideTimer = setTimeout(() => setActive(false), SWEEP_DURATION);
      sweepTimer = setTimeout(fire, INTERVAL);
    };

    const now = Date.now();
    if (!nextSweepAt) nextSweepAt = now + INTERVAL;
    // If we remounted after the scheduled time (e.g. away for over a minute),
    // fire immediately so the session cadence is preserved.
    const initialDelay = Math.max(0, nextSweepAt - now);
    sweepTimer = setTimeout(fire, initialDelay);

    return () => {
      clearTimeout(sweepTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  return { active, variant };
}