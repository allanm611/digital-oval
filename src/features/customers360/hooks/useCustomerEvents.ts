import { useCallback, useEffect, useState } from "react";
import { customerEventService } from "../services/customerEventService";
import type {
  CustomerEventListResult,
  TrackingSourceOption,
} from "../types/customerEvent";
import { EMPTY_EVENT_COUNTS } from "../utils/customerEventHelpers";

const EMPTY_RESULT: CustomerEventListResult = {
  events: [],
  allEvents: [],
  total: 0,
  counts: EMPTY_EVENT_COUNTS,
  facets: {
    event_types: [],
    tracking_sources: [],
    statuses: [],
    channels: [],
  },
  source: "fallback",
};

export function useCustomerEvents(subscriberId: string | number | undefined) {
  const [result, setResult] = useState<CustomerEventListResult>(EMPTY_RESULT);
  const [trackingSources, setTrackingSources] = useState<TrackingSourceOption[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!subscriberId) {
      setResult(EMPTY_RESULT);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [eventsResult, catalog] = await Promise.all([
        customerEventService.getSubscriberEvents(subscriberId, {
          time_preset: "all",
          limit: 500,
        }),
        customerEventService.getTrackingSourceOptions().catch(() => []),
      ]);
      setResult(eventsResult);
      setTrackingSources(catalog);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events");
      setResult(EMPTY_RESULT);
    } finally {
      setIsLoading(false);
    }
  }, [subscriberId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { result, trackingSources, isLoading, error, refetch: load };
}
