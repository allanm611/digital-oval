import { RevenueMetric } from "../types/revenueMetrics";
import { kpiService } from "./kpiService";
import { fetchWithAuthInterceptor } from "../../../shared/services/fetchInterceptor";
import { buildApiUrl } from "../../../shared/services/api";

export const revenueMetricService = {
  // Get all revenue metrics using KPI endpoint, filtered by tag on frontend
  getAllMetrics: async (): Promise<RevenueMetric[]> => {
    try {
      // Fetch all KPIs and filter by revenue_metric tag
      const allKpis = await kpiService.getAllKPIs();
      const revenueKpis = allKpis.filter((kpi: any) => kpi.tag === "revenue_metric");

      return revenueKpis.map((kpi: any) => ({
        ...kpi,
        name: kpi.field_name,
        category: "revenue",
        operators: kpi.default_operator_id ? [kpi.default_operator_id] : [],
      }));
    } catch (err) {
      console.error("Failed to fetch revenue metrics:", err);
      return [];
    }
  },

  // Get a single metric by ID
  getMetricById: async (id: number): Promise<RevenueMetric | null> => {
    try {
      const kpi = await kpiService.getKPIById(id);
      if (!kpi) return null;

      return {
        ...kpi,
        name: kpi.field_name,
        category: "revenue",
        operators: kpi.default_operator_id ? [kpi.default_operator_id] : [],
      } as RevenueMetric;
    } catch (err) {
      console.error("Failed to fetch revenue metric:", err);
      return null;
    }
  },

  // Create a new metric
  createMetric: async (payload: any): Promise<any> => {
    return await kpiService.createKPI(payload);
  },

  // Update an existing metric
  updateMetric: async (id: number, payload: any): Promise<any> => {
    return await kpiService.updateKPI(id, payload);
  },

  // Toggle metric status
  toggleMetricStatus: async (id: number, isActive: boolean): Promise<void> => {
    const baseUrl = buildApiUrl("/profile-dictionary");
    const url = `${baseUrl}/status`;

    await fetchWithAuthInterceptor(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_active: isActive }),
    });
  },
};
