import { useState, useEffect, useCallback } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AsyncFunction<T> = (...args: any[]) => Promise<T>;

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

function useAsyncTask<T>(
  asyncFunction: AsyncFunction<T>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...args: any[]
): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async () => {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await asyncFunction(...args);
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState({ data: null, loading: false, error: error as Error });
    }
  }, [args, asyncFunction]);

  useEffect(() => {
    console.log("Async task");
    execute();
  }, [execute]);

  return state;
}

export default useAsyncTask;
