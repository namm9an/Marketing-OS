import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import Lenis from 'lenis';
import { useMediaQuery } from '../lib/useMediaQuery';

export const LenisContext = createContext(null);
export const NavScrollContext = createContext({
  lenis: null,
  isNavCrossing: false,
  activeSection: 'section-hero',
  scrollToSection: () => {},
});

export function useLenis() {
  const ctx = useContext(NavScrollContext);
  return ctx?.lenis ?? null;
}

export function useNavScroll() {
  return useContext(NavScrollContext);
}

export function LenisProvider({ children, enabled = true }) {
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [lenis, setLenis] = useState(null);
  const [isNavCrossing, setIsNavCrossing] = useState(false);
  const [activeSection, setActiveSection] = useState('section-hero');
  const isNavCrossingRef = useRef(false);

  // Sync ref with state for instant synchronous checks in event listeners
  useEffect(() => {
    isNavCrossingRef.current = isNavCrossing;
  }, [isNavCrossing]);

  // Hand control back immediately if user uses the mouse wheel or touch gesture during a nav scroll
  useEffect(() => {
    const handleUserInterrupt = () => {
      if (isNavCrossingRef.current) {
        setIsNavCrossing(false);
      }
    };

    window.addEventListener('wheel', handleUserInterrupt, { passive: true });
    window.addEventListener('touchmove', handleUserInterrupt, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleUserInterrupt);
      window.removeEventListener('touchmove', handleUserInterrupt);
    };
  }, []);

  // Native and smooth scrolling share the same navigation tracking.
  useEffect(() => {
    // Track active section on scroll to update nav link highlighting
    const updateActiveSection = () => {
      const sections = ['section-hero', 'section-workflows', 'section-specialists', 'section-benchmarks'];
      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;

      // Bottom of page activates the final benchmarks section
      if (scrollY + viewportHeight >= docHeight - 60) {
        setActiveSection('section-benchmarks');
        return;
      }

      const navOffset = 56 + 80; // navbar height (56px) + activation buffer
      let current = 'section-hero';
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const top = el.getBoundingClientRect().top;
          if (top <= navOffset) {
            current = id;
          }
        }
      }
      setActiveSection(current);
    };

    window.addEventListener('scroll', updateActiveSection, { passive: true });
    updateActiveSection();
    return () => window.removeEventListener('scroll', updateActiveSection);
  }, []);

  // Initialize Lenis instance
  useEffect(() => {
    if (!enabled || reducedMotion) {
      setLenis(null);
      setIsNavCrossing(false);
      return;
    }

    const instance = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
      touchMultiplier: 2,
    });

    setLenis(instance);

    let rafId;
    function raf(time) {
      instance.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);


    return () => {
      cancelAnimationFrame(rafId);
      instance.destroy();
      setLenis(null);
    };
  }, [enabled, reducedMotion]);

  // Programmatic Section Scroll with distance scaling and easeInOutCubic
  const scrollToSection = useCallback(
    (target, options = {}) => {
      const navbarHeight = 56;
      const currentScrollY = window.scrollY;
      const viewportHeight = window.innerHeight || 1;

      let targetY = 0;
      let targetSelector = null;
      let targetHash = '';

      if (target === 0 || target === 'top' || target === '#') {
        targetY = 0;
        targetSelector = 0;
        targetHash = '';
      } else if (typeof target === 'string') {
        targetHash = target.startsWith('#') ? target : `#${target}`;
        const el = document.querySelector(targetHash);
        if (!el) {
          console.warn(`Target ${target} not found`);
          return;
        }
        const rect = el.getBoundingClientRect();
        targetY = Math.max(0, rect.top + currentScrollY - navbarHeight);
        targetSelector = targetHash;
      } else if (target instanceof HTMLElement) {
        const rect = target.getBoundingClientRect();
        targetY = Math.max(0, rect.top + currentScrollY - navbarHeight);
        targetSelector = target;
        targetHash = target.id ? `#${target.id}` : '';
      }

      const distancePx = Math.abs(targetY - currentScrollY);
      const distanceInViewportHeights = distancePx / viewportHeight;

      // Check prefers-reduced-motion
      const prefersReducedMotion =
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

      // Duration formula: clamp(0.9, 0.9 + distanceInViewportHeights * 0.12, 2.2) seconds
      const computedDuration = prefersReducedMotion
        ? 0
        : Math.min(2.2, Math.max(0.9, 0.9 + distanceInViewportHeights * 0.12));

      // Easing: easeInOutCubic (slow start, fast middle, slow end)
      const easeInOutCubic = (t) => {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      };

      // Determine if this scroll path crosses the 600vh pinned dossier cascade
      const cascadeEl = document.getElementById('section-dossier-cascade');
      let crossesDeck = false;
      if (cascadeEl) {
        const cascadeRect = cascadeEl.getBoundingClientRect();
        const cascadeTop = cascadeRect.top + currentScrollY;
        const cascadeBottom = cascadeTop + cascadeEl.offsetHeight;

        const minScroll = Math.min(currentScrollY, targetY);
        const maxScroll = Math.max(currentScrollY, targetY);

        if (minScroll < cascadeBottom && maxScroll > cascadeTop && distanceInViewportHeights > 1.0) {
          crossesDeck = true;
        }
      }

      if (crossesDeck && !prefersReducedMotion && lenis) {
        setIsNavCrossing(true);
      }

      if (!lenis) {
        setIsNavCrossing(false);
        window.scrollTo({
          top: targetY,
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
        });
        history.replaceState(null, '', targetHash || window.location.pathname);
        options.onComplete?.();
        return;
      }

      lenis.scrollTo(targetSelector === 0 ? 0 : targetSelector, {
        offset: targetSelector === 0 ? 0 : -navbarHeight,
        duration: computedDuration,
        easing: easeInOutCubic,
        immediate: prefersReducedMotion,
        lock: false,
        onComplete: () => {
          setIsNavCrossing(false);
          if (targetHash) {
            history.replaceState(null, '', targetHash);
          } else {
            history.replaceState(null, '', window.location.pathname);
          }
          options.onComplete?.();
        },
      });
    },
    [lenis]
  );

  const contextValue = {
    lenis,
    isNavCrossing,
    setIsNavCrossing,
    activeSection,
    scrollToSection,
  };

  return (
    <NavScrollContext.Provider value={contextValue}>
      <LenisContext.Provider value={lenis}>
        {children}
      </LenisContext.Provider>
    </NavScrollContext.Provider>
  );
}
