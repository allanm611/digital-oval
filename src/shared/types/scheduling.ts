/**
 * Generic Scheduling Type
 * Used across features: Campaigns, Manual Communications, Manual Rewards, etc.
 */

export interface SchedulingData {
  type?: "scheduled" | "immediate";
  time_zone?: string;
  start_date?: string;
  end_date?: string;
  recurrence_pattern?: "daily" | "weekly" | "monthly";
  recurrence_interval?: number;
  monthly_rule?: "first_day" | "last_day" | "day_of_month";
  monthly_day_of_month?: number;
  selected_days?: number[];
  // Additional fields can be added as needed
  [key: string]: any;
}

export interface SchedulingComponentProps {
  scheduling: SchedulingData;
  onSchedulingChange: (scheduling: SchedulingData) => void;
  title?: string;
  subtitle?: string;
  showPreviewButton?: boolean;
  onPreviewSchedule?: () => void;
}
