import { api } from "../../../shared/services/api";

export interface EtlFileRegistry {
  id: number;
  file_name: string;
  file_category: "CDR" | "TDR";
  file_size_bytes: number;
  processing_status: "pending" | "processing" | "completed" | "failed";
  rows_imported: number;
  rows_failed: number;
  processing_time_ms: number;
  original_filename: string;
  file_hash: string;
  created_at: string;
  updated_at: string;
}

export interface ExecutionResult {
  success: boolean;
  message: string;
  execution_id: number;
  job_id: number;
  files_processed: number;
  rows_inserted: number;
  duration_ms: number;
  errors: string[];
}

export interface FileStatistics {
  total_files: number;
  files_completed: number;
  files_pending: number;
  files_failed: number;
  total_rows_imported: number;
  total_rows_failed: number;
  total_processing_time_ms: number;
  average_file_size_bytes: number;
  success_rate_percent?: number;
  import_rate_rows_per_second?: number;
}

export interface CategoryFileStatistics extends FileStatistics {
  category: string;
}

export interface FileRegistryResponse {
  success: boolean;
  data: EtlFileRegistry[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
  timestamp: string;
}

export interface FileStatsResponse {
  success: boolean;
  data: FileStatistics;
  timestamp: string;
}

export interface CategoryFileStatsResponse {
  success: boolean;
  data: CategoryFileStatistics;
  timestamp: string;
}

const BASE_URL = "/etl-file-fetcher";

class EtlFileFetcherService {
  async fetchFiles(
    jobId: number,
    userId?: number,
    forceReprocess: boolean = false
  ) {
    const response = await api.post<{
      success: boolean;
      message: string;
      data: ExecutionResult;
      errors: any[];
      timestamp: string;
    }>(`${BASE_URL}/fetch-files`, {
      job_id: jobId,
      user_id: userId,
      force_reprocess: forceReprocess,
    });
    return response.data;
  }

  async fetchByTime(
    fileCategory: "CDR" | "TDR",
    month: string,
    day: string,
    hour: string,
    userId: number,
    jobId?: number,
    forceReprocess: boolean = false
  ) {
    const response = await api.post<{
      success: boolean;
      message: string;
      data: { execution_id: number };
    }>(`${BASE_URL}/fetch-by-time`, {
      file_category: fileCategory,
      month,
      day,
      hour,
      user_id: userId,
      job_id: jobId,
      force_reprocess: forceReprocess,
    });
    return response.data;
  }

  async fetchByRange(
    jobId: number,
    userId: number,
    startTime: { month: string; day: string; hour: string },
    endTime: { month: string; day: string; hour: string },
    forceReprocess: boolean = false
  ) {
    const response = await api.post<{
      success: boolean;
      message: string;
      data: { execution_id: number };
    }>(`${BASE_URL}/fetch-by-range`, {
      job_id: jobId,
      user_id: userId,
      start_time: startTime,
      end_time: endTime,
      force_reprocess: forceReprocess,
    });
    return response.data;
  }

  async getFileRegistry(
    category?: string,
    status?: string,
    jobExecutionId?: string,
    limit: number = 50,
    offset: number = 0
  ) {
    const params = new URLSearchParams();
    if (category) params.append("category", category);
    if (status) params.append("status", status);
    if (jobExecutionId) params.append("job_execution_id", jobExecutionId);
    params.append("limit", limit.toString());
    params.append("offset", offset.toString());

    const response = await api.get<FileRegistryResponse>(
      `${BASE_URL}/file-registry?${params.toString()}`
    );
    return response.data;
  }

  async getPendingFiles(limit: number = 50, offset: number = 0) {
    const response = await api.get<FileRegistryResponse>(
      `${BASE_URL}/file-registry/pending?limit=${limit}&offset=${offset}`
    );
    return response.data;
  }

  async reprocessFile(fileId: number, userId?: number) {
    const response = await api.post<{
      success: boolean;
      message: string;
      data: {
        file_id: number;
        file_name: string;
        file_category: string;
        status: string;
        previous_status: string;
      };
      timestamp: string;
    }>(`${BASE_URL}/file-registry/${fileId}/reprocess`, {
      user_id: userId,
    });
    return response.data;
  }

  async getFileStats() {
    const response = await api.get<FileStatsResponse>(
      `${BASE_URL}/file-stats`
    );
    return response.data;
  }

  async getFileStatsByCategory(category: "CDR" | "TDR") {
    const response = await api.get<CategoryFileStatsResponse>(
      `${BASE_URL}/file-stats/${category}`
    );
    return response.data;
  }
}

export const etlFileFetcherService = new EtlFileFetcherService();
