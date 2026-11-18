import React, { useState, useEffect, Suspense } from 'react';
import { LenisProvider } from './context/LenisContext';
import StickySystemHeader from './components/showcase/StickySystemHeader';
import PublicCaseStudyPage from './components/showcase/PublicCaseStudyPage';

// Lazy load the full interactive workbench so the public case study bundle stays micro-lightweight
const InteractiveConsole = React.lazy(() => import('./components/console/InteractiveConsole'));
const PageFoundation = React.lazy(() => import('./components/foundation/PageFoundation'));
const MotionStudy = React.lazy(() => import('./components/foundation/MotionStudy'));
const ConnectedFoundation = React.lazy(() => import('./components/foundation/ConnectedFoundation'));

class ConnectedPreviewBoundary extends React.Component {
  state = { failed: false };

  static getDerivedStateFromError() { return { failed: true }; }

  render() {
    if (this.state.failed) return <main className="p-6">
      <h1>The preview couldn’t open</h1>
      <button type="button" className="underline mr-4" onClick={() => window.location.reload()}>Reload preview</button>
      <a className="underline" href="/">Open the showcase</a>
    </main>;
    return this.props.children;
  }
}

const routeFor = () => window.location.pathname.startsWith('/console') ? 'console'
  : window.location.pathname.replace(/\/$/, '') === '/preview/f03/connected' ? 'connected-foundation'
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
    const fromConnectedPreview = currentRoute === 'connected-foundation';
    window.history.pushState({ fromConnectedPreview }, '', '/console');
    setCurrentRoute('console');
    window.scrollTo({ top: 0, behavior: fromConnectedPreview ? 'instant' : 'smooth' });
  };

  const navigateToCaseStudy = () => {
    if (window.history.state?.fromConnectedPreview) {
      window.history.back();
      return;
    }
    window.history.pushState({}, '', '/');
    setCurrentRoute('case-study');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (currentRoute === 'connected-foundation') {
    return <ConnectedPreviewBoundary>
      <Suspense fallback={<main aria-busy="true"><p role="status">Loading the showcase…</p></main>}>
        <ConnectedFoundation onOpenConsole={navigateToConsole} />
      </Suspense>
    </ConnectedPreviewBoundary>;
  }

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
