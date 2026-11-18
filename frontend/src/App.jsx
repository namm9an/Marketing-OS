import React, { useState, useEffect, Suspense } from 'react';

const InteractiveConsole = React.lazy(() => import('./components/console/InteractiveConsole'));
const ConnectedFoundation = React.lazy(() => import('./components/foundation/ConnectedFoundation'));

class ShowcaseBoundary extends React.Component {
  state = { failed: false };

  static getDerivedStateFromError() { return { failed: true }; }

  render() {
    if (this.state.failed) return <main className="p-6">
      <h1>The showcase couldn’t open</h1>
      <button type="button" className="underline mr-4" onClick={() => window.location.reload()}>Reload showcase</button>
      <a className="underline" href="/console">Open the console</a>
    </main>;
    return this.props.children;
  }
}

const isConsoleRoute = () => window.location.pathname === '/console' || window.location.pathname.startsWith('/console/');

export default function App() {
  const [inConsole, setInConsole] = useState(isConsoleRoute);

  useEffect(() => {
    const syncRoute = () => {
      const { pathname, search, hash } = window.location;
      if (pathname === '/preview/f03' || pathname.startsWith('/preview/f03/')) {
        window.history.replaceState(window.history.state, '', `/${search}${hash}`);
      }
      setInConsole(isConsoleRoute());
    };
    syncRoute();
    window.addEventListener('popstate', syncRoute);
    return () => window.removeEventListener('popstate', syncRoute);
  }, []);

  const navigateToConsole = () => {
    window.history.pushState({ fromShowcase: true }, '', '/console');
    setInConsole(true);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const navigateToShowcase = () => {
    if (window.history.state?.fromShowcase) {
      window.history.back();
      return;
    }
    window.history.pushState({}, '', '/');
    setInConsole(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  if (inConsole) {
    return (
      <div className="min-h-screen bg-[#FBF9F5]">
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center font-mono text-xs text-[#4A505C]">
              Initializing Operational Console...
            </div>
          }
        >
          <InteractiveConsole onBackToCaseStudy={navigateToShowcase} />
        </Suspense>
      </div>
    );
  }

  return (
    <ShowcaseBoundary>
      <Suspense fallback={<main aria-busy="true"><p role="status">Loading the showcase…</p></main>}>
        <ConnectedFoundation onOpenConsole={navigateToConsole} />
      </Suspense>
    </ShowcaseBoundary>
  );
}
