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
  formatWindowLabel,
  getScaleFactor,
  presetBelongsToGrain,
  resolveTimeWindow,
  seedCustomBounds,
  toReportQueryParams,
  validateDateRange,
  type LocalDateBounds,
} from "../utils/reportTimeWindow";
import {
  createSavedReportDateRange,
  filterSavedRangesForGrain,
  loadSavedReportDateRanges,
  MAX_SAVED_REPORT_RANGES_PER_GRAIN,
  persistSavedReportDateRanges,
} from "../utils/savedReportDateRanges";

export function useReportTimeWindow(options?: {
  overviewPreset?: ReportGrain;
  defaultTrendsPreset?: ReportGrain;
}) {
  const overviewGrain = options?.overviewPreset ?? "weekly";
  const defaultTrendsGrain = options?.defaultTrendsPreset ?? "daily";

  const [view, setView] = useState<ReportViewMode>("overview");
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
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [draftRange, setDraftRange] = useState<LocalDateBounds>({
    start: "",
    end: "",
  });
  const [draftName, setDraftName] = useState("");
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [pickerWarning, setPickerWarning] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const overviewWindow = useMemo(
    () =>
      resolveTimeWindow(OVERVIEW_SUB_PRESET[overviewGrain], {
        grain: overviewGrain,
      }),
    [overviewGrain],
  );

  const trendsWindow = useMemo(() => {
    if (savedRangeId) {
      const saved = savedRanges.find(
        (item) => item.id === savedRangeId && item.grain === grainTab,
      );
      if (saved) {
        return resolveTimeWindow("custom", {
          custom: { start: saved.startDate, end: saved.endDate },
          grain: saved.grain,
        });
      }
    }
    return resolveTimeWindow(trendsPreset, {
      custom: trendsPreset === "custom" ? customBounds : undefined,
      grain: grainTab,
    });
  }, [customBounds, grainTab, savedRangeId, savedRanges, trendsPreset]);

  const activeWindow = view === "trends" ? trendsWindow : overviewWindow;

  const openPicker = useCallback(
    (grain: ReportGrain) => {
      const seed =
        customBounds.start && customBounds.end && grainTab === grain
          ? customBounds
          : seedCustomBounds(grain);
      setDraftRange(seed);
      setDraftName("");
      setPickerError(null);
      setPickerWarning(null);
      setSaveMessage(null);
      setIsPickerOpen(true);
    },
    [customBounds, grainTab],
  );

  const selectGrainTab = useCallback(
    (grain: ReportGrain) => {
      setGrainTab(grain);
      setSavedRangeId(null);
      if (!presetBelongsToGrain(trendsPreset, grain) || trendsPreset === "custom") {
        setTrendsPreset(DEFAULT_SUB_PRESET[grain]);
        setCustomBounds({ start: "", end: "" });
      }
    },
    [trendsPreset],
  );

  const selectPreset = useCallback(
    (preset: TimeWindowPreset) => {
      setSavedRangeId(null);
      setTrendsPreset(preset);
      if (preset === "custom") {
        openPicker(grainTab);
        return;
      }
      setCustomBounds({ start: "", end: "" });
    },
    [grainTab, openPicker],
  );

  const selectSavedRange = useCallback((range: SavedReportDateRange) => {
    if (range.grain !== grainTab) return;
    setSavedRangeId(range.id);
    setTrendsPreset("custom");
    setCustomBounds({ start: range.startDate, end: range.endDate });
    setIsPickerOpen(false);
  }, [grainTab]);

  const applyDraftRange = useCallback(() => {
    const result = validateDateRange(draftRange.start, draftRange.end, {
      grain: grainTab,
    });
    if (!result.ok) {
      setPickerError(result.error || "Invalid date range.");
      setPickerWarning(null);
      return false;
    }
    setPickerError(null);
    setPickerWarning(result.warning || null);
    setCustomBounds(draftRange);
    setSavedRangeId(null);
    setTrendsPreset("custom");
    setIsPickerOpen(false);
    return true;
  }, [draftRange, grainTab]);

  const saveDraftRange = useCallback(() => {
    const result = validateDateRange(draftRange.start, draftRange.end, {
      grain: grainTab,
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
    const rangesForGrain = filterSavedRangesForGrain(savedRanges, grainTab);
    if (
      rangesForGrain.some(
        (item) => item.name.toLowerCase() === name.toLowerCase(),
      )
    ) {
      setPickerError(
        `A saved ${grainTab} range with this name already exists.`,
      );
      return false;
    }
    if (rangesForGrain.length >= MAX_SAVED_REPORT_RANGES_PER_GRAIN) {
      setPickerError(
        `You can save up to ${MAX_SAVED_REPORT_RANGES_PER_GRAIN} custom ranges under ${grainTab}.`,
      );
      return false;
    }
    const next = [
      createSavedReportDateRange({
        name,
        startDate: draftRange.start,
        endDate: draftRange.end,
        grain: grainTab,
      }),
      ...savedRanges,
    ];
    persistSavedReportDateRanges(next);
    setSavedRanges(next);
    setSavedRangeId(next[0].id);
    setGrainTab(grainTab);
    setTrendsPreset("custom");
    setCustomBounds(draftRange);
    setDraftName("");
    setPickerError(null);
    setPickerWarning(result.warning || null);
    setSaveMessage(`Saved “${name}”.`);
    return true;
  }, [draftName, draftRange, grainTab, savedRanges]);

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
    },
    [grainTab, savedRangeId, savedRanges],
  );

  const setViewMode = useCallback((next: ReportViewMode) => {
    setView(next);
  }, []);

  const scaleFactor = useMemo(
    () => getScaleFactor(activeWindow.dayCount, activeWindow.rangeKey),
    [activeWindow.dayCount, activeWindow.rangeKey],
  );

  const grainSavedRanges = useMemo(
    () => filterSavedRangesForGrain(savedRanges, grainTab),
    [grainTab, savedRanges],
  );

  return {
    view,
    setView: setViewMode,
    isTrendsView: view === "trends",
    grainTab,
    selectGrainTab,
    trendsPreset,
    savedRangeId,
    selectPreset,
    selectSavedRange,
    overviewWindow,
    trendsWindow,
    activeWindow,
    rangeKey: activeWindow.rangeKey,
    grain: activeWindow.grain,
    customDays: activeWindow.dayCount,
    scaleFactor,
    windowLabel: formatWindowLabel(activeWindow),
    queryParams: toReportQueryParams(activeWindow),
    overviewQueryParams: toReportQueryParams(overviewWindow),
    trendsQueryParams: toReportQueryParams(trendsWindow),
    savedRanges: grainSavedRanges,
    isPickerOpen,
    openPicker: () => openPicker(grainTab),
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
  };
}

export type ReportTimeWindowState = ReturnType<typeof useReportTimeWindow>;
