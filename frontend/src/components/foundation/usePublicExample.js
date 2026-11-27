import { useEffect, useState } from 'react';

export function usePublicExample(catalog, agent) {
  const [example, setExample] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    catalog.load(agent).then(result => {
      if (active) setExample({ catalog, agent, result });
    });
    return () => { active = false; };
  }, [agent, catalog, attempt]);

  function retry() {
    setExample(null);
    setAttempt(previous => previous + 1);
  }

  const current = example?.agent === agent && example.catalog === catalog ? example.result : null;
  return { current, retry };
}
