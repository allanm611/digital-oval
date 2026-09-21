import { useCallback, useMemo, useState } from "react";
import type {
  ReportGrain,
  ReportViewMode,
  SavedReportDateRange,
  TimeWindowPreset,
} from "../types/ReportsAPI";
import {
  DEFAULT_SUB_PRESET,
  OVERVIEW_SUB_PRESET,
  boundsForCalendarYear,
  formatPeriodRange,
  formatWindowLabel,
  grainForPreset,
  getScaleFactor,
  presetBelongsToGrain,
  previousWindowFrom,
  resolveTimeWindow,
  seedCustomBounds,
  toReportQueryParams,
  validateDateRange,
  yearFromBounds,
  yearsForLookback,
  type LocalDateBounds,
  type ResolvedTimeWindow,
} from "../utils/reportTimeWindow";
import {
  createSavedReportDateRange,
  filterSavedRangesForGrain,
  inferSavedRangeGrain,
  loadSavedReportDateRanges,
  MAX_SAVED_REPORT_RANGES_PER_GRAIN,
  persistSavedReportDateRanges,
} from "../utils/savedReportDateRanges";

type PickerTarget = "overview" | "trends";

function resolveSelection(options: {
  grain: ReportGrain;
  preset: TimeWindowPreset;
  customBounds: LocalDateBounds;
  savedRangeId: string | null;
  savedRanges: SavedReportDateRange[];
}): ResolvedTimeWindow {
  if (options.savedRangeId) {
    const saved = options.savedRanges.find(
      (item) =>
        item.id === options.savedRangeId && item.grain === options.grain,
    );
    if (saved) {
      return resolveTimeWindow("custom", {
        custom: { start: saved.startDate, end: saved.endDate },
        grain: saved.grain,
      });
    }
  }
  return resolveTimeWindow(options.preset, {
    custom: options.preset === "custom" ? options.customBounds : undefined,
    grain: options.grain,
  });
}

/**
 * Overview owns a period dropdown (Today, Last 7 days, MTD, LMD, …) plus a
 * sibling Custom range control. Trends owns Daily/Weekly/Monthly grain, MTD/LMD
 * chips, always-visible From/To, a monthly year control, and compare-previous.
 * The two windows stay independent so tables can keep the Overview snapshot
 * while Trends explores a different series grain.
 */
