import { useCallback, useEffect, useRef, useState } from "react";
import { customerInteractionService } from "../services/customerInteractionService";
import type {
  CustomerInteractionProgress,
  CustomerInteractionResult,
} from "../types/customerInteraction";
import { EMPTY_INTERACTION_COUNTS } from "../utils/customerInteractionHelpers";

const EMPTY_RESULT: CustomerInteractionResult = {
  interactions: [],
  counts: { ...EMPTY_INTERACTION_COUNTS },
  eventCount: 0,
  source: "live",
  subscriberLookupUsed: false,
  eventsLive: false,
  warnings: [],
};

export function useCustomerInteractions(
  subscriberId: string | number | undefined,
  customerRecord?: Record<string, unknown> | null,
) {
  const [result, setResult] = useState<CustomerInteractionResult>(EMPTY_RESULT);
  const [progress, setProgress] = useState<CustomerInteractionProgress>({
    phase: "lookup",
    checked: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const load = useCallback(
    async (skipCache = false) => {
      const requestId = ++requestIdRef.current;
      const isStale = () => requestIdRef.current !== requestId;

      if (!subscriberId) {
        setResult(EMPTY_RESULT);
        setProgress({ phase: "lookup", checked: 0, total: 0 });
        setIsLoading(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      setProgress({ phase: "lookup", checked: 0, total: 0 });

      try {
        const next = await customerInteractionService.getCustomerInteractions({
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
            : "Failed to load customer interactions",
        );
        setResult(EMPTY_RESULT);
      } finally {
        if (!isStale()) setIsLoading(false);
      }
    },
    [subscriberId, customerRecord],
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
