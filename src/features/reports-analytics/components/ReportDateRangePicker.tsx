import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import Input from "../../../shared/components/ui/Input";
import { colors } from "../../../shared/utils/tokens";
import { tw } from "../../../shared/utils/utils";
import {
  addLocalDays,
  addLocalMonths,
  formatISODate,
  formatPeriodRange,
  getInclusiveDayCount,
  parseISODate,
  startOfLocalDay,
  startOfMonth,
  type LocalDateBounds,
  type ResolvedTimeWindow,
} from "../utils/reportTimeWindow";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type CalendarDay = {
  iso: string;
  inMonth: boolean;
  disabled: boolean;
  isToday: boolean;
};

type ReportDateRangePickerProps = {
  start: string;
  end: string;
  minDate: string;
  maxDate: string;
  onChange: (next: LocalDateBounds) => void;
  showCalendar?: boolean;
  compact?: boolean;
  fromId?: string;
  toId?: string;
  error?: string | null;
};

function monthCells(anchor: Date, minDate: string, maxDate: string): CalendarDay[] {
  const monthStart = startOfMonth(anchor);
  const weekday = monthStart.getDay();
  const mondayOffset = weekday === 0 ? 6 : weekday - 1;
  const gridStart = addLocalDays(monthStart, -mondayOffset);
  const today = formatISODate(startOfLocalDay());
  const cells: CalendarDay[] = [];
  for (let index = 0; index < 42; index += 1) {
    const date = addLocalDays(gridStart, index);
    const iso = formatISODate(date);
    cells.push({
      iso,
      inMonth: date.getMonth() === anchor.getMonth(),
      disabled: iso < minDate || iso > maxDate,
      isToday: iso === today,
    });
  }
  return cells;
}

function inRange(iso: string, start: string, end: string): boolean {
  if (!start || !end) return false;
  const from = start <= end ? start : end;
  const to = start <= end ? end : start;
  return iso >= from && iso <= to;
}

export default function ReportDateRangePicker({
  start,
  end,
  minDate,
  maxDate,
  onChange,
  showCalendar = true,
  compact = false,
  fromId = "report-range-from",
  toId = "report-range-to",
  error,
}: ReportDateRangePickerProps) {
  const selectedStart = parseISODate(start) || startOfLocalDay();
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(selectedStart));
  const [pickingEnd, setPickingEnd] = useState(Boolean(start && !end));

  const months = useMemo(() => {
    const first = startOfMonth(visibleMonth);
    return showCalendar && !compact ? [first, addLocalMonths(first, 1)] : [first];
  }, [compact, showCalendar, visibleMonth]);

  const dayCount = start && end ? getInclusiveDayCount(start, end) : null;
  const previewWindow: ResolvedTimeWindow | null =
    start && end
      ? {
          preset: "custom",
          grain: "daily",
          bounds: { start, end },
          rangeKey: "7d",
          dayCount: dayCount || 1,
        }
      : null;

  const handleInput = (next: Partial<LocalDateBounds>) => {
    onChange({
      start: next.start ?? start,
      end: next.end ?? end,
    });
  };

  const handleDayClick = (iso: string, disabled: boolean) => {
    if (disabled) return;
    if (!start || (start && end) || !pickingEnd) {
      onChange({ start: iso, end: "" });
      setPickingEnd(true);
      return;
    }
    if (iso < start) {
      onChange({ start: iso, end: start });
    } else {
      onChange({ start, end: iso });
    }
    setPickingEnd(false);
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor={fromId} className="text-xs font-medium text-gray-600">
            From
          </label>
          <Input
            id={fromId}
            type="date"
            variant={compact ? "compact" : "default"}
            value={start}
            min={minDate}
            max={maxDate}
            onChange={(value) => {
              const nextStart = String(value);
              handleInput({ start: nextStart });
              setPickingEnd(Boolean(nextStart && !end));
            }}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor={toId} className="text-xs font-medium text-gray-600">
            To
          </label>
          <Input
            id={toId}
            type="date"
            variant={compact ? "compact" : "default"}
            value={end}
            min={start || minDate}
            max={maxDate}
            onChange={(value) => handleInput({ end: String(value) })}
          />
        </div>
      </div>

      {showCalendar ? (
        <div className={`${tw.rounded} border border-gray-200 bg-white p-3`}>
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setVisibleMonth((prev) => addLocalMonths(prev, -1))}
              className={`${tw.rounded} p-1.5 text-gray-600 hover:bg-gray-100`}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-sm font-medium text-gray-800">
              {pickingEnd ? "Select the end date" : "Select the start date"}
            </p>
            <button
              type="button"
              onClick={() => setVisibleMonth((prev) => addLocalMonths(prev, 1))}
              className={`${tw.rounded} p-1.5 text-gray-600 hover:bg-gray-100`}
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className={`grid gap-4 ${months.length > 1 ? "lg:grid-cols-2" : ""}`}>
            {months.map((month) => (
              <div key={formatISODate(month)}>
                <p className="mb-2 text-center text-sm font-semibold text-gray-900">
                  {month.toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-gray-500">
                  {WEEKDAYS.map((day) => (
                    <span key={`${formatISODate(month)}-${day}`} className="py-1">
                      {day}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {monthCells(month, minDate, maxDate).map((day) => {
                    const selected =
                      day.iso === start || day.iso === end;
                    const ranged = inRange(day.iso, start, end);
                    return (
                      <button
                        key={day.iso}
                        type="button"
                        disabled={day.disabled}
                        onClick={() => handleDayClick(day.iso, day.disabled)}
                        className={`h-8 rounded text-xs ${
                          selected
                            ? "font-semibold text-white"
                            : ranged
                              ? "font-medium text-gray-900"
                              : day.inMonth
                                ? "text-gray-800"
                                : "text-gray-400"
                        } ${day.disabled ? "cursor-not-allowed opacity-40" : "hover:bg-gray-100"}`}
                        style={
                          selected
                            ? { backgroundColor: colors.primary.accent }
                            : ranged
                              ? { backgroundColor: "var(--c-interactive-hover)" }
                              : undefined
                        }
                      >
                        {Number(day.iso.slice(8))}
                        {day.isToday && !selected ? (
                          <span className="mx-auto mt-0.5 block h-0.5 w-3 rounded-full bg-gray-400" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {previewWindow ? (
        <p className="text-xs text-gray-500">
          Inclusive {formatPeriodRange(previewWindow)}
          {dayCount ? ` · ${dayCount} day${dayCount === 1 ? "" : "s"}` : ""}
        </p>
      ) : (
        <p className="text-xs text-gray-500">
          Click a start date, then an end date. Typed dates stay in sync with the calendar.
        </p>
      )}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
