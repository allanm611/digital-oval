// ETL File Fetcher Types

export type EtlFileCategory = "CDR" | "TDR" | string;

// 1. POST /fetch-files
export interface FetchFilesRequest {
  job_id: number;
  user_id?: number;
  force_reprocess?: boolean;
}

export interface FetchFilesResponse {
  success: boolean;
  message: string;
  data?: {
    execution_id: string;
    job_id: number;
    files_processed: number;
    rows_inserted: number;
    duration_ms: number;
  };
  errors?: Array<any>;
  timestamp?: string;
}

// 2. POST /fetch-by-time
export interface FetchByTimeRequest {
  file_category: EtlFileCategory;
  month: string; // 1-12
  day: string; // 1-31
  hour: string; // 0-23
  user_id: number;
  job_id?: number;
}

export interface FetchTriggeredResponse {
  success: boolean;
  message: string;
  data?: {
    execution_id: string;
  };
  timestamp?: string;
}

// 3. POST /fetch-by-range
export interface RangeTimeSlot {
  month: string;
  day: string;
  hour: string;
}

export interface FetchByRangeRequest {
  job_id: number;
  user_id: number;
  start_time: RangeTimeSlot;
  end_time: RangeTimeSlot;
  force_reprocess?: boolean;
}

export interface FetchByRangeResponse {
  success: boolean;
  message: string;
  data?: {
    triggered_executions: string[];
    failed_slots: Array<{
      slot: RangeTimeSlot;
      error: string;
    }>;
  };
}

