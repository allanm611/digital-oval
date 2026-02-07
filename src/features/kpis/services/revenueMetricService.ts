import { RevenueMetric } from "../types/revenueMetrics";

// Dummy revenue metrics data
const hardcodedMetrics: RevenueMetric[] = [
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
    operators: ["equals", "not_equals", "greater_than", "less_than"],
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
    operators: ["equals", "greater_than", "less_than"],
    source_table: "OCS_DATA",
    data_source: "Live",
    frequency: "D-1",
    unit: "Million PKR",
  },
  {
    id: 4,
    name: "Voice Revenue MTN",
    description: "Voice call revenue from MTN network",
    field_type: "decimal",
    category: "voice_revenue",
    operators: ["equals", "not_equals", "greater_than"],
    source_table: "BIB_ADM.FLYTXT_DX_DAILY_KPI",
    data_source: "DB",
    frequency: "D-1",
    unit: "Million PKR",
  },
  {
    id: 5,
    name: "Voice Revenue Airtel",
    description: "Voice call revenue from Airtel network",
    field_type: "decimal",
    category: "voice_revenue",
    operators: ["equals", "not_equals", "in"],
    source_table: "BIB_ADM.FLYTXT_DX_DAILY_KPI",
    data_source: "DB",
    frequency: "Monthly",
    unit: "Million PKR",
  },
  {
    id: 6,
    name: "SMS Revenue",
    description: "Short message service revenue",
    field_type: "decimal",
    category: "sms_revenue",
    operators: ["equals", "greater_than", "less_than", "in"],
    source_table: "SMS_TABLE",
    data_source: "Live",
    frequency: "Per Min",
    unit: "Million PKR",
  },
  {
    id: 7,
    name: "Bundle Revenue",
    description: "Revenue from data bundles sold",
    field_type: "decimal",
    category: "bundle_revenue",
    operators: ["equals", "not_equals", "greater_than"],
    source_table: "BUNDLE_DATA",
    data_source: "DB",
    frequency: "D-1",
    unit: "Million PKR",
  },
  {
    id: 8,
    name: "International Roaming Revenue",
    description: "Revenue from international roaming services",
    field_type: "decimal",
    category: "other_revenue",
    operators: ["equals", "greater_than", "less_than"],
    source_table: "ROAMING_TABLE",
    data_source: "Live",
    frequency: "D-1",
    unit: "Million PKR",
  },
  {
    id: 9,
    name: "VAS Revenue",
    description: "Value Added Services revenue",
    field_type: "decimal",
    category: "other_revenue",
    operators: ["equals", "not_equals", "in", "not_in"],
    source_table: "VAS_TABLE",
    data_source: "DB",
    frequency: "Monthly",
    unit: "Million PKR",
  },
  {
    id: 10,
    name: "Subscription Revenue",
    description: "Monthly subscription revenue",
    field_type: "decimal",
    category: "other_revenue",
    operators: ["equals", "greater_than", "less_than", "in"],
    source_table: "SUBSCRIPTION_TABLE",
    data_source: "Live",
    frequency: "Monthly",
    unit: "Million PKR",
  },
  {
    id: 11,
    name: "Top-up Revenue",
    description: "Revenue from prepaid top-ups",
    field_type: "decimal",
    category: "data_revenue",
    operators: ["equals", "not_equals", "greater_than", "less_than"],
    source_table: "TOPUP_TABLE",
    data_source: "Live",
    frequency: "Per Min",
    unit: "Million PKR",
  },
  {
    id: 12,
    name: "Corporate Revenue",
    description: "Revenue from corporate accounts",
    field_type: "decimal",
    category: "voice_revenue",
    operators: ["equals", "greater_than", "in"],
    source_table: "CORPORATE_TABLE",
    data_source: "DB",
    frequency: "D-1",
    unit: "Million PKR",
  },
  {
    id: 13,
    name: "Shared Revenue",
    description: "Revenue from shared services",
    field_type: "decimal",
    category: "other_revenue",
    operators: ["equals", "not_equals", "greater_than"],
    source_table: "SHARED_TABLE",
    data_source: "DB",
    frequency: "Monthly",
    unit: "Million PKR",
  },
  {
    id: 14,
    name: "Premium Voice Revenue",
    description: "Revenue from premium voice services",
    field_type: "decimal",
    category: "voice_revenue",
    operators: ["equals", "greater_than", "less_than", "in"],
    source_table: "PREMIUM_VOICE",
    data_source: "Live",
    frequency: "D-1",
    unit: "Million PKR",
  },
  {
    id: 15,
    name: "Bundle Voice Revenue",
    description: "Revenue from bundled voice services",
    field_type: "decimal",
    category: "bundle_revenue",
    operators: ["equals", "not_equals", "in", "not_in"],
    source_table: "BUNDLE_VOICE",
    data_source: "DB",
    frequency: "Monthly",
    unit: "Million PKR",
  },
  {
    id: 16,
    name: "SMS Bundle Revenue",
    description: "Revenue from SMS bundles",
    field_type: "decimal",
    category: "bundle_revenue",
    operators: ["equals", "greater_than", "less_than"],
    source_table: "SMS_BUNDLE",
    data_source: "Live",
    frequency: "D-1",
    unit: "Million PKR",
  },
  {
    id: 17,
    name: "International SMS Revenue",
    description: "Revenue from international SMS",
    field_type: "decimal",
    category: "sms_revenue",
    operators: ["equals", "not_equals", "greater_than", "less_than"],
    source_table: "INTL_SMS",
    data_source: "DB",
    frequency: "D-1",
    unit: "Million PKR",
  },
  {
    id: 18,
    name: "Video Call Revenue",
    description: "Revenue from video calling services",
    field_type: "decimal",
    category: "voice_revenue",
    operators: ["equals", "greater_than", "in"],
    source_table: "VIDEO_CALL",
    data_source: "Live",
    frequency: "Per Min",
    unit: "Million PKR",
  },
  {
    id: 19,
    name: "Mobile Money Revenue",
    description: "Revenue from mobile money transactions",
    field_type: "decimal",
    category: "other_revenue",
    operators: ["equals", "not_equals", "greater_than", "less_than", "in"],
    source_table: "MOBILE_MONEY",
    data_source: "DB",
    frequency: "D-1",
    unit: "Million PKR",
  },
  {
    id: 20,
    name: "Device Revenue",
    description: "Revenue from device sales",
    field_type: "decimal",
    category: "other_revenue",
    operators: ["equals", "greater_than", "less_than", "not_in"],
    source_table: "DEVICE_TABLE",
    data_source: "DB",
    frequency: "Monthly",
    unit: "Million PKR",
  },
];

export const revenueMetricService = {
  // Get all metrics
  getAllMetrics: async (): Promise<RevenueMetric[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(hardcodedMetrics);
      }, 300);
    });
  },

  // Get a single metric by ID
  getMetricById: async (id: number): Promise<RevenueMetric | null> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const metric = hardcodedMetrics.find((m) => m.id === id);
        resolve(metric || null);
      }, 300);
    });
  },

  // Create a new metric
  createMetric: async (data: Omit<RevenueMetric, 'id'>): Promise<RevenueMetric> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newMetric: RevenueMetric = {
          id: Math.max(...hardcodedMetrics.map((m) => m.id), 0) + 1,
          ...data,
        };
        hardcodedMetrics.push(newMetric);
        resolve(newMetric);
      }, 500);
    });
  },

  // Update a metric
  updateMetric: async (id: number, data: Omit<RevenueMetric, 'id'>): Promise<RevenueMetric> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = hardcodedMetrics.findIndex((m) => m.id === id);
        if (index === -1) {
          reject(new Error("Metric not found"));
          return;
        }
        const updated: RevenueMetric = {
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
