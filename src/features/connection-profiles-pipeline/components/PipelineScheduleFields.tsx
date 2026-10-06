import Checkbox from "../../../shared/components/ui/Checkbox";
import FormField from "../../../shared/components/FormField";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Input from "../../../shared/components/ui/Input";
import { PipelineFormState } from "../types/pipeline";
import {
  describeSchedule,
  SCHEDULE_FREQUENCY_OPTIONS,
  SCHEDULE_TIMEZONE_OPTIONS,
  WEEKDAY_OPTIONS,
  ScheduleFrequency,
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
  const frequencyHelp = SCHEDULE_FREQUENCY_OPTIONS.find(
    (option) => option.value === schedule.frequency,
  )?.description;
  const timezoneOptions = SCHEDULE_TIMEZONE_OPTIONS.some(
    (option) => option.value === schedule.timezone,
  )
    ? SCHEDULE_TIMEZONE_OPTIONS
    : [{ value: schedule.timezone, label: schedule.timezone }, ...SCHEDULE_TIMEZONE_OPTIONS];

  return (
    <div className="space-y-6">
      <label className="flex items-center gap-3 text-sm text-gray-700">
        <Checkbox
          checked={schedule.enabled}
          onChange={(event) => patch({ enabled: event.target.checked })}
        />
        Run this pipeline on a schedule
      </label>
      {schedule.enabled && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <HeadlessSelect
                label="Frequency*"
                value={schedule.frequency}
                options={SCHEDULE_FREQUENCY_OPTIONS.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
                onChange={(value) =>
                  patch({ frequency: String(value) as ScheduleFrequency })
                }
              />
              {frequencyHelp && (
                <p className="mt-1 text-xs text-gray-500">{frequencyHelp}</p>
              )}
            </div>
            <div>
              <HeadlessSelect
                label="Timezone*"
                searchable
                searchPlaceholder="Search timezones..."
                value={schedule.timezone}
                error={!!errors.schedule_timezone}
                options={timezoneOptions}
                onChange={(value) => patch({ timezone: String(value) })}
              />
              {errors.schedule_timezone && (
                <p className="mt-1 text-xs text-red-600">{errors.schedule_timezone}</p>
              )}
            </div>
            {schedule.frequency === "weekly" && (
              <HeadlessSelect
                label="Weekday*"
                value={schedule.dayOfWeek}
                options={WEEKDAY_OPTIONS}
                onChange={(value) => patch({ dayOfWeek: String(value) })}
              />
            )}
            {schedule.frequency === "monthly" && (
              <FormField error={errors.schedule_day}>
                <Input
                  label="Day of month*"
                  type="number"
                  value={schedule.dayOfMonth}
                  hasError={!!errors.schedule_day}
                  onChange={(value) => patch({ dayOfMonth: String(value) })}
                />
              </FormField>
            )}
            {schedule.frequency !== "custom" && schedule.frequency !== "hourly" && (
              <FormField error={errors.schedule_hour}>
                <Input
                  label="Hour*"
                  type="number"
                  value={schedule.hour}
                  hasError={!!errors.schedule_hour}
                  onChange={(value) => patch({ hour: String(value) })}
                />
              </FormField>
            )}
            {schedule.frequency !== "custom" && (
              <FormField error={errors.schedule_minute}>
                <Input
                  label="Minute*"
                  type="number"
                  value={schedule.minute}
                  hasError={!!errors.schedule_minute}
                  onChange={(value) => patch({ minute: String(value) })}
                />
              </FormField>
            )}
            {schedule.frequency === "custom" && (
              <FormField error={errors.schedule_cron}>
                <Input
                  label="Cron expression*"
                  placeholder="0 2 * * *"
                  value={schedule.cron}
                  hasError={!!errors.schedule_cron}
                  onChange={(value) => patch({ cron: String(value) })}
                />
              </FormField>
            )}
          </div>
          <p className="text-sm text-gray-600">{describeSchedule(schedule)}</p>
        </>
      )}
      {!schedule.enabled && (
        <p className="text-sm text-gray-500">{describeSchedule(schedule)}</p>
      )}
    </div>
  );
}
