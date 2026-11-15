import { useCallback, useEffect, useMemo, useRef } from 'react';

/** Cancel transport and reject stale completions, even if a transport ignores abort. */
export function useRequestScope() {
  const version = useRef(0);
  const controller = useRef(null);
  const cancel = useCallback(() => {
    version.current += 1;
    controller.current?.abort();
    controller.current = null;
  }, []);
  const begin = useCallback(() => {
    cancel();
    const current = version.current;
    controller.current = new AbortController();
    return { signal: controller.current.signal, isCurrent: () => current === version.current };
  }, [cancel]);
  useEffect(() => cancel, [cancel]);
  return useMemo(() => ({ begin, cancel }), [begin, cancel]);
}
