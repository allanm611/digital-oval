/**
 * Single source of truth for offer tracking type defaults.
 * Parameter / metric keys use stable snake_case for engine + KPI alignment.
 */

export type TrackingSourceType =
  | "recharge"
  | "usage_metric"
  | "engagement"
  | "redemption"
  | "churn_prevention"
  | "custom";

export interface TrackingSelectOption {
  value: string;
  label: string;
}

export interface TrackingTypeDefinition {
  id: string;
  label: string;
  description: string;
  type: TrackingSourceType;
  dataSource: string;
  parameters: string[];
  displayMetrics: string[];
}

/** Human-readable labels for known parameter keys */
export const PARAMETER_LABELS: Record<string, string> = {
  amount: "Amount",
  datetime: "Datetime",
  subscriber_id: "Subscriber ID",
  channel: "Channel",
  payment_method: "Payment Method",
  data_volume_mb: "Data Volume (MB)",
  voice_minutes: "Voice Minutes",
  sms_count: "SMS Count",
  service_type: "Service Type",
  delivered: "Delivered",
  opened: "Opened",
  clicked: "Clicked",
  redeemed: "Redeemed",
  redemption_date: "Redemption Date",
  discount_applied: "Discount Applied",
  redemption_channel: "Redemption Channel",
  last_activity_date: "Last Activity Date",
  days_inactive: "Days Inactive",
  subscriber_status: "Subscriber Status",
  retention_period: "Retention Period",
  customer_segment: "Customer Segment",
  product_type: "Product Type",
  transaction_type: "Transaction Type",
  location: "Location",
  frequency: "Frequency",
};

/** Human-readable labels for known display metric keys */
export const METRIC_LABELS: Record<string, string> = {
  conversions: "Conversions",
  conversion_rate: "Conversion Rate",
  avg_recharge_amount: "Avg Recharge Amount",
  revenue_generated: "Revenue Generated",
  active_users: "Active Users",
  activation_rate: "Activation Rate",
  avg_usage: "Avg Usage",
  revenue_from_usage: "Revenue From Usage",
  delivery_rate: "Delivery Rate",
  open_rate: "Open Rate",
  click_through_rate: "Click-Through Rate",
  engagement_score: "Engagement Score",
  redemption_count: "Redemption Count",
  redemption_rate: "Redemption Rate",
  avg_discount_used: "Avg Discount Used",
  cost_per_redemption: "Cost Per Redemption",
  customers_retained: "Customers Retained",
  retention_rate: "Retention Rate",
  churn_prevention_score: "Churn Prevention Score",
  ltv_impact: "LTV Impact",
};

