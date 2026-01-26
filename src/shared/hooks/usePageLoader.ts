import { useEffect, useRef } from "react";

/**
 * Hook to delay showing loading state until data actually takes time to load
 * Fixes UI flashing issues where loader shows then immediately disappears
 */
export function usePageLoader(isLoading: boolean, minDuration = 300) {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const startTimeRef = useRef<number>();

  useEffect(() => {
    if (isLoading) {
      startTimeRef.current = Date.now();
    } else {
      // Check if loading finished faster than minDuration
      if (startTimeRef.current) {
        const duration = Date.now() - startTimeRef.current;
        if (duration < minDuration) {
          // Loading was too fast, delay hiding the loader
          timeoutRef.current = setTimeout(() => {
            // Let component know it's safe to hide loader
          }, minDuration - duration);
        }
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isLoading, minDuration]);
}

/**
 * Hook to prefetch page data before navigation completes
 * Call this in the previous page to load next page's data early
 */
export function usePrefetchPageData<T>(
  fetchFn: () => Promise<T>,
  shouldPrefetch: boolean = true
): { isPrefetching: boolean; data: T | null } {
  const cacheRef = useRef<T | null>(null);
  const isPrefetchingRef = useRef(false);

  useEffect(() => {
    if (!shouldPrefetch) return;

    isPrefetchingRef.current = true;
    fetchFn()
      .then((data) => {
        cacheRef.current = data;
        isPrefetchingRef.current = false;
      })
      .catch(() => {
        isPrefetchingRef.current = false;
      });
  }, [shouldPrefetch, fetchFn]);

  return {
    isPrefetching: isPrefetchingRef.current,
    data: cacheRef.current,
  };
}

/**
 * Hook to show page layout skeleton while data loads
 * Renders immediately with skeleton, hides when data arrives
 */
export function useProgressivePageRender(
  dataLoaded: boolean,
  showSkeleton: boolean = true
) {
  const showSkeletonState = useRef(showSkeleton && !dataLoaded);

  useEffect(() => {
    if (dataLoaded) {
      showSkeletonState.current = false;
    }
  }, [dataLoaded]);

  return {
    showSkeleton: showSkeletonState.current,
    dataLoaded,
  };
}
