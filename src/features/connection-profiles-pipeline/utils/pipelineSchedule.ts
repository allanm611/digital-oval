export type ScheduleFrequency =
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "custom";

export interface PipelineScheduleDraft {
  enabled: boolean;
  frequency: ScheduleFrequency;
  minute: string;
  hour: string;
  dayOfWeek: string;
  dayOfMonth: string;
  cron: string;
  timezone: string;
}

export const SCHEDULE_FREQUENCY_OPTIONS: Array<{
  value: ScheduleFrequency;
  label: string;
  description: string;
}> = [
  {
    value: "hourly",
    label: "Every hour",
    description: "Runs once each hour, at the minute you choose.",
  },
  {
    value: "daily",
    label: "Every day",
    description: "Runs once a day at the time you choose.",
  },
  {
    value: "weekly",
    label: "Every week",
    description: "Runs once a week on the day and time you choose.",
  },
  {
    value: "monthly",
    label: "Every month",
    description: "Runs once a month. Days 29 to 31 are skipped in shorter months.",
  },
  {
    value: "custom",
    label: "Custom",
    description: "A five-field cron expression: minute, hour, day, month, weekday.",
  },
];

export const WEEKDAY_OPTIONS = [
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
  { value: "0", label: "Sunday" },
];

export const SCHEDULE_TIMEZONE_OPTIONS = [
  { value: "Africa/Nairobi", label: "Africa/Nairobi" },
  { value: "UTC", label: "UTC" },
  { value: "Africa/Lagos", label: "Africa/Lagos" },
  { value: "Africa/Johannesburg", label: "Africa/Johannesburg" },
  { value: "Africa/Cairo", label: "Africa/Cairo" },
  { value: "Europe/London", label: "Europe/London" },
  { value: "Europe/Paris", label: "Europe/Paris" },
  { value: "Asia/Dubai", label: "Asia/Dubai" },
  { value: "Asia/Kolkata", label: "Asia/Kolkata" },
  { value: "America/New_York", label: "America/New_York" },
];

const DEFAULT_TIMEZONE = "Africa/Nairobi";

export function emptySchedule(): PipelineScheduleDraft {
  return {
    enabled: false,
    frequency: "daily",
    minute: "0",
    hour: "2",
    dayOfWeek: "1",
    dayOfMonth: "1",
    cron: "",
    timezone: DEFAULT_TIMEZONE,
  };
}

function wholeNumber(value: string, min: number, max: number): number | null {
  if (!/^\d+$/.test(value.trim())) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) return null;
  return parsed;
}

function isCronField(token: string, min: number, max: number): boolean {
  return token.split(",").every((part) => {
    const match = part.match(/^(\*|\d+)(?:-(\d+))?(?:\/(\d+))?$/);
    if (!match) return false;
    if (match[1] === "*" && match[2]) return false;
    const step = match[3] ? Number(match[3]) : null;
    if (step !== null && (!Number.isInteger(step) || step < 1)) return false;
    if (match[1] === "*") return true;
    const start = Number(match[1]);
    const end = match[2] ? Number(match[2]) : start;
    return (
      Number.isInteger(start) &&
      Number.isInteger(end) &&
      start >= min &&
      end <= max &&
      start <= end
    );
  });
}

export function isCronExpression(value: string): boolean {
  const fields = value.trim().split(/\s+/);
  const body = fields.length === 6 ? fields.slice(1) : fields;
  if (body.length !== 5) return false;
  const [minute, hour, day, month, weekday] = body;
  return (
    isCronField(minute, 0, 59) &&
    isCronField(hour, 0, 23) &&
    isCronField(day, 1, 31) &&
    isCronField(month, 1, 12) &&
    isCronField(weekday, 0, 7)
  );
}

