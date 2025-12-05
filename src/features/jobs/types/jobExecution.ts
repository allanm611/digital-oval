// Job Execution Types

export type ExecutionStatus =
  | "pending"
  | "queued"
  | "running"
  | "success"
  | "failure"
  | "aborted"
  | "timeout"
  | "cancelled";

export type TriggeredBy =
  | "scheduler"
  | "manual"
  | "api"
  | "webhook"
  | "event"
  | "retry"
  | "dependency"
  | "system";

export interface JobExecution {
  id: string; // UUID
  job_id: number;
  execution_status: ExecutionStatus;
  started_at: string | null;
  completed_at: string | null;
  duration_seconds: number | null;
  triggered_by: TriggeredBy;
  triggered_by_user_id: number | null;
  server_instance: string | null;
  worker_node_id: string | null;
  trace_id: string | null;
  correlation_id: string | null;
  error_message: string | null;
  error_code: string | null;
  error_step_id: number | null;
  error_details: Record<string, unknown> | null;
  execution_context: Record<string, unknown> | null;
  peak_memory_mb: number | null;
  peak_cpu_percent: number | null;
  rows_read: number | null;
  rows_processed: number | null;
  rows_inserted: number | null;
  rows_updated: number | null;
  rows_deleted: number | null;
  data_quality_score: number | null;
  steps_total: number | null;
  steps_completed: number | null;
  steps_failed: number | null;
  sla_breached: boolean;
  execution_date: string; // YYYY-MM-DD
  archived: boolean;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobExecutionListResponse {
  success?: boolean;
  data: JobExecution[];
  pagination?: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
  count?: number;
  source?: "cache" | "database" | "database-forced";
}

export interface JobExecutionSearchFilters {
  job_id?: number;
  execution_status?: ExecutionStatus;
  started_at_min?: string; // ISO format
  started_at_max?: string; // ISO format
  triggered_by?: TriggeredBy;
  server_instance?: string;
  worker_node_id?: string;
  sla_breached?: boolean;
  archived?: boolean;
}

export interface JobExecutionSearchParams {
  filters: JobExecutionSearchFilters;
  limit?: number;
  offset?: number;
  skipCache?: boolean;
}

export interface BulkArchivePayload {
  executionIds: string[];
  userId: number;
}

export interface ArchiveOldPayload {
  olderThanDays: number;
  jobId?: number;
  userId: number;
}

export interface RetryFailedPayload {
  jobId: number;
  daysBack?: number;
  userId: number;
}

export interface CreateJobExecutionPayload {
  job_id: number; // Required
  userId: number; // Required
  server_instance?: string;
  worker_node_id?: string;
  execution_context?: Record<string, unknown>;
  triggered_by?: TriggeredBy; // Default: "manual" or "api"
}

export interface UpdateJobExecutionPayload {
  error_message?: string;
  error_code?: string;
  error_step_id?: number;
  execution_context?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface UpdateStatusPayload {
  execution_status: ExecutionStatus;
}

export interface StartExecutionPayload {
  server_instance?: string;
  worker_node_id?: string;
}

export interface CompleteExecutionPayload {
  execution_status: ExecutionStatus;
  duration_seconds?: number;
  metrics?: Record<string, unknown>;
}

export interface FailExecutionPayload {
  error_message: string;
  error_code?: string;
  error_step_id?: number;
}

export interface AbortExecutionPayload {
  reason?: string;
}

export interface RecordMetricsPayload {
  peak_memory_mb?: number;
  peak_cpu_percent?: number;
  rows_read?: number;
  rows_processed?: number;
  rows_inserted?: number;
  rows_updated?: number;
  rows_deleted?: number;
  data_quality_score?: number;
  steps_total?: number;
  steps_completed?: number;
  steps_failed?: number;
}

// Analytics and Statistics Types
export interface ExecutionStatistics {
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  running_executions: number;
  queued_executions: number;
  average_duration_seconds: number;
  total_duration_seconds: number;
}

export interface SuccessRateResponse {
  success_rate: number;
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
}

export interface AverageDurationResponse {
  average_duration_seconds: number;
  total_executions: number;
}

export interface SLAComplianceResponse {
  total_executions: number;
  sla_breaches: number;
  compliance_rate: number;
  average_duration_minutes: number;
  sla_duration_minutes: number;
}

export interface ResourceUtilizationStats {
  average_memory_mb: number;
  peak_memory_mb: number;
  average_cpu_percent: number;
  peak_cpu_percent: number;
  total_executions: number;
}

export interface ErrorAnalysisItem {
  error_code: string;
  error_count: number;
  error_message: string;
  most_common_step: number | null;
  jobs_affected: number[];
}

export interface TrendDataPoint {
  date: string;
  executions: number;
  successful: number;
  failed: number;
  average_duration: number;
}

export interface ExecutionByHour {
  hour: number;
  count: number;
  successful: number;
  failed: number;
}

export interface ExecutionByTrigger {
  trigger_type: TriggeredBy;
  count: number;
  successful: number;
  failed: number;
}

export interface DataQualityMetrics {
  average_score: number;
  total_executions: number;
  executions_with_score: number;
}

export interface FailurePattern {
  pattern: string;
  frequency: number;
  common_causes: string[];
  affected_jobs: number[];
}

export interface PerformanceSummary {
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  success_rate: number;
  average_duration_seconds: number;
  median_duration_seconds: number;
  p95_duration_seconds: number;
  p99_duration_seconds: number;
  sla_compliance_rate: number;
}

export interface ExecutionDistribution {
  period: string;
  count: number;
  successful: number;
  failed: number;
}

export interface DailySummary {
  date: string;
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  average_duration_seconds: number;
  sla_breaches: number;
}

export interface WorkerNodeStats {
  worker_node_id: string;
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  average_duration_seconds: number;
}

export interface ServerInstanceStats {
  server_instance: string;
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  average_duration_seconds: number;
}

export interface StepFailureAnalysis {
  step_id: number;
  failure_count: number;
  failure_rate: number;
  common_errors: string[];
}

export interface DurationOutlier {
  execution_id: string;
  job_id: number;
  duration_seconds: number;
  is_outlier: boolean;
  z_score: number;
}

export interface RetryAnalysis {
  total_retries: number;
  successful_retries: number;
  failed_retries: number;
  retry_success_rate: number;
  average_retry_count: number;
}

export interface ExecutionTimelineItem {
  execution_id: string;
  started_at: string;
  completed_at: string | null;
  status: ExecutionStatus;
  duration_seconds: number | null;
}

export interface ConcurrentExecutionAnalysis {
  max_concurrent: number;
  average_concurrent: number;
  peak_time: string;
  concurrent_by_hour: Array<{ hour: number; count: number }>;
}

export interface HealthScoreResponse {
  health_score: number; // 0-100
  factors: Array<{
    factor: string;
    score: number;
    weight: number;
  }>;
}

export interface SlowestExecution {
  execution_id: string;
  job_id: number;
  duration_seconds: number;
  started_at: string;
  completed_at: string;
}

export interface ResourceIssue {
  execution_id: string;
  job_id: number;
  issue_type: "memory" | "cpu" | "both";
  peak_memory_mb: number | null;
  peak_cpu_percent: number | null;
}

export interface ExecutionComparison {
  current_period: {
    total_executions: number;
    successful_executions: number;
    failed_executions: number;
    average_duration_seconds: number;
  };
  previous_period: {
    total_executions: number;
    successful_executions: number;
    failed_executions: number;
    average_duration_seconds: number;
  };
  changes: {
    execution_change_percent: number;
    success_rate_change_percent: number;
    duration_change_percent: number;
  };
}

export interface CompletionForecast {
  execution_id: string;
  estimated_completion: string; // ISO timestamp
  confidence: number; // 0-100
  based_on: string;
}

export interface ExecutionHeatmap {
  data: Array<{
    date: string;
    hour: number;
    count: number;
    status: ExecutionStatus;
  }>;
}

export interface SLAPrediction {
  predicted_compliance_rate: number;
  confidence: number;
  factors: Array<{
    factor: string;
    impact: number;
  }>;
}

export interface AnomalyDetection {
  anomalies: Array<{
    execution_id: string;
    job_id: number;
    anomaly_type: string;
    severity: "low" | "medium" | "high";
    description: string;
  }>;
}

export interface RunningDurationResponse {
  duration_seconds: number;
  started_at: string;
}

export interface IsTimedOutResponse {
  is_timed_out: boolean;
  timeout_duration_minutes: number | null;
  running_duration_minutes: number;
}

export interface ExecutionProgress {
  steps_total: number;
  steps_completed: number;
  steps_failed: number;
  percentage_complete: number;
  estimated_completion: string | null;
}

export interface ResourceUsage {
  peak_memory_mb: number | null;
  peak_cpu_percent: number | null;
  current_memory_mb: number | null;
  current_cpu_percent: number | null;
}

export interface PartitionInfo {
  partition_name: string;
  execution_date_start: string;
  execution_date_end: string;
  row_count: number;
  size_mb: number;
}
