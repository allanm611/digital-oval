import { useCallback, useEffect, useRef, useState } from "react";
import { customerOfferService } from "../services/customerOfferService";
import type {
  CustomerOfferProgress,
  CustomerOfferResult,
} from "../types/customerOffer";
import { EMPTY_OFFER_COUNTS } from "../utils/customerOfferHelpers";

const EMPTY_RESULT: CustomerOfferResult = {
  offers: [],
  counts: { ...EMPTY_OFFER_COUNTS },
  campaignCount: 0,
  segmentCount: 0,
  eventCount: 0,
  source: "live",
  subscriberLookupUsed: false,
  eventsLive: false,
  warnings: [],
};

export function useCustomerOffers(
  subscriberId: string | number | undefined,
  customerRecord?: Record<string, unknown> | null,
) {
  const [result, setResult] = useState<CustomerOfferResult>(EMPTY_RESULT);
  const [progress, setProgress] = useState<CustomerOfferProgress>({
    phase: "audience",
    checked: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isEnriching, setIsEnriching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const load = useCallback(
    async (skipCache = false) => {
      const requestId = ++requestIdRef.current;
      const isStale = () => requestIdRef.current !== requestId;

      if (!subscriberId) {
        setResult(EMPTY_RESULT);
        setProgress({ phase: "audience", checked: 0, total: 0 });
        setIsLoading(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setIsEnriching(false);
      setError(null);
      setProgress({ phase: "audience", checked: 0, total: 0 });
      let hasPartial = false;

      try {
        const next = await customerOfferService.getCustomerOffers({
          subscriberId,
          customerRecord,
          skipCache,
          onProgress: (value) => {
            if (!isStale()) {
              setProgress(value);
              if (value.phase === "catalog" && value.total > value.checked) {
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
          err instanceof Error ? err.message : "Failed to load customer offers",
        );
        if (!hasPartial) setResult(EMPTY_RESULT);
      } finally {
        if (!isStale()) {
          setIsLoading(false);
          setIsEnriching(false);
        }
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

  return { result, progress, isLoading, isEnriching, error, refetch };
}