export function formatTrackingKeyLabel(
  key: string,
  labelMap: Record<string, string> = PARAMETER_LABELS,
): string {
  if (labelMap[key]) return labelMap[key];
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function toTrackingSelectOptions(
  keys: string[],
  labelMap: Record<string, string> = PARAMETER_LABELS,
): TrackingSelectOption[] {
  return keys.map((value) => ({
    value,
    label: formatTrackingKeyLabel(value, labelMap),
  }));
}

export const trackingSourcesData: TrackingTypeDefinition[] = [
  {
    id: "recharge",
    label: "Recharge Tracking",
    description: "Track recharge-based activities and transactions",
    type: "recharge",
    dataSource: "cdr_file",
    parameters: [
      "amount",
      "datetime",
      "subscriber_id",
      "channel",
      "payment_method",
    ],
    displayMetrics: [
      "conversions",
      "conversion_rate",
      "avg_recharge_amount",
      "revenue_generated",
    ],
  },
  {
    id: "usage_metric",
    label: "Usage Metric Tracking",
    description: "Track usage-based metrics like data, voice, SMS",
    type: "usage_metric",
    dataSource: "usage_logs",
    parameters: [
      "data_volume_mb",
      "voice_minutes",
      "sms_count",
      "datetime",
      "subscriber_id",
      "service_type",
    ],
    displayMetrics: [
      "active_users",
      "activation_rate",
      "avg_usage",
      "revenue_from_usage",
    ],
  },
  {
    id: "engagement",
    label: "Engagement Tracking",
    description: "Track customer engagement like delivery, opens, clicks",
    type: "engagement",
    dataSource: "delivery_logs",
    parameters: [
      "delivered",
      "opened",
      "clicked",
      "datetime",
      "subscriber_id",
      "channel",
    ],
    displayMetrics: [
      "delivery_rate",
      "open_rate",
      "click_through_rate",
      "engagement_score",
    ],
  },
  {
    id: "redemption",
    label: "Redemption Tracking",
    description: "Track offer redemption rates and discount utilization",
    type: "redemption",
    dataSource: "redemption_db",
    parameters: [
      "redeemed",
      "redemption_date",
      "discount_applied",
      "subscriber_id",
      "redemption_channel",
    ],
    displayMetrics: [
      "redemption_count",
      "redemption_rate",
      "avg_discount_used",
      "cost_per_redemption",
    ],
  },
  {
    id: "churn_prevention",
    label: "Churn Prevention Tracking",
    description: "Track if offers successfully prevent customer churn",
    type: "churn_prevention",
    dataSource: "subscriber_activity",
    parameters: [
      "last_activity_date",
      "days_inactive",
      "subscriber_status",
      "retention_period",
    ],
    displayMetrics: [
      "customers_retained",
      "retention_rate",
      "churn_prevention_score",
      "ltv_impact",
    ],
  },
  {
    id: "custom",
    label: "Custom Tracking",
    description: "Custom tracking parameters for specific requirements",
    type: "custom",
    dataSource: "custom_api",
    parameters: [],
    displayMetrics: [],
  },
];

export const dataSources: TrackingSelectOption[] = [
  { value: "cdr_file", label: "CDR File" },
  { value: "usage_logs", label: "Usage Logs" },
  { value: "delivery_logs", label: "Delivery Logs" },
  { value: "redemption_db", label: "Redemption Database" },
  { value: "subscriber_activity", label: "Subscriber Activity" },
  { value: "custom_api", label: "Custom API" },
];

/** Flat unique list of all known parameter keys */
export const trackingParameters: string[] = Array.from(
  new Set(trackingSourcesData.flatMap((s) => s.parameters)),
);

export const ALL_TRACKING_PARAMETERS: TrackingSelectOption[] =
  toTrackingSelectOptions(trackingParameters, PARAMETER_LABELS);

export const ALL_TRACKING_METRICS: TrackingSelectOption[] = toTrackingSelectOptions(
  Array.from(new Set(trackingSourcesData.flatMap((s) => s.displayMetrics))),
  METRIC_LABELS,
);

export const TRACKING_TYPE_OPTIONS: TrackingSelectOption[] =
  trackingSourcesData.map((s) => ({
    value: s.type,
    label:
      s.type === "usage_metric"
        ? "Usage"
        : s.type === "churn_prevention"
          ? "Churn Prevention"
          : s.label.replace(/ Tracking$/, ""),
  }));

export const conditions: TrackingSelectOption[] = [
  { value: "equals", label: "Equals" },
  { value: "greater_than", label: "Greater than" },
  { value: "less_than", label: "Less than" },
  { value: "contains", label: "Contains" },
  { value: "is_any_of", label: "Is any of" },
];

export const lookbackPeriods: TrackingSelectOption[] = [
  { value: "24h", label: "24 Hours" },
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
  { value: "custom", label: "Custom Date" },
];

export const getTrackingSourceById = (id: string) => {
  return trackingSourcesData.find((source) => source.id === id);
};

export const getTrackingSourceByType = (type: string) => {
  return trackingSourcesData.find((s) => s.type === type);
};

export const getParametersByType = (type: string): string[] => {
  return getTrackingSourceByType(type)?.parameters || [];
};

export const getMetricsByType = (type: string): string[] => {
  return getTrackingSourceByType(type)?.displayMetrics || [];
};

export const getParameterOptionsByType = (
  type: string,
): TrackingSelectOption[] => {
  const params = getParametersByType(type);
  if (params.length === 0) {
    // Custom / unknown: expose full catalog so operators can pick
    return ALL_TRACKING_PARAMETERS;
  }
  return toTrackingSelectOptions(params, PARAMETER_LABELS);
};

export const getMetricOptionsByType = (
  type: string,
): TrackingSelectOption[] => {
  const metrics = getMetricsByType(type);
  if (metrics.length === 0) {
    return ALL_TRACKING_METRICS;
  }
  return toTrackingSelectOptions(metrics, METRIC_LABELS);
};

export const getDataSourceByType = (type: string) => {
  return getTrackingSourceByType(type)?.dataSource || "";
};

/**
 * Legacy wizard labels → stable snake_case keys.
 * Used when loading older offer drafts.
 */
const LEGACY_PARAMETER_ALIASES: Record<string, string> = {
  Amount: "amount",
  Channel: "channel",
  Customer_Segment: "customer_segment",
  Product_Type: "product_type",
  Transaction_Type: "transaction_type",
  Location: "location",
  Time_Period: "datetime",
  Usage_Volume: "data_volume_mb",
  Frequency: "frequency",
};

export function normalizeParameterKey(raw: string): string {
  if (!raw) return "";
  if (LEGACY_PARAMETER_ALIASES[raw]) return LEGACY_PARAMETER_ALIASES[raw];
  return raw.trim().toLowerCase().replace(/\s+/g, "_");
}
