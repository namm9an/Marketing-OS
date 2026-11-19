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

const isConsoleRoute = path => path === '/console' || path.startsWith('/console/');

export default function App() {
  const [path, setPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const syncRoute = () => setPath(window.location.pathname);
    syncRoute();
    window.addEventListener('popstate', syncRoute);
    return () => window.removeEventListener('popstate', syncRoute);
  }, []);

  const navigateToConsole = () => {
    window.history.pushState({ fromShowcase: true }, '', '/console');
    setPath('/console');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const navigateToShowcase = () => {
    if (window.history.state?.fromShowcase) {
      window.history.back();
      return;
    }
    window.history.pushState({}, '', '/');
    setPath('/');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  if (isConsoleRoute(path)) {
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

  if (path !== '/') return (
    <main className="mx-auto max-w-5xl px-6 py-20">
      <h1 className="text-4xl font-semibold">Page not found</h1>
      <p className="mt-4">This address doesn’t lead to a page.</p>
      <div className="mt-8 flex flex-wrap gap-6">
        <a className="inline-flex min-h-11 items-center underline" href="/">Visit the homepage</a>
        <a className="inline-flex min-h-11 items-center underline" href="/console">Open the console</a>
      </div>
    </main>
  );

  return (
    <ShowcaseBoundary>
      <Suspense fallback={<main aria-busy="true"><p role="status">Loading the showcase…</p></main>}>
        <ConnectedFoundation onOpenConsole={navigateToConsole} />
      </Suspense>
    </ShowcaseBoundary>
  );
}
