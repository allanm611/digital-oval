import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";
import {
  JobWorkflowStep,
  JobWorkflowStepListResponse,
  JobWorkflowStepSearchParams,
  CreateJobWorkflowStepPayload,
  UpdateJobWorkflowStepPayload,
  BatchCreateStepsPayload,
  BatchActivateStepsPayload,
  BatchDeactivateStepsPayload,
  DuplicateStepPayload,
  ReorderStepsPayload,
  BatchUpdateStepsPayload,
  ExecutionOrderResponse,
  ParallelGroupsResponse,
  DependenciesResponse,
  HealthSummaryResponse,
  StatisticsResponse,
  MostFailedStepsResponse,
  LongestRunningStepsResponse,
  TypeDistributionResponse,
  ComplexWorkflowsResponse,
  ValidationStepsResponse,
  RetryStepsResponse,
  OrphanedStepsResponse,
  DependencyComplexityResponse,
  TimeoutAnalysisResponse,
  ValidateIntegrityResponse,
} from "../types/jobWorkflowStep";

const BASE_URL = buildApiUrl("/job-workflow-steps");

const clampLimit = (value?: number) => {
  if (!value && value !== 0) return 50;
  if (value < 1) return 1;
  if (value > 100) return 100;
  return value;
};

class JobWorkflowStepService {
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
      let errorMessage = `Job workflow steps API error (${response.status})`;
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
      | JobWorkflowStepListResponse
      | JobWorkflowStep[]
      | {
          success: boolean;
          data: JobWorkflowStep[];
          pagination?: {
            limit: number;
            offset: number;
            total: number;
            hasMore: boolean;
          };
          source?: string;
        }
  ): JobWorkflowStepListResponse {
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

  async listJobWorkflowSteps(
    params: {
      limit?: number;
      offset?: number;
      skipCache?: boolean;
    } = {}
  ): Promise<JobWorkflowStepListResponse> {
    const query = this.buildQueryString({
      limit: clampLimit(params.limit),
      offset: params.offset ?? 0,
      skipCache: params.skipCache ?? false,
    });
    const response = await this.request<
      | JobWorkflowStepListResponse
      | JobWorkflowStep[]
      | {
          success: boolean;
          data: JobWorkflowStep[];
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

  async searchJobWorkflowSteps(
    params: JobWorkflowStepSearchParams = {}
  ): Promise<JobWorkflowStepListResponse> {
    const safeLimit = clampLimit(params.limit);
    const queryParams: Record<string, string | number | boolean> = {
      limit: safeLimit,
      offset: params.offset ?? 0,
      skipCache: params.skipCache ?? false,
    };

    if (params.job_id !== undefined) queryParams.job_id = params.job_id;
    if (params.step_name) queryParams.step_name = params.step_name;
    if (params.step_code) queryParams.step_code = params.step_code;
    if (params.step_type) queryParams.step_type = params.step_type;
    if (params.step_action) queryParams.step_action = params.step_action;
    if (params.step_order !== undefined)
      queryParams.step_order = params.step_order;
    if (params.is_critical !== undefined)
      queryParams.is_critical = params.is_critical;
    if (params.is_parallel !== undefined)
      queryParams.is_parallel = params.is_parallel;
    if (params.is_active !== undefined)
      queryParams.is_active = params.is_active;
    if (params.on_failure_action)
      queryParams.on_failure_action = params.on_failure_action;
    if (params.parallel_group_id !== undefined)
      queryParams.parallel_group_id = params.parallel_group_id;

    const query = this.buildQueryString(queryParams);
    const response = await this.request<
      | JobWorkflowStepListResponse
      | JobWorkflowStep[]
      | {
          success: boolean;
          data: JobWorkflowStep[];
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

  async getJobWorkflowStepById(
    id: number,
    skipCache = false
  ): Promise<JobWorkflowStep> {
    const query = this.buildQueryString({ skipCache });
    const response = await this.request<
      JobWorkflowStep | { success: boolean; data: JobWorkflowStep }
    >(`/${id}${query}`);

    if (response && typeof response === "object" && "data" in response) {
      return (response as { success: boolean; data: JobWorkflowStep }).data;
    }

    return response as JobWorkflowStep;
  }

  async getStepsByJobId(
    jobId: number,
    skipCache = false
  ): Promise<JobWorkflowStepListResponse> {
    const query = this.buildQueryString({ skipCache });
    const response = await this.request<
      | JobWorkflowStepListResponse
      | JobWorkflowStep[]
      | {
          success: boolean;
          data: JobWorkflowStep[];
          pagination?: {
            limit: number;
            offset: number;
            total: number;
            hasMore: boolean;
          };
          source?: string;
        }
    >(`/job/${jobId}${query}`);
    return this.normalizeListResponse(response);
  }

  async getStepByJobAndOrder(
    jobId: number,
    stepOrder: number,
    skipCache = false
  ): Promise<JobWorkflowStep> {
    const query = this.buildQueryString({ skipCache });
    const response = await this.request<
      JobWorkflowStep | { success: boolean; data: JobWorkflowStep }
    >(`/job/${jobId}/order/${stepOrder}${query}`);

    if (response && typeof response === "object" && "data" in response) {
      return (response as { success: boolean; data: JobWorkflowStep }).data;
    }

    return response as JobWorkflowStep;
  }

  async getStepByJobAndCode(
    jobId: number,
    stepCode: string,
    skipCache = false
  ): Promise<JobWorkflowStep> {
    const query = this.buildQueryString({ skipCache });
    const response = await this.request<
      JobWorkflowStep | { success: boolean; data: JobWorkflowStep }
    >(`/job/${jobId}/code/${encodeURIComponent(stepCode)}${query}`);

    if (response && typeof response === "object" && "data" in response) {
      return (response as { success: boolean; data: JobWorkflowStep }).data;
    }

    return response as JobWorkflowStep;
  }

  async getStepsByType(
    stepType: string,
    skipCache = false
  ): Promise<JobWorkflowStepListResponse> {
    const query = this.buildQueryString({ skipCache });
    const response = await this.request<
      | JobWorkflowStepListResponse
      | JobWorkflowStep[]
      | {
          success: boolean;
          data: JobWorkflowStep[];
          pagination?: {
            limit: number;
            offset: number;
            total: number;
            hasMore: boolean;
          };
          source?: string;
        }
    >(`/type/${encodeURIComponent(stepType)}${query}`);
    return this.normalizeListResponse(response);
  }

  async getCriticalSteps(
    params: {
      job_id?: number;
      limit?: number;
      offset?: number;
      skipCache?: boolean;
    } = {}
  ): Promise<JobWorkflowStepListResponse> {
    const query = this.buildQueryString({
      job_id: params.job_id,
      limit: clampLimit(params.limit),
      offset: params.offset ?? 0,
      skipCache: params.skipCache ?? false,
    });
    const response = await this.request<
      | JobWorkflowStepListResponse
      | JobWorkflowStep[]
      | {
          success: boolean;
          data: JobWorkflowStep[];
          pagination?: {
            limit: number;
            offset: number;
            total: number;
            hasMore: boolean;
          };
          source?: string;
        }
    >(`/critical${query}`);
    return this.normalizeListResponse(response);
  }

  async getParallelSteps(
    jobId: number,
    skipCache = false
  ): Promise<JobWorkflowStepListResponse> {
    const query = this.buildQueryString({ skipCache });
    const response = await this.request<
      | JobWorkflowStepListResponse
      | JobWorkflowStep[]
      | {
          success: boolean;
          data: JobWorkflowStep[];
          pagination?: {
            limit: number;
            offset: number;
            total: number;
            hasMore: boolean;
          };
          source?: string;
        }
    >(`/parallel/${jobId}${query}`);
    return this.normalizeListResponse(response);
  }

  async getExecutionOrder(
    jobId: number,
    skipCache = false
  ): Promise<ExecutionOrderResponse> {
    const query = this.buildQueryString({ skipCache });
    return this.request<ExecutionOrderResponse>(
      `/job/${jobId}/execution-order${query}`
    );
  }

  async getNextStep(
    jobId: number,
    currentStepOrder: number,
    skipCache = false
  ): Promise<JobWorkflowStep> {
    const query = this.buildQueryString({ skipCache });
    const response = await this.request<
      JobWorkflowStep | { success: boolean; data: JobWorkflowStep }
    >(`/job/${jobId}/next-step/${currentStepOrder}${query}`);

    if (response && typeof response === "object" && "data" in response) {
      return (response as { success: boolean; data: JobWorkflowStep }).data;
    }

    return response as JobWorkflowStep;
  }

  async canStepExecute(
    jobId: number,
    stepOrder: number,
    skipCache = false
  ): Promise<{ can_execute: boolean; reason?: string }> {
    const query = this.buildQueryString({ skipCache });
    return this.request<{ can_execute: boolean; reason?: string }>(
      `/job/${jobId}/can-execute/${stepOrder}${query}`
    );
  }

  async getParallelGroups(
    jobId: number,
    skipCache = false
  ): Promise<ParallelGroupsResponse> {
    const query = this.buildQueryString({ skipCache });
    return this.request<ParallelGroupsResponse>(
      `/job/${jobId}/parallel-groups${query}`
    );
  }

  async getDependencies(
    jobId: number,
    skipCache = false
  ): Promise<DependenciesResponse> {
    const query = this.buildQueryString({ skipCache });
    return this.request<DependenciesResponse>(
      `/job/${jobId}/dependencies${query}`
    );
  }

  async getHealthSummary(
    jobId: number,
    skipCache = false
  ): Promise<HealthSummaryResponse> {
    const query = this.buildQueryString({ skipCache });
    return this.request<HealthSummaryResponse>(
      `/job/${jobId}/health-summary${query}`
    );
  }

  async getStatistics(
    params: {
      job_id?: number;
      skipCache?: boolean;
    } = {}
  ): Promise<StatisticsResponse> {
    const query = this.buildQueryString({
      job_id: params.job_id,
      skipCache: params.skipCache ?? false,
    });
    return this.request<StatisticsResponse>(`/statistics${query}`);
  }

  async getMostFailedSteps(
    params: {
      limit?: number;
      days_back?: number;
      skipCache?: boolean;
    } = {}
  ): Promise<MostFailedStepsResponse> {
    const query = this.buildQueryString({
      limit: clampLimit(params.limit),
      days_back: params.days_back ?? 30,
      skipCache: params.skipCache ?? false,
    });
    return this.request<MostFailedStepsResponse>(
      `/analytics/most-failed${query}`
    );
  }

  async getLongestRunningSteps(
    params: {
      limit?: number;
      days_back?: number;
      skipCache?: boolean;
    } = {}
  ): Promise<LongestRunningStepsResponse> {
    const query = this.buildQueryString({
      limit: clampLimit(params.limit),
      days_back: params.days_back ?? 30,
      skipCache: params.skipCache ?? false,
    });
    return this.request<LongestRunningStepsResponse>(
      `/analytics/longest-running${query}`
    );
  }

  async getTypeDistribution(
    params: {
      job_id?: number;
      skipCache?: boolean;
    } = {}
  ): Promise<TypeDistributionResponse> {
    const query = this.buildQueryString({
      job_id: params.job_id,
      skipCache: params.skipCache ?? false,
    });
    return this.request<TypeDistributionResponse>(
      `/analytics/type-distribution${query}`
    );
  }

  async getComplexWorkflows(
    params: {
      limit?: number;
      skipCache?: boolean;
    } = {}
  ): Promise<ComplexWorkflowsResponse> {
    const query = this.buildQueryString({
      limit: clampLimit(params.limit),
      skipCache: params.skipCache ?? false,
    });
    return this.request<ComplexWorkflowsResponse>(
      `/analytics/complex-workflows${query}`
    );
  }

  async getValidationSteps(
    params: {
      job_id?: number;
      skipCache?: boolean;
    } = {}
  ): Promise<ValidationStepsResponse> {
    const query = this.buildQueryString({
      job_id: params.job_id,
      skipCache: params.skipCache ?? false,
    });
    return this.request<ValidationStepsResponse>(
      `/analytics/validation-steps${query}`
    );
  }

  async getRetrySteps(
    params: {
      job_id?: number;
      skipCache?: boolean;
    } = {}
  ): Promise<RetryStepsResponse> {
    const query = this.buildQueryString({
      job_id: params.job_id,
      skipCache: params.skipCache ?? false,
    });
    return this.request<RetryStepsResponse>(`/analytics/retry-steps${query}`);
  }

  async getOrphanedSteps(skipCache = false): Promise<OrphanedStepsResponse> {
    const query = this.buildQueryString({ skipCache });
    return this.request<OrphanedStepsResponse>(`/analytics/orphaned${query}`);
  }

  async getDependencyComplexity(
    params: {
      job_id?: number;
      limit?: number;
      skipCache?: boolean;
    } = {}
  ): Promise<DependencyComplexityResponse> {
    const query = this.buildQueryString({
      job_id: params.job_id,
      limit: clampLimit(params.limit),
      skipCache: params.skipCache ?? false,
    });
    return this.request<DependencyComplexityResponse>(
      `/analytics/dependency-complexity${query}`
    );
  }

  async getTimeoutAnalysis(
    params: {
      job_id?: number;
      skipCache?: boolean;
    } = {}
  ): Promise<TimeoutAnalysisResponse> {
    const query = this.buildQueryString({
      job_id: params.job_id,
      skipCache: params.skipCache ?? false,
    });
    return this.request<TimeoutAnalysisResponse>(
      `/analytics/timeout-analysis${query}`
    );
  }

  async getStepsByFailureAction(
    action: string,
    skipCache = false
  ): Promise<JobWorkflowStepListResponse> {
    const query = this.buildQueryString({ skipCache });
    const response = await this.request<
      | JobWorkflowStepListResponse
      | JobWorkflowStep[]
      | {
          success: boolean;
          data: JobWorkflowStep[];
          pagination?: {
            limit: number;
            offset: number;
            total: number;
            hasMore: boolean;
          };
          source?: string;
        }
    >(`/analytics/failure-action/${encodeURIComponent(action)}${query}`);
    return this.normalizeListResponse(response);
  }

  // ==================== POST Endpoints ====================

  async createJobWorkflowStep(
    payload: CreateJobWorkflowStepPayload
  ): Promise<JobWorkflowStep> {
    return this.request<JobWorkflowStep>("", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
  }

  async batchCreateSteps(
    payload: BatchCreateStepsPayload
  ): Promise<JobWorkflowStepListResponse> {
    const response = await this.request<
      | JobWorkflowStepListResponse
      | { success: boolean; data: JobWorkflowStep[] }
    >("/batch", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });

    if (response && typeof response === "object" && "data" in response) {
      return {
        data: (response as { data: JobWorkflowStep[] }).data,
        count: (response as { data: JobWorkflowStep[] }).data.length,
        success: (response as { success: boolean }).success,
      };
    }

    return response as JobWorkflowStepListResponse;
  }

  async batchActivateSteps(
    payload: BatchActivateStepsPayload
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

  async batchDeactivateSteps(
    payload: BatchDeactivateStepsPayload
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

  async duplicateStep(
    stepId: number,
    payload: DuplicateStepPayload
  ): Promise<JobWorkflowStep> {
    return this.request<JobWorkflowStep>(`/${stepId}/duplicate`, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
  }

  async validateWorkflowIntegrity(
    jobId: number
  ): Promise<ValidateIntegrityResponse> {
    return this.request<ValidateIntegrityResponse>(
      `/job/${jobId}/validate-integrity`,
      {
        method: "POST",
      }
    );
  }

  // ==================== PUT Endpoints ====================

  async updateJobWorkflowStep(
    id: number,
    payload: UpdateJobWorkflowStepPayload
  ): Promise<JobWorkflowStep> {
    return this.request<JobWorkflowStep>(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
  }

  async batchUpdateSteps(
    payload: BatchUpdateStepsPayload
  ): Promise<{ success: number; failed: number }> {
    return this.request<{ success: number; failed: number }>("/batch", {
      method: "PUT",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
  }

  async reorderSteps(
    jobId: number,
    payload: ReorderStepsPayload
  ): Promise<{ success: boolean; message?: string }> {
    return this.request<{ success: boolean; message?: string }>(
      `/job/${jobId}/reorder`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // ==================== PATCH Endpoints ====================

  async activateStep(id: number, userId: number): Promise<JobWorkflowStep> {
    const response = await this.request<
      JobWorkflowStep | { success: boolean; data: JobWorkflowStep }
    >(`/${id}/activate`, {
      method: "PATCH",
      body: JSON.stringify({ userId }),
      headers: { "Content-Type": "application/json" },
    });

    if (response && typeof response === "object" && "data" in response) {
      return (response as { success: boolean; data: JobWorkflowStep }).data;
    }

    return response as JobWorkflowStep;
  }

  async deactivateStep(id: number, userId: number): Promise<JobWorkflowStep> {
    const response = await this.request<
      JobWorkflowStep | { success: boolean; data: JobWorkflowStep }
    >(`/${id}/deactivate`, {
      method: "PATCH",
      body: JSON.stringify({ userId }),
      headers: { "Content-Type": "application/json" },
    });

    if (response && typeof response === "object" && "data" in response) {
      return (response as { success: boolean; data: JobWorkflowStep }).data;
    }

    return response as JobWorkflowStep;
  }

  // ==================== DELETE Endpoints ====================

  async deleteJobWorkflowStep(id: number): Promise<void> {
    await this.request<void>(`/${id}`, { method: "DELETE" });
  }

  async deleteAllStepsForJob(
    jobId: number
  ): Promise<{ success: boolean; deleted_count: number }> {
    return this.request<{ success: boolean; deleted_count: number }>(
      `/job/${jobId}/all`,
      {
        method: "DELETE",
      }
    );
  }
}

export const jobWorkflowStepService = new JobWorkflowStepService();