export function useReportTimeWindow(options?: {
  overviewPreset?: ReportGrain;
  defaultTrendsPreset?: ReportGrain;
}) {
  const initialOverviewGrain = options?.overviewPreset ?? "weekly";
  const defaultTrendsGrain = options?.defaultTrendsPreset ?? "daily";

  const [view, setView] = useState<ReportViewMode>("overview");

  const [overviewGrain, setOverviewGrain] =
    useState<ReportGrain>(initialOverviewGrain);
  const [overviewPreset, setOverviewPreset] = useState<TimeWindowPreset>(
    OVERVIEW_SUB_PRESET[initialOverviewGrain],
  );
  const [overviewCustomBounds, setOverviewCustomBounds] =
    useState<LocalDateBounds>({ start: "", end: "" });
  const [overviewSavedRangeId, setOverviewSavedRangeId] = useState<
    string | null
  >(null);

  const [grainTab, setGrainTab] = useState<ReportGrain>(defaultTrendsGrain);
  const [trendsPreset, setTrendsPreset] = useState<TimeWindowPreset>(
    DEFAULT_SUB_PRESET[defaultTrendsGrain],
  );
  const [customBounds, setCustomBounds] = useState<LocalDateBounds>({
    start: "",
    end: "",
  });
  const [savedRangeId, setSavedRangeId] = useState<string | null>(null);
  const [savedRanges, setSavedRanges] = useState<SavedReportDateRange[]>(
    loadSavedReportDateRanges,
  );
  const [comparePreviousPeriod, setComparePreviousPeriod] = useState(false);
  const [inlineRangeError, setInlineRangeError] = useState<string | null>(null);

  const [pickerTarget, setPickerTarget] = useState<PickerTarget>("overview");
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [draftRange, setDraftRange] = useState<LocalDateBounds>({
    start: "",
    end: "",
  });
  const [draftName, setDraftName] = useState("");
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [pickerWarning, setPickerWarning] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const pickerGrain =
    pickerTarget === "overview" ? overviewGrain : grainTab;

  const overviewWindow = useMemo(
    () =>
      resolveSelection({
        grain: overviewGrain,
        preset: overviewPreset,
        customBounds: overviewCustomBounds,
        savedRangeId: overviewSavedRangeId,
        savedRanges,
      }),
    [
      overviewCustomBounds,
      overviewGrain,
      overviewPreset,
      overviewSavedRangeId,
      savedRanges,
    ],
  );

  const trendsWindow = useMemo(
    () =>
      resolveSelection({
        grain: grainTab,
        preset: trendsPreset,
        customBounds,
        savedRangeId,
        savedRanges,
      }),
    [customBounds, grainTab, savedRangeId, savedRanges, trendsPreset],
  );

  const activeWindow = view === "trends" ? trendsWindow : overviewWindow;
  const previousWindow = useMemo(
    () => previousWindowFrom(activeWindow),
    [activeWindow],
  );

  const openPicker = useCallback(
    (target: PickerTarget) => {
      const grain = target === "overview" ? overviewGrain : grainTab;
      const bounds =
        target === "overview" ? overviewCustomBounds : customBounds;
      const seed =
        bounds.start && bounds.end ? bounds : seedCustomBounds(grain);
      setPickerTarget(target);
      setDraftRange(seed);
      setDraftName("");
      setPickerError(null);
      setPickerWarning(null);
      setSaveMessage(null);
      setIsPickerOpen(true);
    },
    [customBounds, grainTab, overviewCustomBounds, overviewGrain],
  );

  const selectOverviewGrain = useCallback(
    (grain: ReportGrain) => {
      setOverviewGrain(grain);
      setOverviewSavedRangeId(null);
      if (
        !presetBelongsToGrain(overviewPreset, grain) ||
        overviewPreset === "custom"
      ) {
        setOverviewPreset(OVERVIEW_SUB_PRESET[grain]);
        setOverviewCustomBounds({ start: "", end: "" });
      }
    },
    [overviewPreset],
  );

  const selectOverviewPreset = useCallback(
    (preset: TimeWindowPreset) => {
      setOverviewSavedRangeId(null);
      if (preset !== "custom") {
        setOverviewGrain(grainForPreset(preset));
      }
      setOverviewPreset(preset);
      if (preset === "custom") {
        openPicker("overview");
        return;
      }
      setOverviewCustomBounds({ start: "", end: "" });
    },
    [openPicker],
  );

  const selectOverviewSavedRange = useCallback(
    (range: SavedReportDateRange) => {
      setOverviewGrain(range.grain);
      setOverviewSavedRangeId(range.id);
      setOverviewPreset("custom");
      setOverviewCustomBounds({
        start: range.startDate,
        end: range.endDate,
      });
      setIsPickerOpen(false);
    },
    [],
  );

  const selectGrainTab = useCallback(
    (grain: ReportGrain) => {
      setGrainTab(grain);
      setSavedRangeId(null);
      if (
        !presetBelongsToGrain(trendsPreset, grain) ||
        trendsPreset === "custom"
      ) {
        setTrendsPreset(DEFAULT_SUB_PRESET[grain]);
        setCustomBounds({ start: "", end: "" });
      }
    },
    [trendsPreset],
  );

  const selectPreset = useCallback(
    (preset: TimeWindowPreset) => {
      setSavedRangeId(null);
      setInlineRangeError(null);
      setTrendsPreset(preset);
      if (preset === "custom") {
        openPicker("trends");
        return;
      }
      setCustomBounds({ start: "", end: "" });
    },
    [openPicker],
  );

  const applyInlineTrendRange = useCallback(
    (bounds: LocalDateBounds) => {
      const result = validateDateRange(bounds.start, bounds.end, {
        grain: grainTab,
      });
      if (!result.ok) {
        setInlineRangeError(result.error || "Invalid date range.");
        return false;
      }
      setInlineRangeError(null);
      setCustomBounds(bounds);
      setSavedRangeId(null);
      setTrendsPreset("custom");
      return true;
    },
    [grainTab],
  );

  const selectTrendYear = useCallback((year: number) => {
    const bounds = boundsForCalendarYear(year);
    setInlineRangeError(null);
    setCustomBounds(bounds);
    setSavedRangeId(null);
    setTrendsPreset("custom");
  }, []);

  const selectSavedRange = useCallback(
    (range: SavedReportDateRange) => {
      if (range.grain !== grainTab) return;
      setSavedRangeId(range.id);
      setTrendsPreset("custom");
      setCustomBounds({ start: range.startDate, end: range.endDate });
      setIsPickerOpen(false);
    },
    [grainTab],
  );

  const applyDraftRange = useCallback(() => {
    const grain =
      pickerTarget === "overview"
        ? inferSavedRangeGrain(draftRange.start, draftRange.end)
        : pickerGrain;
    const result = validateDateRange(draftRange.start, draftRange.end, {
      grain,
    });
    if (!result.ok) {
      setPickerError(result.error || "Invalid date range.");
      setPickerWarning(null);
      return false;
    }
    setPickerError(null);
    setPickerWarning(result.warning || null);
    if (pickerTarget === "overview") {
      setOverviewGrain(grain);
      setOverviewCustomBounds(draftRange);
      setOverviewSavedRangeId(null);
      setOverviewPreset("custom");
    } else {
      setCustomBounds(draftRange);
      setSavedRangeId(null);
      setTrendsPreset("custom");
    }
    setIsPickerOpen(false);
    return true;
  }, [draftRange, pickerGrain, pickerTarget]);

  const saveDraftRange = useCallback(() => {
    const savedGrain =
      pickerTarget === "overview"
        ? inferSavedRangeGrain(draftRange.start, draftRange.end)
        : pickerGrain;
    const result = validateDateRange(draftRange.start, draftRange.end, {
      grain: savedGrain,
    });
    if (!result.ok) {
      setPickerError(result.error || "Invalid date range.");
      return false;
    }
    const name = draftName.trim();
    if (!name) {
      setPickerError("Name this range before saving.");
      return false;
    }
    const rangesForGrain = filterSavedRangesForGrain(savedRanges, savedGrain);
    if (
      rangesForGrain.some(
        (item) => item.name.toLowerCase() === name.toLowerCase(),
      )
    ) {
      setPickerError(
        `A saved ${savedGrain} range with this name already exists.`,
      );
      return false;
    }
    if (rangesForGrain.length >= MAX_SAVED_REPORT_RANGES_PER_GRAIN) {
      setPickerError(
        `You can save up to ${MAX_SAVED_REPORT_RANGES_PER_GRAIN} custom ranges under ${savedGrain}.`,
      );
      return false;
    }
    const created = createSavedReportDateRange({
      name,
      startDate: draftRange.start,
      endDate: draftRange.end,
      grain: savedGrain,
    });
    const next = [created, ...savedRanges];
    persistSavedReportDateRanges(next);
    setSavedRanges(next);
    if (pickerTarget === "overview") {
      setOverviewGrain(savedGrain);
      setOverviewSavedRangeId(created.id);
      setOverviewPreset("custom");
      setOverviewCustomBounds(draftRange);
    } else {
      setSavedRangeId(created.id);
      setTrendsPreset("custom");
      setCustomBounds(draftRange);
    }
    setDraftName("");
    setPickerError(null);
    setPickerWarning(result.warning || null);
    setSaveMessage(`Saved “${name}”.`);
    return true;
  }, [draftName, draftRange, pickerGrain, pickerTarget, savedRanges]);

  const deleteSavedRange = useCallback(
    (id: string) => {
      const next = savedRanges.filter((item) => item.id !== id);
      persistSavedReportDateRanges(next);
      setSavedRanges(next);
      if (savedRangeId === id) {
        setSavedRangeId(null);
        setTrendsPreset(DEFAULT_SUB_PRESET[grainTab]);
        setCustomBounds({ start: "", end: "" });
      }
      if (overviewSavedRangeId === id) {
        setOverviewSavedRangeId(null);
        setOverviewPreset(OVERVIEW_SUB_PRESET[overviewGrain]);
        setOverviewCustomBounds({ start: "", end: "" });
      }
    },
    [
      grainTab,
      overviewGrain,
      overviewSavedRangeId,
      savedRangeId,
      savedRanges,
    ],
  );

  const setViewMode = useCallback((next: ReportViewMode) => {
    setView(next);
  }, []);

  const scaleFactor = useMemo(
    () => getScaleFactor(activeWindow.dayCount, activeWindow.rangeKey),
    [activeWindow.dayCount, activeWindow.rangeKey],
  );

  const overviewSavedRanges = savedRanges;

  const grainSavedRanges = useMemo(
    () => filterSavedRangesForGrain(savedRanges, grainTab),
    [grainTab, savedRanges],
  );

  return {
    view,
    setView: setViewMode,
    isTrendsView: view === "trends",
    overviewGrain,
    selectOverviewGrain,
    overviewPreset,
    overviewSavedRangeId,
    selectOverviewPreset,
    selectOverviewSavedRange,
    grainTab,
    selectGrainTab,
    trendsPreset,
    savedRangeId,
    selectPreset,
    selectSavedRange,
    overviewWindow,
    trendsWindow,
    activeWindow,
    previousWindow,
    rangeKey: activeWindow.rangeKey,
    grain: activeWindow.grain,
    customDays: activeWindow.dayCount,
    scaleFactor,
    windowLabel: formatWindowLabel(activeWindow),
    periodLabel: formatPeriodRange(activeWindow),
    previousPeriodLabel: formatPeriodRange(previousWindow),
    queryParams: toReportQueryParams(activeWindow),
    overviewQueryParams: toReportQueryParams(overviewWindow),
    trendsQueryParams: toReportQueryParams(trendsWindow),
    previousQueryParams: toReportQueryParams(previousWindow),
    savedRanges: grainSavedRanges,
    overviewSavedRanges,
    comparePreviousPeriod,
    setComparePreviousPeriod,
    applyInlineTrendRange,
    selectTrendYear,
    trendYear: yearFromBounds(trendsWindow.bounds),
    availableTrendYears: yearsForLookback(),
    inlineRangeError,
    isPickerOpen,
    openPicker: () => openPicker(view === "trends" ? "trends" : "overview"),
    closePicker: () => setIsPickerOpen(false),
    draftRange,
    setDraftRange,
    draftName,
    setDraftName,
    applyDraftRange,
    saveDraftRange,
    deleteSavedRange,
    pickerError,
    pickerWarning,
    saveMessage,
    pickerGrain,
    pickerTarget,
  };
}

export type ReportTimeWindowState = ReturnType<typeof useReportTimeWindow>;
