import { RevenueMetric } from "../types/revenueMetrics";
import { segmentService } from "../../segments/services/segmentService";

export const revenueMetricService = {
  // Get all metrics from segmentation profile endpoint
  getAllMetrics: async (): Promise<RevenueMetric[]> => {
    try {
      const response = await segmentService.getSegmentationFields(true);
      if (response && response.success && response.data && response.data.length > 0) {
        const config = response.data[0]?.field_selector_config || [];

        // Find Revenue KPIs category and extract fields
        const revenueKpisCategory = config.find(
          (cat: any) => cat.value === "revenue_kpis" || cat.value === "revenue_metric"
        );

        if (revenueKpisCategory && revenueKpisCategory.fields) {
          // Map backend fields to RevenueMetric format
          return revenueKpisCategory.fields.map((field: any) => ({
            id: field.id,
            name: field.field_name,
            description: field.field_description || "",
            field_type: field.field_type?.toLowerCase() || "decimal",
            category: "revenue",
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
      console.error("Failed to fetch revenue metrics:", err);
      return [];
    }
  },

  // Get a single metric by ID
  getMetricById: async (id: number): Promise<RevenueMetric | null> => {
    const metrics = await revenueMetricService.getAllMetrics();
    return metrics.find((m) => m.id === id) || null;
  },
};
