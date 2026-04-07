import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Generic loading/error/data hook for GET fetches.
 * `loadFn` may change every render; latest ref is used so deps stay stable.
 */
export function useAsyncResource(loadFn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const loadFnRef = useRef(loadFn);
  loadFnRef.current = loadFn;

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await loadFnRef.current();
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload };
}
