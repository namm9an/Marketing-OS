import React, { useState, useEffect, Suspense } from 'react';
import Lenis from 'lenis';
import StickySystemHeader from './components/showcase/StickySystemHeader';
import PublicCaseStudyPage from './components/showcase/PublicCaseStudyPage';

// Lazy load the full interactive workbench so the public case study bundle stays micro-lightweight
const InteractiveConsole = React.lazy(() => import('./components/console/InteractiveConsole'));

export default function App() {
  const [currentRoute, setCurrentRoute] = useState(() => {
    return window.location.pathname.startsWith('/console') ? 'console' : 'case-study';
  });

  // Smooth inertial scrolling with Lenis for the public product showcase
  useEffect(() => {
    if (currentRoute !== 'case-study') return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
      touchMultiplier: 2,
    });

    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, [currentRoute]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname.startsWith('/console')) {
        setCurrentRoute('console');
      } else {
        setCurrentRoute('case-study');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateToConsole = () => {
    window.history.pushState({}, '', '/console');
    setCurrentRoute('console');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToCaseStudy = () => {
    window.history.pushState({}, '', '/');
    setCurrentRoute('case-study');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (currentRoute === 'console') {
    return (
      <div className="min-h-screen bg-[#FBF9F5]">
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center font-mono text-xs text-[#4A505C]">
              Initializing Operational Console...
            </div>
          }
        >
          <InteractiveConsole onBackToCaseStudy={navigateToCaseStudy} />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F5F1] text-[#111315]">
      <StickySystemHeader onOpenConsole={navigateToConsole} isConsoleActive={false} />
      <main>
        <PublicCaseStudyPage onOpenConsole={navigateToConsole} />
      </main>
    </div>
  );
}
