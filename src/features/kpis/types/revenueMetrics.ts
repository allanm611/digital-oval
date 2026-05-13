

export type RevenueMetricCategory =
  | "data_revenue"
  | "voice_revenue"
  | "sms_revenue"
  | "bundle_revenue"
  | "other_revenue";

export type RevenueMetricOperator =
  | "equals"
  | "not_equals"
  | "greater_than"
  | "less_than"
  | "in"
  | "not_in";

export interface RevenueMetric {
  id: number;
  name: string;
  description: string;
  field_type: "numeric" | "decimal";
  category: RevenueMetricCategory;
  operators: RevenueMetricOperator[];
  source_table: string;
  data_source: "Live" | "DB";
  frequency: "Per Min" | "D-1" | "Monthly";
  unit?: string;
  default_value?: string | number;
}

export const REVENUE_METRICS: RevenueMetric[] = [];
