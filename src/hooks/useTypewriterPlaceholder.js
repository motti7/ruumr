import { useEffect, useRef, useState } from 'react';

const EXAMPLES = [
  'חדר מואר בדירת שותפים',
  'חדר מרווח עם מרפסת בפלורנטין',
  'חדר פינתי שקט בכיס הרצליה',
  'סטודיו קסום עם חניה בתל אביב',
  'חדר ענק עם מזגן בשואבה',
  'חדר מרווח בדירת גג בבאר שבע',
  'חדר נעים עם חלון לגינה',
];

const TYPE_SPEED = 80;   // ms per keystroke while typing
const ERASE_SPEED = 40;  // ms per keystroke while erasing
const HOLD_AFTER_TYPE = 1500; // ms to hold a full phrase before erasing
const HOLD_AFTER_ERASE = 250; // ms after fully erased before next phrase

export function useTypewriterPlaceholder(active = true) {
  const [text, setText] = useState('');
  const idxRef = useRef(0);          // index of current example phrase
  const charRef = useRef(0);        // number of chars currently shown
  const modeRef = useRef('typing'); // 'typing' | 'holding' | 'erasing' | 'paused'
  const timerRef = useRef(null);

  useEffect(() => {
    if (!active) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setText('');
      return;
    }

    const tick = () => {
      const phrase = EXAMPLES[idxRef.current % EXAMPLES.length];
      const mode = modeRef.current;

      if (mode === 'typing') {
        if (charRef.current < phrase.length) {
          charRef.current += 1;
          setText(phrase.slice(0, charRef.current));
          timerRef.current = setTimeout(tick, TYPE_SPEED);
        } else {
          modeRef.current = 'holding';
          timerRef.current = setTimeout(tick, HOLD_AFTER_TYPE);
        }
      } else if (mode === 'holding') {
        modeRef.current = 'erasing';
        timerRef.current = setTimeout(tick, ERASE_SPEED);
      } else if (mode === 'erasing') {
        if (charRef.current > 0) {
          charRef.current -= 1;
          setText(phrase.slice(0, charRef.current));
          timerRef.current = setTimeout(tick, ERASE_SPEED);
        } else {
          modeRef.current = 'paused';
          idxRef.current += 1;
          timerRef.current = setTimeout(tick, HOLD_AFTER_ERASE);
        }
      } else if (mode === 'paused') {
        modeRef.current = 'typing';
        tick();
      }
    };

    modeRef.current = 'typing';
    charRef.current = 0;
    setText('');
    tick();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [active]);

  return text;
}