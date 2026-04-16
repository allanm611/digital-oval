import { useRef } from "react";

/**
 * Custom hook for Suspense-compatible data fetching
 * Throws a promise while data is loading, allowing Suspense to catch it
 * Returns data when ready
 */
export function useSuspenseData<T>(
  fetchFn: () => Promise<T>,
  _dependencies: React.DependencyList = []
): T {
  const cacheRef = useRef<{ data?: T; error?: Error; status: "pending" | "success" | "error" }>({
    status: "pending",
  });

  // If we have cached data, return it immediately
  if (cacheRef.current.status === "success" && cacheRef.current.data !== undefined) {
    return cacheRef.current.data;
  }

  // If there was an error, throw it
  if (cacheRef.current.status === "error" && cacheRef.current.error) {
    throw cacheRef.current.error;
  }

  // If pending, throw the promise to trigger Suspense
  if (cacheRef.current.status === "pending") {
    throw fetchFn()
      .then((data) => {
        cacheRef.current.data = data;
        cacheRef.current.status = "success";
      })
      .catch((error) => {
        cacheRef.current.error = error;
        cacheRef.current.status = "error";
        throw error;
      });
  }

  // Fallback (should not reach here)
  throw new Error("Unexpected state in useSuspenseData");
}

/**
 * Alternative: Pre-fetch data outside of render
 * Returns a resource that can be read later with useResource
 */
export function createResource<T>(
  fetchFn: () => Promise<T>
): {
  read: () => T;
  preload: () => void;
} {
  let status: "pending" | "success" | "error" = "pending";
  let result: T | Error | Promise<T> = fetchFn();

  return {
    read() {
      if (status === "success") {
        return result as T;
      }
      if (status === "error") {
        throw result;
      }
      throw (result as Promise<T>)
        .then((res) => {
          status = "success";
          result = res;
          return res;
        })
        .catch((err) => {
          status = "error";
          result = err;
          throw err;
        });
    },
    preload() {
      this.read();
    },
  };
}

/**
 * Hook to use a resource created with createResource
 */
export function useResource<T>(resource: ReturnType<typeof createResource<T>>): T {
  return resource.read();
}
