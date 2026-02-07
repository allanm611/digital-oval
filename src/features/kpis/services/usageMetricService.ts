import { UsageMetric } from "../types/usageMetrics";

// Dummy usage metrics data
const hardcodedMetrics: UsageMetric[] = [
  {
    id: 1,
    name: "Data 2G Usage New",
    description: "Data usage on 2G network in MB",
    field_type: "decimal",
    category: "data_usage",
    operators: ["equals", "not_equals", "greater_than", "less_than", "in", "not_in"],
    source_table: "OCS_DATA",
    data_source: "Live",
    frequency: "Per Min",
    unit: "MB",
  },
  {
    id: 2,
    name: "Data 3G Usage New",
    description: "Data usage on 3G network in MB",
    field_type: "decimal",
    category: "data_usage",
    operators: ["equals", "not_equals", "greater_than", "less_than"],
    source_table: "OCS_DATA",
    data_source: "Live",
    frequency: "Per Min",
    unit: "MB",
  },
  {
    id: 3,
    name: "Data 4G Usage New",
    description: "Data usage on 4G network in MB",
    field_type: "decimal",
    category: "data_usage",
    operators: ["equals", "greater_than", "less_than"],
    source_table: "OCS_DATA",
    data_source: "Live",
    frequency: "D-1",
    unit: "MB",
  },
  {
    id: 4,
    name: "Voice Usage MTN",
    description: "Voice usage minutes on MTN network",
    field_type: "numeric",
    category: "voice_usage",
    operators: ["equals", "not_equals", "greater_than"],
    source_table: "BIB_ADM.FLYTXT_DX_DAILY_KPI",
    data_source: "DB",
    frequency: "D-1",
    unit: "Minutes",
  },
  {
    id: 5,
    name: "Voice Usage Airtel",
    description: "Voice usage minutes on Airtel network",
    field_type: "numeric",
    category: "voice_usage",
    operators: ["equals", "not_equals", "in"],
    source_table: "BIB_ADM.FLYTXT_DX_DAILY_KPI",
    data_source: "DB",
    frequency: "Monthly",
    unit: "Minutes",
  },
  {
    id: 6,
    name: "SMS Usage",
    description: "Short message service count",
    field_type: "numeric",
    category: "sms_usage",
    operators: ["equals", "greater_than", "less_than", "in"],
    source_table: "SMS_TABLE",
    data_source: "Live",
    frequency: "Per Min",
    unit: "Count",
  },
  {
    id: 7,
    name: "Data Bundle Usage",
    description: "Data consumed from bundles in MB",
    field_type: "decimal",
    category: "bundle_usage",
    operators: ["equals", "not_equals", "greater_than"],
    source_table: "BUNDLE_DATA",
    data_source: "DB",
    frequency: "D-1",
    unit: "MB",
  },
  {
    id: 8,
    name: "Voice Bundle Usage",
    description: "Voice minutes consumed from bundles",
    field_type: "numeric",
    category: "bundle_usage",
    operators: ["equals", "greater_than", "less_than"],
    source_table: "BUNDLE_VOICE",
    data_source: "Live",
    frequency: "D-1",
    unit: "Minutes",
  },
  {
    id: 9,
    name: "International Roaming Usage",
    description: "Data usage in international roaming",
    field_type: "decimal",
    category: "data_usage",
    operators: ["equals", "not_equals", "in", "not_in"],
    source_table: "ROAMING_TABLE",
    data_source: "Live",
    frequency: "D-1",
    unit: "MB",
  },
  {
    id: 10,
    name: "Email Usage",
    description: "Email traffic in MB",
    field_type: "decimal",
    category: "data_usage",
    operators: ["equals", "greater_than", "less_than"],
    source_table: "EMAIL_TABLE",
    data_source: "DB",
    frequency: "Monthly",
    unit: "MB",
  },
  {
    id: 11,
    name: "Web Browsing Usage",
    description: "Web browsing data in MB",
    field_type: "decimal",
    category: "data_usage",
    operators: ["equals", "not_equals", "greater_than", "less_than"],
    source_table: "WEB_TABLE",
    data_source: "Live",
    frequency: "D-1",
    unit: "MB",
  },
  {
    id: 12,
    name: "Messaging Usage",
    description: "All messaging services usage",
    field_type: "numeric",
    category: "sms_usage",
    operators: ["equals", "greater_than", "in"],
    source_table: "MESSAGE_TABLE",
    data_source: "DB",
    frequency: "D-1",
    unit: "Count",
  },
  {
    id: 13,
    name: "Video Streaming Usage",
    description: "Video streaming data in MB",
    field_type: "decimal",
    category: "data_usage",
    operators: ["equals", "not_equals", "greater_than"],
    source_table: "VIDEO_TABLE",
    data_source: "DB",
    frequency: "D-1",
    unit: "MB",
  },
  {
    id: 14,
    name: "Social Media Usage",
    description: "Social media data consumption in MB",
    field_type: "decimal",
    category: "data_usage",
    operators: ["equals", "greater_than", "less_than", "in"],
    source_table: "SOCIAL_TABLE",
    data_source: "Live",
    frequency: "D-1",
    unit: "MB",
  },
  {
    id: 15,
    name: "Video Call Usage",
    description: "Video call minutes usage",
    field_type: "numeric",
    category: "voice_usage",
    operators: ["equals", "not_equals", "in", "not_in"],
    source_table: "VIDEO_CALL",
    data_source: "DB",
    frequency: "Monthly",
    unit: "Minutes",
  },
  {
    id: 16,
    name: "MMS Usage",
    description: "Multimedia messaging count",
    field_type: "numeric",
    category: "sms_usage",
    operators: ["equals", "greater_than", "less_than"],
    source_table: "MMS_TABLE",
    data_source: "Live",
    frequency: "D-1",
    unit: "Count",
  },
  {
    id: 17,
    name: "Daily Active Users",
    description: "Number of daily active users",
    field_type: "numeric",
    category: "dou_metrics",
    operators: ["equals", "not_equals", "greater_than", "less_than"],
    source_table: "DAU_TABLE",
    data_source: "DB",
    frequency: "D-1",
    unit: "Count",
  },
  {
    id: 18,
    name: "Monthly Active Users",
    description: "Number of monthly active users",
    field_type: "numeric",
    category: "dou_metrics",
    operators: ["equals", "greater_than", "in"],
    source_table: "MAU_TABLE",
    data_source: "DB",
    frequency: "Monthly",
    unit: "Count",
  },
  {
    id: 19,
    name: "Unique Subscribers",
    description: "Count of unique active subscribers",
    field_type: "numeric",
    category: "dou_metrics",
    operators: ["equals", "not_equals", "greater_than", "less_than", "in"],
    source_table: "SUBSCRIBER_TABLE",
    data_source: "DB",
    frequency: "D-1",
    unit: "Count",
  },
  {
    id: 20,
    name: "Mobile Money Usage",
    description: "Mobile money transaction count",
    field_type: "numeric",
    category: "dou_metrics",
    operators: ["equals", "greater_than", "less_than"],
    source_table: "MOBILE_MONEY",
    data_source: "Live",
    frequency: "D-1",
    unit: "Count",
  },
  {
    id: 21,
    name: "App Download Usage",
    description: "Count of app downloads",
    field_type: "numeric",
    category: "dou_metrics",
    operators: ["equals", "not_equals", "greater_than"],
    source_table: "APP_TABLE",
    data_source: "DB",
    frequency: "D-1",
    unit: "Count",
  },
  {
    id: 22,
    name: "GPS Usage",
    description: "Location-based services data in MB",
    field_type: "decimal",
    category: "data_usage",
    operators: ["equals", "greater_than", "less_than", "in"],
    source_table: "GPS_TABLE",
    data_source: "Live",
    frequency: "D-1",
    unit: "MB",
  },
  {
    id: 23,
    name: "Data Top-up Usage",
    description: "Data from paid top-ups in MB",
    field_type: "decimal",
    category: "data_usage",
    operators: ["equals", "not_equals", "greater_than", "less_than"],
    source_table: "TOPUP_TABLE",
    data_source: "Live",
    frequency: "D-1",
    unit: "MB",
  },
];

