import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";
import {
  CreateScheduledJobPayload,
  ExecutionStatsPayload,
  LastRunPayload,
  NextRunPayload,
  NotificationRecipientsPayload,
  RollbackPayload,
  ScheduledJob,
  ScheduledJobListResponse,
  ScheduledJobSearchParams,
  UpdateScheduledJobPayload,
  VersionPayload,
} from "../types/scheduledJob";

const BASE_URL = buildApiUrl("/scheduled-jobs");

const clampLimit = (value?: number) => {
  if (!value && value !== 0) return 50;
  if (value < 1) return 1;
  if (value > 100) return 100;
  return value;
};

class ScheduledJobService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
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
      let errorMessage = `Scheduled jobs API error (${response.status})`;
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

    if (response.status === 204 || response.status === 201) {
      const text = await response.text();
      if (!text) {
        return {} as T;
      }
      return JSON.parse(text);
    }

    return response.json();
  }

  private normalizeJobResponse(
    response:
      | ScheduledJob
      | {
          success?: boolean;
          data?: ScheduledJob;
        },
  ): ScheduledJob {
    if (
      response &&
      typeof response === "object" &&
      "data" in response &&
      (response as { data?: ScheduledJob }).data
    ) {
      return (response as { data: ScheduledJob }).data;
    }
    return response as ScheduledJob;
  }

  private buildQueryString(
    params?: Record<string, string | number | boolean | undefined | null>,
  ) {
    if (!params) return "";
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      searchParams.append(key, String(value));
    });
    const query = searchParams.toString();
    return query ? `?${query}` : "";
  }

  async listScheduledJobs(
    params: {
      limit?: number;
      offset?: number;
      status?: string;
      skipCache?: boolean;
    } = {},
  ): Promise<ScheduledJobListResponse> {
    const query = this.buildQueryString({
      limit: clampLimit(params.limit),
      offset: params.offset ?? 0,
      status: params.status,
      skipCache: params.skipCache ?? false,
    });
    return this.request<ScheduledJobListResponse>(query);
  }

  async searchScheduledJobs(
    params: ScheduledJobSearchParams = {},
  ): Promise<ScheduledJobListResponse> {
    const query = this.buildQueryString({
      ...params,
      limit: clampLimit(params.limit),
    });
    return this.request<ScheduledJobListResponse>(`/search${query}`);
  }

  async getScheduledJobById(id: number, skipCache?: boolean): Promise<ScheduledJob> {
    const query = this.buildQueryString({ skipCache });
    const response = await this.request<{
      success: boolean;
      data: ScheduledJob;
    }>(`/${id}${query}`);
    // Handle both wrapped and unwrapped responses
    if (
      response &&
      typeof response === "object" &&
      "data" in response &&
      "success" in response
    ) {
      return (response as { success: boolean; data: ScheduledJob }).data;
    }
    return response as ScheduledJob;
  }

  async getScheduledJobByCode(code: string, skipCache?: boolean): Promise<ScheduledJob> {
    const query = this.buildQueryString({ skipCache });
    return this.request<ScheduledJob>(`/code/${encodeURIComponent(code)}${query}`);
  }

  async getScheduledJobByUuid(uuid: string, skipCache?: boolean): Promise<ScheduledJob> {
    const query = this.buildQueryString({ skipCache });
    return this.request<ScheduledJob>(`/uuid/${encodeURIComponent(uuid)}${query}`);
  }

  async getScheduledJobsByStatus(status: string, skipCache?: boolean) {
    const query = this.buildQueryString({ skipCache });
    return this.request<ScheduledJobListResponse>(
      `/status/${encodeURIComponent(status)}${query}`,
    );
  }

  async getScheduledJobsByJobType(jobTypeId: number, skipCache?: boolean) {
    const query = this.buildQueryString({ skipCache });
    return this.request<ScheduledJobListResponse>(`/job-type/${jobTypeId}${query}`);
  }

  async createScheduledJob(
    payload: CreateScheduledJobPayload,
  ): Promise<ScheduledJob> {
    return this.request<ScheduledJob>("", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
  }

  async updateScheduledJob(
    id: number,
    payload: UpdateScheduledJobPayload,
  ): Promise<ScheduledJob> {
    return this.request<ScheduledJob>(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
  }

  async deleteScheduledJob(id: number): Promise<void> {
    await this.request<void>(`/${id}`, { method: "DELETE" });
  }

  async activateScheduledJob(id: number) {
    return this.request<ScheduledJob>(`/${id}/activate`, { method: "PATCH" });
  }

  async deactivateScheduledJob(id: number) {
    return this.request<ScheduledJob>(`/${id}/deactivate`, { method: "PATCH" });
  }

  async pauseScheduledJob(id: number) {
    return this.request<ScheduledJob>(`/${id}/pause`, { method: "PATCH" });
  }

  async archiveScheduledJob(id: number) {
    return this.request<ScheduledJob>(`/${id}/archive`, { method: "PATCH" });
  }

  async getCountByStatus(skipCache?: boolean) {
    const query = this.buildQueryString({ skipCache });
    const response = await this.request<
      | Array<{ status: string; count: number | string }>
      | Array<{ label: string; count: number | string }>
      | {
          success: boolean;
          data: Array<
            | { status: string; count: number | string }
            | { label: string; count: number | string }
          >;
          total?: number;
          source?: string;
        }
    >(`/analytics/count-by-status${query}`);
    if (Array.isArray(response)) {
      return response;
    }
    return response.data || [];
  }

  async getCountByType(skipCache?: boolean) {
    const query = this.buildQueryString({ skipCache });
    const response = await this.request<
      | Array<{ label: string; count: number }>
      | {
          success: boolean;
          data: Array<{ label: string; count: number }>;
          total?: number;
          source?: string;
        }
    >(`/analytics/count-by-type${query}`);
    if (Array.isArray(response)) {
      return response;
    }
    return response.data || [];
  }

  async getCountByOwner(skipCache?: boolean) {
    const query = this.buildQueryString({ skipCache });
    const response = await this.request<
      | Array<{ label: string; count: number }>
      | {
          success: boolean;
          data: Array<{ label: string; count: number }>;
          total?: number;
          source?: string;
        }
    >(`/analytics/count-by-owner${query}`);
    if (Array.isArray(response)) {
      return response;
    }
    return response.data || [];
  }

  async updateExecutionStats(
    id: number,
    payload: ExecutionStatsPayload,
  ): Promise<ScheduledJob> {
    return this.request<ScheduledJob>(`/${id}/execution-stats`, {
      method: "PATCH",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
  }

  async updateLastRun(
    id: number,
    payload: LastRunPayload,
  ): Promise<ScheduledJob> {
    return this.request<ScheduledJob>(`/${id}/last-run`, {
      method: "PATCH",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
  }

  async updateNextRun(
    id: number,
    payload: NextRunPayload,
  ): Promise<ScheduledJob> {
    return this.request<ScheduledJob>(`/${id}/next-run`, {
      method: "PATCH",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
  }

  async incrementFailureCount(id: number, amount: number = 1) {
    return this.request<ScheduledJob>(`/${id}/failure-count/increment`, {
      method: "PATCH",
      body: JSON.stringify({ amount }),
      headers: { "Content-Type": "application/json" },
    });
  }

  async resetFailureCount(id: number) {
    return this.request<ScheduledJob>(`/${id}/failure-count/reset`, {
      method: "PATCH",
    });
  }

  async addTag(id: number, tag: string) {
    const response = await this.request<
      ScheduledJob | { success?: boolean; data: ScheduledJob }
    >(`/${id}/tags`, {
      method: "POST",
      body: JSON.stringify({ tag }),
      headers: { "Content-Type": "application/json" },
    });
    return this.normalizeJobResponse(response);
  }

  async removeTag(id: number, tag: string) {
    const response = await this.request<
      ScheduledJob | { success?: boolean; data: ScheduledJob }
    >(`/${id}/tags/${encodeURIComponent(tag)}`, {
      method: "DELETE",
    });
    return this.normalizeJobResponse(response);
  }

  async addNotificationRecipients(
    id: number,
    payload: NotificationRecipientsPayload,
  ) {
    const response = await this.request<
      ScheduledJob | { success?: boolean; data: ScheduledJob }
    >(`/${id}/notification-recipients`, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
    return this.normalizeJobResponse(response);
  }

  async removeNotificationRecipient(id: number, recipient: string) {
    const response = await this.request<
      ScheduledJob | { success?: boolean; data: ScheduledJob }
    >(`/${id}/notification-recipients/${encodeURIComponent(recipient)}`, {
      method: "DELETE",
    });
    return this.normalizeJobResponse(response);
  }

  async createVersion(id: number, payload: VersionPayload) {
    return this.request<ScheduledJob>(`/${id}/versions`, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
  }

  async rollbackVersion(
    id: number,
    versionId: number,
    payload: RollbackPayload,
  ) {
    return this.request<ScheduledJob>(`/${id}/rollback/${versionId}`, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
  }

  async getVersions(id: number, skipCache?: boolean) {
    const query = this.buildQueryString({ skipCache });
    const response = await this.request<{
      success?: boolean;
      data: ScheduledJob[];
    }>(`/${id}/versions${query}`);
    // Handle wrapped response
    if (response && typeof response === "object" && "data" in response) {
      return response;
    }
    return { data: response as ScheduledJob[] };
  }

  // ==================== Search/List Endpoints ====================

  async getActiveJobs(skipCache?: boolean) {
    const query = this.buildQueryString({ skipCache });
    return this.request<ScheduledJobListResponse>(`/active${query}`);
  }

  async getSlaBreachJobs(skipCache?: boolean) {
    const query = this.buildQueryString({ skipCache });
    return this.request<ScheduledJobListResponse>(`/sla-breach${query}`);
  }

  async getStaleJobs(skipCache?: boolean) {
    const query = this.buildQueryString({ skipCache });
    return this.request<ScheduledJobListResponse>(`/stale${query}`);
  }

  async getDueForExecutionJobs(skipCache?: boolean) {
    const query = this.buildQueryString({ skipCache });
    return this.request<ScheduledJobListResponse>(`/due-for-execution${query}`);
  }

  // ==================== Batch Operations ====================

  async batchActivate(
    jobIds: number[],
    updated_by?: number,
  ): Promise<{
    success: number;
    failed: number;
    errors?: Record<number, string>;
  }> {
    return this.request(`/batch/activate`, {
      method: "POST",
      body: JSON.stringify({ jobIds, updated_by }),
      headers: { "Content-Type": "application/json" },
    });
  }

  async batchDeactivate(
    jobIds: number[],
    updated_by?: number,
  ): Promise<{
    success: number;
    failed: number;
    errors?: Record<number, string>;
  }> {
    return this.request(`/batch/deactivate`, {
      method: "POST",
      body: JSON.stringify({ jobIds, updated_by }),
      headers: { "Content-Type": "application/json" },
    });
  }

  async batchPause(
    jobIds: number[],
    updated_by?: number,
  ): Promise<{
    success: number;
    failed: number;
    errors?: Record<number, string>;
  }> {
    return this.request(`/batch/pause`, {
      method: "POST",
      body: JSON.stringify({ jobIds, updated_by }),
      headers: { "Content-Type": "application/json" },
    });
  }

  async batchArchive(
    jobIds: number[],
    updated_by?: number,
  ): Promise<{
    success: number;
    failed: number;
    errors?: Record<number, string>;
  }> {
    return this.request(`/batch/archive`, {
      method: "POST",
      body: JSON.stringify({ jobIds, updated_by }),
      headers: { "Content-Type": "application/json" },
    });
  }

  async batchDelete(
    jobIds: number[],
    updated_by?: number,
  ): Promise<{
    success: number;
    failed: number;
    errors?: Record<number, string>;
  }> {
    return this.request(`/batch/delete`, {
      method: "POST",
      body: JSON.stringify({ jobIds, updated_by }),
      headers: { "Content-Type": "application/json" },
    });
  }

  // ==================== Additional Analytics ====================

  async getExecutionStatistics(skipCache?: boolean) {
    const query = this.buildQueryString({ skipCache });
    return this.request(`/analytics/execution-statistics${query}`);
  }

  async getSlaCompliance(skipCache?: boolean) {
    const query = this.buildQueryString({ skipCache });
    return this.request<{
      within_sla: number;
      breached: number;
      breach_rate_percent: number;
    }>(`/analytics/sla-compliance${query}`);
  }

  async getFailureAnalysis(skipCache?: boolean) {
    const query = this.buildQueryString({ skipCache });
    return this.request(`/analytics/failure-analysis${query}`);
  }

  async getMostFailed(limit: number = 10, skipCache?: boolean) {
    const query = this.buildQueryString({ limit, skipCache });
    return this.request(`/analytics/most-failed${query}`);
  }

  async getLongestRunning(limit: number = 10, skipCache?: boolean) {
    const query = this.buildQueryString({ limit, skipCache });
    return this.request(`/analytics/longest-running${query}`);
  }

  async getResourceUtilization(skipCache?: boolean) {
    const query = this.buildQueryString({ skipCache });
    return this.request(`/analytics/resource-utilization${query}`);
  }

  async getHighFailureRate(skipCache?: boolean) {
    const query = this.buildQueryString({ skipCache });
    return this.request(`/analytics/high-failure-rate${query}`);
  }

  // ==================== Additional Lookup Filters ====================

  async getScheduledJobsByOwner(ownerId: number, skipCache?: boolean) {
    const query = this.buildQueryString({ skipCache });
    return this.request<ScheduledJobListResponse>(`/owner/${ownerId}${query}`);
  }

  async getScheduledJobsByTenant(tenantId: number, skipCache?: boolean) {
    const query = this.buildQueryString({ skipCache });
    return this.request<ScheduledJobListResponse>(
      `/tenant/${tenantId}${query}`,
    );
  }

  async getScheduledJobsByScheduleType(
    scheduleType: string,
    skipCache?: boolean,
  ) {
    const query = this.buildQueryString({ skipCache });
    return this.request<ScheduledJobListResponse>(
      `/schedule-type/${encodeURIComponent(scheduleType)}${query}`,
    );
  }

  async getScheduledJobsByTag(tag: string, skipCache?: boolean) {
    const query = this.buildQueryString({ skipCache });
    return this.request<ScheduledJobListResponse>(
      `/tag/${encodeURIComponent(tag)}${query}`,
    );
  }

  async getScheduledJobsByConnectionProfile(
    profileId: number,
    skipCache?: boolean,
  ) {
    const query = this.buildQueryString({ skipCache });
    return this.request<ScheduledJobListResponse>(
      `/connection-profile/${profileId}${query}`,
    );
  }

  // ==================== Health & Monitoring ====================

  async getJobHealth(id: number, skipCache?: boolean) {
    const query = this.buildQueryString({ skipCache });
    const response = await this.request<{
      success: boolean;
      data: {
        health_status: string;
        success_streak: number;
        sla_risk: string;
        dependency_readiness: boolean;
        last_run_status: string | null;
        next_run_at: string | null;
      };
    }>(`/${id}/health${query}`);
    // Handle wrapped response
    if (
      response &&
      typeof response === "object" &&
      "data" in response &&
      "success" in response
    ) {
      return (response as { success: boolean; data: ScheduledJob }).data;
    }
    return response as ScheduledJob;
  }
}

export const scheduledJobService = new ScheduledJobService();
