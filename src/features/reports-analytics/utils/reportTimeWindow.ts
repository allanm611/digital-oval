import type {
  RangeOption,
  ReportGrain,
  ReportQueryParams,
  TimeWindowPreset,
} from "../types/ReportsAPI";

export interface LocalDateBounds {
  start: string;
  end: string;
}

export interface ResolvedTimeWindow {
  preset: TimeWindowPreset;
  grain: ReportGrain;
  bounds: LocalDateBounds;
  rangeKey: RangeOption;
  dayCount: number;
}

export const RANGE_DAYS: Record<RangeOption, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

export interface TrendSubPreset {
  id: TimeWindowPreset;
  label: string;
  hint: string;
}

export const TREND_GRAIN_TABS: Array<{ id: ReportGrain; label: string }> = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
];

export const TREND_SUB_PRESETS: Record<ReportGrain, TrendSubPreset[]> = {
  daily: [
    { id: "today", label: "Today", hint: "Current calendar day" },
    { id: "yesterday", label: "Yesterday", hint: "Previous calendar day" },
    { id: "last_7_days", label: "Last 7 days", hint: "Trailing 7 inclusive days" },
    { id: "last_14_days", label: "Last 14 days", hint: "Trailing 14 inclusive days" },
    { id: "custom", label: "Custom", hint: "Pick From / To, keep daily grain" },
  ],
  weekly: [
    { id: "this_week", label: "This week", hint: "Monday through today" },
    { id: "last_week", label: "Last week", hint: "Previous Monday–Sunday" },
    { id: "last_4_weeks", label: "Last 4 weeks", hint: "This week plus 3 prior weeks" },
    { id: "last_8_weeks", label: "Last 8 weeks", hint: "This week plus 7 prior weeks" },
    { id: "custom", label: "Custom", hint: "Pick From / To, keep weekly grain" },
  ],
  monthly: [
    { id: "this_month", label: "This month", hint: "1st through today" },
    { id: "last_month", label: "Last month", hint: "Previous full calendar month" },
    { id: "last_3_months", label: "Last 3 months", hint: "From month start two months ago" },
    { id: "last_6_months", label: "Last 6 months", hint: "From month start five months ago" },
    { id: "last_12_months", label: "Last 12 months", hint: "From month start eleven months ago" },
    { id: "custom", label: "Custom", hint: "Pick From / To, keep monthly grain" },
  ],
};

export const DEFAULT_SUB_PRESET: Record<ReportGrain, TimeWindowPreset> = {
  daily: "last_7_days",
  weekly: "last_8_weeks",
  monthly: "last_6_months",
};

/** Dummy templates still keyed 7d/30d/90d: map grain to the matching shape. */
export function dummyTemplateRange(grain: ReportGrain): RangeOption {
  if (grain === "weekly") return "30d";
  if (grain === "monthly") return "90d";
  return "7d";
}

/**
 * Default Overview chips when a report page first loads.
 * Kept separate from Trends so snapshot KPIs/tables do not jump to "today".
 */
export const OVERVIEW_SUB_PRESET: Record<ReportGrain, TimeWindowPreset> = {
  daily: "last_7_days",
  weekly: "last_4_weeks",
  monthly: "last_3_months",
};

export function namedRangePresets(grain: ReportGrain): TrendSubPreset[] {
  return TREND_SUB_PRESETS[grain];
}

/** Daily + weekly + monthly snapshot chips, with a single Custom at the end. */
export function allNamedRangePresets(): TrendSubPreset[] {
  const presets: TrendSubPreset[] = [];
  for (const grain of TREND_GRAIN_TABS) {
    for (const preset of TREND_SUB_PRESETS[grain.id]) {
      if (preset.id === "custom") continue;
      presets.push(preset);
    }
  }
  presets.push({
    id: "custom",
    label: "Custom",
    hint: "Pick From / To",
  });
  return presets;
}

