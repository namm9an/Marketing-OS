import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

// An explanation is one visit, even when the visitor switches specialists inside it.
// The underlying Results or dossier URL stays shareable.
export function useExplanation() {
  const [stage, setStage] = useState(null);
  const visit = useRef(null);
  const pendingBack = useRef(null);
  const heading = useRef(null);

  useEffect(() => {
    let frame;
    function sync() {
      cancelAnimationFrame(frame);
      const previous = visit.current;
      const entry = window.history.state?.explanation;
      if (entry && previous && entry.key === previous.key
        && previous.href === window.location.href && previous.trigger.isConnected) {
        setStage(previous);
        return;
      }
      setStage(null);
      const pending = pendingBack.current;
      pendingBack.current = null;
      if (pending?.after && pending.href === window.location.href) {
        queueMicrotask(pending.after);
      } else if (previous?.href === window.location.href && !pending?.skipFocus) {
        frame = requestAnimationFrame(() => {
          if (previous.href !== window.location.href || window.history.state?.explanation) return;
          if (previous.trigger.isConnected) {
            window.scrollTo({ top: previous.y, behavior: 'instant' });
            if (previous.panel) previous.panel.scrollTop = previous.panelTop;
            previous.trigger.focus({ preventScroll: true });
          }
        });
      }
    }
    window.addEventListener('popstate', sync);
    window.addEventListener('hashchange', sync);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('popstate', sync);
      window.removeEventListener('hashchange', sync);
    };
  }, []);

  useLayoutEffect(() => {
    if (stage) heading.current?.focus();
  }, [stage]);

  const open = (agent, trigger, surface) => {
    if (pendingBack.current) return;
    const panel = trigger.closest('dialog');
    const active = window.history.state?.explanation;
    const next = {
      agent, surface, trigger, href: window.location.href, y: window.scrollY,
      panel, panelTop: panel?.scrollTop, key: active?.key ?? performance.now(),
    };
    visit.current = next;
    if (!active) {
      window.history.pushState({ ...window.history.state, explanation: { key: next.key } }, '');
    }
    setStage(next);
  };

  const close = useCallback((after, skipFocus = false) => {
    if (skipFocus) visit.current = null;
    if (!window.history.state?.explanation) {
      after?.();
      return;
    }
    const navigating = Boolean(pendingBack.current);
    pendingBack.current = { after, skipFocus, href: window.location.href };
    if (!navigating) window.history.back();
  }, []);

  return { stage, open, close, heading };
}
