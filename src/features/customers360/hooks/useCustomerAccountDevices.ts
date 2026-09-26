import { useCallback, useEffect, useRef, useState } from "react";
import { customerAccountDeviceService } from "../services/customerAccountDeviceService";
import type {
  CustomerAccountDeviceProgress,
  CustomerAccountDeviceResult,
} from "../types/customerAccountDevice";
import {
  EMPTY_ACCOUNT_DEVICE_COUNTS,
  EMPTY_ACCOUNT_SNAPSHOT,
} from "../utils/customerAccountDeviceHelpers";

const EMPTY_RESULT: CustomerAccountDeviceResult = {
  snapshot: { ...EMPTY_ACCOUNT_SNAPSHOT, evidence: [] },
  items: [],
  counts: { ...EMPTY_ACCOUNT_DEVICE_COUNTS },
  eventCount: 0,
  source: "live",
  subscriberLookupUsed: false,
  eventsLive: false,
  warnings: [],
};

export function useCustomerAccountDevices(
  subscriberId: string | number | undefined,
  customerRecord?: Record<string, unknown> | null,
) {
  const [result, setResult] = useState<CustomerAccountDeviceResult>(EMPTY_RESULT);
  const [progress, setProgress] = useState<CustomerAccountDeviceProgress>({
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
        const next = await customerAccountDeviceService.getCustomerAccountDevices({
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
            : "Failed to load account and device details",
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
