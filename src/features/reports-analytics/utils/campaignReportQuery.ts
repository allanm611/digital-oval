import type { RangeOption, ReportGrain, ReportQueryParams } from "../types/ReportsAPI";

export function grainFromRange(range: RangeOption): ReportGrain {
  if (range === "7d") return "daily";
  if (range === "30d") return "weekly";
  return "monthly";
}

export function buildCampaignReportParams(options: {
  range: RangeOption;
  grain?: ReportGrain;
  startDate?: string;
  endDate?: string;
  preset?: ReportQueryParams["preset"];
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
    grain: options.grain || grainFromRange(options.range),
    preset: options.preset,
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
  if (!label) return "—";
  const cleaned = label
    .replace(/\s*vs last period/gi, "")
    .replace(/\s*vs prior period/gi, "")
    .trim();
  return cleaned || "—";
}

export function resolveHeroTrend(trend?: {
  label?: string;
  direction?: "up" | "down";
}): { value: string; direction: "up" | "down" } {
  const value = formatTrendLabel(trend?.label);
  const trimmed = value.trim();
  if (trimmed.startsWith("-")) return { value, direction: "down" };
  if (trimmed.startsWith("+")) return { value, direction: "up" };
  return { value, direction: trend?.direction || "up" };
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
