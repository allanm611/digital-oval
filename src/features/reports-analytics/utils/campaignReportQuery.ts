import type { RangeOption, ReportQueryParams } from "../types/ReportsAPI";

export function grainFromRange(range: RangeOption): ReportQueryParams["grain"] {
  if (range === "7d") return "daily";
  if (range === "30d") return "weekly";
  return "monthly";
}

export function buildCampaignReportParams(options: {
  range: RangeOption;
  startDate?: string;
  endDate?: string;
  campaignId?: string | number;
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  metric?: string;
}): ReportQueryParams & { metric?: string } {
  const hasCustomDates = Boolean(options.startDate && options.endDate);
  return {
    range: options.range,
    grain: grainFromRange(options.range),
    startDate: hasCustomDates ? options.startDate : undefined,
    endDate: hasCustomDates ? options.endDate : undefined,
    campaignId: options.campaignId || undefined,
    page: options.page,
    pageSize: options.pageSize,
    search: options.search,
    sortBy: options.sortBy,
    sortOrder: options.sortOrder,
    metric: options.metric,
  };
}

export function formatTrendLabel(label?: string): string {
  return label?.replace(" vs prior period", "") || "—";
}

export function settledValue<T>(result: PromiseSettledResult<T>): T | null {
  return result.status === "fulfilled" ? result.value : null;
}

export function settledError(
  result: PromiseSettledResult<unknown>,
  fallback: string,
): string | null {
  if (result.status !== "rejected") return null;
  const reason = result.reason;
  if (reason instanceof Error && reason.message) return reason.message;
  return fallback;
}
