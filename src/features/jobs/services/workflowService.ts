import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";
import {
  Workflow,
  WorkflowListResponse,
  CreateWorkflowPayload,
  UpdateWorkflowPayload,
  WorkflowSearchParams,
  AdvancedWorkflowSearchParams,
  BatchActivateWorkflowsPayload,
  BatchDeactivateWorkflowsPayload,
  CloneWorkflowPayload,
  CountByTypeResponse,
  StatusCountsResponse,
  WorkflowTypesResponse,
} from "../types/workflow";

const BASE_URL = buildApiUrl("/workflows");

const clampLimit = (value?: number) => {
  if (!value && value !== 0) return 50;
  if (value < 1) return 1;
  if (value > 100) return 100;
  return value;
};

class WorkflowService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...getAuthHeaders(options.body !== undefined),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      let errorMessage = `Workflows API error (${response.status})`;
      try {
        const parsed = JSON.parse(errorBody);
        errorMessage = parsed?.message || parsed?.error || errorMessage;
      } catch {
        if (errorBody) {
          errorMessage = errorBody;
        }
      }
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  private buildQueryString(
    params?: Record<string, string | number | boolean | undefined | null>
  ): string {
    if (!params) return "";
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      searchParams.append(key, String(value));
    });
    const query = searchParams.toString();
    return query ? `?${query}` : "";
  }

  private normalizeListResponse(
    response:
      | WorkflowListResponse
      | Workflow[]
      | {
          success: boolean;
          data: Workflow[];
          pagination?: {
            limit: number;
            offset: number;
            total: number;
            hasMore: boolean;
          };
          source?: string;
        }
  ): WorkflowListResponse {
    if (Array.isArray(response)) {
      return {
        data: response,
        count: response.length,
      };
    }
    if ("success" in response && "data" in response) {
      return {
        data: response.data,
        count: response.pagination?.total ?? response.data.length,
        success: response.success,
        pagination: response.pagination,
        source: response.source,
      };
    }
    return response;
  }

  // ==================== GET Endpoints ====================

  async getAllWorkflows(
    params: {
      limit?: number;
      offset?: number;
      skipCache?: boolean;
    } = {}
  ): Promise<WorkflowListResponse> {
    const query = this.buildQueryString({
      limit: clampLimit(params.limit),
      offset: params.offset ?? 0,
      skipCache: params.skipCache ?? false,
    });
    const response = await this.request<
      | WorkflowListResponse
      | Workflow[]
      | {
          success: boolean;
          data: Workflow[];
          pagination?: {
            limit: number;
            offset: number;
            total: number;
            hasMore: boolean;
          };
          source?: string;
        }
    >(query);
    return this.normalizeListResponse(response);
  }

  async getActiveWorkflows(
    params: {
      limit?: number;
      offset?: number;
      skipCache?: boolean;
    } = {}
  ): Promise<WorkflowListResponse> {
    const query = this.buildQueryString({
      limit: clampLimit(params.limit),
      offset: params.offset ?? 0,
      skipCache: params.skipCache ?? false,
    });
    const response = await this.request<
      | WorkflowListResponse
      | Workflow[]
      | {
          success: boolean;
          data: Workflow[];
          pagination?: {
            limit: number;
            offset: number;
            total: number;
            hasMore: boolean;
          };
          source?: string;
        }
    >(`/active${query}`);
    return this.normalizeListResponse(response);
  }

  async getInactiveWorkflows(
    params: {
      limit?: number;
      offset?: number;
      skipCache?: boolean;
    } = {}
  ): Promise<WorkflowListResponse> {
    const query = this.buildQueryString({
      limit: clampLimit(params.limit),
      offset: params.offset ?? 0,
      skipCache: params.skipCache ?? false,
    });
    const response = await this.request<
      | WorkflowListResponse
      | Workflow[]
      | {
          success: boolean;
          data: Workflow[];
          pagination?: {
            limit: number;
            offset: number;
            total: number;
            hasMore: boolean;
          };
          source?: string;
        }
    >(`/inactive${query}`);
    return this.normalizeListResponse(response);
  }

  async getWorkflowTypes(): Promise<WorkflowTypesResponse> {
    return this.request<WorkflowTypesResponse>("/types");
  }

  async searchWorkflows(
    params: WorkflowSearchParams
  ): Promise<WorkflowListResponse> {
    const queryParams: Record<string, string | number | boolean> = {
      q: params.q || "",
      activeOnly: params.activeOnly ?? true,
      limit: clampLimit(params.limit),
      offset: params.offset ?? 0,
      skipCache: params.skipCache ?? false,
    };

    const query = this.buildQueryString(queryParams);
    const response = await this.request<
      | WorkflowListResponse
      | Workflow[]
      | {
          success: boolean;
          data: Workflow[];
          pagination?: {
            limit: number;
            offset: number;
            total: number;
            hasMore: boolean;
          };
          source?: string;
        }
    >(`/search${query}`);
    return this.normalizeListResponse(response);
  }

  async getWorkflowsByType(
    type: string,
    params: {
      activeOnly?: boolean;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<WorkflowListResponse> {
    const query = this.buildQueryString({
      activeOnly: params.activeOnly ?? true,
      limit: clampLimit(params.limit),
      offset: params.offset ?? 0,
    });
    const response = await this.request<
      | WorkflowListResponse
      | Workflow[]
      | {
          success: boolean;
          data: Workflow[];
          pagination?: {
            limit: number;
            offset: number;
            total: number;
            hasMore: boolean;
          };
          source?: string;
        }
    >(`/types/${encodeURIComponent(type)}${query}`);
    return this.normalizeListResponse(response);
  }

  async getWorkflowByName(name: string): Promise<Workflow> {
    const response = await this.request<
      Workflow | { success: boolean; data: Workflow }
    >(`/name/${encodeURIComponent(name)}`);

    if (response && typeof response === "object" && "data" in response) {
      return (response as { success: boolean; data: Workflow }).data;
    }

    return response as Workflow;
  }

  async getWorkflowById(
    id: number,
    skipCache = false
  ): Promise<Workflow> {
    const query = this.buildQueryString({ skipCache });
    const response = await this.request<
      Workflow | { success: boolean; data: Workflow }
    >(`/${id}${query}`);

    if (response && typeof response === "object" && "data" in response) {
      return (response as { success: boolean; data: Workflow }).data;
    }

    return response as Workflow;
  }

  async checkWorkflowActive(id: number): Promise<{ is_active: boolean }> {
    return this.request<{ is_active: boolean }>(`/${id}/active`);
  }

  async getCountByType(): Promise<CountByTypeResponse> {
    return this.request<CountByTypeResponse>("/reports/count-by-type");
  }

  async getStatusCounts(
    skipCache = false
  ): Promise<StatusCountsResponse> {
    const query = this.buildQueryString({ skipCache });
    return this.request<StatusCountsResponse>(`/reports/status-counts${query}`);
  }

  async advancedSearchWorkflows(
    params: AdvancedWorkflowSearchParams
  ): Promise<WorkflowListResponse> {
    const queryParams: Record<string, string | number | boolean> = {
      limit: clampLimit(params.limit),
      offset: params.offset ?? 0,
      skipCache: params.skipCache ?? false,
    };

    if (params.id !== undefined) queryParams.id = params.id;
    if (params.name) queryParams.name = params.name;
    if (params.description) queryParams.description = params.description;
    if (params.workflow_type) queryParams.workflow_type = params.workflow_type;
    if (params.is_active !== undefined)
      queryParams.is_active = params.is_active;
    if (params.created_by !== undefined)
      queryParams.created_by = params.created_by;
    if (params.created_at_from) queryParams.created_at_from = params.created_at_from;
    if (params.created_at_to) queryParams.created_at_to = params.created_at_to;
    if (params.updated_at_from) queryParams.updated_at_from = params.updated_at_from;
    if (params.updated_at_to) queryParams.updated_at_to = params.updated_at_to;

    const query = this.buildQueryString(queryParams);
    const response = await this.request<
      | WorkflowListResponse
      | Workflow[]
      | {
          success: boolean;
          data: Workflow[];
          pagination?: {
            limit: number;
            offset: number;
            total: number;
            hasMore: boolean;
          };
          source?: string;
        }
    >(`/search/advanced${query}`, {
      method: "POST",
      body: JSON.stringify(params),
      headers: { "Content-Type": "application/json" },
    });
    return this.normalizeListResponse(response);
  }

  // ==================== POST Endpoints ====================

  async createWorkflow(
    payload: CreateWorkflowPayload
  ): Promise<Workflow> {
    return this.request<Workflow>("", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
  }

  async bulkActivateWorkflows(
    payload: BatchActivateWorkflowsPayload
  ): Promise<{ success: number; failed: number }> {
    return this.request<{ success: number; failed: number }>(
      "/batch/activate",
      {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  async bulkDeactivateWorkflows(
    payload: BatchDeactivateWorkflowsPayload
  ): Promise<{ success: number; failed: number }> {
    return this.request<{ success: number; failed: number }>(
      "/batch/deactivate",
      {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  async activateWorkflow(id: number): Promise<Workflow> {
    const response = await this.request<
      Workflow | { success: boolean; data: Workflow }
    >(`/${id}/activate`, {
      method: "POST",
    });

    if (response && typeof response === "object" && "data" in response) {
      return (response as { success: boolean; data: Workflow }).data;
    }

    return response as Workflow;
  }

  async deactivateWorkflow(id: number): Promise<Workflow> {
    const response = await this.request<
      Workflow | { success: boolean; data: Workflow }
    >(`/${id}/deactivate`, {
      method: "POST",
    });

    if (response && typeof response === "object" && "data" in response) {
      return (response as { success: boolean; data: Workflow }).data;
    }

    return response as Workflow;
  }

  async cloneWorkflow(
    id: number,
    payload: CloneWorkflowPayload
  ): Promise<Workflow> {
    return this.request<Workflow>(`/${id}/clone`, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
  }

  // ==================== PUT Endpoints ====================

  async updateWorkflow(
    id: number,
    payload: UpdateWorkflowPayload
  ): Promise<Workflow> {
    return this.request<Workflow>(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
  }

  // ==================== DELETE Endpoints ====================

  async deleteWorkflow(id: number): Promise<void> {
    await this.request<void>(`/${id}`, { method: "DELETE" });
  }
}

export const workflowService = new WorkflowService();

