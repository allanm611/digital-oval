import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { customerPreferenceService } from "../services/customerPreferenceService";
import type {
  CustomerPreferenceProgress,
  CustomerPreferenceResult,
} from "../types/customerPreference";
import {
  EMPTY_PREFERENCE_COUNTS,
  EMPTY_PREFERENCE_SETTINGS,
} from "../utils/customerPreferenceHelpers";
import { collectCustomerIdentifiers } from "../utils/customerSubscribedListHelpers";

const EMPTY_RESULT: CustomerPreferenceResult = {
  settings: {
    ...EMPTY_PREFERENCE_SETTINGS,
    contentCategories: [],
    evidence: [],
  },
  channels: [],
  consents: [],
  counts: { ...EMPTY_PREFERENCE_COUNTS },
  eventCount: 0,
  source: "live",
  subscriberLookupUsed: false,
  eventsLive: false,
  warnings: [],
};

export function useCustomerPreferences(
  subscriberId: string | number | undefined,
  customerRecord?: Record<string, unknown> | null,
) {
  const [result, setResult] = useState<CustomerPreferenceResult>(EMPTY_RESULT);
  const [progress, setProgress] = useState<CustomerPreferenceProgress>({
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
        const next = await customerPreferenceService.getCustomerPreferences({
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
            : "Failed to load customer preferences",
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
