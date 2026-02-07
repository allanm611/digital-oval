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

// Common error format
export interface EtlErrorResponse {
  success: false;
  message: string;
  error?: string;
  errors?: Array<{ field: string; message: string }>;
  timestamp?: string;
}
