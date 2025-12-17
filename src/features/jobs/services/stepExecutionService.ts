import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";
import type {
  StepExecution,
  StepExecutionListResponse,
} from "../types/stepExecution";
import type { ExecutionStatistics, SuccessRateResponse, AverageDurationResponse, ErrorAnalysisItem, TrendDataPoint, ExecutionsByHour, PeakTimes, FailurePattern, PerformanceSummary, ExecutionDistribution, StepFailureAnalysis, DurationOutlier, RetryAnalysis, ExecutionTimelineItem, SlowestExecution, ResourceIssue, ExecutionHeatmap, AnomalyDetection, ConcurrentExecutionAnalysis, HealthScoreResponse, ExecutionComparison } from "../types/jobExecution";

const BASE_URL = buildApiUrl("/step-executions");

const clampLimit = (value?: number, max: number = 100) => {
  if (!value && value !== 0) return 50;
  if (value < 1) return 1;
  if (value > max) return max;
  return value;
};

class StepExecutionService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const fullUrl = `${BASE_URL}${endpoint}`;
    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        ...getAuthHeaders(options.body !== undefined),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      let errorMessage = `Step executions API error (${response.status})`;
      try {
        const parsed = JSON.parse(errorBody);
        errorMessage = parsed?.message || parsed?.error || errorMessage;
      } catch {
        if (errorBody) errorMessage = errorBody;
      }
      throw new Error(errorMessage);
    }

    if (response.status === 204) return {} as T;
    return response.json();
  }

  private normalizeExecutionResponse(
    response: StepExecution | { success?: boolean; data?: StepExecution }
  ): StepExecution {
    if (
      response &&
      typeof response === "object" &&
      "data" in response &&
      (response as { data?: StepExecution }).data
    ) {
      return (response as { data: StepExecution }).data;
    }
    return response as StepExecution;
  }

  private normalizeListResponse(
    response:
      | StepExecutionListResponse
      | {
          success?: boolean;
          data?: StepExecution[];
          pagination?: StepExecutionListResponse["pagination"];
          source?: string;
        }
  ): StepExecutionListResponse {
    if (
      response &&
      typeof response === "object" &&
      "data" in response &&
      Array.isArray((response as { data?: StepExecution[] }).data)
    ) {
      return {
        success: (response as { success?: boolean }).success ?? true,
        data: (response as { data?: StepExecution[] }).data,
        pagination: (
          response as { pagination?: StepExecutionListResponse["pagination"] }
        ).pagination,
        source: (response as { source?: string }).source,
      };
    }
    return response as StepExecutionListResponse;
  }

  private buildQueryString(
    params?: Record<string, string | number | boolean | undefined | null>
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

  // ==================== GET Endpoints - Single Record Reads ====================

  /**
   * Get Step Execution by ID
   * GET /step-executions/:id
   */
  async getStepExecutionById(
    id: string,
    skipCache?: boolean
  ): Promise<StepExecution> {
    const query = this.buildQueryString({ skipCache });
    const response = await this.request<
      StepExecution | { success?: boolean; data?: StepExecution }
    >(`/${id}${query}`);
    return this.normalizeExecutionResponse(response);
  }

  // ==================== GET Endpoints - Multiple Record Queries ====================

  /**
   * Get Step Executions by Job Execution ID
   * GET /step-executions/job-executions/:jobExecutionId
   */
  async getStepExecutionsByJobExecution(
    jobExecutionId: string,
    params?: {
      limit?: number;
      offset?: number;
      skipCache?: boolean;
    }
  ): Promise<StepExecutionListResponse> {
    const query = this.buildQueryString({
      limit: clampLimit(params?.limit),
      offset: params?.offset ?? 0,
      skipCache: params?.skipCache ?? false,
    });
    const response = await this.request<
      | StepExecutionListResponse
      | {
          success?: boolean;
          data?: StepExecution[];
          pagination?: StepExecutionListResponse["pagination"];
          source?: string;
        }
    >(`/job-executions/${jobExecutionId}${query}`);
    return this.normalizeListResponse(response);
  }

  /**
   * Get Step Executions by Step ID
   * GET /step-executions/steps/:stepId
   */
  async getStepExecutionsByStepId(
    stepId: number,
    params?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<StepExecutionListResponse> {
    const query = this.buildQueryString({
      limit: clampLimit(params?.limit),
      offset: params?.offset ?? 0,
    });
    const response = await this.request<
      | StepExecutionListResponse
      | {
          success?: boolean;
          data?: StepExecution[];
          pagination?: StepExecutionListResponse["pagination"];
          source?: string;
        }
    >(`/steps/${stepId}${query}`);
    return this.normalizeListResponse(response);
  }

  /**
   * Get Step Executions by Status
   * GET /step-executions/status/:status
   */
  async getStepExecutionsByStatus(
    status: string,
    params?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<StepExecutionListResponse> {
    const query = this.buildQueryString({
      limit: clampLimit(params?.limit),
      offset: params?.offset ?? 0,
    });
    const response = await this.request<
      | StepExecutionListResponse
      | {
          success?: boolean;
          data?: StepExecution[];
          pagination?: StepExecutionListResponse["pagination"];
          source?: string;
        }
    >(`/status/${encodeURIComponent(status)}${query}`);
    return this.normalizeListResponse(response);
  }

  /**
   * Get Failed Step Executions
   * GET /step-executions/failed
   */
  async getFailedStepExecutions(params?: {
    jobExecutionId?: string;
    stepId?: number;
  }): Promise<StepExecutionListResponse> {
    const query = this.buildQueryString({
      jobExecutionId: params?.jobExecutionId,
      stepId: params?.stepId,
    });
    const response = await this.request<
      | StepExecutionListResponse
      | {
          success?: boolean;
          data?: StepExecution[];
          pagination?: StepExecutionListResponse["pagination"];
          source?: string;
        }
    >(`/failed${query}`);
    return this.normalizeListResponse(response);
  }

  /**
   * Get Active Step Executions
   * GET /step-executions/active
   */
  async getActiveStepExecutions(): Promise<StepExecutionListResponse> {
    const query = "";
    const response = await this.request<
      | StepExecutionListResponse
      | {
          success?: boolean;
          data?: StepExecution[];
          pagination?: StepExecutionListResponse["pagination"];
          source?: string;
        }
    >(`/active${query}`);
    return this.normalizeListResponse(response);
  }

  /**
   * Search Step Executions
   * POST /step-executions/search
   */
  async searchStepExecutions(body: {
    filters?: {
      job_execution_id?: string;
      step_id?: number;
      execution_status?: string;
      started_at_min?: string;
      started_at_max?: string;
    };
    limit?: number;
    offset?: number;
    skipCache?: boolean;
  }): Promise<StepExecutionListResponse> {
    const response = await this.request<
      | StepExecutionListResponse
      | {
          success?: boolean;
          data?: StepExecution[];
          pagination?: StepExecutionListResponse["pagination"];
          source?: string;
        }
    >(`/search`, {
      method: "POST",
      body: JSON.stringify({
        ...body,
        limit: clampLimit(body.limit, 1000),
      }),
      headers: { "Content-Type": "application/json" },
    });
    return this.normalizeListResponse(response);
  }

  // ==================== POST Endpoints ====================

  /**
   * Create Step Execution
   * POST /step-executions
   */
  async createStepExecution(payload: {
    job_execution_id: string;
    step_id: number;
    execution_status?: string;
    started_at?: string;
  }): Promise<StepExecution> {
    const response = await this.request<
      StepExecution | { success?: boolean; data?: StepExecution }
    >("/", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
    return this.normalizeExecutionResponse(response);
  }

  /**
   * Retry Failed Step Executions
   * POST /step-executions/retry-failed
   */
  async retryFailedSteps(payload: {
    job_execution_id: string;
    step_ids?: number[];
    userId?: number;
  }): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/retry-failed`, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
  }

  // ==================== PUT Endpoints ====================

  /**
   * Update Step Execution
   * PUT /step-executions/:id
   */
  async updateStepExecution(
    id: string,
    payload: Partial<StepExecution>
  ): Promise<StepExecution> {
    const response = await this.request<
      StepExecution | { success?: boolean; data?: StepExecution }
    >(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
    return this.normalizeExecutionResponse(response);
  }

  // ==================== PATCH Endpoints ====================

  /**
   * Update Step Execution Status
   * PATCH /step-executions/:id/status
   */
  async updateStepExecutionStatus(
    id: string,
    execution_status: string
  ): Promise<StepExecution> {
    const response = await this.request<
      StepExecution | { success?: boolean; data?: StepExecution }
    >(`/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ execution_status }),
    });
    return this.normalizeExecutionResponse(response);
  }

  /**
   * Mark Step Execution Started
   * PATCH /step-executions/:id/start
   */
  async markStepExecutionStarted(id: string): Promise<StepExecution> {
    const response = await this.request<
      StepExecution | { success?: boolean; data?: StepExecution }
    >(`/${id}/start`, {
      method: "PATCH",
    });
    return this.normalizeExecutionResponse(response);
  }

  /**
   * Mark Step Execution Completed
   * PATCH /step-executions/:id/complete
   */
  async markStepExecutionCompleted(id: string): Promise<StepExecution> {
    const response = await this.request<
      StepExecution | { success?: boolean; data?: StepExecution }
    >(`/${id}/complete`, {
      method: "PATCH",
    });
    return this.normalizeExecutionResponse(response);
  }

  /**
   * Mark Step Execution Failed
   * PATCH /step-executions/:id/fail
   */
  async markStepExecutionFailed(
    id: string,
    payload?: { error_message?: string; error_code?: string }
  ): Promise<StepExecution> {
    const response = await this.request<
      StepExecution | { success?: boolean; data?: StepExecution }
    >(`/${id}/fail`, {
      method: "PATCH",
      body: JSON.stringify(payload || {}),
      headers: { "Content-Type": "application/json" },
    });
    return this.normalizeExecutionResponse(response);
  }

  /**
   * Mark Step Execution Aborted
   * PATCH /step-executions/:id/abort
   */
  async markStepExecutionAborted(id: string): Promise<StepExecution> {
    const response = await this.request<
      StepExecution | { success?: boolean; data?: StepExecution }
    >(`/${id}/abort`, {
      method: "PATCH",
    });
    return this.normalizeExecutionResponse(response);
  }

  /**
   * Mark Step Execution Timeout
   * PATCH /step-executions/:id/timeout
   */
  async markStepExecutionTimeout(id: string): Promise<StepExecution> {
    const response = await this.request<
      StepExecution | { success?: boolean; data?: StepExecution }
    >(`/${id}/timeout`, {
      method: "PATCH",
    });
    return this.normalizeExecutionResponse(response);
  }

  // ==================== GET Endpoints - Additional Queries ====================

  /**
   * Get Step Executions by Date Range
   * GET /step-executions/date-range
   */
  async getStepExecutionsByDateRange(params: {
    startDate: string;
    endDate: string;
    jobExecutionId?: string;
    stepId?: number;
    limit?: number;
    offset?: number;
  }): Promise<StepExecutionListResponse> {
    const query = this.buildQueryString({
      startDate: params.startDate,
      endDate: params.endDate,
      jobExecutionId: params.jobExecutionId,
      stepId: params.stepId,
      limit: clampLimit(params.limit),
      offset: params.offset ?? 0,
    });
    const response = await this.request<
      | StepExecutionListResponse
      | {
          success?: boolean;
          data?: StepExecution[];
          pagination?: StepExecutionListResponse["pagination"];
          source?: string;
        }
    >(`/date-range${query}`);
    return this.normalizeListResponse(response);
  }

  /**
   * Get Queued Step Executions
   * GET /step-executions/queued
   */
  async getQueuedStepExecutions(params?: {
    limit?: number;
    offset?: number;
  }): Promise<StepExecutionListResponse> {
    const query = this.buildQueryString({
      limit: clampLimit(params?.limit),
      offset: params?.offset ?? 0,
    });
    const response = await this.request<
      | StepExecutionListResponse
      | {
          success?: boolean;
          data?: StepExecution[];
          pagination?: StepExecutionListResponse["pagination"];
          source?: string;
        }
    >(`/queued${query}`);
    return this.normalizeListResponse(response);
  }

  /**
   * Get Pending Step Executions
   * GET /step-executions/pending
   */
  async getPendingStepExecutions(params?: {
    limit?: number;
    offset?: number;
  }): Promise<StepExecutionListResponse> {
    const query = this.buildQueryString({
      limit: clampLimit(params?.limit),
      offset: params?.offset ?? 0,
    });
    const response = await this.request<
      | StepExecutionListResponse
      | {
          success?: boolean;
          data?: StepExecution[];
          pagination?: StepExecutionListResponse["pagination"];
          source?: string;
        }
    >(`/pending${query}`);
    return this.normalizeListResponse(response);
  }

  /**
   * Get Step Execution History
   * GET /step-executions/steps/:stepId/history
   */
  async getStepExecutionHistory(
    stepId: number,
    params?: {
      limit?: number;
    }
  ): Promise<StepExecutionListResponse> {
    const query = this.buildQueryString({
      limit: clampLimit(params?.limit),
    });
    const response = await this.request<
      | StepExecutionListResponse
      | {
          success?: boolean;
          data?: StepExecution[];
          pagination?: StepExecutionListResponse["pagination"];
          source?: string;
        }
    >(`/steps/${stepId}/history${query}`);
    return this.normalizeListResponse(response);
  }

  /**
   * Get Currently Running Step Executions
   * GET /step-executions/currently-running
   */
  async getCurrentlyRunningStepExecutions(): Promise<StepExecutionListResponse> {
    const response = await this.request<
      | StepExecutionListResponse
      | {
          success?: boolean;
          data?: StepExecution[];
          pagination?: StepExecutionListResponse["pagination"];
          source?: string;
        }
    >(`/currently-running`);
    return this.normalizeListResponse(response);
  }

  /**
   * Get Long Running Step Executions
   * GET /step-executions/long-running
   */
  async getLongRunningStepExecutions(params?: {
    thresholdMinutes?: number;
  }): Promise<StepExecutionListResponse> {
    const query = this.buildQueryString({
      thresholdMinutes: params?.thresholdMinutes ?? 60,
    });
    const response = await this.request<
      | StepExecutionListResponse
      | {
          success?: boolean;
          data?: StepExecution[];
          pagination?: StepExecutionListResponse["pagination"];
          source?: string;
        }
    >(`/long-running${query}`);
    return this.normalizeListResponse(response);
  }

  // ==================== GET Endpoints - Monitoring Operations ====================

  /**
   * Get Running Duration
   * GET /step-executions/:id/running-duration
   */
  async getRunningDuration(id: string): Promise<{ duration_seconds: number }> {
    return this.request<{ duration_seconds: number }>(
      `/${id}/running-duration`
    );
  }

  /**
   * Check if Step Execution is Timed Out
   * GET /step-executions/:id/is-timed-out
   */
  async isStepExecutionTimedOut(
    id: string
  ): Promise<{ is_timed_out: boolean }> {
    return this.request<{ is_timed_out: boolean }>(`/${id}/is-timed-out`);
  }

  /**
   * Get Step Execution Progress
   * GET /step-executions/:id/progress
   */
  async getStepExecutionProgress(id: string): Promise<{
    percentage_complete?: number;
    estimated_completion?: string;
  }> {
    return this.request<{
      percentage_complete?: number;
      estimated_completion?: string;
    }>(`/${id}/progress`);
  }

  /**
   * Get Resource Usage
   * GET /step-executions/:id/resource-usage
   */
  async getResourceUsage(id: string): Promise<{
    peak_memory_mb?: number;
    peak_cpu_percent?: number;
  }> {
    return this.request<{
      peak_memory_mb?: number;
      peak_cpu_percent?: number;
    }>(`/${id}/resource-usage`);
  }

  // ==================== GET Endpoints - Analytics & Reporting ====================

  /**
   * Get Step Execution Statistics
   * GET /step-executions/stats
   */
  async getStepExecutionStatistics(params?: {
    stepId?: number;
    jobExecutionId?: string;
    startDate?: string;
    endDate?: string;
    skipCache?: boolean;
  }): Promise<ExecutionStatistics> {
    const query = this.buildQueryString({
      stepId: params?.stepId,
      jobExecutionId: params?.jobExecutionId,
      startDate: params?.startDate,
      endDate: params?.endDate,
      skipCache: params?.skipCache ?? false,
    });
    return this.request<ExecutionStatistics>(`/stats${query}`);
  }

  /**
   * Get Success Rate
   * GET /step-executions/success-rate
   */
  async getSuccessRate(params?: {
    stepId?: number;
    skipCache?: boolean;
    // daysBack?: number; // Not supported by backend
  }): Promise<SuccessRateResponse> {
    const query = this.buildQueryString({
      stepId: params?.stepId,
      skipCache: params?.skipCache ?? true,
      // daysBack: params?.daysBack ?? 30, // Commented out - not allowed by backend
    });
    return this.request<SuccessRateResponse>(`/success-rate${query}`);
  }

  /**
   * Get Average Duration
   * GET /step-executions/average-duration
   */
  async getAverageDuration(params?: {
    stepId?: number;
    skipCache?: boolean;
    // daysBack?: number; // Not supported by backend
  }): Promise<AverageDurationResponse> {
    const query = this.buildQueryString({
      stepId: params?.stepId,
      skipCache: params?.skipCache ?? true,
      // daysBack: params?.daysBack ?? 30, // Commented out - not allowed by backend
    });
    return this.request<AverageDurationResponse>(`/average-duration${query}`);
  }

  /**
   * Get Error Analysis
   * GET /step-executions/error-analysis
   */
  async getErrorAnalysis(params?: {
    // daysBack?: number; // Not supported by backend
    stepId?: number;
  }): Promise<ErrorAnalysisItem[]> {
    const query = this.buildQueryString({
      // daysBack: params?.daysBack ?? 30, // Commented out - not allowed by backend
      stepId: params?.stepId,
    });
    return this.request<ErrorAnalysisItem[]>(`/error-analysis${query}`);
  }

  /**
   * Get Trend Data
   * GET /step-executions/trend-data
   */
  async getTrendData(params?: {
    stepId?: number;
    // daysBack?: number; // Not supported by backend
  }): Promise<TrendDataPoint[]> {
    const query = this.buildQueryString({
      stepId: params?.stepId,
      // daysBack: params?.daysBack ?? 30, // Commented out - not allowed by backend
    });
    return this.request<TrendDataPoint[]>(`/trend-data${query}`);
  }

  /**
   * Get Executions by Hour
   * GET /step-executions/by-hour
   */
  async getStepExecutionsByHour(params?: {
    stepId?: number;
    date?: string;
  }): Promise<ExecutionsByHour[]> {
    const query = this.buildQueryString({
      stepId: params?.stepId,
      date: params?.date,
    });
    return this.request<ExecutionsByHour[]>(`/by-hour${query}`);
  }

  /**
   * Get Peak Execution Times
   * GET /step-executions/peak-times
   */
  async getPeakExecutionTimes(params?: { stepId?: number }): Promise<PeakTimes[]> {
    const query = this.buildQueryString({
      stepId: params?.stepId,
    });
    return this.request<PeakTimes[]>(`/peak-times${query}`);
  }

  /**
   * Get Failure Patterns
   * GET /step-executions/failure-patterns
   */
  async getFailurePatterns(): Promise<FailurePattern[]> {
    return this.request<FailurePattern[]>(`/failure-patterns`);
  }

  /**
   * Get Performance Summary
   * GET /step-executions/performance-summary
   */
  async getPerformanceSummary(params?: {
    stepId?: number;
    // daysBack?: number; // Not supported by backend
  }): Promise<PerformanceSummary> {
    const query = this.buildQueryString({
      stepId: params?.stepId,
      // daysBack: params?.daysBack ?? 30, // Commented out - not allowed by backend
    });
    return this.request<PerformanceSummary>(`/performance-summary${query}`);
  }

  /**
   * Get Execution Distribution
   * GET /step-executions/execution-distribution
   */
  async getExecutionDistribution(): Promise<ExecutionDistribution[]> {
    return this.request<ExecutionDistribution[]>(`/execution-distribution`);
  }

  /**
   * Get Step Failure Analysis
   * GET /step-executions/step-failure-analysis
   */
  async getStepFailureAnalysis(params?: {
    stepId?: number;
    // daysBack?: number; // Not supported by backend
  }): Promise<StepFailureAnalysis[]> {
    const query = this.buildQueryString({
      stepId: params?.stepId,
      // daysBack: params?.daysBack ?? 30, // Commented out - not allowed by backend
    });
    return this.request<StepFailureAnalysis[]>(`/step-failure-analysis${query}`);
  }

  /**
   * Get Duration Outliers
   * GET /step-executions/duration-outliers
   */
  async getDurationOutliers(params?: {
    stepId?: number;
    // daysBack?: number; // Not supported by backend
  }): Promise<DurationOutlier[]> {
    const query = this.buildQueryString({
      stepId: params?.stepId,
      // daysBack: params?.daysBack ?? 30, // Commented out - not allowed by backend
    });
    return this.request<DurationOutlier[]>(`/duration-outliers${query}`);
  }

  /**
   * Get Retry Analysis
   * GET /step-executions/retry-analysis
   */
  async getRetryAnalysis(params?: {
    stepId?: number;
    // daysBack?: number; // Not supported by backend
  }): Promise<RetryAnalysis> {
    const query = this.buildQueryString({
      stepId: params?.stepId,
      // daysBack: params?.daysBack ?? 14, // Commented out - not allowed by backend
    });
    return this.request<RetryAnalysis>(`/retry-analysis${query}`);
  }

  /**
   * Get Execution Timeline
   * GET /step-executions/steps/:stepId/timeline
   */
  async getExecutionTimeline(
    stepId: number,
    params?: {
      limit?: number;
    }
  ): Promise<ExecutionTimelineItem[]> {
    const query = this.buildQueryString({
      limit: clampLimit(params?.limit),
    });
    return this.request<ExecutionTimelineItem[]>(`/steps/${stepId}/timeline${query}`);
  }

  /**
   * Get Slowest Step Executions
   * GET /step-executions/slowest
   */
  async getSlowestStepExecutions(params?: {
    limit?: number;
    // daysBack?: number; // Not supported by backend
  }): Promise<SlowestExecution[]> {
    const query = this.buildQueryString({
      limit: clampLimit(params?.limit, 100),
      // daysBack: params?.daysBack ?? 30, // Commented out - not allowed by backend
    });
    return this.request<SlowestExecution[]>(`/slowest${query}`);
  }

  /**
   * Get Step Executions with Resource Issues
   * GET /step-executions/resource-issues
   */
  async getStepExecutionsWithResourceIssues(params?: {
    limit?: number;
  }): Promise<ResourceIssue[]> {
    const query = this.buildQueryString({
      limit: clampLimit(params?.limit, 100),
    });
    return this.request<ResourceIssue[]>(`/resource-issues${query}`);
  }

  /**
   * Get Execution Comparison
   * GET /step-executions/steps/:stepId/comparison
   */
  async getExecutionComparison(
    stepId: number,
    params?: {
      currentPeriodDays?: number;
    }
  ): Promise<ExecutionComparison> {
    const query = this.buildQueryString({
      currentPeriodDays: params?.currentPeriodDays ?? 7,
    });
    return this.request<ExecutionComparison>(`/steps/${stepId}/comparison${query}`);
  }

  /**
   * Get Execution Heatmap
   * GET /step-executions/steps/:stepId/heatmap
   */
  async getExecutionHeatmap(stepId: number): Promise<ExecutionHeatmap> {
    return this.request<ExecutionHeatmap>(`/steps/${stepId}/heatmap`);
  }

  /**
   * Get Anomaly Detection
   * GET /step-executions/anomaly-detection
   */
  async getAnomalyDetection(): Promise<AnomalyDetection> {
    return this.request<AnomalyDetection>(`/anomaly-detection`);
  }

  /**
   * Get Concurrent Execution Analysis
   * GET /step-executions/concurrent-analysis
   */
  async getConcurrentExecutionAnalysis(): Promise<ConcurrentExecutionAnalysis> {
    return this.request<ConcurrentExecutionAnalysis>(`/concurrent-analysis`);
  }

  /**
   * Get Execution Health Score
   * GET /step-executions/health-score
   */
  async getExecutionHealthScore(params?: { stepId?: number }): Promise<HealthScoreResponse> {
    const query = this.buildQueryString({
      stepId: params?.stepId,
    });
    return this.request<HealthScoreResponse>(`/health-score${query}`);
  }

  // ==================== DELETE Endpoints ====================

  /**
   * Cleanup Old Step Executions
   * DELETE /step-executions/cleanup-old
   */
  async cleanupOldStepExecutions(params?: {
    olderThanDays?: number;
  }): Promise<{ success: boolean }> {
    const query = this.buildQueryString({
      olderThanDays: params?.olderThanDays ?? 365,
    });
    return this.request<{ success: boolean }>(`/cleanup-old${query}`, {
      method: "DELETE",
    });
  }
}

export const stepExecutionService = new StepExecutionService();
