import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";
import {
  JobExecution,
  JobExecutionListResponse,
  JobExecutionSearchParams,
  BulkArchivePayload,
  ArchiveOldPayload,
  RetryFailedPayload,
  CreateJobExecutionPayload,
  UpdateJobExecutionPayload,
  UpdateStatusPayload,
  StartExecutionPayload,
  CompleteExecutionPayload,
  FailExecutionPayload,
  AbortExecutionPayload,
  RecordMetricsPayload,
  ExecutionStatistics,
  SuccessRateResponse,
  AverageDurationResponse,
  SLAComplianceResponse,
  ResourceUtilizationStats,
  ErrorAnalysisItem,
  TrendDataPoint,
  ExecutionByHour,
  ExecutionByTrigger,
  DataQualityMetrics,
  FailurePattern,
  PerformanceSummary,
  ExecutionDistribution,
  DailySummary,
  WorkerNodeStats,
  ServerInstanceStats,
  StepFailureAnalysis,
  DurationOutlier,
  RetryAnalysis,
  ExecutionTimelineItem,
  ConcurrentExecutionAnalysis,
  HealthScoreResponse,
  SlowestExecution,
  ResourceIssue,
  ExecutionComparison,
  CompletionForecast,
  ExecutionHeatmap,
  SLAPrediction,
  AnomalyDetection,
  RunningDurationResponse,
  IsTimedOutResponse,
  ExecutionProgress,
  ResourceUsage,
  PartitionInfo,
} from "../types/jobExecution";

const BASE_URL = buildApiUrl("/job-executions");

const clampLimit = (value?: number, max: number = 100) => {
  if (!value && value !== 0) return 50;
  if (value < 1) return 1;
  if (value > max) return max;
  return value;
};