export function customRangePreset(grain: ReportGrain): TrendSubPreset {
  return (
    TREND_SUB_PRESETS[grain].find((item) => item.id === "custom") || {
      id: "custom",
      label: "Custom",
      hint: "Pick From / To",
    }
  );
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MAX_LOOKBACK_YEARS = 2;
const MAX_CUSTOM_DAYS = 731;
const DAILY_GRAIN_WARN_DAYS = 92;
const WEEKLY_GRAIN_WARN_DAYS = 14;
const MONTHLY_GRAIN_WARN_DAYS = 60;

export function formatISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseISODate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function startOfLocalDay(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addLocalDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Monday-start week, matching reporting calendars used by the monitoring APIs. */
export function startOfIsoWeek(date: Date): Date {
  const local = startOfLocalDay(date);
  const weekday = local.getDay();
  const offset = weekday === 0 ? 6 : weekday - 1;
  return addLocalDays(local, -offset);
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addLocalMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, date.getDate());
}

export function getDateConstraints(now = new Date()) {
  const today = startOfLocalDay(now);
  const minDate = new Date(today);
  minDate.setFullYear(today.getFullYear() - MAX_LOOKBACK_YEARS);
  return {
    minDate: formatISODate(minDate),
    maxDate: formatISODate(today),
  };
}

/** Inclusive calendar-day count between YYYY-MM-DD bounds. */
export function getInclusiveDayCount(start: string, end: string): number | null {
  const startDate = parseISODate(start);
  const endDate = parseISODate(end);
  if (!startDate || !endDate) return null;
  const diff = Math.round((endDate.getTime() - startDate.getTime()) / MS_PER_DAY);
  if (!Number.isFinite(diff)) return null;
  return Math.max(1, Math.abs(diff) + 1);
}

export function mapDaysToRange(days: number | null): RangeOption {
  if (days === null) return "7d";
  if (days <= 7) return "7d";
  if (days <= 30) return "30d";
  return "90d";
}

export function grainForPreset(preset: TimeWindowPreset): ReportGrain {
  if (
    preset === "today" ||
    preset === "yesterday" ||
    preset === "last_7_days" ||
    preset === "last_14_days"
  ) {
    return "daily";
  }
  if (
    preset === "this_week" ||
    preset === "last_week" ||
    preset === "last_4_weeks" ||
    preset === "last_8_weeks"
  ) {
    return "weekly";
  }
  if (
    preset === "this_month" ||
    preset === "last_month" ||
    preset === "last_3_months" ||
    preset === "last_6_months" ||
    preset === "last_12_months"
  ) {
    return "monthly";
  }
  return "daily";
}

export function presetBelongsToGrain(
  preset: TimeWindowPreset,
  grain: ReportGrain,
): boolean {
  if (preset === "custom") return true;
  return grainForPreset(preset) === grain;
}

export function getScaleFactor(
  customDays: number | null,
  baseRange: RangeOption,
): number {
  if (!customDays) return 1;
  return customDays / RANGE_DAYS[baseRange];
}

function trailingDays(dayCount: number, now = new Date()): LocalDateBounds {
  const end = startOfLocalDay(now);
  const start = addLocalDays(end, -(dayCount - 1));
  return { start: formatISODate(start), end: formatISODate(end) };
}

function trailingIsoWeeks(weekCount: number, now = new Date()): LocalDateBounds {
  const today = startOfLocalDay(now);
  const start = addLocalDays(startOfIsoWeek(today), -7 * (weekCount - 1));
  return { start: formatISODate(start), end: formatISODate(today) };
}

function trailingCalendarMonths(monthCount: number, now = new Date()): LocalDateBounds {
  const today = startOfLocalDay(now);
  const start = startOfMonth(addLocalMonths(today, -(monthCount - 1)));
  return { start: formatISODate(start), end: formatISODate(today) };
}

function lastCompleteIsoWeek(now = new Date()): LocalDateBounds {
  const thisMonday = startOfIsoWeek(startOfLocalDay(now));
  const lastMonday = addLocalDays(thisMonday, -7);
  const lastSunday = addLocalDays(thisMonday, -1);
  return { start: formatISODate(lastMonday), end: formatISODate(lastSunday) };
}

function lastCompleteMonth(now = new Date()): LocalDateBounds {
  const thisMonthStart = startOfMonth(startOfLocalDay(now));
  const lastMonthEnd = addLocalDays(thisMonthStart, -1);
  const lastMonthStart = startOfMonth(lastMonthEnd);
  return { start: formatISODate(lastMonthStart), end: formatISODate(lastMonthEnd) };
}

export function boundsForPreset(
  preset: TimeWindowPreset,
  custom?: LocalDateBounds,
  now = new Date(),
): LocalDateBounds {
  const today = startOfLocalDay(now);
  switch (preset) {
    case "today":
      return { start: formatISODate(today), end: formatISODate(today) };
    case "yesterday": {
      const yesterday = addLocalDays(today, -1);
      return { start: formatISODate(yesterday), end: formatISODate(yesterday) };
    }
    case "last_7_days":
      return trailingDays(7, now);
    case "last_14_days":
      return trailingDays(14, now);
    case "this_week":
      return {
        start: formatISODate(startOfIsoWeek(today)),
        end: formatISODate(today),
      };
    case "last_week":
      return lastCompleteIsoWeek(now);
    case "last_4_weeks":
      return trailingIsoWeeks(4, now);
    case "last_8_weeks":
      return trailingIsoWeeks(8, now);
    case "this_month":
      return {
        start: formatISODate(startOfMonth(today)),
        end: formatISODate(today),
      };
    case "last_month":
      return lastCompleteMonth(now);
    case "last_3_months":
      return trailingCalendarMonths(3, now);
    case "last_6_months":
      return trailingCalendarMonths(6, now);
    case "last_12_months":
      return trailingCalendarMonths(12, now);
    case "custom":
      if (custom?.start && custom?.end) return custom;
      return trailingDays(7, now);
    default:
      return trailingDays(30, now);
  }
}

export function resolveTimeWindow(
  preset: TimeWindowPreset,
  options: { custom?: LocalDateBounds; grain?: ReportGrain; now?: Date } = {},
): ResolvedTimeWindow {
  const grain = options.grain || grainForPreset(preset);
  const bounds = boundsForPreset(preset, options.custom, options.now);
  const dayCount = getInclusiveDayCount(bounds.start, bounds.end) ?? 1;
  return {
    preset,
    grain,
    bounds,
    rangeKey: mapDaysToRange(dayCount),
    dayCount,
  };
}

export function toReportQueryParams(
  window: ResolvedTimeWindow,
): Pick<ReportQueryParams, "range" | "grain" | "startDate" | "endDate" | "preset"> {
  return {
    range: window.rangeKey,
    grain: window.grain,
    startDate: window.bounds.start,
    endDate: window.bounds.end,
    preset: window.preset,
  };
}

export function formatPresetLabel(preset: TimeWindowPreset): string {
  for (const grain of TREND_GRAIN_TABS) {
    const match = TREND_SUB_PRESETS[grain.id].find((item) => item.id === preset);
    if (match) return match.label;
  }
  return preset;
}

export function formatWindowLabel(window: ResolvedTimeWindow): string {
  const start = parseISODate(window.bounds.start);
  const end = parseISODate(window.bounds.end);
  if (!start || !end) return "";
  const formatter = new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const rangeLabel =
    window.bounds.start === window.bounds.end
      ? formatter.format(start)
      : `${formatter.format(start)} – ${formatter.format(end)}`;
  const presetLabel =
    window.preset === "custom" ? "custom" : formatPresetLabel(window.preset);
  return `${presetLabel} · ${rangeLabel} · ${window.grain} grain`;
}

export interface DateRangeValidation {
  ok: boolean;
  error?: string;
  warning?: string;
  dayCount?: number;
}

export function validateDateRange(
  start: string,
  end: string,
  options: { grain?: ReportGrain } = {},
): DateRangeValidation {
  if (!start || !end) {
    return { ok: false, error: "Select both a start and end date." };
  }
  const startDate = parseISODate(start);
  const endDate = parseISODate(end);
  if (!startDate || !endDate) {
    return { ok: false, error: "Enter valid calendar dates." };
  }
  const { minDate, maxDate } = getDateConstraints();
  if (start > end) {
    return { ok: false, error: "Start date must be on or before the end date." };
  }
  if (start < minDate) {
    return { ok: false, error: "Start date cannot be more than 2 years ago." };
  }
  if (end > maxDate) {
    return { ok: false, error: "End date cannot be in the future." };
  }
  const dayCount = getInclusiveDayCount(start, end) ?? 1;
  if (dayCount > MAX_CUSTOM_DAYS) {
    return {
      ok: false,
      error: `Custom ranges cannot exceed ${MAX_CUSTOM_DAYS} days.`,
    };
  }
  let warning: string | undefined;
  if (options.grain === "daily" && dayCount > DAILY_GRAIN_WARN_DAYS) {
    warning =
      "Daily grain over long ranges can be slow. Weekly or monthly is usually better.";
  } else if (options.grain === "weekly" && dayCount < WEEKLY_GRAIN_WARN_DAYS) {
    warning = "Weekly grain is thin on short ranges. Daily may show more detail.";
  } else if (options.grain === "monthly" && dayCount < MONTHLY_GRAIN_WARN_DAYS) {
    warning = "Monthly grain needs a longer span. Weekly may be a better fit.";
  }
  return { ok: true, warning, dayCount };
}

export function seedCustomBounds(grain: ReportGrain, now = new Date()): LocalDateBounds {
  if (grain === "weekly") return boundsForPreset("last_4_weeks", undefined, now);
  if (grain === "monthly") return boundsForPreset("last_3_months", undefined, now);
  return boundsForPreset("last_7_days", undefined, now);
}

const MAX_TREND_BUCKETS: Record<ReportGrain, number> = {
  daily: 92,
  weekly: 53,
  monthly: 24,
};

export function enumerateTrendBuckets(
  startDate: string,
  endDate: string,
  grain: ReportGrain,
): string[] {
  const start = parseISODate(startDate);
  const end = parseISODate(endDate);
  const dates: string[] = [];
  if (!start || !end || start > end) return dates;
  const max = MAX_TREND_BUCKETS[grain];

  if (grain === "daily") {
    for (let cursor = start; cursor <= end && dates.length < max; cursor = addLocalDays(cursor, 1)) {
      dates.push(formatISODate(cursor));
    }
    return dates;
  }

  if (grain === "weekly") {
    for (
      let cursor = startOfIsoWeek(start);
      cursor <= end && dates.length < max;
      cursor = addLocalDays(cursor, 7)
    ) {
      dates.push(formatISODate(cursor));
    }
    return dates;
  }

  for (
    let cursor = startOfMonth(start);
    cursor <= end && dates.length < max;
    cursor = addLocalMonths(cursor, 1)
  ) {
    dates.push(formatISODate(cursor));
  }
  return dates;
}

export function labelTrendBucket(
  isoDate: string,
  grain: ReportGrain,
  spanDays: number,
): string {
  const date = parseISODate(isoDate);
  if (!date) return isoDate;
  if (grain === "daily") {
    if (spanDays <= 7) return date.toLocaleDateString("en-US", { weekday: "short" });
    return date.toLocaleDateString("en-US", { day: "numeric", month: "short" });
  }
  if (grain === "weekly") {
    return `Week of ${date.toLocaleDateString("en-US", { day: "numeric", month: "short" })}`;
  }
  return date.toLocaleDateString("en-US", {
    month: "long",
    ...(spanDays > 366 ? { year: "numeric" as const } : {}),
  });
}

/** Compact tick text. Tooltip/table still use the full period string when provided. */
export function shortenAxisLabel(label: string): string {
  const weekOf = /^Week of\s+(.+)$/i.exec(label.trim());
  if (weekOf) return weekOf[1];
  if (/^(January|February|March|April|May|June|July|August|September|October|November|December)\b/i.test(label)) {
    const date = new Date(`${label} 1, 2000`);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString("en-US", { month: "short" });
    }
  }
  return label;
}

