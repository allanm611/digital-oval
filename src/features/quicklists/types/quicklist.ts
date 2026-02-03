// Common Types
export type CacheSource = "cache" | "database" | "database-forced";

export interface PaginationMeta {
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
}

export type ProcessingStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";
export type ImportStatus = "success" | "failed" | "skipped";

// QuickList Types
export interface QuickListType {
  id: number;
  name: string;
  description: string | null;
  original_filename: string;
  file_hash: string;
  file_size_bytes: number;
  rows_imported: number;
  rows_failed: number;
  processing_status: ProcessingStatus;
  processing_error: string | null;
  processing_time_ms: number | null;
  data_table_name: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuickListWithDetails extends Partial<QuickListType> {
  id: number;
  name: string;
  description: string | null;
  original_filename: string;
  rows_imported: number;
  rows_failed: number;
  processing_status: ProcessingStatus;
  data_table_name: string;
  created_by: string | null;
  created_at: string;
  column_mappings?: Record<string, string>;
  file_hash?: string;
  file_size_bytes?: number;
  processing_error?: string | null;
  processing_time_ms?: number | null;
  updated_at?: string;
}

export type QuickList = QuickListWithDetails;

export interface QuickListTableMapping {
  id: number;
  table_name: string;
  schema_name: string;
  column_mappings: Record<string, string>; 
  table_created_at: string;
  last_used_at: string;
  total_rows: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// For backward compatibility
export type TableMapping = QuickListTableMapping;

// QuickList Data (dynamic data rows)
export interface QuickListData {
  id: number;
  quicklist_id: number;
  created_at: string;
  // Dynamic columns - all other fields are column data
  [key: string]: unknown;
}

// Import Log
export interface QuickListImportLog {
  id: number;
  quicklist_id: number;
  row_number: number;
  row_data: Record<string, unknown>;
  import_status: ImportStatus;
  error_message: string | null;
  created_at: string;
}

// For backward compatibility
export type ImportLog = QuickListImportLog;

// Statistics
export interface QuickListStats {
  overall: {
    total_quicklists: number;
    total_rows_imported: number;
    total_rows_failed: number;
    avg_processing_time_ms: number;
    total_file_size_bytes: number;
    unique_users: number;
  };
  by_status: Array<{
    processing_status: ProcessingStatus;
    count: number;
  }>;
  recent_activity: Array<{
    date: string;
    quicklists_created: number;
    rows_imported: number;
  }>;
}

// Request Types
export interface CreateQuickListRequest {
  name: string;
  description?: string | null;
  created_by?: string | null;
  file?: File; // Optional file if providing file_text instead
  file_text?: string; // Raw file content
  file_name?: string;
  file_size?: number;
  file_delimiter: string; // Delimiter used in file (comma, semicolon, tab, pipe)
  subscriber_id_col_name: string; // Column name that contains subscriber IDs
  list_headers?: string; // CSV headers line
}

export interface UpdateQuickListRequest {
  name?: string;
  description?: string | null;
}

// Response Types
export interface QuickListCollectionResponse {
  success: true;
  data: QuickListWithDetails[];
  pagination: PaginationMeta;
  source: CacheSource;
  message?: string;
}

export interface QuickListDetailResponse {
  success: true;
  data: QuickListWithDetails;
  source: CacheSource;
  message?: string;
}

export interface QuickListDataResponse {
  success: true;
  data: Record<string, unknown>[];
  pagination: PaginationMeta;
  source: CacheSource;
  message?: string;
}

export interface QuickListImportLogsResponse {
  success: true;
  data: QuickListImportLog[];
  pagination: PaginationMeta;
  source: CacheSource;
  message?: string;
}

export interface TableMappingsResponse {
  success: true;
  data: QuickListTableMapping[];
  count?: number;
  source: CacheSource;
  message?: string;
}

export interface TableMappingResponse {
  success: true;
  data: QuickListTableMapping;
  source: CacheSource;
  message?: string;
}

export interface QuickListStatsResponse {
  success: true;
  data: QuickListStats;
  source: CacheSource;
  message?: string;
}

export interface CreateQuickListResponse {
  success: true;
  data: {
    quicklist_id: number;
    table_name: string;
    rows_imported: number;
    rows_failed: number;
    has_errors: boolean;
    errors: Array<{
      row_number: number;
      error: string;
      row_data: Record<string, unknown>;
    }>;
  };
  message?: string;
}

export interface UpdateQuickListResponse {
  success: true;
  message: string;
  data: QuickListWithDetails;
}

export interface DeleteQuickListResponse {
  success: true;
  message: string;
  data: {
    id: number;
    name: string;
    table_name: string;
    rows_imported: number;
  };
}

// Error Response
export interface QuickListErrorResponse {
  success: false;
  error: string;
  code?: string;
  execution_time_ms?: number;
}

// Union types for responses
export type QuickListResponse =
  | QuickListCollectionResponse
  | QuickListErrorResponse;

export type SingleQuickListResponse =
  | QuickListDetailResponse
  | QuickListErrorResponse;

export type QuickListDataResponseUnion =
  | QuickListDataResponse
  | QuickListErrorResponse;

export type ImportLogsResponse =
  | QuickListImportLogsResponse
  | QuickListErrorResponse;

export type TableMappingsResponseUnion =
  | TableMappingsResponse
  | QuickListErrorResponse;

export type SingleTableMappingResponse =
  | TableMappingResponse
  | QuickListErrorResponse;

export type QuickListStatsResponseUnion =
  | QuickListStatsResponse
  | QuickListErrorResponse;

export type CreateQuickListResponseUnion =
  | CreateQuickListResponse
  | QuickListErrorResponse;

export type UpdateQuickListResponseUnion =
  | UpdateQuickListResponse
  | QuickListErrorResponse;

export type DeleteQuickListResponseUnion =
  | DeleteQuickListResponse
  | QuickListErrorResponse;
