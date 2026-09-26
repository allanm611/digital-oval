import type { RangeOption, ReportGrain, ReportQueryParams } from "../types/ReportsAPI";
import { grainFromRange } from "./campaignReportQuery";

export {
  formatTrendLabel,
  grainFromRange,
  resolveHeroTrend,
  settledError,
  settledValue,
} from "./campaignReportQuery";

export function buildOfferReportParams(options: {
  range: RangeOption;
  grain?: ReportGrain;
  startDate?: string;
  endDate?: string;
  preset?: ReportQueryParams["preset"];
  offerId?: string | number;
  status?: string;
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  metric?: string;
  limit?: number;
}): ReportQueryParams & { metric?: string; limit?: number } {
  const hasCustomDates = Boolean(options.startDate && options.endDate);
  const status =
    options.status && options.status !== "All Statuses"
      ? options.status
      : undefined;
  return {
    range: options.range,
    grain: options.grain || grainFromRange(options.range),
    preset: options.preset,
    startDate: hasCustomDates ? options.startDate : undefined,
    endDate: hasCustomDates ? options.endDate : undefined,
    offerId: options.offerId || undefined,
    status,
    page: options.page,
    pageSize: options.pageSize,
    search: options.search,
    sortBy: options.sortBy,
    sortOrder: options.sortOrder,
    metric: options.metric,
    limit: options.limit,
  };
}