export function cronFromSchedule(
  schedule: PipelineScheduleDraft,
): { ok: true; cron: string } | { ok: false; message: string } {
  if (schedule.frequency === "custom") {
    const cron = schedule.cron.trim();
    if (!cron) {
      return { ok: false, message: "Enter a cron expression for this schedule." };
    }
    if (!isCronExpression(cron)) {
      return {
        ok: false,
        message:
          "Use five fields: minute hour day month weekday. For example, 0 2 * * * runs every day at 02:00.",
      };
    }
    return { ok: true, cron };
  }

  const minute = wholeNumber(schedule.minute, 0, 59);
  if (minute === null) {
    return { ok: false, message: "Minute must be a whole number from 0 to 59." };
  }
  if (schedule.frequency === "hourly") {
    return { ok: true, cron: `${minute} * * * *` };
  }

  const hour = wholeNumber(schedule.hour, 0, 23);
  if (hour === null) {
    return { ok: false, message: "Hour must be a whole number from 0 to 23." };
  }
  if (schedule.frequency === "daily") {
    return { ok: true, cron: `${minute} ${hour} * * *` };
  }
  if (schedule.frequency === "weekly") {
    const day = wholeNumber(schedule.dayOfWeek, 0, 6);
    if (day === null) {
      return { ok: false, message: "Choose the weekday this pipeline runs." };
    }
    return { ok: true, cron: `${minute} ${hour} * * ${day}` };
  }

  const dayOfMonth = wholeNumber(schedule.dayOfMonth, 1, 31);
  if (dayOfMonth === null) {
    return { ok: false, message: "Day of month must be a whole number from 1 to 31." };
  }
  return { ok: true, cron: `${minute} ${hour} ${dayOfMonth} * *` };
}

function clock(hour: string, minute: string): string {
  return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
}

export function describeSchedule(
  schedule: Pick<
    PipelineScheduleDraft,
    "enabled" | "frequency" | "minute" | "hour" | "dayOfWeek" | "dayOfMonth" | "cron" | "timezone"
  >,
): string {
  if (!schedule.enabled) return "Not scheduled";
  const zone = schedule.timezone || DEFAULT_TIMEZONE;
  if (schedule.frequency === "hourly") {
    return `Every hour at minute ${schedule.minute.padStart(2, "0")} (${zone}).`;
  }
  if (schedule.frequency === "daily") {
    return `Every day at ${clock(schedule.hour, schedule.minute)} (${zone}).`;
  }
  if (schedule.frequency === "weekly") {
    const day =
      WEEKDAY_OPTIONS.find((option) => option.value === schedule.dayOfWeek)?.label ||
      "the selected day";
    return `Every ${day} at ${clock(schedule.hour, schedule.minute)} (${zone}).`;
  }
  if (schedule.frequency === "monthly") {
    return `Day ${schedule.dayOfMonth} of each month at ${clock(schedule.hour, schedule.minute)} (${zone}).`;
  }
  return schedule.cron.trim()
    ? `Custom schedule ${schedule.cron.trim()} (${zone}).`
    : `Custom schedule (${zone}).`;
}

export function scheduleFromPipeline(input: {
  schedule_enabled?: boolean;
  schedule_cron?: string | null;
  schedule_timezone?: string;
}): PipelineScheduleDraft {
  const base = emptySchedule();
  base.enabled = input.schedule_enabled === true;
  base.timezone = input.schedule_timezone || DEFAULT_TIMEZONE;
  const cron = (input.schedule_cron || "").trim();
  if (!cron) return base;

  const hourly = cron.match(/^(\d{1,2}) \* \* \* \*$/);
  if (hourly) {
    base.frequency = "hourly";
    base.minute = String(Number(hourly[1]));
    return base;
  }
  const daily = cron.match(/^(\d{1,2}) (\d{1,2}) \* \* \*$/);
  if (daily) {
    base.frequency = "daily";
    base.minute = String(Number(daily[1]));
    base.hour = String(Number(daily[2]));
    return base;
  }
  const weekly = cron.match(/^(\d{1,2}) (\d{1,2}) \* \* ([0-7])$/);
  if (weekly) {
    base.frequency = "weekly";
    base.minute = String(Number(weekly[1]));
    base.hour = String(Number(weekly[2]));
    base.dayOfWeek = weekly[3] === "7" ? "0" : String(Number(weekly[3]));
    return base;
  }
  const monthly = cron.match(/^(\d{1,2}) (\d{1,2}) (\d{1,2}) \* \*$/);
  if (monthly) {
    base.frequency = "monthly";
    base.minute = String(Number(monthly[1]));
    base.hour = String(Number(monthly[2]));
    base.dayOfMonth = String(Number(monthly[3]));
    return base;
  }

  base.frequency = "custom";
  base.cron = cron;
  return base;
}

export function describeStoredSchedule(input: {
  schedule_enabled?: boolean;
  schedule_cron?: string | null;
  schedule_timezone?: string;
}): string {
  return describeSchedule(scheduleFromPipeline(input));
}
