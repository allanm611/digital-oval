import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { customerSubscribedListService } from "../services/customerSubscribedListService";
import type {
  CustomerSubscribedListProgress,
  CustomerSubscribedListResult,
} from "../types/customerSubscribedList";
import { collectCustomerIdentifiers } from "../utils/customerSubscribedListHelpers";

const EMPTY_RESULT: CustomerSubscribedListResult = {
  memberships: [],
  systemQuickListCount: 0,
  checkedCount: 0,
  failedCheckCount: 0,
  identifierCount: 0,
  source: "live",
  warnings: [],
};

export function useCustomerSubscribedLists(
  subscriberId: string | number | undefined,
  customerRecord?: Record<string, unknown> | null,
) {
  const [result, setResult] = useState<CustomerSubscribedListResult>(EMPTY_RESULT);
  const [progress, setProgress] = useState<CustomerSubscribedListProgress>({
    checked: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const identifierKey = useMemo(() => {
    const identifiers = collectCustomerIdentifiers(customerRecord, subscriberId);
    return JSON.stringify(identifiers);
  }, [customerRecord, subscriberId]);

  const load = useCallback(
    async (skipCache = false) => {
      const requestId = ++requestIdRef.current;
      const isStale = () => requestIdRef.current !== requestId;

      if (!subscriberId) {
        setResult(EMPTY_RESULT);
        setProgress({ checked: 0, total: 0 });
        setIsLoading(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      setProgress({ checked: 0, total: 0 });

      try {
        const next = await customerSubscribedListService.getSubscribedLists({
          subscriberId,
          customerRecord,
          skipCache,
          onProgress: (value) => {
            if (!isStale()) setProgress(value);
          },
          isAborted: isStale,
        });
        if (!isStale()) {
          setResult(next);
        }
      } catch (err) {
        if (isStale()) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load subscribed lists",
        );
        setResult(EMPTY_RESULT);
      } finally {
        if (!isStale()) setIsLoading(false);
      }
    },
    [subscriberId, customerRecord, identifierKey],
  );

  useEffect(() => {
    void load(false);
    return () => {
      requestIdRef.current += 1;
    };
  }, [load]);

  const refetch = useCallback(() => {
    void load(true);
  }, [load]);

  return { result, progress, isLoading, error, refetch };
}
