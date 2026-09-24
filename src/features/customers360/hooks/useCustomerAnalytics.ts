import { useCallback, useEffect, useState } from "react";
import { useReportTimeWindow } from "../../reports-analytics/hooks/useReportTimeWindow";
import { customerAnalyticsService } from "../services/customerAnalyticsService";
import {
  EMPTY_ANALYTICS_RESULT,
  type SubscriberAnalyticsResult,
} from "../types/customerAnalytics";

export function useCustomerAnalytics(
  subscriberId: string | number | undefined,
  enabled = true,
) {
  const timeWindow = useReportTimeWindow({
    overviewPreset: "monthly",
    defaultTrendsPreset: "daily",
  });
  const { queryParams } = timeWindow;
  const [result, setResult] = useState<SubscriberAnalyticsResult>(
    EMPTY_ANALYTICS_RESULT,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled || !subscriberId) {
      setResult(EMPTY_ANALYTICS_RESULT);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const next = await customerAnalyticsService.getSubscriberAnalytics(
        subscriberId,
        {
          range: queryParams.range,
          startDate: queryParams.startDate,
          endDate: queryParams.endDate,
          grain: queryParams.grain,
          preset: queryParams.preset,
        },
      );
      setResult(next);
      if (
        next.loadedResources.length === 0 &&
        next.failedResources.length > 0
      ) {
        setError(
          next.warnings[0] ||
            "Unable to load subscriber analytics for this window.",
        );
      }
    } catch (err) {
      setResult(EMPTY_ANALYTICS_RESULT);
      setError(
        err instanceof Error && err.message.trim()
          ? err.message
          : "Unable to load subscriber analytics.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    enabled,
    subscriberId,
    queryParams.range,
    queryParams.startDate,
    queryParams.endDate,
    queryParams.grain,
    queryParams.preset,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  return { result, isLoading, error, refetch: load, timeWindow };
}
