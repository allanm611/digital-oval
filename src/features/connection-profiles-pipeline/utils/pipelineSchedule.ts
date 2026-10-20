import { getSettingsTimezone } from "../../../shared/utils/settingsHelper";

export type ScheduleRecurrence = "hourly" | "daily" | "weekly" | "monthly";
export type ScheduleEndType = "never" | "at";

export interface ScheduleDayTime {
  day: number;
  time: string;
}

export interface PipelineScheduleDraft {
  enabled: boolean;
  startDate: string;
  startTime: string;
  endType: ScheduleEndType;
  endDate: string;
  endTime: string;
  recurrence: ScheduleRecurrence;
  interval: string;
  specificSchedule: boolean;
  dayTimes: ScheduleDayTime[];
  selectedDays: number[];
  timezone: string;
}

export const SCHEDULE_RECURRENCE_OPTIONS: Array<{
  value: ScheduleRecurrence;
  label: string;
}> = [
  { value: "hourly", label: "Hours" },
  { value: "daily", label: "Days" },
  { value: "weekly", label: "Weeks" },
  { value: "monthly", label: "Months" },
];

export const WEEKDAY_OPTIONS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

function todayDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function emptySchedule(): PipelineScheduleDraft {
  return {
    enabled: false,
    startDate: todayDate(),
    startTime: "08:00",
    endType: "never",
    endDate: "",
    endTime: "23:59",
    recurrence: "daily",
    interval: "1",
    specificSchedule: false,
    dayTimes: [{ day: 1, time: "08:00" }],
    selectedDays: [1, 2, 3, 4, 5, 6],
    timezone: getSettingsTimezone() || "Africa/Nairobi",
  };
}

function clockParts(time: string): { hour: number; minute: number } | null {
  const match = time.trim().match(/^(\d{2}):(\d{2})$/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return { hour, minute };
}

function dayOfMonth(date: string): number | null {
  const match = date.match(/^\d{4}-\d{2}-(\d{2})$/);
  if (!match) return null;
  const day = Number(match[1]);
  if (day < 1 || day > 31) return null;
  return day;
}

export function zonedWallTimeToIso(
  date: string,
  time: string,
  timeZone: string,
): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !clockParts(time)) return null;
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  try {
    const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0);
    const zoned = new Date(
      new Date(utcGuess).toLocaleString("en-US", { timeZone }),
    );
    const utc = new Date(
      new Date(utcGuess).toLocaleString("en-US", { timeZone: "UTC" }),
    );
    const instant = new Date(utcGuess - (zoned.getTime() - utc.getTime()));
    if (Number.isNaN(instant.getTime())) return null;
    return instant.toISOString();
  } catch {
    return null;
  }
}

export function isoToWallTime(
  iso: string,
  timeZone: string,
): { date: string; time: string } | null {
  const instant = new Date(iso);
  if (Number.isNaN(instant.getTime())) return null;
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(instant);
    const read = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((part) => part.type === type)?.value || "";
    const hour = read("hour") === "24" ? "00" : read("hour");
    const date = `${read("year")}-${read("month")}-${read("day")}`;
    const time = `${hour}:${read("minute")}`;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !clockParts(time)) return null;
    return { date, time };
  } catch {
    return null;
  }
}

export function scheduleBounds(schedule: PipelineScheduleDraft): {
  start: string | null;
  end: string | null;
} {
  const zone = schedule.timezone.trim() || "UTC";
  return {
    start: zonedWallTimeToIso(schedule.startDate, schedule.startTime, zone),
    end:
      schedule.endType === "at"
        ? zonedWallTimeToIso(schedule.endDate, schedule.endTime, zone)
        : null,
  };
}

