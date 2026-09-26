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
  value?: number;
  label?: string;
  direction?: "up" | "down" | "flat";
}): { value: string; direction: "up" | "down" | "flat" } {
  if (!trend) return { value: "—", direction: "flat" };
  const fromLabel = formatTrendLabel(trend.label);
  const trimmed = fromLabel.trim();
  if (trimmed && trimmed !== "—") {
    if (
      trimmed === "0" ||
      trimmed === "0%" ||
      trimmed === "0.0x" ||
      trimmed === "0 pts" ||
      trimmed === "+0" ||
      trimmed === "+0.0x" ||
      trimmed === "+0 pts"
    ) {
      return { value: fromLabel, direction: "flat" };
    }
    if (trimmed.startsWith("-")) return { value: fromLabel, direction: "down" };
    if (trimmed.startsWith("+")) return { value: fromLabel, direction: "up" };
    if (trend.direction === "down") return { value: fromLabel, direction: "down" };
    if (trend.direction === "up") return { value: fromLabel, direction: "up" };
    return { value: fromLabel, direction: "flat" };
  }
  if (typeof trend.value === "number" && Number.isFinite(trend.value) && trend.value !== 0) {
    const sign = trend.value > 0 ? "+" : "";
    return {
      value: `${sign}${trend.value}`,
      direction: trend.value > 0 ? "up" : "down",
    };
  }
  return { value: "—", direction: "flat" };
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
