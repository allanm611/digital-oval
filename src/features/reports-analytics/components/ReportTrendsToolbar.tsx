import { BookmarkPlus, CalendarRange, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import Input from "../../../shared/components/ui/Input";
import RegularModal from "../../../shared/components/ui/RegularModal";
import SegmentedTabs from "../../../shared/components/ui/SegmentedTabs";
import { colors } from "../../../shared/utils/tokens";
import { tw } from "../../../shared/utils/utils";
import type { ReportViewMode, SavedReportDateRange } from "../types/ReportsAPI";
import type { ReportTimeWindowState } from "../hooks/useReportTimeWindow";
import {
  TREND_GRAIN_TABS,
  allNamedRangePresets,
  namedRangePresets,
  getDateConstraints,
  type TrendSubPreset,
} from "../utils/reportTimeWindow";

const REPORT_VIEW_TABS: Array<{ id: ReportViewMode; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "trends", label: "Trends" },
];

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
    savedRanges,
    overviewSavedRanges,
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
  } = timeWindow;

  const overviewPresets = allNamedRangePresets();
  const trendPresets = namedRangePresets(grainTab);
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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
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
          <RangeChips
            presets={overviewPresets}
            savedRanges={overviewSavedRanges}
            activePreset={overviewPreset}
            savedRangeId={overviewSavedRangeId}
            onSelectPreset={selectOverviewPreset}
            onSelectSavedRange={selectOverviewSavedRange}
          />
          {windowLabel ? (
            <p className="text-xs text-gray-500">
              Overview window: {windowLabel}
            </p>
          ) : null}
        </div>
      )}

      {isTrendsView && (
        <div className="space-y-2">
          <SegmentedTabs
            items={TREND_GRAIN_TABS}
            value={grainTab}
            onChange={selectGrainTab}
            ariaLabel="Trend grain"
          />
          <RangeChips
            presets={trendPresets}
            savedRanges={savedRanges}
            activePreset={trendsPreset}
            savedRangeId={savedRangeId}
            onSelectPreset={selectPreset}
            onSelectSavedRange={selectSavedRange}
          />
          <p className="text-xs text-gray-500">
            Showing {windowLabel}. Saved custom ranges stay under {grainTab}{" "}
            only.
          </p>
        </div>
      )}

      <RegularModal
        isOpen={isPickerOpen}
        onClose={closePicker}
        title={pickerTitle}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {pickerTarget === "overview"
              ? "Inclusive From / To. Grain is inferred from the span so KPIs and tables stay aligned."
              : `Inclusive From / To for ${pickerGrain}. Saved ranges stay on this tab only — they will not appear under the other grain tabs.`}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="report-trend-from"
                className="text-sm font-medium text-gray-700"
              >
                From
              </label>
              <Input
                id="report-trend-from"
                type="date"
                value={draftRange.start}
                min={constraints.minDate}
                max={constraints.maxDate}
                onChange={(value) =>
                  setDraftRange((prev) => ({ ...prev, start: String(value) }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="report-trend-to"
                className="text-sm font-medium text-gray-700"
              >
                To
              </label>
              <Input
                id="report-trend-to"
                type="date"
                value={draftRange.end}
                min={draftRange.start || constraints.minDate}
                max={constraints.maxDate}
                onChange={(value) =>
                  setDraftRange((prev) => ({ ...prev, end: String(value) }))
                }
              />
            </div>
          </div>
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
