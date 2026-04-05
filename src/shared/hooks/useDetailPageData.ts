import { useEffect, useState } from "react";

interface UseDetailPageDataOptions<T> {
  id: number | undefined;
  fetchFn: (id: number) => Promise<T>;
  onError?: (error: Error) => void;
}

export const useDetailPageData = <T,>({
  id,
  fetchFn,
  onError,
}: UseDetailPageDataOptions<T>) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchFn(id);
        setData(result);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to load data";
        setError(errorMsg);
        onError?.(err instanceof Error ? err : new Error(errorMsg));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, fetchFn, onError]);

  return { data, loading, error };
};