export const usageMetricService = {
  // Get all metrics
  getAllMetrics: async (): Promise<UsageMetric[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(hardcodedMetrics);
      }, 300);
    });
  },

  // Get a single metric by ID
  getMetricById: async (id: number): Promise<UsageMetric | null> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const metric = hardcodedMetrics.find((m) => m.id === id);
        resolve(metric || null);
      }, 300);
    });
  },

  // Create a new metric
  createMetric: async (data: Omit<UsageMetric, 'id'>): Promise<UsageMetric> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newMetric: UsageMetric = {
          id: Math.max(...hardcodedMetrics.map((m) => m.id), 0) + 1,
          ...data,
        };
        hardcodedMetrics.push(newMetric);
        resolve(newMetric);
      }, 500);
    });
  },

  // Update a metric
  updateMetric: async (id: number, data: Omit<UsageMetric, 'id'>): Promise<UsageMetric> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = hardcodedMetrics.findIndex((m) => m.id === id);
        if (index === -1) {
          reject(new Error("Metric not found"));
          return;
        }
        const updated: UsageMetric = {
          id,
          ...data,
        };
        hardcodedMetrics[index] = updated;
        resolve(updated);
      }, 500);
    });
  },

  // Delete a metric
  deleteMetric: async (id: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = hardcodedMetrics.findIndex((m) => m.id === id);
        if (index === -1) {
          reject(new Error("Metric not found"));
          return;
        }
        hardcodedMetrics.splice(index, 1);
        resolve();
      }, 500);
    });
  },
};
