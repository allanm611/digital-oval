

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

export const REVENUE_METRICS: RevenueMetric[] = [
  {
    id: 1,
    name: "Data 2G Revenue New",
    description: "Data revenue generated from 2G network",
    field_type: "decimal",
    category: "data_revenue",
    operators: ["equals", "not_equals", "greater_than", "less_than", "in", "not_in"],
    source_table: "OCS_DATA",
    data_source: "Live",
    frequency: "Per Min",
    unit: "Million PKR",
  },
  {
    id: 2,
    name: "Data 3G Revenue New",
    description: "Data revenue generated from 3G network",
    field_type: "decimal",
    category: "data_revenue",
    operators: ["equals", "not_equals", "greater_than", "less_than", "in", "not_in"],
    source_table: "OCS_DATA",
    data_source: "Live",
    frequency: "Per Min",
    unit: "Million PKR",
  },
  {
    id: 3,
    name: "Data 4G Revenue New",
    description: "Data revenue generated from 4G network",
    field_type: "decimal",
    category: "data_revenue",
    operators: ["equals", "not_equals", "greater_than", "less_than", "in", "not_in"],
    source_table: "OCS_DATA",
    data_source: "Live",
    frequency: "Per Min",
    unit: "Million PKR",
  },
  {
    id: 4,
    name: "Total Data PAYGO Revenue",
    description: "Total data pay-as-you-go revenue",
    field_type: "decimal",
    category: "data_revenue",
    operators: ["equals", "not_equals", "greater_than", "less_than", "in", "not_in"],
    source_table: "OCS_DATA",
    data_source: "Live",
    frequency: "Per Min",
    unit: "Million PKR",
  },
  {
    id: 5,
    name: "Total Data Revenue New",
    description: "Total data revenue (PAYGO + Bundle)",
    field_type: "decimal",
    category: "data_revenue",
    operators: ["equals", "not_equals", "greater_than", "less_than", "in", "not_in"],
    source_table: "OCS_DATA",
    data_source: "Live",
    frequency: "Per Min",
    unit: "Million PKR",
  },
  {
    id: 6,
    name: "Total Data Bundled Revenue",
    description: "Total data bundle revenue",
    field_type: "decimal",
    category: "bundle_revenue",
    operators: ["equals", "not_equals", "greater_than", "less_than", "in", "not_in"],
    source_table: "BIB_ADM.FLYTXT_DX_DAILY_KPI",
    data_source: "DB",
    frequency: "D-1",
    unit: "Million PKR",
  },

  {
    id: 7,
    name: "Onnet OG Rev New",
    description: "On-net outgoing call revenue",
    field_type: "decimal",
    category: "voice_revenue",
    operators: ["equals", "not_equals", "greater_than", "less_than", "in", "not_in"],
    source_table: "OCS_REC",
    data_source: "Live",
    frequency: "Per Min",
    unit: "Million PKR",
  },
  {
    id: 8,
    name: "Offnet OG Rev New",
    description: "Off-net outgoing call revenue",
    field_type: "decimal",
    category: "voice_revenue",
    operators: ["equals", "not_equals", "greater_than", "less_than", "in", "not_in"],
    source_table: "OCS_REC",
    data_source: "Live",
    frequency: "Per Min",
    unit: "Million PKR",
  },
  {
    id: 9,
    name: "IDD OG Rev New",
    description: "International direct dial outgoing call revenue",
    field_type: "decimal",
    category: "voice_revenue",
    operators: ["equals", "not_equals", "greater_than", "less_than", "in", "not_in"],
    source_table: "OCS_REC",
    data_source: "Live",
    frequency: "Per Min",
    unit: "Million PKR",
  },
  {
    id: 10,
    name: "Total Voice PAYGO Rev",
    description: "Total voice pay-as-you-go revenue",
    field_type: "decimal",
    category: "voice_revenue",
    operators: ["equals", "not_equals", "greater_than", "less_than", "in", "not_in"],
    source_table: "OCS_REC",
    data_source: "Live",
    frequency: "Per Min",
    unit: "Million PKR",
  },
  {
    id: 11,
    name: "Total Voice Bundle Revenue",
    description: "Total voice bundle revenue",
    field_type: "decimal",
    category: "bundle_revenue",
    operators: ["equals", "not_equals", "greater_than", "less_than", "in", "not_in"],
    source_table: "BIB_ADM.FLYTXT_DX_DAILY_KPI",
    data_source: "DB",
    frequency: "D-1",
    unit: "Million PKR",
  },
  {
    id: 12,
    name: "Total Voice Revenue",
    description: "Total voice revenue (PAYGO + Bundle)",
    field_type: "decimal",
    category: "voice_revenue",
    operators: ["equals", "not_equals", "greater_than", "less_than", "in", "not_in"],
    source_table: "OCS_REC",
    data_source: "Live",
    frequency: "Per Min",
    unit: "Million PKR",
  },
  {
    id: 13,
    name: "Total Roaming Rev New",
    description: "Total roaming revenue",
    field_type: "decimal",
    category: "voice_revenue",
    operators: ["equals", "not_equals", "greater_than", "less_than", "in", "not_in"],
    source_table: "OCS_REC",
    data_source: "Live",
    frequency: "Per Min",
    unit: "Million PKR",
  },

  {
    id: 14,
    name: "Total SMS PAYG Rev New",
    description: "Total SMS pay-as-you-go revenue",
    field_type: "decimal",
    category: "sms_revenue",
    operators: ["equals", "not_equals", "greater_than", "less_than", "in", "not_in"],
    source_table: "OCS_SMS",
    data_source: "Live",
    frequency: "Per Min",
    unit: "Million PKR",
  },
  {
    id: 15,
    name: "Total SMS Bundled Revenue",
    description: "Total SMS bundle revenue",
    field_type: "decimal",
    category: "bundle_revenue",
    operators: ["equals", "not_equals", "greater_than", "less_than", "in", "not_in"],
    source_table: "BIB_ADM.FLYTXT_DX_DAILY_KPI",
    data_source: "DB",
    frequency: "D-1",
    unit: "Million PKR",
  },
  {
    id: 16,
    name: "Total SMS Revenue New",
    description: "Total SMS revenue (PAYGO + Bundle)",
    field_type: "decimal",
    category: "sms_revenue",
    operators: ["equals", "not_equals", "greater_than", "less_than", "in", "not_in"],
    source_table: "OCS_SMS",
    data_source: "Live",
    frequency: "Per Min",
    unit: "Million PKR",
  },

  {
    id: 17,
    name: "Total On-net Revenue",
    description: "Total on-net revenue across all services",
    field_type: "decimal",
    category: "other_revenue",
    operators: ["equals", "not_equals", "greater_than", "less_than", "in", "not_in"],
    source_table: "OCS_REC",
    data_source: "Live",
    frequency: "Per Min",
    unit: "Million PKR",
  },
  {
    id: 18,
    name: "Total Revenue Updated",
    description: "Total revenue across all services",
    field_type: "decimal",
    category: "other_revenue",
    operators: ["equals", "not_equals", "greater_than", "less_than", "in", "not_in"],
    source_table: "BIB_ADM.FLYTXT_DX_DAILY_KPI",
    data_source: "Live",
    frequency: "Per Min",
    unit: "Million PKR",
  },
  {
    id: 19,
    name: "Total VAS Revenue",
    description: "Total VAS (Value Added Services) revenue",
    field_type: "decimal",
    category: "other_revenue",
    operators: ["equals", "not_equals", "greater_than", "less_than", "in", "not_in"],
    source_table: "BIB_ADM.FLYTXT_DX_DAILY_KPI",
    data_source: "DB",
    frequency: "D-1",
    unit: "Million PKR",
  },
  {
    id: 20,
    name: "Refill Amount",
    description: "Total recharge/refill amount",
    field_type: "decimal",
    category: "other_revenue",
    operators: ["equals", "not_equals", "greater_than", "less_than", "in", "not_in"],
    source_table: "OCS_VOU",
    data_source: "Live",
    frequency: "Per Min",
    unit: "Million PKR",
  },
];

export const REVENUE_METRICS_BY_CATEGORY = {
  data_revenue: REVENUE_METRICS.filter((m) => m.category === "data_revenue"),
  voice_revenue: REVENUE_METRICS.filter((m) => m.category === "voice_revenue"),
  sms_revenue: REVENUE_METRICS.filter((m) => m.category === "sms_revenue"),
  bundle_revenue: REVENUE_METRICS.filter((m) => m.category === "bundle_revenue"),
  other_revenue: REVENUE_METRICS.filter((m) => m.category === "other_revenue"),
};

export const REVENUE_METRIC_CATEGORIES = [
  { value: "data_revenue", label: "Data Revenue" },
  { value: "voice_revenue", label: "Voice Revenue" },
  { value: "sms_revenue", label: "SMS Revenue" },
  { value: "bundle_revenue", label: "Bundle Revenue" },
  { value: "other_revenue", label: "Other Revenue" },
] as const;
