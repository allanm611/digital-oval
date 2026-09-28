import { BookmarkPlus, CalendarRange, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import Checkbox from "../../../shared/components/ui/Checkbox";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Input from "../../../shared/components/ui/Input";
import RegularModal from "../../../shared/components/ui/RegularModal";
import SegmentedTabs from "../../../shared/components/ui/SegmentedTabs";
import { colors } from "../../../shared/utils/tokens";
import { tw } from "../../../shared/utils/utils";
import type {
  ReportViewMode,
  SavedReportDateRange,
  TimeWindowPreset,
} from "../types/ReportsAPI";
import type { ReportTimeWindowState } from "../hooks/useReportTimeWindow";
import {
  TREND_GRAIN_TABS,
  OVERVIEW_RANGE_PRESETS,
  boundsForPreset,
  namedRangePresets,
  formatPeriodRange,
  getDateConstraints,
  type TrendSubPreset,
} from "../utils/reportTimeWindow";
import ReportDateRangePicker from "./ReportDateRangePicker";

const REPORT_VIEW_TABS: Array<{ id: ReportViewMode; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "trends", label: "Trends" },
];

const SAVED_RANGE_PREFIX = "saved:";

interface ReportTrendsToolbarProps {
  timeWindow: ReportTimeWindowState;
  entityFilter?: ReactNode;
  extraActions?: ReactNode;
}

function chipClass(active: boolean) {
  return `${tw.rounded} border px-3 py-1.5 text-sm font-medium transition-colors ${
    active
      ? "border-[var(--c-bg-tab-active)] bg-[var(--c-bg-tab-active)] text-white"
      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
  }`;
}

function RangeChips({
  presets,
  savedRanges,
  activePreset,
  savedRangeId,
  onSelectPreset,
  onSelectSavedRange,
}: {
  presets: TrendSubPreset[];
  savedRanges: SavedReportDateRange[];
  activePreset: string;
  savedRangeId: string | null;
  onSelectPreset: (id: TrendSubPreset["id"]) => void;
  onSelectSavedRange: (range: SavedReportDateRange) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {presets.map((preset) => (
        <button
          key={preset.id}
          type="button"
          title={preset.hint}
          onClick={() => onSelectPreset(preset.id)}
          className={chipClass(!savedRangeId && activePreset === preset.id)}
        >
          {preset.id === "custom" ? (
            <span className="inline-flex items-center gap-1.5">
              <CalendarRange className="h-3.5 w-3.5" />
              {preset.label}
            </span>
          ) : (
            preset.label
          )}
        </button>
      ))}
      {savedRanges.map((range) => (
        <button
          key={range.id}
          type="button"
          onClick={() => onSelectSavedRange(range)}
          title={`${range.startDate} to ${range.endDate} · ${range.grain}`}
          className={chipClass(savedRangeId === range.id)}
        >
          {range.name}
        </button>
      ))}
    </div>
  );
}