export function cronFromSchedule(
  schedule: PipelineScheduleDraft,
): { ok: true; cron: string } | { ok: false; field: string; message: string } {
  const clock = clockParts(schedule.startTime);
  if (!schedule.startDate.trim() || !clock) {
    return {
      ok: false,
      field: "schedule_start",
      message: "Choose a start date and time.",
    };
  }
  if (!schedule.timezone.trim()) {
    return {
      ok: false,
      field: "schedule_timezone",
      message: "Choose the timezone for this schedule.",
    };
  }
  const interval = Number(schedule.interval);
  if (!Number.isInteger(interval) || interval < 1) {
    return {
      ok: false,
      field: "schedule_interval",
      message: "Recur every must be a whole number of at least 1.",
    };
  }

  const specific = schedule.specificSchedule && schedule.recurrence !== "hourly" && schedule.recurrence !== "monthly";
  let hour = clock.hour;
  let minute = clock.minute;
  let days: number[] = [];
  if (specific) {
    if (schedule.dayTimes.length === 0) {
      return {
        ok: false,
        field: "schedule_days",
        message: "Add at least one day and time.",
      };
    }
    const times = new Set(schedule.dayTimes.map((row) => row.time));
    if (times.size > 1) {
      return {
        ok: false,
        field: "schedule_days",
        message: "Each day has to use the same time. The pipeline stores one run time.",
      };
    }
    const rowClock = clockParts(schedule.dayTimes[0]?.time || "");
    if (!rowClock) {
      return {
        ok: false,
        field: "schedule_days",
        message: "Choose a time for each scheduled day.",
      };
    }
    hour = rowClock.hour;
    minute = rowClock.minute;
    days = schedule.dayTimes.map((row) => row.day);
    if (days.some((day) => !Number.isInteger(day) || day < 0 || day > 6)) {
      return {
        ok: false,
        field: "schedule_days",
        message: "Choose a weekday for each row.",
      };
    }
    if (new Set(days).size !== days.length) {
      return {
        ok: false,
        field: "schedule_days",
        message: "Each weekday can be listed once.",
      };
    }
  }

  if (schedule.recurrence === "hourly") {
    if (interval > 23) {
      return {
        ok: false,
        field: "schedule_interval",
        message: "Hourly repeat must be from 1 to 23 hours.",
      };
    }
    return { ok: true, cron: interval === 1 ? `${minute} * * * *` : `${minute} */${interval} * * *` };
  }
  if (schedule.recurrence === "weekly" && !schedule.specificSchedule) {
    return {
      ok: false,
      field: "schedule_days",
      message: "Choose the weekdays this pipeline runs.",
    };
  }
  if ((schedule.recurrence === "weekly" || specific) && interval !== 1) {
    return {
      ok: false,
      field: "schedule_interval",
      message: "A weekday schedule repeats every week, so Recur every stays at 1.",
    };
  }
  if (specific) {
    const ordered = [...new Set(days)].sort((left, right) => left - right);
    return { ok: true, cron: `${minute} ${hour} * * ${ordered.join(",")}` };
  }
  if (schedule.recurrence === "daily") {
    if (schedule.recurrence === "daily" && interval > 31) {
      return {
        ok: false,
        field: "schedule_interval",
        message: "Daily repeat must be from 1 to 31.",
      };
    }
    if (interval === 1) return { ok: true, cron: `${minute} ${hour} * * *` };
    return { ok: true, cron: `${minute} ${hour} */${interval} * *` };
  }
  const day = dayOfMonth(schedule.startDate);
  if (day === null) {
    return {
      ok: false,
      field: "schedule_start",
      message: "Choose a start date and time.",
    };
  }
  if (interval > 12) {
    return {
      ok: false,
      field: "schedule_interval",
      message: "Monthly repeat must be from 1 to 12 months.",
    };
  }
  return {
    ok: true,
    cron: interval === 1 ? `${minute} ${hour} ${day} * *` : `${minute} ${hour} ${day} */${interval} *`,
  };
}

function weekdayLabel(day: number): string {
  return WEEKDAY_OPTIONS.find((option) => option.value === day)?.label || "";
}

export function describeSchedule(schedule: PipelineScheduleDraft): string {
  if (!schedule.enabled) {
    return "Not scheduled. The pipeline runs only when someone starts it.";
  }
  const zone = schedule.timezone || "UTC";
  const interval = Number(schedule.interval) || 1;
  const specific = schedule.specificSchedule && schedule.dayTimes.length > 0 && schedule.recurrence !== "hourly" && schedule.recurrence !== "monthly";
  const time = specific ? schedule.dayTimes[0]?.time || schedule.startTime : schedule.startTime || "08:00";
  let when = interval === 1 ? `Every day at ${time}` : `Every ${interval} days of the month at ${time}`;
  if (schedule.recurrence === "hourly") {
    when = interval === 1 ? `Every hour at minute ${time.slice(3)}` : `Every ${interval} hours at minute ${time.slice(3)}`;
  } else if (specific) {
    const names = [...schedule.dayTimes]
      .map((row) => weekdayLabel(row.day))
      .filter(Boolean);
    when = names.length ? `${names.join(", ")} at ${time}` : `Selected days at ${time}`;
  } else if (schedule.recurrence === "weekly") {
    when = `Every week at ${time}`;
  } else if (schedule.recurrence === "monthly") {
    const day = dayOfMonth(schedule.startDate);
    when = interval === 1
      ? `Day ${day || "—"} of each month at ${time}`
      : `Day ${day || "—"} every ${interval} months at ${time}`;
  }
  const start = schedule.startDate
    ? `, starting ${schedule.startDate} ${time}`
    : "";
  const end =
    schedule.endType === "at" && schedule.endDate
      ? `, until ${schedule.endDate} ${schedule.endTime}`
      : ", with no end date";
  return `${when} (${zone})${start}${end}.`;
}

