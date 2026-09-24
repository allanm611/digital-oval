import type { ReportGrain, ReportQueryParams } from "../types/ReportsAPI";
import {
  dummyPreviousPeriod,
  type TrendSeriesPoint,
} from "./reportTimeWindow";

export function previousComparisonLabel(
  compare: boolean,
  previousPeriodLabel?: string,
): string {
  if (compare && previousPeriodLabel) {
    return `Previous (${previousPeriodLabel})`;
  }
  return "Previous period";
}

export type AlignComparisonSeries<T> = (
  rows: T[],
  window: { startDate?: string; endDate?: string; grain?: ReportGrain },
) => T[];

/**
 * Overlay for "Compare vs previous period".
 * Dummy mode scales the current series. Live mode uses a second equal-length window.
 */
export function resolveComparisonSeries<T extends TrendSeriesPoint>(options: {
  compare: boolean;
  useDummyData: boolean;
  current: T[];
  livePrevious?: T[];
  previousQueryParams: Pick<ReportQueryParams, "startDate" | "endDate" | "grain">;
  align?: AlignComparisonSeries<T>;
}): T[] | undefined {
  if (!options.compare) return undefined;
  if (options.useDummyData) {
    return options.current.length ? dummyPreviousPeriod(options.current) : undefined;
  }
  if (!options.livePrevious?.length) return undefined;
  if (options.align) {
    return options.align(options.livePrevious, {
      startDate: options.previousQueryParams.startDate,
      endDate: options.previousQueryParams.endDate,
      grain: options.previousQueryParams.grain,
    });
  }
  return options.livePrevious;
}