export function shouldChartUseFullRow(
  pointCount: number,
  labels: Array<string | number> = [],
): boolean {
  if (pointCount >= 7) return true;
  const longest = labels.reduce((max, label) => Math.max(max, String(label).length), 0);
  return pointCount >= 6 && longest >= 10;
}

export interface CampaignTrendPoint {
  period: string;
  date?: string;
  ctr: number;
  engagement: number;
  revenue?: number;
  spend?: number;
  target?: number;
}

const RUNNING_TOTAL_PAIRS: Array<[string, string]> = [
  ["redemptions", "cumulativeRedemptions"],
  ["members", "cumulativeMembers"],
];

function recomputeRunningTotals<T extends Record<string, unknown>>(rows: T[]): T[] {
  for (const [from, to] of RUNNING_TOTAL_PAIRS) {
    if (!rows.some((row) => typeof row[from] === "number")) continue;
    let running = 0;
    for (const row of rows) {
      running += Number(row[from] || 0);
      (row as Record<string, unknown>)[to] = running;
    }
  }
  return rows;
}

export type TrendSeriesPoint = Record<string, string | number | null | undefined> & {
  period?: string;
  date?: string;
};

/**
 * Align a time series to the selected window + grain.
 * Live rows with ISO `date` values are matched to buckets (missing buckets = 0).
 * Dummy templates without dates are projected by index onto those buckets so
 * Daily/Weekly/Monthly never reuse the wrong 7d/30d/90d shape.
 */
