import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import Checkbox from "../../../shared/components/ui/Checkbox";
import FormField from "../../../shared/components/FormField";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Input from "../../../shared/components/ui/Input";
import Radio from "../../../shared/components/ui/Radio";
import { tw } from "../../../shared/utils/utils";
import { timezoneService } from "../../configurations/services/timezoneService";
import { TimeZone } from "../../configurations/types/timezone";
import { PipelineFormState } from "../types/pipeline";
import {
  describeSchedule,
  SCHEDULE_RECURRENCE_OPTIONS,
  ScheduleDayTime,
  ScheduleEndType,
  ScheduleRecurrence,
  WEEKDAY_OPTIONS,
} from "../utils/pipelineSchedule";

interface PipelineScheduleFieldsProps {
  form: PipelineFormState;
  errors: Record<string, string>;
  onChange: (schedule: PipelineFormState["schedule"]) => void;
}

export default function PipelineScheduleFields({
  form,
  errors,
  onChange,
}: PipelineScheduleFieldsProps) {
  const schedule = form.schedule;
  const patch = (next: Partial<PipelineFormState["schedule"]>) =>
    onChange({ ...schedule, ...next });
  const [timezones, setTimezones] = useState<TimeZone[]>([]);
  const [timezonesLoading, setTimezonesLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const loadTimezones = async () => {
      try {
        const data = await timezoneService.getTimezones();
        if (cancelled) return;
        setTimezones(data.filter((zone) => zone?.is_active !== false && zone.value));
      } catch (error) {
        console.error("Failed to load timezones", error);
        if (!cancelled) setTimezones([]);
      } finally {
        if (!cancelled) setTimezonesLoading(false);
      }
    };
    void loadTimezones();
    return () => {
      cancelled = true;
    };
  }, []);

  const timezoneOptions = timezones
    .filter((zone) => zone.value && zone.label)
    .map((zone) => ({
      value: zone.value,
      label: zone.utc_offset ? `${zone.label} (${zone.utc_offset})` : zone.label,
    }));
  if (
    schedule.timezone &&
    !timezoneOptions.some((option) => option.value === schedule.timezone)
  ) {
    timezoneOptions.unshift({
      value: schedule.timezone,
      label: schedule.timezone,
    });
  }

  const patternLabel =
    SCHEDULE_RECURRENCE_OPTIONS.find((option) => option.value === schedule.recurrence)
      ?.label || "Days";
  const showSpecificSchedule =
    schedule.recurrence === "daily" || schedule.recurrence === "weekly";
  const dayTimes = schedule.dayTimes ?? [];

  const updateDayTimes = (next: ScheduleDayTime[]) => {
    patch({
      dayTimes: next,
      selectedDays: next.map((row) => row.day),
    });
  };

  const changeDefaultTime = (value: string) => {
    const previous = schedule.startTime;
    patch({
      startTime: value,
      dayTimes: dayTimes.map((row) =>
        row.time === previous ? { ...row, time: value } : row,
      ),
    });
  };

  const addDayTime = () => {
    const used = new Set(dayTimes.map((row) => row.day));
    const nextDay = WEEKDAY_OPTIONS.find((day) => !used.has(day.value))?.value;
    if (nextDay === undefined) return;
    updateDayTimes([
      ...dayTimes,
      { day: nextDay, time: schedule.startTime || "08:00" },
    ]);
  };

  return (
    <div className="space-y-6">
      <label className="flex items-center gap-3 text-sm text-gray-700">
        <Checkbox
          checked={schedule.enabled}
          onChange={(event) => patch({ enabled: event.target.checked })}
        />
        Run this pipeline on a schedule
      </label>
      {!schedule.enabled && (
        <p className="text-sm text-gray-500">{describeSchedule(schedule)}</p>
      )}
      {schedule.enabled && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField error={errors.schedule_start}>
              <Input
                type="date"
                label="Start date*"
                value={schedule.startDate}
                hasError={!!errors.schedule_start}
                onChange={(value) => patch({ startDate: String(value) })}
              />
            </FormField>
            <FormField error={errors.schedule_start}>
              <Input
                type="time"
                label="Start time*"
                value={schedule.startTime}
                hasError={!!errors.schedule_start}
                onChange={(value) => changeDefaultTime(String(value))}
              />
            </FormField>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">End</p>
            <div className="flex items-center gap-6">
              <label className="flex items-center">
                <Radio
                  name="pipeline-schedule-end"
                  value="never"
                  checked={schedule.endType === "never"}
                  onChange={() => patch({ endType: "never" })}
                />
                <span className="ml-2 text-sm font-medium text-gray-700">Never</span>
              </label>
              <label className="flex items-center">
                <Radio
                  name="pipeline-schedule-end"
                  value="at"
                  checked={schedule.endType === "at"}
                  onChange={() => patch({ endType: "at" as ScheduleEndType })}
                />
                <span className="ml-2 text-sm font-medium text-gray-700">At</span>
              </label>
            </div>
          </div>

          {schedule.endType === "at" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField error={errors.schedule_end}>
                <Input
                  type="date"
                  label="End date*"
                  value={schedule.endDate}
                  hasError={!!errors.schedule_end}
                  onChange={(value) => patch({ endDate: String(value) })}
                />
              </FormField>
              <FormField error={errors.schedule_end}>
                <Input
                  type="time"
                  label="End time*"
                  value={schedule.endTime}
                  hasError={!!errors.schedule_end}
                  onChange={(value) => patch({ endTime: String(value) })}
                />
              </FormField>
            </div>
          )}

          <div>
            <HeadlessSelect
              label="Time zone*"
              searchable
              searchPlaceholder="Search timezones..."
              value={schedule.timezone}
              error={!!errors.schedule_timezone}
              disabled={timezonesLoading && timezoneOptions.length === 0}
              placeholder={
                timezonesLoading ? "Loading timezones..." : "Select a timezone"
              }
              options={timezoneOptions}
              onChange={(value) => patch({ timezone: String(value) })}
            />
            {errors.schedule_timezone && (
              <p className="mt-1 text-xs text-red-600">{errors.schedule_timezone}</p>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-900">
              Recurrence Pattern and Delivery
            </h3>
            <div className={`border border-gray-200 ${tw.rounded} p-6 space-y-6`}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <HeadlessSelect
                  label="Recurrence Pattern"
                  value={schedule.recurrence}
                  options={SCHEDULE_RECURRENCE_OPTIONS}
                  onChange={(value) => {
                    const recurrence = String(value) as ScheduleRecurrence;
                    const weekly = recurrence === "weekly";
                    patch({
                      recurrence,
                      specificSchedule: weekly ? true : schedule.specificSchedule,
                      interval: weekly ? "1" : schedule.interval,
                      dayTimes:
                        weekly && dayTimes.length === 0
                          ? [{ day: 1, time: schedule.startTime || "08:00" }]
                          : dayTimes,
                    });
                  }}
                />
                <div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Input
                        type="number"
                        label="Recur Every"
                        min="1"
                        value={schedule.interval || "1"}
                        hasError={!!errors.schedule_interval}
                        onChange={(value) => patch({ interval: String(value) })}
                      />
                    </div>
                    <span className="pb-2.5 text-sm text-gray-600">{patternLabel}</span>
                  </div>
                  {errors.schedule_interval && (
                    <p className="mt-1 text-xs text-red-600">{errors.schedule_interval}</p>
                  )}
                </div>
                <Input
                  type="time"
                  label="Default Start Time"
                  value={schedule.startTime}
                  hasError={!!errors.schedule_start}
                  onChange={(value) => changeDefaultTime(String(value))}
                />
              </div>

              {showSpecificSchedule && (
                <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
                  <Checkbox
                    checked={schedule.specificSchedule}
                    onChange={(event) => {
                      const enabled = event.target.checked;
                      patch({
                        specificSchedule: enabled,
                        interval: enabled ? "1" : schedule.interval,
                        dayTimes:
                          enabled && dayTimes.length === 0
                            ? [{ day: 1, time: schedule.startTime || "08:00" }]
                            : dayTimes,
                      });
                    }}
                  />
                  Set specific schedule
                </label>
              )}

              {showSpecificSchedule && schedule.specificSchedule && (
                <div className={`border border-gray-200 ${tw.rounded} p-4 space-y-3`}>
                  {dayTimes.map((row, index) => (
                    <div key={`${row.day}-${index}`} className="flex items-end gap-3">
                      <div className="min-w-0 flex-1">
                        <HeadlessSelect
                          value={row.day}
                          options={WEEKDAY_OPTIONS.map((day) => ({
                            value: day.value,
                            label: day.label,
                            disabled: dayTimes.some(
                              (other, otherIndex) =>
                                otherIndex !== index && other.day === day.value,
                            ),
                          }))}
                          onChange={(value) => {
                            const next = dayTimes.map((current, currentIndex) =>
                              currentIndex === index
                                ? { ...current, day: Number(value) }
                                : current,
                            );
                            updateDayTimes(next);
                          }}
                        />
                      </div>
                      <div className="w-40">
                        <Input
                          type="time"
                          label={index === 0 ? "Time" : undefined}
                          value={row.time}
                          hasError={!!errors.schedule_days}
                          onChange={(value) => {
                            const next = dayTimes.map((current, currentIndex) =>
                              currentIndex === index
                                ? { ...current, time: String(value) }
                                : current,
                            );
                            updateDayTimes(next);
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        aria-label="Remove day"
                        className={`mb-0.5 inline-flex h-10 w-10 items-center justify-center border border-gray-300 text-gray-500 hover:text-red-600 ${tw.rounded}`}
                        onClick={() =>
                          updateDayTimes(dayTimes.filter((_, currentIndex) => currentIndex !== index))
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    disabled={dayTimes.length >= WEEKDAY_OPTIONS.length}
                    className={`px-3 py-2 text-sm border border-gray-300 text-gray-800 disabled:opacity-50 ${tw.rounded}`}
                    onClick={addDayTime}
                  >
                    Add Day Time
                  </button>
                </div>
              )}
              {errors.schedule_days && (
                <p className="text-xs text-red-600">{errors.schedule_days}</p>
              )}
            </div>
          </div>

          <p className="text-sm text-gray-600">{describeSchedule(schedule)}</p>
        </div>
      )}
    </div>
  );
}
