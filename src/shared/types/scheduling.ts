/**
 * Generic Scheduling Type
 * Used across features: Campaigns, Manual Communications, Manual Rewards, etc.
 */

export interface SchedulingData {
  type?: "scheduled" | "immediate";
  time_zone?: string;
  start_date?: string;
  end_date?: string;
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