export function scheduleFromPipeline(input: {
  schedule_enabled?: boolean;
  schedule_cron?: string | null;
  schedule_timezone?: string;
  schedule_start_at?: string | null;
  schedule_end_at?: string | null;
}): PipelineScheduleDraft {
  const base = emptySchedule();
  base.enabled = input.schedule_enabled === true;
  base.timezone = input.schedule_timezone || base.timezone;
  const zone = base.timezone;

  const start = input.schedule_start_at
    ? isoToWallTime(input.schedule_start_at, zone)
    : null;
  if (start) {
    base.startDate = start.date;
    base.startTime = start.time;
  }
  const end = input.schedule_end_at
    ? isoToWallTime(input.schedule_end_at, zone)
    : null;
  if (end) {
    base.endType = "at";
    base.endDate = end.date;
    base.endTime = end.time;
  }

  const cron = (input.schedule_cron || "").trim();
  const applyTime = (minute: string, hour?: string) => {
    if (start) return;
    base.startTime = hour
      ? `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`
      : `00:${minute.padStart(2, "0")}`;
  };
  const hourlyStep = cron.match(/^(\d{1,2}) \*\/(\d{1,2}) \* \* \*$/);
  const hourly = cron.match(/^(\d{1,2}) \* \* \* \*$/);
  if (hourlyStep || hourly) {
    base.recurrence = "hourly";
    base.interval = hourlyStep ? String(Number(hourlyStep[2])) : "1";
    applyTime(String(Number((hourlyStep || hourly)?.[1])));
    return base;
  }
  const dailyStep = cron.match(/^(\d{1,2}) (\d{1,2}) \*\/(\d{1,2}) \* \*$/);
  const daily = cron.match(/^(\d{1,2}) (\d{1,2}) \* \* \*$/);
  if (dailyStep || daily) {
    base.recurrence = "daily";
    base.interval = dailyStep ? String(Number(dailyStep[3])) : "1";
    const match = dailyStep || daily;
    applyTime(String(Number(match?.[1])), String(Number(match?.[2])));
    return base;
  }
  const weekly = cron.match(/^(\d{1,2}) (\d{1,2}) \* \* ([0-7](?:,[0-7])*)$/);
  if (weekly) {
    base.recurrence = "weekly";
    base.interval = "1";
    base.specificSchedule = true;
    applyTime(String(Number(weekly[1])), String(Number(weekly[2])));
    const time = base.startTime;
    base.selectedDays = weekly[3]
      .split(",")
      .map((day) => (day === "7" ? 0 : Number(day)))
      .filter((day) => day >= 0 && day <= 6);
    base.dayTimes = base.selectedDays.map((day) => ({ day, time }));
    return base;
  }
  const monthlyStep = cron.match(/^(\d{1,2}) (\d{1,2}) (\d{1,2}) \*\/(\d{1,2}) \*$/);
  const monthly = cron.match(/^(\d{1,2}) (\d{1,2}) (\d{1,2}) \* \*$/);
  if (monthlyStep || monthly) {
    base.recurrence = "monthly";
    const match = monthlyStep || monthly;
    base.interval = monthlyStep ? String(Number(monthlyStep[4])) : "1";
    applyTime(String(Number(match?.[1])), String(Number(match?.[2])));
    const day = String(Number(match?.[3])).padStart(2, "0");
    if (!start) base.startDate = `${base.startDate.slice(0, 8)}${day}`;
    return base;
  }
  return base;
}

export function isPipelineScheduled(input: {
  schedule_enabled?: boolean;
  schedule_cron?: string | null;
}): boolean {
  return input.schedule_enabled === true && Boolean((input.schedule_cron || "").trim());
}

export function describeStoredSchedule(input: {
  schedule_enabled?: boolean;
  schedule_cron?: string | null;
  schedule_timezone?: string;
  schedule_start_at?: string | null;
  schedule_end_at?: string | null;
}): string {
  return describeSchedule(scheduleFromPipeline(input));
}
