import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { customerSegmentService } from "../services/customerSegmentService";
import type {
  CustomerSegmentProgress,
  CustomerSegmentResult,
} from "../types/customerSegment";
import { collectCustomerIdentifiers } from "../utils/customerSubscribedListHelpers";

const EMPTY_RESULT: CustomerSegmentResult = {
  memberships: [],
  audienceCampaigns: [],
  systemSegmentCount: 0,
  checkedCount: 0,
  failedCheckCount: 0,
  identifierCount: 0,
  source: "live",
  reverseLookupUsed: false,
  warnings: [],
};

export function useCustomerSegments(
  subscriberId: string | number | undefined,
  customerRecord?: Record<string, unknown> | null,
) {
  const [result, setResult] = useState<CustomerSegmentResult>(EMPTY_RESULT);
  const [progress, setProgress] = useState<CustomerSegmentProgress>({
    phase: "segments",
    checked: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isEnriching, setIsEnriching] = useState(false);
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
        setProgress({ phase: "segments", checked: 0, total: 0 });
        setIsLoading(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setIsEnriching(false);
      setError(null);
      setProgress({ phase: "segments", checked: 0, total: 0 });
      let hasPartial = false;

      try {
        const next = await customerSegmentService.getCustomerSegments({
          subscriberId,
          customerRecord,
          skipCache,
          onProgress: (value) => {
            if (!isStale()) {
              setProgress(value);
              if (value.phase === "campaigns" && value.total > value.checked) {
                setIsEnriching(true);
              }
            }
          },
          onPartial: (partial) => {
            if (isStale()) return;
            hasPartial = true;
            setResult(partial);
            setIsLoading(false);
          },
          isAborted: isStale,
        });
        if (!isStale()) {
          setResult(next);
          setIsEnriching(false);
        }
      } catch (err) {
        if (isStale()) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(
          err instanceof Error ? err.message : "Failed to load customer segments",
        );
        if (!hasPartial) setResult(EMPTY_RESULT);
      } finally {
        if (!isStale()) {
          setIsLoading(false);
          setIsEnriching(false);
        }
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

  return { result, progress, isLoading, isEnriching, error, refetch };
}
