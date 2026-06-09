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
  field_name: string;
  field_value: string;
  name: string;
  description?: string;
  field_type: "numeric" | "decimal";
  field_pg_type?: string;
  category?: UsageMetricCategory;
  category_name?: string;
  operators?: UsageMetricOperator[];
  source_table?: string;
  field_source_table?: string;
  data_source?: "Live" | "DB";
  frequency?: "Per Min" | "D-1" | "Monthly";
  data_latency?: string;
  unit?: string;
  default_value?: string | number;
  default_operator_id?: number | null;
  is_active?: boolean;
  is_computable?: boolean;
  is_multi_select?: boolean;
  is_required?: boolean;
  extraction_logic?: string;
  validation_strategy?: string;
  field_allowed_range_min?: number;
  field_allowed_range_max?: number;
  field_allowed_distinct_values?: string[];
  field_allowed_value_length?: number;
  field_column_name?: string;
  tag?: string;
  display_order?: number;
  ui_component_type?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: number;
  updated_by?: number;
}

export const USAGE_METRICS: UsageMetric[] = [];

