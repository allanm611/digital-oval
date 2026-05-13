export type UsageMetricCategory =
  | "data_usage"
  | "voice_usage"
  | "sms_usage"
  | "bundle_usage"
  | "dou_metrics";

export type UsageMetricOperator =
  | "equals"
  | "not_equals"
  | "greater_than"
  | "less_than"
  | "in"
  | "not_in";

export interface UsageMetric {
  id: number;
  name: string;
  description: string;
  field_type: "numeric" | "decimal";
  category: UsageMetricCategory;
  operators: UsageMetricOperator[];
  source_table: string;
  data_source: "Live" | "DB";
  frequency: "Per Min" | "D-1" | "Monthly";
  unit?: string;
  default_value?: string | number;
}

export const USAGE_METRICS: UsageMetric[] = [];

