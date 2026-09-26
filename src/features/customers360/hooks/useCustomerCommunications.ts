import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { customerCommunicationService } from "../services/customerCommunicationService";
import type {
  CustomerCommunicationProgress,
  CustomerCommunicationResult,
} from "../types/customerCommunication";
import { EMPTY_COMMUNICATION_COUNTS } from "../utils/customerCommunicationHelpers";
import { collectCustomerIdentifiers } from "../utils/customerSubscribedListHelpers";

const EMPTY_RESULT: CustomerCommunicationResult = {
  communications: [],
  counts: { ...EMPTY_COMMUNICATION_COUNTS },
  campaignCount: 0,
  broadcastCount: 0,
  eventCount: 0,
  source: "live",
  subscriberLookupUsed: false,
  eventsLive: false,
  warnings: [],
};

export function useCustomerCommunications(
  subscriberId: string | number | undefined,
  customerRecord?: Record<string, unknown> | null,
  refreshToken = 0,
) {
  const [result, setResult] = useState<CustomerCommunicationResult>(EMPTY_RESULT);
  const [progress, setProgress] = useState<CustomerCommunicationProgress>({
    phase: "lookup",
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
        setProgress({ phase: "lookup", checked: 0, total: 0 });
        setIsLoading(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      setProgress({ phase: "lookup", checked: 0, total: 0 });

      try {
        const next =
          await customerCommunicationService.getCustomerCommunications({
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
            : "Failed to load customer communications",
        );
        setResult(EMPTY_RESULT);
      } finally {
        if (!isStale()) setIsLoading(false);
      }
    },
    [subscriberId, customerRecord, identifierKey, refreshToken],
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