class JobExecutionService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const fullUrl = `${BASE_URL}${endpoint}`;
    const isPostOrPut =
      options.method === "POST" ||
      options.method === "PUT" ||
      options.method === "PATCH";

    if (isPostOrPut && options.body) {
      console.log("🔵 JOB EXECUTION SERVICE - Request Details:");
      console.log("Full URL:", fullUrl);
      console.log("Method:", options.method);
      console.log("Body (raw):", options.body);
      try {
        const parsedBody = JSON.parse(options.body as string);
        console.log("Body (parsed):", JSON.stringify(parsedBody, null, 2));
        console.log("Has userId:", "userId" in parsedBody);
        console.log("userId value:", parsedBody.userId);
        console.log("Has job_id:", "job_id" in parsedBody);
        console.log("job_id value:", parsedBody.job_id);
      } catch (e) {
        console.log("Could not parse body:", e);
      }
    }

    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        ...getAuthHeaders(options.body !== undefined),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      let errorMessage = `Job executions API error (${response.status})`;
      try {
        const parsed = JSON.parse(errorBody);
        errorMessage = parsed?.message || parsed?.error || errorMessage;
        console.error("🔴 JOB EXECUTION SERVICE - Error Response:");
        console.error("Status:", response.status);
        console.error("Error body (parsed):", parsed);
        console.error("Error message:", errorMessage);
      } catch {
        if (errorBody) {
          errorMessage = errorBody;
          console.error("🔴 JOB EXECUTION SERVICE - Error Response:");
          console.error("Status:", response.status);
          console.error("Error body (raw):", errorBody);
        }
      }
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  private normalizeExecutionResponse(
    response:
      | JobExecution
      | {
          success?: boolean;
          data?: JobExecution;
        }
  ): JobExecution {
    if (
      response &&
      typeof response === "object" &&
      "data" in response &&
      (response as { data?: JobExecution }).data
    ) {
      return (response as { data: JobExecution }).data;
    }
    return response as JobExecution;
  }

  private normalizeListResponse(
    response:
      | JobExecutionListResponse
      | {
          success?: boolean;
          data?: JobExecution[];
          pagination?: JobExecutionListResponse["pagination"];
          source?: string;
        }
  ): JobExecutionListResponse {
    if (
      response &&
      typeof response === "object" &&
      "data" in response &&
      Array.isArray((response as { data?: JobExecution[] }).data)
    ) {
      return {
        success: (response as { success?: boolean }).success ?? true,
        data: (response as { data: JobExecution[] }).data,
        pagination: (
          response as { pagination?: JobExecutionListResponse["pagination"] }
        ).pagination,
        source: (response as { source?: string }).source,
      };
    }
    return response as JobExecutionListResponse;
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
   * Get Job Execution by ID
   * GET /job-executions/:id
   */
  async getJobExecutionById(
    id: string,
    skipCache?: boolean
  ): Promise<JobExecution> {
    const query = this.buildQueryString({ skipCache });
    const response = await this.request<
      JobExecution | { success?: boolean; data?: JobExecution }
    >(`/${id}${query}`);
    return this.normalizeExecutionResponse(response);
  }

  /**
   * Get Job Execution by Trace ID
   * GET /job-executions/trace/:traceId
   */
  async getJobExecutionByTraceId(
    traceId: string,
    skipCache?: boolean
  ): Promise<JobExecution> {
    const query = this.buildQueryString({ skipCache });
    const response = await this.request<
      JobExecution | { success?: boolean; data?: JobExecution }
    >(`/trace/${encodeURIComponent(traceId)}${query}`);
    return this.normalizeExecutionResponse(response);
  }

  /**
   * Get Latest Execution for a Job
   * GET /job-executions/jobs/:jobId/latest
   */
  async getLatestExecutionForJob(
    jobId: number,
    skipCache?: boolean
  ): Promise<JobExecution> {
    const query = this.buildQueryString({ skipCache });
    const response = await this.request<
      JobExecution | { success?: boolean; data?: JobExecution }
    >(`/jobs/${jobId}/latest${query}`);
    return this.normalizeExecutionResponse(response);
  }

  // ==================== GET Endpoints - Multiple Record Queries ====================

  /**
   * Get Executions by Job ID
   * GET /job-executions/jobs/:jobId
   */
  async getExecutionsByJobId(
    jobId: number,
    params?: {
      limit?: number;
      offset?: number;
      skipCache?: boolean;
    }
  ): Promise<JobExecutionListResponse> {
    const query = this.buildQueryString({
      limit: clampLimit(params?.limit),
      offset: params?.offset ?? 0,
      skipCache: params?.skipCache ?? false,
    });
    const response = await this.request<
      | JobExecutionListResponse
      | {
          success?: boolean;
          data?: JobExecution[];
          pagination?: JobExecutionListResponse["pagination"];
          source?: string;
        }
    >(`/jobs/${jobId}${query}`);
    return this.normalizeListResponse(response);
  }

  /**
   * Get Executions by Status
   * GET /job-executions/status/:status
   */
  async getExecutionsByStatus(
    status: string,
    params?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<JobExecutionListResponse> {
    const query = this.buildQueryString({
      limit: clampLimit(params?.limit),
      offset: params?.offset ?? 0,
    });
    const response = await this.request<
      | JobExecutionListResponse
      | {
          success?: boolean;
          data?: JobExecution[];
          pagination?: JobExecutionListResponse["pagination"];
          source?: string;
        }
    >(`/status/${encodeURIComponent(status)}${query}`);
    return this.normalizeListResponse(response);
  }

  /**
   * Get Executions by Date Range
   * GET /job-executions/date-range
   */
  async getExecutionsByDateRange(params: {
    startDate: string; // ISO format: YYYY-MM-DD
    endDate: string; // ISO format: YYYY-MM-DD
    jobId?: number;
    limit?: number;
    offset?: number;
  }): Promise<JobExecutionListResponse> {
    const query = this.buildQueryString({
      startDate: params.startDate,
      endDate: params.endDate,
      jobId: params.jobId,
      limit: clampLimit(params.limit),
      offset: params.offset ?? 0,
    });
    const response = await this.request<
      | JobExecutionListResponse
      | {
          success?: boolean;
          data?: JobExecution[];
          pagination?: JobExecutionListResponse["pagination"];
          source?: string;
        }
    >(`/date-range${query}`);
    return this.normalizeListResponse(response);
  }

  /**
   * Get Executions by Correlation ID
   * GET /job-executions/correlation/:correlationId
   */
  async getExecutionsByCorrelationId(
    correlationId: string
  ): Promise<JobExecutionListResponse> {
    const response = await this.request<
      | JobExecutionListResponse
      | {
          success?: boolean;
          data?: JobExecution[];
          pagination?: JobExecutionListResponse["pagination"];
          source?: string;
        }
    >(`/correlation/${encodeURIComponent(correlationId)}`);
    return this.normalizeListResponse(response);
  }

  /**
   * Get Failed Executions
   * GET /job-executions/failed
   */
  async getFailedExecutions(params?: {
    jobId?: number;
    daysBack?: number;
    limit?: number;
    offset?: number;
  }): Promise<JobExecutionListResponse> {
    const query = this.buildQueryString({
      jobId: params?.jobId,
      daysBack: params?.daysBack ?? 7,
      limit: clampLimit(params?.limit),
      offset: params?.offset ?? 0,
    });
    const response = await this.request<
      | JobExecutionListResponse
      | {
          success?: boolean;
          data?: JobExecution[];
          pagination?: JobExecutionListResponse["pagination"];
          source?: string;
        }
    >(`/failed${query}`);
    return this.normalizeListResponse(response);
  }

  /**
   * Get SLA Breached Executions
   * GET /job-executions/sla-breached
   */
  async getSLABreachedExecutions(params?: {
    jobId?: number;
    daysBack?: number;
    limit?: number;
    offset?: number;
  }): Promise<JobExecutionListResponse> {
    const query = this.buildQueryString({
      jobId: params?.jobId,
      daysBack: params?.daysBack ?? 7,
      limit: clampLimit(params?.limit),
      offset: params?.offset ?? 0,
    });
    const response = await this.request<
      | JobExecutionListResponse
      | {
          success?: boolean;
          data?: JobExecution[];
          pagination?: JobExecutionListResponse["pagination"];
          source?: string;
        }
    >(`/sla-breached${query}`);
    return this.normalizeListResponse(response);
  }

  /**
   * Get Active Executions
   * GET /job-executions/active
   */
  async getActiveExecutions(params?: {
    limit?: number;
    offset?: number;
  }): Promise<JobExecutionListResponse> {
    const query = this.buildQueryString({
      limit: clampLimit(params?.limit),
      offset: params?.offset ?? 0,
    });
    const response = await this.request<
      | JobExecutionListResponse
      | {
          success?: boolean;
          data?: JobExecution[];
          pagination?: JobExecutionListResponse["pagination"];
          source?: string;
        }
    >(`/active${query}`);
    return this.normalizeListResponse(response);
  }

  /**
   * Get Queued Executions
   * GET /job-executions/queued
   */
  async getQueuedExecutions(params?: {
    limit?: number;
    offset?: number;
  }): Promise<JobExecutionListResponse> {
    const query = this.buildQueryString({
      limit: clampLimit(params?.limit),
      offset: params?.offset ?? 0,
    });
    const response = await this.request<
      | JobExecutionListResponse
      | {
          success?: boolean;
          data?: JobExecution[];
          pagination?: JobExecutionListResponse["pagination"];
          source?: string;
        }
    >(`/queued${query}`);
    return this.normalizeListResponse(response);
  }

  /**
   * Search Job Executions
   * POST /job-executions/search
   */
  async searchJobExecutions(
    params: JobExecutionSearchParams
  ): Promise<JobExecutionListResponse> {
    const response = await this.request<
      | JobExecutionListResponse
      | {
          success?: boolean;
          data?: JobExecution[];
          pagination?: JobExecutionListResponse["pagination"];
          source?: string;
        }
    >(`/search`, {
      method: "POST",
      body: JSON.stringify({
        ...params,
        limit: clampLimit(params.limit, 1000),
      }),
      headers: { "Content-Type": "application/json" },
    });
    return this.normalizeListResponse(response);
  }

  /**
   * Get Job Execution History
   * GET /job-executions/jobs/:jobId/history
   */
  async getJobExecutionHistory(
    jobId: number,
    params?: {
      limit?: number;
    }
  ): Promise<JobExecutionListResponse> {
    const query = this.buildQueryString({
      limit: clampLimit(params?.limit),
    });
    const response = await this.request<
      | JobExecutionListResponse
      | {
          success?: boolean;
          data?: JobExecution[];
          pagination?: JobExecutionListResponse["pagination"];
          source?: string;
        }
    >(`/jobs/${jobId}/history${query}`);
    return this.normalizeListResponse(response);
  }

  // ==================== GET Endpoints - Monitoring Operations ====================

  /**
   * Get Running Duration
   * GET /job-executions/:id/running-duration
   */
  async getRunningDuration(id: string): Promise<RunningDurationResponse> {
    return this.request<RunningDurationResponse>(`/${id}/running-duration`);
  }

  /**
   * Check if Execution is Timed Out
   * GET /job-executions/:id/is-timed-out
   */
  async isExecutionTimedOut(id: string): Promise<IsTimedOutResponse> {
    return this.request<IsTimedOutResponse>(`/${id}/is-timed-out`);
  }

  /**
   * Get Execution Progress
   * GET /job-executions/:id/progress
   */
  async getExecutionProgress(id: string): Promise<ExecutionProgress> {
    return this.request<ExecutionProgress>(`/${id}/progress`);
  }

  /**
   * Get Resource Usage
   * GET /job-executions/:id/resource-usage
   */
  async getResourceUsage(id: string): Promise<ResourceUsage> {
    return this.request<ResourceUsage>(`/${id}/resource-usage`);
  }

  /**
   * Get Currently Running Executions
   * GET /job-executions/currently-running
   */
  async getCurrentlyRunningExecutions(): Promise<JobExecutionListResponse> {
    const response = await this.request<
      | JobExecutionListResponse
      | {
          success?: boolean;
          data?: JobExecution[];
          pagination?: JobExecutionListResponse["pagination"];
          source?: string;
        }
    >(`/currently-running`);
    return this.normalizeListResponse(response);
  }

  /**
   * Get Long Running Executions
   * GET /job-executions/long-running
   */
  async getLongRunningExecutions(params?: {
    thresholdMinutes?: number;
  }): Promise<JobExecutionListResponse> {
    const query = this.buildQueryString({
      thresholdMinutes: params?.thresholdMinutes ?? 60,
    });
    const response = await this.request<
      | JobExecutionListResponse
      | {
          success?: boolean;
          data?: JobExecution[];
          pagination?: JobExecutionListResponse["pagination"];
          source?: string;
        }
    >(`/long-running${query}`);
    return this.normalizeListResponse(response);
  }

  // ==================== GET Endpoints - System Information ====================

  /**
   * Get Partition Information
   * GET /job-executions/partitions
   */
  async getPartitionInformation(): Promise<PartitionInfo[]> {
    return this.request<PartitionInfo[]>(`/partitions`);
  }

  /**
   * Get Executions Pending Cleanup
   * GET /job-executions/pending-cleanup
   */
  async getExecutionsPendingCleanup(params?: {
    retentionDays?: number;
  }): Promise<JobExecutionListResponse> {
    const query = this.buildQueryString({
      retentionDays: params?.retentionDays ?? 365,
    });
    const response = await this.request<
      | JobExecutionListResponse
      | {
          success?: boolean;
          data?: JobExecution[];
          pagination?: JobExecutionListResponse["pagination"];
          source?: string;
        }
    >(`/pending-cleanup${query}`);
    return this.normalizeListResponse(response);
  }

  // ==================== GET Endpoints - Analytics & Reporting ====================

  /**
   * Get Execution Statistics
   * GET /job-executions/stats
   */
  async getExecutionStatistics(params?: {
    jobId?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<ExecutionStatistics> {
    const query = this.buildQueryString({
      jobId: params?.jobId,
      startDate: params?.startDate,
      endDate: params?.endDate,
    });
    return this.request<ExecutionStatistics>(`/stats${query}`);
  }

  /**
   * Get Success Rate
   * GET /job-executions/success-rate
   */
  async getSuccessRate(params?: {
    jobId?: number;
    daysBack?: number;
  }): Promise<SuccessRateResponse> {
    const query = this.buildQueryString({
      jobId: params?.jobId,
      daysBack: params?.daysBack ?? 30,
    });
    return this.request<SuccessRateResponse>(`/success-rate${query}`);
  }

  /**
   * Get Average Duration
   * GET /job-executions/average-duration
   */
  async getAverageDuration(params?: {
    jobId?: number;
    daysBack?: number;
  }): Promise<AverageDurationResponse> {
    const query = this.buildQueryString({
      jobId: params?.jobId,
      daysBack: params?.daysBack ?? 30,
    });
    return this.request<AverageDurationResponse>(`/average-duration${query}`);
  }

  /**
   * Get SLA Compliance
   * GET /job-executions/sla-compliance
   */
  async getSLACompliance(params?: {
    jobId?: number;
    daysBack?: number;
  }): Promise<SLAComplianceResponse> {
    const query = this.buildQueryString({
      jobId: params?.jobId,
      daysBack: params?.daysBack ?? 30,
    });
    return this.request<SLAComplianceResponse>(`/sla-compliance${query}`);
  }

  /**
   * Get Resource Utilization Stats
   * GET /job-executions/resource-utilization-stats
   */
  async getResourceUtilizationStats(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ResourceUtilizationStats> {
    const query = this.buildQueryString({
      startDate: params?.startDate,
      endDate: params?.endDate,
    });
    return this.request<ResourceUtilizationStats>(
      `/resource-utilization-stats${query}`
    );
  }

  /**
   * Get Error Analysis
   * GET /job-executions/error-analysis
   */
  async getErrorAnalysis(params?: {
    daysBack?: number;
    jobId?: number;
  }): Promise<ErrorAnalysisItem[]> {
    const query = this.buildQueryString({
      daysBack: params?.daysBack ?? 30,
      jobId: params?.jobId,
    });
    return this.request<ErrorAnalysisItem[]>(`/error-analysis${query}`);
  }

  /**
   * Get Trend Data
   * GET /job-executions/trend-data
   */
  async getTrendData(params?: {
    jobId?: number;
    daysBack?: number;
  }): Promise<TrendDataPoint[]> {
    const query = this.buildQueryString({
      jobId: params?.jobId,
      daysBack: params?.daysBack ?? 30,
    });
    return this.request<TrendDataPoint[]>(`/trend-data${query}`);
  }

  /**
   * Get Executions by Hour
   * GET /job-executions/by-hour
   */
  async getExecutionsByHour(params?: {
    jobId?: number;
    date?: string;
  }): Promise<ExecutionByHour[]> {
    const query = this.buildQueryString({
      jobId: params?.jobId,
      date: params?.date,
    });
    return this.request<ExecutionByHour[]>(`/by-hour${query}`);
  }

  /**
   * Get Peak Execution Times
   * GET /job-executions/peak-times
   */
  async getPeakExecutionTimes(params?: {
    jobId?: number;
  }): Promise<ExecutionByHour[]> {
    const query = this.buildQueryString({
      jobId: params?.jobId,
    });
    return this.request<ExecutionByHour[]>(`/peak-times${query}`);
  }

  /**
   * Get Executions by Trigger
   * GET /job-executions/by-trigger
   */
  async getExecutionsByTrigger(): Promise<ExecutionByTrigger[]> {
    return this.request<ExecutionByTrigger[]>(`/by-trigger`);
  }

  /**
   * Get Data Quality Metrics
   * GET /job-executions/data-quality-metrics
   */
  async getDataQualityMetrics(params?: {
    jobId?: number;
  }): Promise<DataQualityMetrics> {
    const query = this.buildQueryString({
      jobId: params?.jobId,
    });
    return this.request<DataQualityMetrics>(`/data-quality-metrics${query}`);
  }

  /**
   * Get Failure Patterns
   * GET /job-executions/failure-patterns
   */
  async getFailurePatterns(): Promise<FailurePattern[]> {
    return this.request<FailurePattern[]>(`/failure-patterns`);
  }

  /**
   * Get Performance Summary
   * GET /job-executions/performance-summary
   */
  async getPerformanceSummary(params?: {
    jobId?: number;
    daysBack?: number;
  }): Promise<PerformanceSummary> {
    const query = this.buildQueryString({
      jobId: params?.jobId,
      daysBack: params?.daysBack ?? 30,
    });
    return this.request<PerformanceSummary>(`/performance-summary${query}`);
  }

  /**
   * Get Execution Distribution
   * GET /job-executions/execution-distribution
   */
  async getExecutionDistribution(): Promise<ExecutionDistribution[]> {
    return this.request<ExecutionDistribution[]>(`/execution-distribution`);
  }

  /**
   * Get Daily Summary
   * GET /job-executions/jobs/:jobId/daily-summary
   */
  async getDailySummary(
    jobId: number,
    params?: {
      daysBack?: number;
    }
  ): Promise<DailySummary[]> {
    const query = this.buildQueryString({
      daysBack: params?.daysBack ?? 30,
    });
    return this.request<DailySummary[]>(`/jobs/${jobId}/daily-summary${query}`);
  }

  /**
   * Get Worker Node Stats
   * GET /job-executions/worker-stats
   */
  async getWorkerNodeStats(): Promise<WorkerNodeStats[]> {
    return this.request<WorkerNodeStats[]>(`/worker-stats`);
  }

  /**
   * Get Server Instance Stats
   * GET /job-executions/server-stats
   */
  async getServerInstanceStats(params?: {
    daysBack?: number;
  }): Promise<ServerInstanceStats[]> {
    const query = this.buildQueryString({
      daysBack: params?.daysBack ?? 7,
    });
    return this.request<ServerInstanceStats[]>(`/server-stats${query}`);
  }

  /**
   * Get Step Failure Analysis
   * GET /job-executions/step-failure-analysis
   */
  async getStepFailureAnalysis(params?: {
    jobId?: number;
    daysBack?: number;
  }): Promise<StepFailureAnalysis[]> {
    const query = this.buildQueryString({
      jobId: params?.jobId,
      daysBack: params?.daysBack ?? 30,
    });
    return this.request<StepFailureAnalysis[]>(
      `/step-failure-analysis${query}`
    );
  }

  /**
   * Get Duration Outliers
   * GET /job-executions/duration-outliers
   */
  async getDurationOutliers(params?: {
    jobId?: number;
    daysBack?: number;
  }): Promise<DurationOutlier[]> {
    const query = this.buildQueryString({
      jobId: params?.jobId,
      daysBack: params?.daysBack ?? 30,
    });
    return this.request<DurationOutlier[]>(`/duration-outliers${query}`);
  }

  /**
   * Get Retry Analysis
   * GET /job-executions/retry-analysis
   */
  async getRetryAnalysis(params?: {
    jobId?: number;
    daysBack?: number;
  }): Promise<RetryAnalysis> {
    const query = this.buildQueryString({
      jobId: params?.jobId,
      daysBack: params?.daysBack ?? 14,
    });
    return this.request<RetryAnalysis>(`/retry-analysis${query}`);
  }

  /**
   * Get Trigger Distribution
   * GET /job-executions/trigger-distribution
   */
  async getTriggerDistribution(params?: {
    daysBack?: number;
  }): Promise<ExecutionByTrigger[]> {
    const query = this.buildQueryString({
      daysBack: params?.daysBack ?? 7,
    });
    return this.request<ExecutionByTrigger[]>(`/trigger-distribution${query}`);
  }

  /**
   * Get Execution Timeline
   * GET /job-executions/jobs/:jobId/timeline
   */
  async getExecutionTimeline(
    jobId: number,
    params?: {
      limit?: number;
    }
  ): Promise<ExecutionTimelineItem[]> {
    const query = this.buildQueryString({
      limit: clampLimit(params?.limit),
    });
    return this.request<ExecutionTimelineItem[]>(
      `/jobs/${jobId}/timeline${query}`
    );
  }

  /**
   * Get Concurrent Execution Analysis
   * GET /job-executions/concurrent-analysis
   */
  async getConcurrentExecutionAnalysis(): Promise<ConcurrentExecutionAnalysis> {
    return this.request<ConcurrentExecutionAnalysis>(`/concurrent-analysis`);
  }

  /**
   * Get Execution Health Score
   * GET /job-executions/health-score
   */
  async getExecutionHealthScore(params?: {
    jobId?: number;
  }): Promise<HealthScoreResponse> {
    const query = this.buildQueryString({
      jobId: params?.jobId,
    });
    return this.request<HealthScoreResponse>(`/health-score${query}`);
  }

  /**
   * Get Slowest Executions
   * GET /job-executions/slowest
   */
  async getSlowestExecutions(params?: {
    limit?: number;
    daysBack?: number;
  }): Promise<SlowestExecution[]> {
    const query = this.buildQueryString({
      limit: clampLimit(params?.limit, 100),
      daysBack: params?.daysBack ?? 30,
    });
    return this.request<SlowestExecution[]>(`/slowest${query}`);
  }

  /**
   * Get Executions with Resource Issues
   * GET /job-executions/resource-issues
   */
  async getExecutionsWithResourceIssues(params?: {
    limit?: number;
  }): Promise<ResourceIssue[]> {
    const query = this.buildQueryString({
      limit: clampLimit(params?.limit, 100),
    });
    return this.request<ResourceIssue[]>(`/resource-issues${query}`);
  }

  /**
   * Get Execution Comparison
   * GET /job-executions/jobs/:jobId/comparison
   */
  async getExecutionComparison(
    jobId: number,
    params?: {
      currentPeriodDays?: number;
    }
  ): Promise<ExecutionComparison> {
    const query = this.buildQueryString({
      currentPeriodDays: params?.currentPeriodDays ?? 7,
    });
    return this.request<ExecutionComparison>(
      `/jobs/${jobId}/comparison${query}`
    );
  }

  /**
   * Get Completion Forecast
   * GET /job-executions/completion-forecast
   */
  async getCompletionForecast(): Promise<CompletionForecast[]> {
    return this.request<CompletionForecast[]>(`/completion-forecast`);
  }

  /**
   * Get Execution Heatmap
   * GET /job-executions/jobs/:jobId/heatmap
   */
  async getExecutionHeatmap(jobId: number): Promise<ExecutionHeatmap> {
    return this.request<ExecutionHeatmap>(`/jobs/${jobId}/heatmap`);
  }

  /**
   * Get SLA Prediction
   * GET /job-executions/sla-prediction
   */
  async getSLAPrediction(): Promise<SLAPrediction> {
    return this.request<SLAPrediction>(`/sla-prediction`);
  }

  /**
   * Get Anomaly Detection
   * GET /job-executions/anomaly-detection
   */
  async getAnomalyDetection(): Promise<AnomalyDetection> {
    return this.request<AnomalyDetection>(`/anomaly-detection`);
  }

  // ==================== POST Endpoints ====================

  /**
   * Create Job Execution
   * POST /job-executions
   */
  async createJobExecution(
    payload: CreateJobExecutionPayload
  ): Promise<JobExecution> {
    console.log("🔵 CREATE JOB EXECUTION - Method Called!");
    console.log("==========================================");
    console.log("Payload received:", payload);
    console.log("Payload type:", typeof payload);
    console.log("Payload keys:", Object.keys(payload));
    console.log("job_id:", payload.job_id, "Type:", typeof payload.job_id);
    console.log("userId:", payload.userId, "Type:", typeof payload.userId);
    console.log("userId is undefined?", payload.userId === undefined);
    console.log("userId is null?", payload.userId === null);
    console.log("Full payload JSON:", JSON.stringify(payload, null, 2));
    console.log("==========================================");

    // Validate required fields before making the request
    if (!payload.job_id) {
      console.error("❌ Validation Error: job_id is missing!");
      throw new Error("Job ID is required");
    }
    if (payload.userId === undefined || payload.userId === null) {
      console.error("❌ Validation Error: userId is missing!");
      console.error("userId value:", payload.userId);
      throw new Error("User ID is required");
    }

    try {
      const requestPayload = {
        job_id: payload.job_id,
        userId: payload.userId,
        ...(payload.server_instance && {
          server_instance: payload.server_instance,
        }),
        ...(payload.worker_node_id && {
          worker_node_id: payload.worker_node_id,
        }),
        ...(payload.execution_context && {
          execution_context: payload.execution_context,
        }),
        ...(payload.triggered_by && { triggered_by: payload.triggered_by }),
      };

      console.log(
        "📤 Sending request with payload:",
        JSON.stringify(requestPayload, null, 2)
      );

      const response = await this.request<
        JobExecution | { success?: boolean; data?: JobExecution }
      >("/", {
        method: "POST",
        body: JSON.stringify(requestPayload),
        headers: { "Content-Type": "application/json" },
      });

      console.log("🟢 CREATE JOB EXECUTION - Success Response:");
      console.log("Response:", JSON.stringify(response, null, 2));

      return this.normalizeExecutionResponse(response);
    } catch (error) {
      console.error("🔴 CREATE JOB EXECUTION - Error Caught:");
      console.error(
        "Error type:",
        error instanceof Error ? error.constructor.name : typeof error
      );
      console.error(
        "Error message:",
        error instanceof Error ? error.message : String(error)
      );
      console.error("Full error:", error);
      throw error;
    }
  }

  /**
   * Bulk Archive Job Executions
   * POST /job-executions/bulk-archive
   */
  async bulkArchiveJobExecutions(
    payload: BulkArchivePayload
  ): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/bulk-archive`, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
  }

  /**
   * Archive Old Job Executions
   * POST /job-executions/archive-old
   */
  async archiveOldJobExecutions(
    payload: ArchiveOldPayload
  ): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/archive-old`, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
  }

  /**
   * Retry Failed Job Executions
   * POST /job-executions/retry-failed
   */
  async retryFailedJobExecutions(
    payload: RetryFailedPayload
  ): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/retry-failed`, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
  }

  // ==================== PUT Endpoints ====================

  /**
   * Update Job Execution
   * PUT /job-executions/:id
   */
  async updateJobExecution(
    id: string,
    payload: UpdateJobExecutionPayload
  ): Promise<JobExecution> {
    const response = await this.request<
      JobExecution | { success?: boolean; data?: JobExecution }
    >(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
    return this.normalizeExecutionResponse(response);
  }

  // ==================== PATCH Endpoints ====================

  /**
   * Update Job Execution Status
   * PATCH /job-executions/:id/status
   */
  async updateJobExecutionStatus(
    id: string,
    payload: UpdateStatusPayload
  ): Promise<JobExecution> {
    const response = await this.request<
      JobExecution | { success?: boolean; data?: JobExecution }
    >(`/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
    return this.normalizeExecutionResponse(response);
  }

  /**
   * Mark Job Execution Started
   * PATCH /job-executions/:id/start
   */
  async markJobExecutionStarted(
    id: string,
    payload?: StartExecutionPayload
  ): Promise<JobExecution> {
    const response = await this.request<
      JobExecution | { success?: boolean; data?: JobExecution }
    >(`/${id}/start`, {
      method: "PATCH",
      body: JSON.stringify(payload || {}),
      headers: { "Content-Type": "application/json" },
    });
    return this.normalizeExecutionResponse(response);
  }

  /**
   * Mark Job Execution Completed
   * PATCH /job-executions/:id/complete
   */
  async markJobExecutionCompleted(
    id: string,
    payload: CompleteExecutionPayload
  ): Promise<JobExecution> {
    const response = await this.request<
      JobExecution | { success?: boolean; data?: JobExecution }
    >(`/${id}/complete`, {
      method: "PATCH",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
    return this.normalizeExecutionResponse(response);
  }

  /**
   * Mark Job Execution Failed
   * PATCH /job-executions/:id/fail
   */
  async markJobExecutionFailed(
    id: string,
    payload: FailExecutionPayload
  ): Promise<JobExecution> {
    const response = await this.request<
      JobExecution | { success?: boolean; data?: JobExecution }
    >(`/${id}/fail`, {
      method: "PATCH",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
    return this.normalizeExecutionResponse(response);
  }

  /**
   * Mark Job Execution Aborted
   * PATCH /job-executions/:id/abort
   */
  async markJobExecutionAborted(
    id: string,
    payload?: AbortExecutionPayload
  ): Promise<JobExecution> {
    const response = await this.request<
      JobExecution | { success?: boolean; data?: JobExecution }
    >(`/${id}/abort`, {
      method: "PATCH",
      body: JSON.stringify(payload || {}),
      headers: { "Content-Type": "application/json" },
    });
    return this.normalizeExecutionResponse(response);
  }

  /**
   * Mark Job Execution Timeout
   * PATCH /job-executions/:id/timeout
   */
  async markJobExecutionTimeout(id: string): Promise<JobExecution> {
    const response = await this.request<
      JobExecution | { success?: boolean; data?: JobExecution }
    >(`/${id}/timeout`, {
      method: "PATCH",
    });
    return this.normalizeExecutionResponse(response);
  }

  /**
   * Record Job Execution Metrics
   * PATCH /job-executions/:id/metrics
   */
  async recordJobExecutionMetrics(
    id: string,
    payload: RecordMetricsPayload
  ): Promise<JobExecution> {
    const response = await this.request<
      JobExecution | { success?: boolean; data?: JobExecution }
    >(`/${id}/metrics`, {
      method: "PATCH",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
    return this.normalizeExecutionResponse(response);
  }

  /**
   * Archive Job Execution
   * PATCH /job-executions/:id/archive
   */
  async archiveJobExecution(id: string): Promise<JobExecution> {
    const response = await this.request<
      JobExecution | { success?: boolean; data?: JobExecution }
    >(`/${id}/archive`, {
      method: "PATCH",
    });
    return this.normalizeExecutionResponse(response);
  }

  // ==================== DELETE Endpoints ====================

  /**
   * Cleanup Archived Job Executions
   * DELETE /job-executions/cleanup-archived
   */
  async cleanupArchivedJobExecutions(params?: {
    olderThanDays?: number;
  }): Promise<{ success: boolean }> {
    const query = this.buildQueryString({
      olderThanDays: params?.olderThanDays ?? 365,
    });
    return this.request<{ success: boolean }>(`/cleanup-archived${query}`, {
      method: "DELETE",
    });
  }
}

export const jobExecutionService = new JobExecutionService();