export function alignTrendSeries<T extends TrendSeriesPoint>(
  points: T[] = [],
  options: { startDate?: string; endDate?: string; grain?: ReportGrain } = {},
): Array<T & { period: string; date: string }> {
  const { startDate, endDate, grain } = options;
  if (!startDate || !endDate || !grain) {
    return points as Array<T & { period: string; date: string }>;
  }
  const buckets = enumerateTrendBuckets(startDate, endDate, grain);
  if (!buckets.length) {
    return points as Array<T & { period: string; date: string }>;
  }

  const spanDays = getInclusiveDayCount(startDate, endDate) ?? buckets.length;
  const byDate = new Map<string, T>();
  for (const point of points) {
    const key = String(point.date || "").slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(key)) byDate.set(key, point);
  }
  const matchByDate = byDate.size > 0;
  const numericKeys = new Set<string>();
  for (const point of points) {
    for (const [key, value] of Object.entries(point)) {
      if (typeof value === "number") numericKeys.add(key);
    }
  }

  const rows = buckets.map((iso, index) => {
    const period = labelTrendBucket(iso, grain, spanDays);
    if (matchByDate) {
      const existing = byDate.get(iso);
      if (existing) return { ...existing, period, date: iso };
      const empty: Record<string, unknown> = { period, date: iso };
      for (const key of numericKeys) empty[key] = 0;
      return empty as T & { period: string; date: string };
    }
    if (points.length) {
      return { ...points[index % points.length], period, date: iso };
    }
    const empty: Record<string, unknown> = { period, date: iso };
    for (const key of numericKeys) empty[key] = 0;
    return empty as T & { period: string; date: string };
  });

  return recomputeRunningTotals(rows);
}