export default function ReportTrendsToolbar({
  timeWindow,
  entityFilter,
  extraActions,
}: ReportTrendsToolbarProps) {
  const constraints = getDateConstraints();
  const {
    view,
    setView,
    isTrendsView,
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
    windowLabel,
    periodLabel,
    previousPeriodLabel,
    savedRanges,
    overviewSavedRanges,
    comparePreviousPeriod,
    setComparePreviousPeriod,
    applyInlineTrendRange,
    applyInlineOverviewRange,
    overviewInlineError,
    selectTrendYear,
    trendYear,
    availableTrendYears,
    inlineRangeError,
    isPickerOpen,
    closePicker,
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
    trendsWindow,
    overviewWindow,
  } = timeWindow;

  const trendPresets = namedRangePresets(grainTab);
  const [fromDate, setFromDate] = useState(trendsWindow.bounds.start);
  const [toDate, setToDate] = useState(trendsWindow.bounds.end);
  const [overviewFrom, setOverviewFrom] = useState(overviewWindow.bounds.start);
  const [overviewTo, setOverviewTo] = useState(overviewWindow.bounds.end);

  useEffect(() => {
    setFromDate(trendsWindow.bounds.start);
    setToDate(trendsWindow.bounds.end);
  }, [trendsWindow.bounds.start, trendsWindow.bounds.end]);

  useEffect(() => {
    setOverviewFrom(overviewWindow.bounds.start);
    setOverviewTo(overviewWindow.bounds.end);
  }, [overviewWindow.bounds.start, overviewWindow.bounds.end]);

  const isOverviewCustom = overviewPreset === "custom";
  const overviewQuickPresets = OVERVIEW_RANGE_PRESETS.filter((preset) =>
    [
      "last_7_days",
      "last_14_days",
      "this_month",
      "last_month",
      "last_3_months",
    ].includes(preset.id),
  );

  const overviewSelectValue = overviewSavedRangeId
    ? `${SAVED_RANGE_PREFIX}${overviewSavedRangeId}`
    : overviewPreset;

  const overviewOptions = useMemo(() => {
    const named = OVERVIEW_RANGE_PRESETS.map((preset) => ({
      value: preset.id,
      label: preset.label,
    }));
    const saved = overviewSavedRanges.map((range) => ({
      value: `${SAVED_RANGE_PREFIX}${range.id}`,
      label: range.name,
    }));
    if (overviewPreset === "custom" && !overviewSavedRangeId) {
      return [
        { value: "custom", label: "Custom range" },
        ...named,
        ...saved,
      ];
    }
    return [...named, ...saved];
  }, [overviewPreset, overviewSavedRangeId, overviewSavedRanges]);

  const handleOverviewPeriodChange = (value: string | number) => {
    const key = String(value);
    if (key.startsWith(SAVED_RANGE_PREFIX)) {
      const range = overviewSavedRanges.find(
        (item) => item.id === key.slice(SAVED_RANGE_PREFIX.length),
      );
      if (range) selectOverviewSavedRange(range);
      return;
    }
    if (key === "custom") {
      selectOverviewPreset("custom");
      return;
    }
    selectOverviewPreset(key as TimeWindowPreset);
  };

  const handleInlineDateChange = (next: { start?: string; end?: string }) => {
    const start = next.start ?? fromDate;
    const end = next.end ?? toDate;
    if (next.start !== undefined) setFromDate(next.start);
    if (next.end !== undefined) setToDate(next.end);
    if (start && end) applyInlineTrendRange({ start, end });
  };

  const handleOverviewInlineRange = (next: { start: string; end: string }) => {
    setOverviewFrom(next.start);
    setOverviewTo(next.end);
    if (next.start && next.end) applyInlineOverviewRange(next);
  };

  const pickerTitle =
    pickerTarget === "overview"
      ? "Custom date range"
      : pickerGrain === "weekly"
        ? "Custom weekly range"
        : pickerGrain === "monthly"
          ? "Custom monthly range"
          : "Custom daily range";

  return (
    <div className="space-y-3">
      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
        <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">
          {entityFilter}
          {entityFilter ? <div className="h-6 border-l border-gray-300" /> : null}
          <SegmentedTabs
            items={REPORT_VIEW_TABS}
            value={view}
            onChange={setView}
            ariaLabel="Report view"
          />
        </div>
        {extraActions ? (
          <div className="flex flex-wrap items-center gap-3">{extraActions}</div>
        ) : null}
      </div>

      {!isTrendsView && (
        <div className="space-y-2">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="flex w-full min-w-0 flex-col gap-1.5 sm:max-w-xs sm:min-w-[12rem] sm:flex-1">
              <span className="text-xs font-medium text-gray-600">Period</span>
              <HeadlessSelect
                searchable
                value={overviewSelectValue}
                onChange={handleOverviewPeriodChange}
                options={overviewOptions}
                placeholder="Select period"
              />
            </div>
            <button
              type="button"
              title="Pick a custom From / To range"
              onClick={() => selectOverviewPreset("custom")}
              className={`${chipClass(isOverviewCustom && !overviewSavedRangeId)} inline-flex w-full items-center justify-center gap-1.5 whitespace-nowrap sm:w-auto`}
            >
              <CalendarRange className="h-3.5 w-3.5" />
              Custom date range
            </button>
          </div>
          {isOverviewCustom ? (
            <div className="min-w-0 max-w-xl">
              <ReportDateRangePicker
                start={overviewFrom}
                end={overviewTo}
                minDate={constraints.minDate}
                maxDate={constraints.maxDate}
                onChange={handleOverviewInlineRange}
                showCalendar={false}
                compact
                fromId="report-overview-from"
                toId="report-overview-to"
                error={overviewInlineError}
              />
            </div>
          ) : null}
          {windowLabel ? (
            <p className="break-words text-xs text-gray-500">
              Overview window: {formatPeriodRange(overviewWindow)}
              {overviewPreset !== "custom"
                ? ` · ${OVERVIEW_RANGE_PRESETS.find((item) => item.id === overviewPreset)?.label || ""}`
                : " · Custom"}
            </p>
          ) : null}
        </div>
      )}

      {isTrendsView && (
        <div className="space-y-3">
          <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
            <SegmentedTabs
              items={TREND_GRAIN_TABS}
              value={grainTab}
              onChange={selectGrainTab}
              ariaLabel="Trend grain"
            />
            <div
              className={`${tw.rounded} inline-flex max-w-full items-center gap-2 border border-gray-200 bg-white px-3 py-1.5`}
            >
              <Checkbox
                id="compare-previous-period"
                checked={comparePreviousPeriod}
                onChange={(event) =>
                  setComparePreviousPeriod(event.target.checked)
                }
              />
              <label
                htmlFor="compare-previous-period"
                className="min-w-0 cursor-pointer text-sm font-medium text-gray-700"
              >
                Compare vs previous period
              </label>
            </div>
          </div>
          <RangeChips
            presets={trendPresets}
            savedRanges={savedRanges}
            activePreset={trendsPreset}
            savedRangeId={savedRangeId}
            onSelectPreset={selectPreset}
            onSelectSavedRange={selectSavedRange}
          />
          <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
            <div className="w-full max-w-xl">
              <ReportDateRangePicker
                start={fromDate}
                end={toDate}
                minDate={constraints.minDate}
                maxDate={constraints.maxDate}
                onChange={(next) =>
                  handleInlineDateChange({
                    start: next.start,
                    end: next.end,
                  })
                }
                showCalendar={false}
                compact
                fromId="report-trend-inline-from"
                toId="report-trend-inline-to"
                error={inlineRangeError}
              />
            </div>
            {grainTab === "monthly" ? (
              <div className="flex min-w-[8rem] flex-col gap-1.5 sm:max-w-[10rem]">
                <span className="text-xs font-medium text-gray-600">Year</span>
                <HeadlessSelect
                  value={trendYear ?? availableTrendYears[0]}
                  onChange={(value) => selectTrendYear(Number(value))}
                  options={availableTrendYears.map((year) => ({
                    value: year,
                    label: String(year),
                  }))}
                  placeholder="Year"
                />
              </div>
            ) : null}
          </div>
          <p className="break-words text-xs text-gray-500">
            Period: {periodLabel}
            {grainTab === "monthly" && trendYear ? ` · Year ${trendYear}` : ""}
            {comparePreviousPeriod
              ? ` · vs previous ${previousPeriodLabel}`
              : ""}
            . Saved custom ranges stay under {grainTab} only.
          </p>
        </div>
      )}

      <RegularModal
        isOpen={isPickerOpen}
        onClose={closePicker}
        title={pickerTitle}
        size="xl"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {pickerTarget === "overview"
              ? "Pick inclusive From / To dates on the calendar or type them. Grain is inferred from the span so KPIs and tables stay aligned."
              : `Pick inclusive From / To dates for ${pickerGrain}. Saved ranges stay on this tab only.`}
          </p>
          <div className="flex flex-wrap gap-2">
            {overviewQuickPresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                title={preset.hint}
                onClick={() => {
                  const bounds = boundsForPreset(preset.id);
                  setDraftRange(bounds);
                  setDraftName("");
                }}
                className={chipClass(false)}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <ReportDateRangePicker
            start={draftRange.start}
            end={draftRange.end}
            minDate={constraints.minDate}
            maxDate={constraints.maxDate}
            onChange={setDraftRange}
            fromId="report-trend-from"
            toId="report-trend-to"
          />
          <div className="space-y-1.5">
            <label
              htmlFor="report-trend-range-name"
              className="text-sm font-medium text-gray-700"
            >
              Save as (optional)
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="report-trend-range-name"
                value={draftName}
                placeholder="e.g. Launch week"
                onChange={(value) => setDraftName(String(value))}
                className="flex-1"
              />
              <button
                type="button"
                onClick={saveDraftRange}
                className={`${tw.rounded} inline-flex items-center justify-center gap-1.5 border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:border-gray-300`}
              >
                <BookmarkPlus className="h-4 w-4" />
                Save range
              </button>
            </div>
          </div>
          {pickerError && <p className="text-sm text-red-600">{pickerError}</p>}
          {pickerWarning && !pickerError && (
            <p className="text-sm text-amber-700">{pickerWarning}</p>
          )}
          {saveMessage && !pickerError && (
            <p className="text-sm text-emerald-700">{saveMessage}</p>
          )}
          {(pickerTarget === "overview"
            ? overviewSavedRanges
            : savedRanges
          ).length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                Saved {pickerGrain} ranges
              </p>
              <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                {(pickerTarget === "overview"
                  ? overviewSavedRanges
                  : savedRanges
                ).map((range) => (
                  <li
                    key={range.id}
                    className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                  >
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() =>
                        pickerTarget === "overview"
                          ? selectOverviewSavedRange(range)
                          : selectSavedRange(range)
                      }
                    >
                      <span className="block truncate font-medium text-gray-900">
                        {range.name}
                      </span>
                      <span className="block text-xs text-gray-500">
                        {range.startDate} to {range.endDate}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteSavedRange(range.id)}
                      className={`${tw.rounded} p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600`}
                      aria-label={`Delete ${range.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={closePicker}
              className={`${tw.rounded} border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 hover:border-gray-300`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={applyDraftRange}
              className={`${tw.rounded} px-4 py-1.5 text-sm font-medium text-white`}
              style={{ backgroundColor: colors.primary.accent }}
            >
              Apply
            </button>
          </div>
        </div>
      </RegularModal>
    </div>
  );
}
