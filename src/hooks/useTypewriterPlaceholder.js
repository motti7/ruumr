import {useRoomLocale} from '@/lib/room-i18n';
import { useEffect, useRef, useState } from 'react';

const EXAMPLES_HE = [
  'חדר מואר בדירת שותפים',
  'חדר מרווח עם מרפסת בפלורנטין',
  'חדר שקט בדירה בשכונת נווה עוזר',
  'חדר ענק בדירה עם מזגן בבאר שבע',
  'חדר בדירת גג בלב תל אביב',
  'חדר נעים עם חלון לגינה בכרמל',
  'חדר פינתי בדירת שותפים ביפו',
];

const EXAMPLES_EN = [
  'Bright room in a shared apartment',
  'Spacious room with a balcony in Drumcondra',
  'Quiet room in a flat in Rathmines',
  'Large room with heating in Phibsborough',
  'Cosy room in a top-floor flat in Smithfield',
  'Pleasant room with a garden view in Ranelagh',
  'Corner room in a flatshare in Stoneybatter',
];

const TYPE_SPEED = 80;   // ms per keystroke while typing
const ERASE_SPEED = 40;  // ms per keystroke while erasing
const HOLD_AFTER_TYPE = 1500; // ms to hold a full phrase before erasing
const HOLD_AFTER_ERASE = 250; // ms after fully erased before next phrase

export function useTypewriterPlaceholder(active = true) {
  const language=useRoomLocale();
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

    const examples = language === 'he' ? EXAMPLES_HE : EXAMPLES_EN;
    const tick = () => {
      const phrase = examples[idxRef.current % examples.length];
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
  }, [active, language]);

  return text;
}