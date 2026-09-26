import type { ReportGrain, SavedReportDateRange } from "../types/ReportsAPI";
import { getInclusiveDayCount } from "./reportTimeWindow";

const STORAGE_KEY = "sentra.reports.savedDateRanges";
const STORAGE_VERSION = 2;
export const MAX_SAVED_REPORT_RANGES_PER_GRAIN = 8;

const VALID_GRAINS: ReportGrain[] = ["daily", "weekly", "monthly"];

type StoredPayloadV2 = {
  version: 2;
  ranges: SavedReportDateRange[];
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isGrain(value: unknown): value is ReportGrain {
  return VALID_GRAINS.includes(value as ReportGrain);
}

/** Legacy rows without grain stay on one tab only — never on every tab. */
export function inferSavedRangeGrain(
  startDate: string,
  endDate: string,
): ReportGrain {
  const days = getInclusiveDayCount(startDate, endDate);
  if (days === null || days <= 14) return "daily";
  if (days <= 62) return "weekly";
  return "monthly";
}

function normalizeSavedRange(item: unknown): SavedReportDateRange | null {
  if (!item || typeof item !== "object") return null;
  const row = item as Partial<SavedReportDateRange>;
  if (
    typeof row.id !== "string" ||
    typeof row.name !== "string" ||
    typeof row.startDate !== "string" ||
    typeof row.endDate !== "string"
  ) {
    return null;
  }
  const grain = isGrain(row.grain)
    ? row.grain
    : inferSavedRangeGrain(row.startDate, row.endDate);
  return {
    id: row.id,
    name: row.name,
    startDate: row.startDate,
    endDate: row.endDate,
    createdAt: typeof row.createdAt === "string" ? row.createdAt : new Date().toISOString(),
    grain,
  };
}

function readRawEntries(): unknown[] {
  if (!canUseStorage()) return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  const parsed = JSON.parse(raw) as StoredPayloadV2 | SavedReportDateRange[];
  if (Array.isArray(parsed)) return parsed;
  if (parsed && parsed.version === STORAGE_VERSION && Array.isArray(parsed.ranges)) {
    return parsed.ranges;
  }
  return [];
}

export function filterSavedRangesForGrain(
  ranges: SavedReportDateRange[],
  grain: ReportGrain,
): SavedReportDateRange[] {
  return ranges.filter((range) => range.grain === grain);
}

export function loadSavedReportDateRanges(): SavedReportDateRange[] {
  if (!canUseStorage()) return [];
  try {
    const rawEntries = readRawEntries();
    const normalized = rawEntries
      .map(normalizeSavedRange)
      .filter((item): item is SavedReportDateRange => item !== null);
    const needsMigration =
      !canUseStorage()
        ? false
        : rawEntries.some((item) => {
            const row = item as Partial<SavedReportDateRange>;
            return !isGrain(row?.grain);
          }) || !window.localStorage.getItem(STORAGE_KEY)?.includes('"version":2');
    if (needsMigration) {
      persistSavedReportDateRanges(normalized);
    }
    return normalized;
  } catch {
    return [];
  }
}

export function persistSavedReportDateRanges(ranges: SavedReportDateRange[]) {
  if (!canUseStorage()) return;
  const payload: StoredPayloadV2 = {
    version: STORAGE_VERSION,
    ranges,
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function createSavedReportDateRange(input: {
  name: string;
  startDate: string;
  endDate: string;
  grain: ReportGrain;
}): SavedReportDateRange {
  if (!isGrain(input.grain)) {
    throw new Error("A saved date range must belong to Daily, Weekly, or Monthly.");
  }
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `range-${Date.now()}`;
  return {
    id,
    name: input.name.trim(),
    startDate: input.startDate,
    endDate: input.endDate,
    createdAt: new Date().toISOString(),
    grain: input.grain,
  };
}
