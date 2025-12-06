import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";
import {
  JobDependency,
  JobDependencyListResponse,
  JobDependencySearchResponse,
  JobDependencyListParams,
  JobDependencySearchParams,
  CreateJobDependencyPayload,
  UpdateJobDependencyPayload,
  BatchActivatePayload,
  BatchDeactivatePayload,
  BatchOperationResponse,
  DependencySatisfiedResponse,
  UnsatisfiedDependenciesResponse,
  DependencyStatusResponse,
  DependencyChainResponse,
  DependencyGraphResponse,
  MostDependedResponse,
  OrphanedJobsResponse,
  DependencyStatisticsResponse,
  DependentsResponse,
  CriticalPathResponse,
  DeleteAllResponse,
} from "../types/jobDependency";

const BASE_URL = buildApiUrl("/job-dependencies");

class JobDependencyService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      let errorMessage = `Failed to call job dependencies API (status ${response.status})`;

      try {
        const parsed = JSON.parse(errorBody);
        errorMessage =
          parsed?.message || parsed?.error || parsed?.details || errorMessage;
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
      | JobDependencyListResponse
      | JobDependency[]
      | {
          success: boolean;
          data: JobDependency[];
          pagination?: {
            limit: number;
            offset: number;
            total: number;
            hasMore: boolean;
          };
          source?: string;
        }
  ): JobDependencyListResponse {
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

  // GET Endpoints

  async listJobDependencies(
    params: JobDependencyListParams = {}
  ): Promise<JobDependencyListResponse> {
    const safeLimit = Math.min(Math.max(params.limit ?? 50, 1), 100);
    const query = this.buildQueryString({
      activeOnly: params.activeOnly ?? true,
      limit: safeLimit,
      offset: params.offset ?? 0,
      skipCache: params.skipCache ?? false,
    });

    const response = await this.request<
      | JobDependencyListResponse
      | JobDependency[]
      | {
          success: boolean;
          data: JobDependency[];
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

  async searchJobDependencies(
    params: JobDependencySearchParams = {}
  ): Promise<JobDependencySearchResponse> {
    const safeLimit = Math.min(Math.max(params.limit ?? 50, 1), 100);
    const queryParams: Record<string, string | number | boolean> = {
      limit: safeLimit,
      offset: params.offset ?? 0,
      skipCache: params.skipCache ?? false,
    };

    if (params.id !== undefined) queryParams.id = params.id;
    if (params.job_id !== undefined) queryParams.job_id = params.job_id;
    if (params.depends_on_job_id !== undefined)
      queryParams.depends_on_job_id = params.depends_on_job_id;
    if (params.dependency_type)
      queryParams.dependency_type = params.dependency_type;
    if (params.wait_for_status)
      queryParams.wait_for_status = params.wait_for_status;
    if (params.is_active !== undefined)
      queryParams.is_active = params.is_active;
    if (params.lookback_days_min !== undefined)
      queryParams.lookback_days_min = params.lookback_days_min;
    if (params.lookback_days_max !== undefined)
      queryParams.lookback_days_max = params.lookback_days_max;
    if (params.max_wait_minutes_min !== undefined)
      queryParams.max_wait_minutes_min = params.max_wait_minutes_min;
    if (params.max_wait_minutes_max !== undefined)
      queryParams.max_wait_minutes_max = params.max_wait_minutes_max;

    const query = this.buildQueryString(queryParams);
    const response = await this.request<JobDependencySearchResponse>(
      `/search${query}`
    );

    if (Array.isArray(response)) {
      return {
        success: true,
        data: response,
        pagination: {
          limit: safeLimit,
          offset: params.offset ?? 0,
          total: response.length,
          hasMore: false,
        },
      };
    }

    return response;
  }

  async getJobDependencyById(
    id: number,
    skipCache = false
  ): Promise<JobDependency> {
    const query = this.buildQueryString({ skipCache });
    const response = await this.request<
      JobDependency | { success: boolean; data: JobDependency }
    >(`/${id}${query}`);

    if (response && typeof response === "object" && "data" in response) {
      return (response as { success: boolean; data: JobDependency }).data;
    }

    return response as JobDependency;
  }

  async getDependenciesForJob(
    jobId: number,
    params: Omit<JobDependencyListParams, "activeOnly"> & {
      activeOnly?: boolean;
    } = {}
  ): Promise<JobDependencyListResponse> {
    const safeLimit = Math.min(Math.max(params.limit ?? 50, 1), 100);
    const query = this.buildQueryString({
      activeOnly: params.activeOnly ?? true,
      limit: safeLimit,
      offset: params.offset ?? 0,
      skipCache: params.skipCache ?? false,
    });

    const response = await this.request<
      | JobDependencyListResponse
      | JobDependency[]
      | {
          success: boolean;
          data: JobDependency[];
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

  async getJobsDependingOn(
    dependsOnJobId: number,
    params: JobDependencyListParams = {}
  ): Promise<JobDependencyListResponse> {
    const safeLimit = Math.min(Math.max(params.limit ?? 50, 1), 100);
    const query = this.buildQueryString({
      activeOnly: params.activeOnly ?? true,
      limit: safeLimit,
      offset: params.offset ?? 0,
      skipCache: params.skipCache ?? false,
    });

    const response = await this.request<
      | JobDependencyListResponse
      | JobDependency[]
      | {
          success: boolean;
          data: JobDependency[];
          pagination?: {
            limit: number;
            offset: number;
            total: number;
            hasMore: boolean;
          };
          source?: string;
        }
    >(`/depends-on/${dependsOnJobId}${query}`);
    return this.normalizeListResponse(response);
  }

  async getSpecificDependency(
    jobId: number,
    dependsOnJobId: number,
    skipCache = false
  ): Promise<JobDependency> {
    const query = this.buildQueryString({
      job_id: jobId,
      depends_on_job_id: dependsOnJobId,
      skipCache,
    });
    const response = await this.request<
      JobDependency | { success: boolean; data: JobDependency }
    >(`/specific${query}`);

    if (response && typeof response === "object" && "data" in response) {
      return (response as { success: boolean; data: JobDependency }).data;
    }

    return response as JobDependency;
  }

  async getBlockingDependencies(
    jobId: number,
    params: Omit<JobDependencyListParams, "activeOnly"> = {}
  ): Promise<JobDependencyListResponse> {
    const safeLimit = Math.min(Math.max(params.limit ?? 50, 1), 100);
    const query = this.buildQueryString({
      limit: safeLimit,
      offset: params.offset ?? 0,
      skipCache: params.skipCache ?? false,
    });

    const response = await this.request<
      | JobDependencyListResponse
      | JobDependency[]
      | {
          success: boolean;
          data: JobDependency[];
          pagination?: {
            limit: number;
            offset: number;
            total: number;
            hasMore: boolean;
          };
          source?: string;
        }
    >(`/blocking/${jobId}${query}`);
    return this.normalizeListResponse(response);
  }

  async getDependencyChain(
    jobId: number,
    skipCache = false
  ): Promise<DependencyChainResponse> {
    const query = this.buildQueryString({ skipCache });
    return this.request<DependencyChainResponse>(`/chain/${jobId}${query}`);
  }

  async getCriticalPath(
    jobId: number,
    skipCache = false
  ): Promise<CriticalPathResponse> {
    const query = this.buildQueryString({ skipCache });
    return this.request<CriticalPathResponse>(
      `/critical-path/${jobId}${query}`
    );
  }

  async getImmediateDependencies(
    jobId: number,
    skipCache = false
  ): Promise<JobDependencyListResponse> {
    const query = this.buildQueryString({ skipCache });
    const response = await this.request<
      | JobDependencyListResponse
      | JobDependency[]
      | {
          success: boolean;
          data: JobDependency[];
          pagination?: {
            limit: number;
            offset: number;
            total: number;
            hasMore: boolean;
          };
          source?: string;
        }
    >(`/immediate/${jobId}${query}`);
    return this.normalizeListResponse(response);
  }

  async getAllDependents(
    jobId: number,
    skipCache = false
  ): Promise<DependentsResponse> {
    const query = this.buildQueryString({ skipCache });
    return this.request<DependentsResponse>(`/dependents/${jobId}${query}`);
  }

  async checkDependenciesSatisfied(
    jobId: number,
    skipCache = false
  ): Promise<DependencySatisfiedResponse> {
    const query = this.buildQueryString({ skipCache });
    return this.request<DependencySatisfiedResponse>(
      `/satisfied/${jobId}${query}`
    );
  }

  async getUnsatisfiedDependencies(
    jobId: number,
    skipCache = false
  ): Promise<UnsatisfiedDependenciesResponse> {
    const query = this.buildQueryString({ skipCache });
    return this.request<UnsatisfiedDependenciesResponse>(
      `/unsatisfied/${jobId}${query}`
    );
  }

  async getDependencyStatus(
    jobId: number,
    skipCache = false
  ): Promise<DependencyStatusResponse> {
    const query = this.buildQueryString({ skipCache });
    return this.request<DependencyStatusResponse>(`/status/${jobId}${query}`);
  }

  async getDependencyGraph(
    skipCache = false
  ): Promise<DependencyGraphResponse> {
    const query = this.buildQueryString({ skipCache });
    return this.request<DependencyGraphResponse>(`/graph${query}`);
  }

  async getOrphanedJobs(skipCache = false): Promise<OrphanedJobsResponse> {
    const query = this.buildQueryString({ skipCache });
    return this.request<OrphanedJobsResponse>(`/orphaned${query}`);
  }

  async getMostDependedOnJobs(
    limit = 10,
    skipCache = false
  ): Promise<MostDependedResponse> {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const query = this.buildQueryString({ limit: safeLimit, skipCache });
    return this.request<MostDependedResponse>(`/most-depended${query}`);
  }

  async getComplexDependencies(
    skipCache = false
  ): Promise<JobDependencyListResponse> {
    const query = this.buildQueryString({ skipCache });
    const response = await this.request<
      | JobDependencyListResponse
      | JobDependency[]
      | {
          success: boolean;
          data: JobDependency[];
          pagination?: {
            limit: number;
            offset: number;
            total: number;
            hasMore: boolean;
          };
          source?: string;
        }
    >(`/complex${query}`);
    return this.normalizeListResponse(response);
  }

  async getDependencyStatistics(
    skipCache = false
  ): Promise<DependencyStatisticsResponse> {
    const query = this.buildQueryString({ skipCache });
    return this.request<DependencyStatisticsResponse>(`/statistics${query}`);
  }

  // POST Endpoints

  async createJobDependency(
    payload: CreateJobDependencyPayload
  ): Promise<JobDependency> {
    console.log("🔵 CREATE JOB DEPENDENCY - Request Details:");
    console.log("==========================================");
    console.log("Full URL:", `${BASE_URL}`);
    console.log("Method: POST");
    console.log("Payload received:", payload);
    console.log("Payload JSON:", JSON.stringify(payload, null, 2));
    console.log("Has userId:", "userId" in payload);
    console.log("userId value:", payload.userId);
    console.log("userId type:", typeof payload.userId);
    console.log("job_id:", payload.job_id);
    console.log("depends_on_job_id:", payload.depends_on_job_id);
    console.log("==========================================");

    // Some backend implementations expect fields like `created_by` or `user_id`.
    // Add these aliases to the outgoing body to increase compatibility.
    const body = {
      ...payload,
      created_by: (payload as any).userId ?? (payload as any).user_id ?? null,
      user_id: (payload as any).userId ?? (payload as any).user_id ?? null,
    };

    return this.request<JobDependency>("", {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async batchActivateDependencies(
    payload: BatchActivatePayload
  ): Promise<BatchOperationResponse> {
    return this.request<BatchOperationResponse>("/batch/activate", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async batchDeactivateDependencies(
    payload: BatchDeactivatePayload
  ): Promise<BatchOperationResponse> {
    return this.request<BatchOperationResponse>("/batch/deactivate", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  // PUT Endpoints

  async updateJobDependency(
    id: number,
    payload: UpdateJobDependencyPayload
  ): Promise<JobDependency> {
    // Include aliases for `updated_by` and `user_id` so backend accepting
    // different field names still receives the user information.
    const body = {
      ...payload,
      updated_by: (payload as any).userId ?? (payload as any).user_id ?? null,
      user_id: (payload as any).userId ?? (payload as any).user_id ?? null,
    };

    return this.request<JobDependency>(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  // PATCH Endpoints

  async activateDependency(id: number): Promise<JobDependency> {
    const response = await this.request<
      JobDependency | { success: boolean; data: JobDependency }
    >(`/${id}/activate`, {
      method: "PATCH",
    });

    if (response && typeof response === "object" && "data" in response) {
      return (response as { success: boolean; data: JobDependency }).data;
    }

    return response as JobDependency;
  }

  async deactivateDependency(id: number): Promise<JobDependency> {
    const response = await this.request<
      JobDependency | { success: boolean; data: JobDependency }
    >(`/${id}/deactivate`, {
      method: "PATCH",
    });

    if (response && typeof response === "object" && "data" in response) {
      return (response as { success: boolean; data: JobDependency }).data;
    }

    return response as JobDependency;
  }

  // DELETE Endpoints

  async deleteJobDependency(id: number): Promise<void> {
    await this.request<{ success: boolean }>(`/${id}`, {
      method: "DELETE",
    });
  }

  async deleteAllDependenciesForJob(jobId: number): Promise<DeleteAllResponse> {
    return this.request<DeleteAllResponse>(`/job/${jobId}/all`, {
      method: "DELETE",
    });
  }
}

export const jobDependencyService = new JobDependencyService();
