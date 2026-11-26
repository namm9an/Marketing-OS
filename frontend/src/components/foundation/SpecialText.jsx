import { useEffect, useState } from 'react';
import { useMediaQuery } from '../../lib/useMediaQuery';

const GLYPHS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz0123456789';

function scrambleText(text, progress, tickOffset) {
  const locked = Math.floor(Math.max(0, Math.min(1, progress)) * text.length);
  let next = '';
  for (let index = 0; index < text.length; index += 1) {
    const ch = text[index];
    if (index < locked || /\s|[^\w]/.test(ch)) {
      next += ch;
    } else {
      const seed = (index * 7 + Math.max(0, tickOffset)) % GLYPHS.length;
      next += GLYPHS[seed];
    }
  }
  return next;
}

/**
 * Subtle single-pass decode reveal for short labels and kickers.
 * Immediately settles when reduced motion is preferred.
 */
export default function SpecialText({ children, className = '', durationMs = 200 }) {
  const text = String(children ?? '');
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [display, setDisplay] = useState(() => (reduced || !text ? text : scrambleText(text, 0, 1)));

  useEffect(() => {
    if (reduced || !text) return;

    let frame = null;
    const start = performance.now();
    const safeDuration = Number.isFinite(durationMs) && durationMs > 0 ? durationMs : 200;
    const total = Math.max(80, safeDuration);

    function step(now) {
      const elapsed = Math.max(0, now - start);
      const progress = Math.max(0, Math.min(1, elapsed / total));
      if (progress >= 1) {
        setDisplay(text);
        return;
      }
      setDisplay(scrambleText(text, progress, Math.floor(elapsed / 28)));
      frame = window.requestAnimationFrame(step);
    }

    setDisplay(scrambleText(text, 0, 1));
    frame = window.requestAnimationFrame(step);
    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, [durationMs, reduced, text]);

  return <span className={className}>{reduced || !text ? text : display}</span>;
}
