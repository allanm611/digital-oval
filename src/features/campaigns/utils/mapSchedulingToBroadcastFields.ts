type SchedulingLike = {
  type?: string;
  time_zone?: string;
  start_date?: string;
  delivery_times?: string[];
  recurrence_pattern?: "daily" | "weekly" | "monthly";
  selected_days?: number[];
  frequency?: {
    type?: "daily" | "weekly" | "monthly";
    days_of_week?: number[];
    days_of_month?: number[];
  };
  monthly_day_of_month?: number;
};

export type BroadcastExecutionMode = "immediate" | "schedule";

export interface BroadcastScheduleFields {
  execution_mode: BroadcastExecutionMode;
  cron_expression?: string;
  schedule_timezone?: string;
}

function extractHourMinute(scheduling?: SchedulingLike | null): {
  hour: number;
  minute: number;
} {
  const timeSource =
    scheduling?.delivery_times?.[0] ||
    scheduling?.start_date ||
    "";
  const match = String(timeSource).match(/T?(\d{1,2}):(\d{2})/);
  if (match) {
    return { hour: Number(match[1]), minute: Number(match[2]) };
  }
  return { hour: 8, minute: 0 };
}

/**
 * Maps the campaign scheduling wizard into the fields BroadcastSchedulerService
 * expects: execution_mode + cron_expression.
 *
 * Recurring lookahead on the backend is currently 3 occurrences per segment
 * (user-facing copy often says "up to 2"); the frontend only supplies the
 * schedule, it does not control how many rows are pre-created.
 */
export function mapSchedulingToBroadcastFields(
  scheduling?: SchedulingLike | null,
): BroadcastScheduleFields {
  const timezone = scheduling?.time_zone || "UTC";

  if (!scheduling || scheduling.type === "immediate") {
    return {
      execution_mode: "immediate",
      schedule_timezone: timezone,
    };
  }

  const { hour, minute } = extractHourMinute(scheduling);
  const pattern =
    scheduling.recurrence_pattern || scheduling.frequency?.type || "weekly";

  let cronExpression: string;
  if (pattern === "daily") {
    cronExpression = `${minute} ${hour} * * *`;
  } else if (pattern === "monthly") {
    const day =
      scheduling.monthly_day_of_month ||
      scheduling.frequency?.days_of_month?.[0] ||
      1;
    cronExpression = `${minute} ${hour} ${day} * *`;
  } else {
    const days =
      scheduling.selected_days?.length
        ? scheduling.selected_days
        : scheduling.frequency?.days_of_week?.length
          ? scheduling.frequency.days_of_week
          : [1, 2, 3, 4, 5];
    cronExpression = `${minute} ${hour} * * ${days.join(",")}`;
  }

  return {
    execution_mode: "schedule",
    cron_expression: cronExpression,
    schedule_timezone: timezone,
  };
}
