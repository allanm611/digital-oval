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

/** Value types accepted by tracking rule Value inputs / engine comparisons */
export type TrackingParameterValueType =
  | "string"
  | "number"
  | "boolean"
  | "date"
  | "datetime";

export type TrackingRuleCondition =
  | "equals"
  | "greater_than"
  | "less_than"
  | "contains"
  | "is_any_of";

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

/**
 * Canonical value types for known parameter keys.
 * Used by the rule modal to render typed Value controls (datetime picker, number, etc.).
 */
export const PARAMETER_VALUE_TYPES: Record<string, TrackingParameterValueType> =
  {
    amount: "number",
    datetime: "datetime",
    subscriber_id: "string",
    channel: "string",
    payment_method: "string",
    data_volume_mb: "number",
    voice_minutes: "number",
    sms_count: "number",
    service_type: "string",
    delivered: "boolean",
    opened: "boolean",
    clicked: "boolean",
    redeemed: "boolean",
    redemption_date: "date",
    discount_applied: "number",
    redemption_channel: "string",
    last_activity_date: "date",
    days_inactive: "number",
    subscriber_status: "string",
    retention_period: "number",
    customer_segment: "string",
    product_type: "string",
    transaction_type: "string",
    location: "string",
    frequency: "number",
  };

/** Conditions allowed per value type (invalid combos are hidden in the UI). */
const CONDITIONS_BY_VALUE_TYPE: Record<
  TrackingParameterValueType,
  TrackingRuleCondition[]
> = {
  string: ["equals", "contains", "is_any_of"],
  number: ["equals", "greater_than", "less_than", "is_any_of"],
  boolean: ["equals"],
  date: ["equals", "greater_than", "less_than"],
  datetime: ["equals", "greater_than", "less_than"],
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

/**
 * Infer a value type for unknown / custom parameter keys from naming conventions.
 * Known keys always win via PARAMETER_VALUE_TYPES.
 */
export function inferParameterValueType(
  parameterKey: string,
): TrackingParameterValueType {
  const key = normalizeParameterKey(parameterKey);
  if (!key) return "string";
  if (PARAMETER_VALUE_TYPES[key]) return PARAMETER_VALUE_TYPES[key];

  if (
    key === "datetime" ||
    key.endsWith("_datetime") ||
    key.endsWith("_timestamp") ||
    key.endsWith("_at") ||
    key.includes("datetime")
  ) {
    return "datetime";
  }
  if (key === "date" || key.endsWith("_date") || key.includes("date")) {
    return "date";
  }
  if (
    key.startsWith("is_") ||
    key.startsWith("has_") ||
    /^(delivered|opened|clicked|redeemed|enabled|active)$/.test(key)
  ) {
    return "boolean";
  }
  if (
    /(^|_)(amount|count|volume|minutes|mb|days|period|frequency|discount|rate|score|qty|quantity)(_|$)/.test(
      key,
    )
  ) {
    return "number";
  }
  return "string";
}

export function getParameterValueType(
  parameterKey: string,
): TrackingParameterValueType {
  return inferParameterValueType(parameterKey);
}

export function getConditionsForValueType(
  valueType: TrackingParameterValueType,
): TrackingSelectOption[] {
  const allowed = new Set(
    CONDITIONS_BY_VALUE_TYPE[valueType] || CONDITIONS_BY_VALUE_TYPE.string,
  );
  return conditions.filter((c) =>
    allowed.has(c.value as TrackingRuleCondition),
  );
}

export function getConditionsForParameter(
  parameterKey: string,
): TrackingSelectOption[] {
  return getConditionsForValueType(getParameterValueType(parameterKey));
}

export function getDefaultConditionForParameter(
  parameterKey: string,
): TrackingRuleCondition {
  return getConditionsForParameter(parameterKey)[0]?.value as
    | TrackingRuleCondition
    | undefined || "equals";
}

/** Convert stored ISO / date strings into values accepted by HTML date/datetime-local inputs. */
export function toTrackingValueInputDisplay(
  raw: string,
  valueType: TrackingParameterValueType,
): string {
  if (!raw) return "";
  if (valueType === "datetime") {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 16);
    // Already datetime-local shaped
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(raw)) return raw.slice(0, 16);
    return raw;
  }
  if (valueType === "date") {
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    return raw;
  }
  if (valueType === "boolean") {
    const normalized = String(raw).trim().toLowerCase();
    if (["true", "1", "yes"].includes(normalized)) return "true";
    if (["false", "0", "no"].includes(normalized)) return "false";
    return "";
  }
  return raw;
}

/** Normalize UI values to a stable storage / engine representation. */
export function serializeTrackingRuleValue(
  raw: string | number,
  valueType: TrackingParameterValueType,
): string {
  const str = String(raw ?? "").trim();
  if (!str) return "";

  if (valueType === "datetime") {
    const d = new Date(str);
    return Number.isNaN(d.getTime()) ? str : d.toISOString();
  }
  if (valueType === "date") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    const d = new Date(str);
    return Number.isNaN(d.getTime()) ? str : d.toISOString().slice(0, 10);
  }
  if (valueType === "boolean") {
    const normalized = str.toLowerCase();
    if (["true", "1", "yes"].includes(normalized)) return "true";
    if (["false", "0", "no"].includes(normalized)) return "false";
    return str;
  }
  if (valueType === "number") {
    return str;
  }
  return str;
}

export function validateTrackingRuleValue(
  value: string,
  parameterKey: string,
  condition: string,
  valueTypeOverride?: TrackingParameterValueType,
): string | null {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    return "Enter a value for this rule.";
  }

  const valueType =
    valueTypeOverride ?? getParameterValueType(parameterKey);

  if (condition === "is_any_of") {
    const parts = trimmed
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length === 0) {
      return "Enter one or more comma-separated values.";
    }
    if (valueType === "number") {
      const invalid = parts.find((p) => Number.isNaN(Number(p)));
      if (invalid) {
        return `"${invalid}" is not a valid number.`;
      }
    }
    return null;
  }

  if (valueType === "number") {
    if (Number.isNaN(Number(trimmed))) {
      return "Value must be a number.";
    }
    return null;
  }
  if (valueType === "boolean") {
    if (!["true", "false"].includes(trimmed.toLowerCase())) {
      return "Select true or false.";
    }
    return null;
  }
  if (valueType === "date") {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed) && Number.isNaN(Date.parse(trimmed))) {
      return "Select a valid date.";
    }
    return null;
  }
  if (valueType === "datetime") {
    if (Number.isNaN(Date.parse(trimmed))) {
      return "Select a valid date and time.";
    }
    return null;
  }
  return null;
}

/** Human-friendly value for rule list cards. */
export function formatTrackingRuleValueDisplay(
  value: string,
  parameterKey: string,
): string {
  if (!value) return "";
  const valueType = getParameterValueType(parameterKey);
  if (valueType === "datetime") {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toLocaleString();
  }
  if (valueType === "date") {
    const d = new Date(
      /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value,
    );
    if (!Number.isNaN(d.getTime())) return d.toLocaleDateString();
  }
  if (valueType === "boolean") {
    const display = toTrackingValueInputDisplay(value, "boolean");
    if (display === "true") return "True";
    if (display === "false") return "False";
  }
  return value;
}
