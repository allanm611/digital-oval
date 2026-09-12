import { BookmarkPlus, CalendarRange, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import Input from "../../../shared/components/ui/Input";
import RegularModal from "../../../shared/components/ui/RegularModal";
import { colors } from "../../../shared/utils/tokens";
import { tw } from "../../../shared/utils/utils";
import type { ReportTimeWindowState } from "../hooks/useReportTimeWindow";
import {
  TREND_GRAIN_TABS,
  TREND_SUB_PRESETS,
  getDateConstraints,
} from "../utils/reportTimeWindow";
import { filterSavedRangesForGrain } from "../utils/savedReportDateRanges";

interface ReportTrendsToolbarProps {
  timeWindow: ReportTimeWindowState;
  entityFilter?: ReactNode;
  extraActions?: ReactNode;
}

function chipClass(active: boolean) {
  return `${tw.rounded} border px-3 py-1.5 text-sm font-medium transition-colors ${
    active
      ? "border-[#252829] bg-[#252829] text-white"
      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
  }`;
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
    grainTab,
    selectGrainTab,
    trendsPreset,
    savedRangeId,
    selectPreset,
    selectSavedRange,
    windowLabel,
    savedRanges,
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
  } = timeWindow;

  const subPresets = TREND_SUB_PRESETS[grainTab];
  const scopedSavedRanges = filterSavedRangesForGrain(savedRanges, grainTab);
  const pickerTitle =
    grainTab === "weekly"
      ? "Custom weekly range"
      : grainTab === "monthly"
        ? "Custom monthly range"
        : "Custom daily range";

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {entityFilter}
          {entityFilter ? <div className="h-6 border-l border-gray-300" /> : null}
          <div
            className={`${tw.rounded} inline-flex border border-gray-200 bg-white p-0.5`}
            role="tablist"
            aria-label="Report view"
          >
            <button
              type="button"
              role="tab"
              aria-selected={view === "overview"}
              onClick={() => setView("overview")}
              className={`${tw.rounded} px-3 py-1.5 text-sm font-medium transition-colors ${
                view === "overview"
                  ? "bg-[#252829] text-white"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={isTrendsView}
              onClick={() => setView("trends")}
              className={`${tw.rounded} px-3 py-1.5 text-sm font-medium transition-colors ${
                isTrendsView
                  ? "bg-[#252829] text-white"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              Trends
            </button>
          </div>
        </div>
        {extraActions ? (
          <div className="flex flex-wrap items-center gap-3">{extraActions}</div>
        ) : null}
      </div>

      {!isTrendsView && windowLabel ? (
        <p className="text-xs text-gray-500">Overview window: {windowLabel}</p>
      ) : null}

      {isTrendsView && (
        <div className="space-y-2">
          <div
            className={`${tw.rounded} inline-flex border border-gray-200 bg-white p-0.5`}
            role="tablist"
            aria-label="Trend grain"
          >
            {TREND_GRAIN_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={grainTab === tab.id}
                onClick={() => selectGrainTab(tab.id)}
                className={`${tw.rounded} px-3 py-1.5 text-sm font-medium transition-colors ${
                  grainTab === tab.id
                    ? "bg-[#252829] text-white"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {subPresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                title={preset.hint}
                onClick={() => selectPreset(preset.id)}
                className={chipClass(
                  !savedRangeId && trendsPreset === preset.id,
                )}
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
            {scopedSavedRanges.map((range) => (
              <button
                key={range.id}
                type="button"
                onClick={() => selectSavedRange(range)}
                title={`${range.startDate} to ${range.endDate} · ${range.grain}`}
                className={chipClass(savedRangeId === range.id)}
              >
                {range.name}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500">
            Showing {windowLabel}. Saved custom ranges stay under {grainTab} only.
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
            Inclusive From / To for {grainTab}. Saved ranges stay on this tab
            only — they will not appear under the other grain tabs.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="report-trend-from" className="text-sm font-medium text-gray-700">
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
              <label htmlFor="report-trend-to" className="text-sm font-medium text-gray-700">
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
            <label htmlFor="report-trend-range-name" className="text-sm font-medium text-gray-700">
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
          {scopedSavedRanges.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                Saved {grainTab} ranges
              </p>
              <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                {scopedSavedRanges.map((range) => (
                  <li
                    key={range.id}
                    className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                  >
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => selectSavedRange(range)}
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
