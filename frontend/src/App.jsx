import React, { useState, useEffect, Suspense } from 'react';
import { LenisProvider } from './context/LenisContext';
import StickySystemHeader from './components/showcase/StickySystemHeader';
import PublicCaseStudyPage from './components/showcase/PublicCaseStudyPage';

// Lazy load the full interactive workbench so the public case study bundle stays micro-lightweight
const InteractiveConsole = React.lazy(() => import('./components/console/InteractiveConsole'));
const PageFoundation = React.lazy(() => import('./components/foundation/PageFoundation'));
const MotionStudy = React.lazy(() => import('./components/foundation/MotionStudy'));

const routeFor = () => window.location.pathname.startsWith('/console') ? 'console'
  : window.location.pathname.startsWith('/preview/f03/motion') ? 'motion-study'
    : window.location.pathname.startsWith('/preview/f03') ? 'foundation' : 'case-study';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState(routeFor);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(routeFor());
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

  if (currentRoute === 'foundation' || currentRoute === 'motion-study') {
    return <Suspense fallback={<p role="status">Loading preview…</p>}>
      {currentRoute === 'foundation'
        ? <LenisProvider><PageFoundation onOpenConsole={navigateToConsole} /></LenisProvider>
        : <MotionStudy />}
    </Suspense>;
  }

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
    <LenisProvider enabled={currentRoute === 'case-study'}>
      <div className="min-h-screen bg-[#F6F5F1] text-[#111315]">
        <StickySystemHeader onOpenConsole={navigateToConsole} isConsoleActive={false} />
        <main>
          <PublicCaseStudyPage onOpenConsole={navigateToConsole} />
        </main>
      </div>
    </LenisProvider>
  );
}
