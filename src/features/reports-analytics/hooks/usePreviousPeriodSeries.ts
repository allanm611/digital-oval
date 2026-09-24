import { useEffect, useRef, useState } from "react";
import type { ReportQueryParams } from "../types/ReportsAPI";

/**
 * Fetches the previous equal-length window only when Compare is on and Real Data is selected.
 * Failures stay empty so the current series still renders.
 */
export function usePreviousPeriodSeries<T>(options: {
  enabled: boolean;
  previousQueryParams: Pick<
    ReportQueryParams,
    "range" | "grain" | "startDate" | "endDate" | "preset" | "campaignId" | "offerId"
  >;
  refreshKey?: string | number;
  fetchSeries: (params: ReportQueryParams) => Promise<T[]>;
}): T[] {
  const [rows, setRows] = useState<T[]>([]);
  const fetchRef = useRef(options.fetchSeries);
  fetchRef.current = options.fetchSeries;

  const {
    enabled,
    refreshKey,
    previousQueryParams = {},
  } = options;
  const {
    range,
    grain,
    startDate,
    endDate,
    preset,
    campaignId,
    offerId,
  } = previousQueryParams;

  useEffect(() => {
    if (!enabled || !startDate || !endDate) {
      setRows([]);
      return;
    }

    let cancelled = false;
    fetchRef
      .current({
        range,
        grain,
        startDate,
        endDate,
        preset,
        campaignId,
        offerId,
      })
      .then((data) => {
        if (!cancelled) setRows(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setRows([]);
      });

    return () => {
      cancelled = true;
    };
  }, [
    enabled,
    range,
    grain,
    startDate,
    endDate,
    preset,
    campaignId,
    offerId,
    refreshKey,
  ]);

  return rows;
}
