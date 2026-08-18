import { kpiService } from "./kpiService";
import { fetchWithAuthInterceptor } from "../../../shared/services/fetchInterceptor";
import { buildApiUrl } from "../../../shared/services/api";

export interface SubscriberProfile {
  id: number;
  field_name: string;
  field_value: string;
  name: string;
  description?: string;
  field_type?: string;
  field_pg_type?: string;
  category?: string;
  category_name?: string;
  operators?: string[];
  source_table?: string;
  field_source_table?: string;
  data_source?: string;
  frequency?: string;
  data_latency?: string;
  unit?: string;
  is_active?: boolean;
  default_operator_id?: number | null;
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

export const subscriberProfileService = {
  getAllProfiles: async (): Promise<SubscriberProfile[]> => {
    try {
      // Fetch all KPIs and filter by tag: null, "kpi", or "profile"
      const allKpis = await kpiService.getAllKPIs();
      const subscriberProfiles = allKpis.filter(
        (kpi: any) => !kpi.tag || kpi.tag === "kpi" || kpi.tag === "profile"
      );

      return subscriberProfiles.map((kpi: any) => ({
        ...kpi,
        name: kpi.field_name,
        category: "subscriber",
        operators: kpi.default_operator_id ? [kpi.default_operator_id] : [],
      }));
    } catch (err) {
      console.error("Failed to fetch subscriber profiles:", err);
      return [];
    }
  },

  getProfileById: async (id: number): Promise<SubscriberProfile | null> => {
    try {
      const kpi = await kpiService.getKPIById(id);
      if (!kpi) return null;

      return {
        ...kpi,
        name: kpi.field_name,
        category: "subscriber",
        operators: kpi.default_operator_id ? [kpi.default_operator_id] : [],
      } as SubscriberProfile;
    } catch (err) {
      console.error("Failed to fetch subscriber profile:", err);
      return null;
    }
  },

  // Create a new profile
  createProfile: async (payload: any): Promise<any> => {
    return await kpiService.createKPI(payload);
  },

  // Update an existing profile
  updateProfile: async (id: number, payload: any): Promise<any> => {
    return await kpiService.updateKPI(id, payload);
  },

  // Toggle profile status
  toggleProfileStatus: async (id: number, isActive: boolean): Promise<void> => {
    const baseUrl = buildApiUrl("/profile-dictionary");
    const url = `${baseUrl}/status`;

    await fetchWithAuthInterceptor(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_active: isActive }),
    });
  },
};
