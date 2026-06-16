import { fetchWithAuthInterceptor } from "../../../shared/services/fetchInterceptor";
import { ApiResponse } from "../../../shared/types/api";
import { buildApiUrl } from "../../../shared/services/api";

export interface KPIProfile {
  id?: number;
  field_name: string;
  field_value: string;
  field_category_id: number;
  field_type: string;
  field_pg_type: string;
  field_source_table: string;
  description?: string;
  extraction_logic?: string;
  data_latency?: string;
  kpi_target_table?: string;
  latency_frequency_mapping?: Record<string, any>;
  validation_strategy: string;
  field_allowed_distinct_values?: string[];
  field_allowed_range_min?: number;
  field_allowed_range_max?: number;
  field_allowed_value_length?: number;
  ui_component_type?: string;
  is_multi_select?: boolean;
  is_required?: boolean;
  is_active?: boolean;
  is_computable?: boolean;
  field_column_name?: string;
  tag?: string;
  display_order?: number;
  created_by?: number;
  updated_by?: number;
  created_at?: string;
  updated_at?: string;
  default_value?: string | number;
  is_dynamic_variable?: boolean;
}

class KPIService {
  private baseUrl = buildApiUrl("/profile-dictionary");

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      ...options?.headers,
    };

    const response = await fetchWithAuthInterceptor(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || errorData.message || `HTTP ${response.status}`
      );
    }

    return response.json();
  }

  async getAllKPIs(
    categoryId?: number,
    isActive?: boolean,
    skipCache: boolean = true
  ): Promise<KPIProfile[]> {
    const params = new URLSearchParams();
    if (categoryId !== undefined) params.append("categoryId", categoryId.toString());
    if (isActive !== undefined) params.append("isActive", isActive.toString());
    params.append("skipCache", skipCache.toString());

    const endpoint = `?${params.toString()}`;
    const data = await this.request<ApiResponse<KPIProfile[]>>(endpoint);
    if (data && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  }

  async getKPIById(id: number): Promise<KPIProfile> {
    const data = await this.request<ApiResponse<KPIProfile>>(`/${id}`);
    if (data && data.data) {
      return data.data;
    }
    return {} as KPIProfile;
  }

  async getKPIByFieldValue(fieldValue: string): Promise<KPIProfile> {
    const data = await this.request<ApiResponse<KPIProfile>>(`/${fieldValue}`);
    if (data && data.data) {
      return data.data;
    }
    return {} as KPIProfile;
  }

  async createKPI(payload: Partial<KPIProfile>): Promise<KPIProfile> {
    const data = await this.request<ApiResponse<KPIProfile>>("", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (data && data.data) {
      return data.data;
    }
    return {} as KPIProfile;
  }

  async updateKPI(
    id: number,
    payload: Partial<KPIProfile>
  ): Promise<KPIProfile> {
    const data = await this.request<ApiResponse<KPIProfile>>(`/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    if (data && data.data) {
      return data.data;
    }
    return {} as KPIProfile;
  }

  async deleteKPI(id: number): Promise<void> {
    await this.request<void>(`/${id}`, {
      method: "DELETE",
    });
  }

  async toggleKPIStatus(
    id: number,
    isActive: boolean
  ): Promise<void> {
    await this.request<void>("/status", {
      method: "PATCH",
      body: JSON.stringify({
        id,
        is_active: isActive,
      }),
    });
  }

  async triggerManualExtraction(fieldValue: string): Promise<void> {
    await this.request<void>(`/manual-trigger/${fieldValue}`, {
      method: "POST",
    });
  }

  async getSegmentationConfig(): Promise<any> {
    const data = await this.request<ApiResponse<any>>("/segmentation-config");
    if (data && data.data) {
      return data.data;
    }
    return null;
  }
}

export const kpiService = new KPIService();
