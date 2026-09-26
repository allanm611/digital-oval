import { useCallback, useEffect, useState } from "react";
import { customerEventService } from "../services/customerEventService";
import type {
  CommunicationChannelOption,
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

export function useCustomerEvents(
  subscriberId: string | number | undefined,
  customerRecord?: Record<string, unknown> | null,
) {
  const [result, setResult] = useState<CustomerEventListResult>(EMPTY_RESULT);
  const [trackingSources, setTrackingSources] = useState<TrackingSourceOption[]>(
    [],
  );
  const [communicationChannels, setCommunicationChannels] = useState<
    CommunicationChannelOption[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCatalogs = useCallback(async () => {
    const [sources, channels] = await Promise.all([
      customerEventService.getTrackingSourceOptions().catch(() => []),
      customerEventService.getCommunicationChannelOptions().catch(() => []),
    ]);
    setTrackingSources(sources);
    setCommunicationChannels(channels);
  }, []);

  const load = useCallback(async () => {
    if (!subscriberId) {
      setResult(EMPTY_RESULT);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const eventsResult = await customerEventService.getSubscriberEvents(
        subscriberId,
        {},
        { customerRecord },
      );
      setResult(eventsResult);
    } catch (err) {
      const message =
        err instanceof Error && err.message.trim()
          ? err.message
          : "Unable to load customer events. Please try again.";
      setError(message);
      setResult(EMPTY_RESULT);
    } finally {
      setIsLoading(false);
    }
  }, [subscriberId, customerRecord]);

  const refetch = useCallback(async () => {
    await Promise.all([loadCatalogs(), load()]);
  }, [loadCatalogs, load]);

  useEffect(() => {
    void loadCatalogs();
  }, [loadCatalogs]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    result,
    trackingSources,
    communicationChannels,
    isLoading,
    error,
    refetch,
  };
}