export function fillCampaignTrendSeries<T extends CampaignTrendPoint>(
  points: T[] = [],
  options: { startDate?: string; endDate?: string; grain?: ReportGrain } = {},
): Array<T & CampaignTrendPoint> {
  return alignTrendSeries(points, options).map((point) => ({
    ...point,
    ctr: Number(point.ctr || 0),
    engagement: Number(point.engagement || 0),
    revenue: Number(point.revenue || 0),
    spend: Number(point.spend || 0),
  })) as Array<T & CampaignTrendPoint>;
}

export function previousWindowFrom(window: ResolvedTimeWindow): ResolvedTimeWindow {
  const start = parseISODate(window.bounds.start);
  if (!start) return window;
  const prevEnd = addLocalDays(start, -1);
  const prevStart = addLocalDays(prevEnd, -(window.dayCount - 1));
  const bounds = {
    start: formatISODate(prevStart),
    end: formatISODate(prevEnd),
  };
  return {
    ...window,
    preset: "custom",
    bounds,
    dayCount: getInclusiveDayCount(bounds.start, bounds.end) ?? window.dayCount,
    rangeKey: mapDaysToRange(getInclusiveDayCount(bounds.start, bounds.end)),
  };
}

/** Dummy-only previous-period overlay. Live data should come from a second API window. */
export function dummyPreviousPeriod<T extends TrendSeriesPoint>(
  rows: T[],
  factor = 0.9,
): T[] {
  return rows.map((row) => {
    const next: TrendSeriesPoint = { ...row };
    for (const [key, value] of Object.entries(row)) {
      if (typeof value !== "number") continue;
      if (key === "roi") continue;
      next[key] = Number((value * factor).toFixed(2));
    }
    return next as T;
  });
}

export function toChartAudit(window: ResolvedTimeWindow) {
  return {
    grain: window.grain,
    startDate: window.bounds.start,
    endDate: window.bounds.end,
    windowLabel: formatWindowLabel(window),
  };
}
