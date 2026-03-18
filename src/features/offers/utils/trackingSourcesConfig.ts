// Centralized tracking sources configuration
// This is the single source of truth for all offer tracking types

export const trackingSourcesData = [
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
    parameters: ["delivered", "opened", "clicked", "datetime", "subscriber_id", "channel"],
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

export const dataSources = [
  { id: "cdr_file", label: "CDR File" },
  { id: "usage_logs", label: "Usage Logs" },
  { id: "delivery_logs", label: "Delivery Logs" },
  { id: "redemption_db", label: "Redemption Database" },
  { id: "subscriber_activity", label: "Subscriber Activity" },
  { id: "custom_api", label: "Custom API" },
];

export const trackingParameters = [
  "amount",
  "datetime",
  "subscriber_id",
  "channel",
  "payment_method",
  "data_volume_mb",
  "voice_minutes",
  "sms_count",
  "service_type",
  "delivered",
  "opened",
  "clicked",
  "redeemed",
  "redemption_date",
  "discount_applied",
  "redemption_channel",
  "last_activity_date",
  "days_inactive",
  "subscriber_status",
  "retention_period",
];

export const conditions = [
  { value: "equals", label: "Equals" },
  { value: "greater_than", label: "Greater than" },
  { value: "less_than", label: "Less than" },
  { value: "contains", label: "Contains" },
  { value: "is_any_of", label: "Is any of" },
];

export const lookbackPeriods = [
  { value: "24h", label: "24 Hours" },
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
];

// Helper functions
export const getTrackingSourceById = (id: string) => {
  return trackingSourcesData.find((source) => source.id === id);
};

export const getParametersByType = (type: string) => {
  const source = trackingSourcesData.find((s) => s.type === type);
  return source?.parameters || [];
};

export const getMetricsByType = (type: string) => {
  const source = trackingSourcesData.find((s) => s.type === type);
  return source?.displayMetrics || [];
};

export const getDataSourceByType = (type: string) => {
  const source = trackingSourcesData.find((s) => s.type === type);
  return source?.dataSource || "";
};