// 4. GET /file-registry
export interface EtlFileRegistryRowType {
  id: number;
  job_execution_id?: string;
  file_category: string;
  file_name: string;
  file_path?: string;
  file_url: string;
  file_size_bytes?: number;
  file_updated_at?: string;
  fetch_attempted_at?: string;
  fetch_completed_at?: string;
  fetch_duration_ms?: number;
  fetch_attempts: number;
  fetch_error?: string;
  processing_status: "pending" | "processing" | "completed" | "failed" | string;
  processing_started_at?: string;
  processing_completed_at?: string;
  processing_duration_ms?: number;
  rows_parsed?: number;
  rows_inserted?: number;
  rows_failed?: number;
  data_size_mb?: number;
  error_message?: string;
  error_code?: string;
  retry_count: number;
  last_retry_at?: string;
  checksum?: string;
  file_format: string;
  validation_status?: string;
  validation_errors?: any;
  destination_table?: string;
  processing_metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface FileRegistryQuery {
  category?: string;
  status?: string;
  job_execution_id?: string;
  limit?: number; // default 50
  offset?: number; // default 0
}

export interface FileRegistryListResponse {
  success: boolean;
  data: EtlFileRegistryRowType[];
  pagination?: {
    limit: number;
    offset: number;
    total: number;
  };
  timestamp?: string;
}

// 5. GET /file-registry/pending
export interface PendingFilesQuery {
  category?: string;
}

export interface PendingFilesResponse {
  success: boolean;
  data: EtlFileRegistryRowType[];
  count: number;
  timestamp?: string;
}

// 6. POST /file-registry/:id/reprocess
export interface ReprocessFileRequest {
  id: number;
  user_id?: number;
}

export interface ReprocessFileResponse {
  success: boolean;
  message: string;
  data?: {
    file_id: number;
    file_name: string;
    file_category: string;
    status: string;
    previous_status: string;
  };
  timestamp?: string;
}

// 7. GET /file-stats
export interface FileStatsResponse {
  success: boolean;
  data: {
    total_files?: number;
    completed_files?: number;
    pending_files?: number;
    failed_files?: number;
    processing_files?: number;
    total_rows_inserted?: number;
    total_rows_failed?: number;
    total_data_size_mb?: number;
    avg_processing_duration_ms?: number;
  };
  timestamp?: string;
}

// 8. GET /file-stats/:category
export interface CategoryFileStatsResponse {
  success: boolean;
  data: {
    category: string;
    total_files?: number;
    completed_files?: number;
    pending_files?: number;
    failed_files?: number;
    processing_files?: number;
    total_rows_inserted?: number;
    total_rows_failed?: number;
    total_data_size_mb?: number;
    avg_processing_duration_ms?: number;
  };
  timestamp?: string;
}

// 9. POST /files/upload/etl
export interface FileUploadRequest {
  file: File;
}

export interface FileUploadResponse {
  success: boolean;
  message: string;
  data?: {
    file_id: number;
    file_name: string;
    file_category: string;
    file_size_bytes: number;
    processing_status: string;
  };
  timestamp?: string;
}

// ============================================
// Task 1: ETL File Registry Analytics Types
// ============================================

// 1. GET /monitoring/etl-file-registry/statistics
export interface FileCategoryStats {
  file_category: string;
  count: number;
}

export interface ETLFileRegistryStatistics {
  total_files: number;
  files_by_category: FileCategoryStats[];
  active_files: number;
  downloaded_files: number;
  processed_files: number;
  failed_files: number;
  skipped_files: number;
  total_file_size_bytes: number;
  average_file_size_bytes: number;
  total_rows_parsed: number;
  total_rows_inserted: number;
  total_rows_failed: number;
  average_fetch_duration_ms: number;
  average_processing_duration_ms: number;
  average_retry_count: number;
}

export interface ETLFileRegistryStatisticsResponse {
  success: boolean;
  data: ETLFileRegistryStatistics;
  timestamp?: string;
}

// 2. GET /monitoring/etl-file-registry/category
export interface CategoryDistribution {
  file_category: string;
  count: number;
  percentage: number;
  average_size_bytes: number;
  processed_count: number;
}

export interface ETLCategoryDistributionResponse {
  success: boolean;
  data: {
    categories: CategoryDistribution[];
  };
  timestamp?: string;
}

// 3. GET /monitoring/etl-file-registry/processing-status
export interface ProcessingStatusDistribution {
  processing_status: "pending" | "downloading" | "downloaded" | "parsing" | "processing" | "failed" | "skipped";
  count: number;
  percentage: number;
}

export interface ETLProcessingStatusResponse {
  success: boolean;
  data: {
    statuses: ProcessingStatusDistribution[];
  };
  timestamp?: string;
}

// 4. GET /monitoring/etl-file-registry/format-distribution
export interface FormatDistribution {
  file_format: string;
  count: number;
  percentage: number;
}

export interface ETLFormatDistributionResponse {
  success: boolean;
  data: {
    formats: FormatDistribution[];
  };
  timestamp?: string;
}

// 5. GET /monitoring/etl-file-registry/fetch-duration-analytics
export interface ETLFetchDurationAnalytics {
  average_fetch_duration_ms: number;
  average_fetch_attempts: number;
  files_with_fetch_errors: number;
}

export interface ETLFetchDurationAnalyticsResponse {
  success: boolean;
  data: ETLFetchDurationAnalytics;
  timestamp?: string;
}

// 6. GET /monitoring/etl-file-registry/processing-duration-analytics
export interface ETLProcessingDurationAnalytics {
  average_processing_duration_ms: number;
  average_total_batches: number;
  average_processed_batches: number;
}

export interface ETLProcessingDurationAnalyticsResponse {
  success: boolean;
  data: ETLProcessingDurationAnalytics;
  timestamp?: string;
}

// 7. GET /monitoring/etl-file-registry/row-metrics
export interface ETLRowMetrics {
  total_rows_parsed: number;
  total_rows_inserted: number;
  total_rows_failed: number;
  insertion_rate: number;
  failure_rate: number;
}

export interface ETLRowMetricsResponse {
  success: boolean;
  data: ETLRowMetrics;
  timestamp?: string;
}

// 8. GET /monitoring/etl-file-registry/checksum-usuage
export interface ETLChecksumUsage {
  files_with_checksum: number;
  unique_checksums: number;
  duplicate_files: number;
}

export interface ETLChecksumUsageResponse {
  success: boolean;
  data: ETLChecksumUsage;
  timestamp?: string;
}

// 9. GET /monitoring/etl-file-registry/trends
export interface ETLTrendPeriod {
  period: string;
  files_created: number;
  files_fetched: number;
  files_processed: number;
  rows_inserted: number;
  failures: number;
}

export interface ETLTrendsQuery {
  start_date?: string;
  end_date?: string;
  granularity?: "day" | "week" | "month";
}

export interface ETLTrendsResponse {
  success: boolean;
  data: {
    trends: ETLTrendPeriod[];
  };
  timestamp?: string;
}

// 10. GET /monitoring/etl-file-registry/retry-analysis
export interface ETLRetryAnalysis {
  files_with_retries: number;
  average_retry_count: number;
  max_retry_count: number;
  recent_retries_last_7_days: number;
}

export interface ETLRetryAnalysisResponse {
  success: boolean;
  data: ETLRetryAnalysis;
  timestamp?: string;
}

// 11. GET /monitoring/etl-file-registry/data-size-analytics
export interface DataSizeRange {
  range: "0-1" | "1-10" | "10-100" | "100+";
  count: number;
}

export interface ETLDataSizeAnalytics {
  total_data_size_mb: number;
  average_data_size_mb: number;
  size_distribution: DataSizeRange[];
}

export interface ETLDataSizeAnalyticsResponse {
  success: boolean;
  data: ETLDataSizeAnalytics;
  timestamp?: string;
}

// 12. GET /monitoring/etl-file-registry/error-message-distribution
export interface ErrorMessageDistribution {
  error_message: string;
  count: number;
}

export interface ETLErrorMessagePaginationQuery {
  offset?: number;
  limit?: number;
}

export interface ETLErrorMessageDistributionResponse {
  success: boolean;
  data: {
    total: number;
    error_messages: ErrorMessageDistribution[];
  };
  pagination?: {
    offset: number;
    limit: number;
    total: number;
  };
  timestamp?: string;
}

// ============================================
// Task 2: ETL Task Queue Analytics Types
// ============================================

// 1. GET /monitoring/etl-task-queue/statistics
export interface ETLTaskStatistics {
  total_tasks: number;
  pending_tasks: number;
  processing_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  tasks_with_retries: number;
  average_retry_count: number;
  tasks_with_errors: number;
}

export interface ETLTaskStatisticsResponse {
  success: boolean;
  data: ETLTaskStatistics;
  timestamp?: string;
}

// 2. GET /monitoring/etl-task-queue/type-distribution
export interface TaskTypeDistribution {
  task_type: string;
  count: number;
  percentage: number;
}

export interface ETLTaskTypeDistributionResponse {
  success: boolean;
  data: {
    task_types: TaskTypeDistribution[];
  };
  timestamp?: string;
}

// 3. GET /monitoring/etl-task-queue/status-distribution
export interface TaskStatusDistribution {
  status: "pending" | "processing" | "completed" | "failed";
  count: number;
  percentage: number;
}

export interface ETLTaskStatusDistributionResponse {
  success: boolean;
  data: {
    statuses: TaskStatusDistribution[];
  };
  timestamp?: string;
}

// 4. GET /monitoring/etl-task-queue/priority-distribution
export interface TaskPriorityDistribution {
  priority: number;
  count: number;
}

export interface ETLTaskPriorityDistributionResponse {
  success: boolean;
  data: {
    priorities: TaskPriorityDistribution[];
    average_priority: number;
  };
  timestamp?: string;
}

// 5. GET /monitoring/etl-task-queue/duration-analytics
export interface ETLTaskDurationAnalytics {
  average_duration_seconds: number;
  max_duration_seconds: number;
}

export interface ETLTaskDurationAnalyticsResponse {
  success: boolean;
  data: ETLTaskDurationAnalytics;
  timestamp?: string;
}

// 6. GET /monitoring/etl-task-queue/trends
export interface TaskTrendPeriod {
  period: string;
  tasks_created: number;
  tasks_completed: number;
  failures: number;
}

export interface ETLTaskTrendsQuery {
  start_date?: string;
  end_date?: string;
  granularity?: "day" | "week" | "month";
}

export interface ETLTaskTrendsResponse {
  success: boolean;
  data: {
    trends: TaskTrendPeriod[];
  };
  timestamp?: string;
}

// 7. GET /monitoring/etl-task-queue/file-correlation
export interface ETLTaskFileCorrelation {
  tasks_with_files: number;
  average_tasks_per_file: number;
}

export interface ETLTaskFileCorrelationResponse {
  success: boolean;
  data: ETLTaskFileCorrelation;
  timestamp?: string;
}

// 8. GET /monitoring/etl-task-queue/job-correlation
export interface ETLTaskJobCorrelation {
  tasks_with_jobs: number;
  average_tasks_per_job: number;
}

export interface ETLTaskJobCorrelationResponse {
  success: boolean;
  data: ETLTaskJobCorrelation;
  timestamp?: string;
}

// ============================================
// File Count Endpoints
// ============================================

// GET /monitoring/etl-file-registry/cdr-count
export interface ETLFileCountResponse {
  success: boolean;
  data: {
    count: number;
  };
  timestamp?: string;
}

// Common error format
export interface EtlErrorResponse {
  success: false;
  message: string;
  error?: string;
  errors?: Array<{ field: string; message: string }>;
  timestamp?: string;
}
