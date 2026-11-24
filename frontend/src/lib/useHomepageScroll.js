import { useLayoutEffect } from 'react';
import Lenis from 'lenis';
import { useMediaQuery } from './useMediaQuery';
import './homepage-scroll.css';

const desktopMotion = '(min-width: 861px) and (pointer: fine) and (prefers-reduced-motion: no-preference)';
const openDialog = 'dialog[open], [role="dialog"][aria-modal="true"]';
const scrollKeys = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ']);

export function useHomepageScroll() {
  const enabled = useMediaQuery(desktopMotion);

  useLayoutEffect(() => {
    if (!enabled) return;
    const lenis = new Lenis({
      smoothWheel: true,
      syncTouch: false,
      anchors: false,
      lerp: 0.15,
      prevent: element => element.matches(openDialog),
    });
    let frame = null;

    function cancelFrame() {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
    }

    function tick(time) {
      frame = null;
      lenis.raf(time);
      if (lenis.isScrolling === 'smooth') frame = requestAnimationFrame(tick);
    }

    const unsubscribe = lenis.on('virtual-scroll', ({ event }) => {
      if (event.type !== 'wheel' || event.ctrlKey || frame !== null || lenis.isStopped) return;
      // Restart the clock at the current time so the first frame after an idle gap still glides.
      lenis.raf(performance.now());
      frame = requestAnimationFrame(tick);
    });

    function syncDialog() {
      if (document.querySelector(openDialog)) {
        cancelFrame();
        lenis.stop();
      } else {
        lenis.start();
      }
    }

    function interruptGlide() {
      if (lenis.isScrolling !== 'smooth') return;
      cancelFrame();
      lenis.stop();
      lenis.start();
    }

    function followLink(event) {
      if (event.target instanceof Element && event.target.closest('a[href]')) interruptGlide();
    }

    function useNativeKeys(event) {
      if (scrollKeys.has(event.key)) interruptGlide();
    }

    const dialogObserver = new MutationObserver(syncDialog);
    dialogObserver.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['open', 'aria-modal'],
    });
    syncDialog();
    window.addEventListener('click', followLink, true);
    window.addEventListener('keydown', useNativeKeys, true);
    window.addEventListener('hashchange', interruptGlide);
    window.addEventListener('popstate', interruptGlide);

    return () => {
      dialogObserver.disconnect();
      window.removeEventListener('click', followLink, true);
      window.removeEventListener('keydown', useNativeKeys, true);
      window.removeEventListener('hashchange', interruptGlide);
      window.removeEventListener('popstate', interruptGlide);
      cancelFrame();
      unsubscribe();
      lenis.destroy();
    };
  }, [enabled]);
}
