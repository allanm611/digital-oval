import { UsageMetric } from "../types/usageMetrics";
import { segmentService } from "../../segments/services/segmentService";

export const usageMetricService = {
  // Get all metrics from segmentation profile endpoint
  getAllMetrics: async (): Promise<UsageMetric[]> => {
    try {
      const response = await segmentService.getSegmentationFields(true);
      if (response && response.success && response.data && response.data.length > 0) {
        const config = response.data[0]?.field_selector_config || [];

        // Find Usage KPIs category and extract fields
        const usageKpisCategory = config.find(
          (cat: any) => cat.value === "usage_kpis" || cat.value === "usage_metric"
        );

        if (usageKpisCategory && usageKpisCategory.fields) {
          // Map backend fields to UsageMetric format
          return usageKpisCategory.fields.map((field: any) => ({
            id: field.id,
            name: field.field_name,
            description: field.field_description || "",
            field_type: field.field_type?.toLowerCase() || "decimal",
            category: "usage",
            operators: field.operators?.map((op: any) => op.label) || [],
            source_table: field.source_table || "",
            data_source: field.data_source || "DB",
            frequency: field.data_latency || "Daily",
            unit: field.unit || "",
          }));
        }
      }
      return [];
    } catch (err) {
      console.error("Failed to fetch usage metrics:", err);
      return [];
    }
  },

  // Get a single metric by ID
  getMetricById: async (id: number): Promise<UsageMetric | null> => {
    const metrics = await usageMetricService.getAllMetrics();
    return metrics.find((m) => m.id === id) || null;
  },
};
