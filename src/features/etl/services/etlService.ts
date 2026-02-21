import { buildApiUrl, buildDirectBackendUrl, getAuthHeaders } from "../../../shared/services/api";
import {
  CategoryFileStatsResponse,
  ETLCategoryDistributionResponse,
  ETLChecksumUsageResponse,
  ETLDataSizeAnalyticsResponse,
  ETLErrorMessageDistributionResponse,
  ETLErrorMessagePaginationQuery,
  ETLFetchDurationAnalyticsResponse,
  ETLFileCountResponse,
  ETLFileRegistryStatisticsResponse,
  ETLFormatDistributionResponse,
  ETLProcessingDurationAnalyticsResponse,
  ETLProcessingStatusResponse,
  ETLRetryAnalysisResponse,
  ETLRowMetricsResponse,
  ETLTaskDurationAnalyticsResponse,
  ETLTaskFileCorrelationResponse,
  ETLTaskJobCorrelationResponse,
  ETLTaskPriorityDistributionResponse,
  ETLTaskStatisticsResponse,
  ETLTaskStatusDistributionResponse,
  ETLTaskTrendsQuery,
  ETLTaskTrendsResponse,
  ETLTaskTypeDistributionResponse,
  ETLTrendsQuery,
  ETLTrendsResponse,
//   EtlErrorResponse,
//   EtlFileRegistryRowType,
  FetchByRangeRequest,
  FetchByRangeResponse,
  FetchByTimeRequest,
  FetchFilesRequest,
  FetchFilesResponse,
  FetchTriggeredResponse,
  FileRegistryListResponse,
  FileRegistryQuery,
  FileStatsResponse,
  FileUploadResponse,
  PendingFilesQuery,
  PendingFilesResponse,
  ReprocessFileRequest,
  ReprocessFileResponse,
} from "../types/etl";

const BASE_URL = buildApiUrl("/etl-file-fetcher");

class EtlService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    });

    const text = await response.text();
    const isJson = text.trim().startsWith("{") || text.trim().startsWith("[");

    if (!text) {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }
      return undefined as T;
    }

    let parsed: unknown;
    try {
      parsed = isJson ? JSON.parse(text) : (text as unknown);
    } catch {
      throw new Error(
        `Invalid JSON response from ETL API. First 200 chars: ${text.substring(0, 200)}`,
      );
    }

    if (!response.ok) {
      const errorMessage =
        (parsed as { error?: string; message?: string })?.error ||
        (parsed as { message?: string })?.message ||
        response.statusText ||
        "Unknown error";
      throw new Error(errorMessage);
    }

    return parsed as T;
  }

  private buildQueryParams(params?: Record<string, unknown>): string {
    if (!params) return "";
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      if (Array.isArray(value)) {
        value.forEach((v) => sp.append(key, String(v)));
      } else {
        sp.append(key, String(value));
      }
    });
    const qs = sp.toString();
    return qs ? `?${qs}` : "";
  }

//   private unwrapSuccess<T>(response: unknown): T {
//     if (
//       response &&
//       typeof response === "object" &&
//       "success" in response &&
//       (response as { success?: boolean }).success === true
//     ) {
//       if ("data" in response) {
//         return (response as { data: T }).data;
//       }
//       return response as T;
//     }
//     return response as T;
//   }

  // 1. POST /fetch-files
  async fetchFiles(payload: FetchFilesRequest): Promise<FetchFilesResponse> {
    const res = await this.request<FetchFilesResponse>("/fetch-files", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return res;
  }

  // 2. POST /fetch-by-time
  async fetchByTime(
    payload: FetchByTimeRequest,
  ): Promise<FetchTriggeredResponse> {
    const res = await this.request<FetchTriggeredResponse>("/fetch-by-time", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return res;
  }

  // 3. POST /fetch-by-range
  async fetchByRange(
    payload: FetchByRangeRequest,
  ): Promise<FetchByRangeResponse> {
    const res = await this.request<FetchByRangeResponse>("/fetch-by-range", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return res;
  }

  // 4. GET /file-registry
  async getFileRegistry(
    query?: FileRegistryQuery,
  ): Promise<FileRegistryListResponse> {
    const res = await this.request<FileRegistryListResponse>(
      `/file-registry${this.buildQueryParams(query as Record<string, unknown>)}`,
    );
    return res;
  }

  // 5. GET /file-registry/pending
  async getPendingFiles(
    query?: PendingFilesQuery,
  ): Promise<PendingFilesResponse> {
    const res = await this.request<PendingFilesResponse>(
      `/file-registry/pending${this.buildQueryParams(query as Record<string, unknown>)}`,
    );
    return res;
  }

  // 6. POST /file-registry/:id/reprocess
  async reprocessFile({
    id,
    user_id,
  }: ReprocessFileRequest): Promise<ReprocessFileResponse> {
    const res = await this.request<ReprocessFileResponse>(
      `/file-registry/${id}/reprocess`,
      {
        method: "POST",
        body: JSON.stringify(user_id ? { user_id } : {}),
      },
    );
    return res;
  }

  // 7. GET /file-stats
  async getFileStats(): Promise<FileStatsResponse> {
    const res = await this.request<FileStatsResponse>("/file-stats");
    return res;
  }

  // 8. GET /file-stats/:category
  async getCategoryFileStats(
    category: string,
  ): Promise<CategoryFileStatsResponse> {
    const res = await this.request<CategoryFileStatsResponse>(
      `/file-stats/${encodeURIComponent(category)}`,
    );
    return res;
  }

  // Validate file is CDR or TDR
  private validateFileType(file: File): { valid: boolean; error?: string } {
    const fileName = file.name.toLowerCase();
    const validExtensions = ['.cdr', '.tdr'];

    // Check file extension
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));

    if (!hasValidExtension) {
      return {
        valid: false,
        error: `Invalid file type. Only .cdr and .tdr files are allowed. Got: ${file.name.split('.').pop() || 'unknown'}`,
      };
    }

    // Check file size (optional - max 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size exceeds maximum limit of 100MB. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
      };
    }

    return { valid: true };
  }

  // 9. POST /files/upload/etl (file upload endpoint)
  async uploadFile(file: File): Promise<FileUploadResponse> {
    // Validate file
    const validation = this.validateFileType(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const formData = new FormData();
    formData.append("file", file);

    // Use buildDirectBackendUrl which routes through proxy on Vercel (same domain, avoids CORS/SSL issues)
    const url = buildDirectBackendUrl("/files/upload/etl");

    // Get auth headers but exclude Content-Type for FormData
    const authHeaders = getAuthHeaders();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { 'Content-Type': _, ...headersWithoutContentType } = authHeaders as Record<string, string>;

    const response = await fetch(url, {
      method: "POST",
      headers: headersWithoutContentType,
      body: formData,
    });

    const text = await response.text();
    const isJson = text.trim().startsWith("{") || text.trim().startsWith("[");

    if (!text) {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }
      return {
        success: true,
        message: "File uploaded successfully",
      };
    }

    let parsed: unknown;
    try {
      parsed = isJson ? JSON.parse(text) : (text as unknown);
    } catch {
      throw new Error(
        `Invalid JSON response from upload API. First 200 chars: ${text.substring(0, 200)}`,
      );
    }

    if (!response.ok) {
      const errorMessage =
        (parsed as { error?: string; message?: string })?.error ||
        (parsed as { message?: string })?.message ||
        response.statusText ||
        "Upload failed";
      throw new Error(errorMessage);
    }

    return parsed as FileUploadResponse;
  }

  

  // 1. GET /monitoring/etl-file-registry/statistics
  async getFileRegistryStatistics(): Promise<ETLFileRegistryStatisticsResponse> {
    const res = await this.request<ETLFileRegistryStatisticsResponse>(
      "/monitoring/etl-file-registry/statistics",
    );
    return res;
  }

  // 2. GET /monitoring/etl-file-registry/category
  async getFileRegistryCategoryDistribution(): Promise<ETLCategoryDistributionResponse> {
    const res = await this.request<ETLCategoryDistributionResponse>(
      "/monitoring/etl-file-registry/category",
    );
    return res;
  }

  // 3. GET /monitoring/etl-file-registry/processing-status
  async getFileRegistryProcessingStatus(): Promise<ETLProcessingStatusResponse> {
    const res = await this.request<ETLProcessingStatusResponse>(
      "/monitoring/etl-file-registry/processing-status",
    );
    return res;
  }

  // 4. GET /monitoring/etl-file-registry/format-distribution
  async getFileRegistryFormatDistribution(): Promise<ETLFormatDistributionResponse> {
    const res = await this.request<ETLFormatDistributionResponse>(
      "/monitoring/etl-file-registry/format-distribution",
    );
    return res;
  }

  // 5. GET /monitoring/etl-file-registry/fetch-duration-analytics
  async getFileRegistryFetchDurationAnalytics(): Promise<ETLFetchDurationAnalyticsResponse> {
    const res = await this.request<ETLFetchDurationAnalyticsResponse>(
      "/monitoring/etl-file-registry/fetch-duration-analytics",
    );
    return res;
  }

  // 6. GET /monitoring/etl-file-registry/processing-duration-analytics
  async getFileRegistryProcessingDurationAnalytics(): Promise<ETLProcessingDurationAnalyticsResponse> {
    const res = await this.request<ETLProcessingDurationAnalyticsResponse>(
      "/monitoring/etl-file-registry/processing-duration-analytics",
    );
    return res;
  }

  // 7. GET /monitoring/etl-file-registry/row-metrics
  async getFileRegistryRowMetrics(): Promise<ETLRowMetricsResponse> {
    const res = await this.request<ETLRowMetricsResponse>(
      "/monitoring/etl-file-registry/row-metrics",
    );
    return res;
  }

  // 8. GET /monitoring/etl-file-registry/checksum-usuage
  async getFileRegistryChecksumUsage(): Promise<ETLChecksumUsageResponse> {
    const res = await this.request<ETLChecksumUsageResponse>(
      "/monitoring/etl-file-registry/checksum-usuage",
    );
    return res;
  }

  // 9. GET /monitoring/etl-file-registry/trends
  async getFileRegistryTrends(query?: ETLTrendsQuery): Promise<ETLTrendsResponse> {
    const res = await this.request<ETLTrendsResponse>(
      `/monitoring/etl-file-registry/trends${this.buildQueryParams(query as Record<string, unknown>)}`,
    );
    return res;
  }

  // 10. GET /monitoring/etl-file-registry/retry-analysis
  async getFileRegistryRetryAnalysis(): Promise<ETLRetryAnalysisResponse> {
    const res = await this.request<ETLRetryAnalysisResponse>(
      "/monitoring/etl-file-registry/retry-analysis",
    );
    return res;
  }

  // 11. GET /monitoring/etl-file-registry/data-size-analytics
  async getFileRegistryDataSizeAnalytics(): Promise<ETLDataSizeAnalyticsResponse> {
    const res = await this.request<ETLDataSizeAnalyticsResponse>(
      "/monitoring/etl-file-registry/data-size-analytics",
    );
    return res;
  }

  // 12. GET /monitoring/etl-file-registry/error-message-distribution
  async getFileRegistryErrorMessageDistribution(
    query?: ETLErrorMessagePaginationQuery,
  ): Promise<ETLErrorMessageDistributionResponse> {
    const res = await this.request<ETLErrorMessageDistributionResponse>(
      `/monitoring/etl-file-registry/error-message-distribution${this.buildQueryParams(query as Record<string, unknown>)}`,
    );
    return res;
  }

  // 13. GET /monitoring/etl-file-registry/cdr-count
  async getCDRFileCount(): Promise<ETLFileCountResponse> {
    const res = await this.request<ETLFileCountResponse>(
      "/monitoring/etl-file-registry/cdr-count",
    );
    return res;
  }

  // 14. GET /monitoring/etl-file-registry/tdr-count
  async getTDRFileCount(): Promise<ETLFileCountResponse> {
    const res = await this.request<ETLFileCountResponse>(
      "/monitoring/etl-file-registry/tdr-count",
    );
    return res;
  }

  // ============================================
  // Task 2: ETL Task Queue Analytics Methods
  // ============================================

  // 1. GET /monitoring/etl-task-queue/statistics
  async getTaskQueueStatistics(): Promise<ETLTaskStatisticsResponse> {
    const res = await this.request<ETLTaskStatisticsResponse>(
      "/monitoring/etl-task-queue/statistics",
    );
    return res;
  }

  // 2. GET /monitoring/etl-task-queue/type-distribution
  async getTaskQueueTypeDistribution(): Promise<ETLTaskTypeDistributionResponse> {
    const res = await this.request<ETLTaskTypeDistributionResponse>(
      "/monitoring/etl-task-queue/type-distribution",
    );
    return res;
  }

  // 3. GET /monitoring/etl-task-queue/status-distribution
  async getTaskQueueStatusDistribution(): Promise<ETLTaskStatusDistributionResponse> {
    const res = await this.request<ETLTaskStatusDistributionResponse>(
      "/monitoring/etl-task-queue/status-distribution",
    );
    return res;
  }

  // 4. GET /monitoring/etl-task-queue/priority-distribution
  async getTaskQueuePriorityDistribution(): Promise<ETLTaskPriorityDistributionResponse> {
    const res = await this.request<ETLTaskPriorityDistributionResponse>(
      "/monitoring/etl-task-queue/priority-distribution",
    );
    return res;
  }

  // 5. GET /monitoring/etl-task-queue/duration-analytics
  async getTaskQueueDurationAnalytics(): Promise<ETLTaskDurationAnalyticsResponse> {
    const res = await this.request<ETLTaskDurationAnalyticsResponse>(
      "/monitoring/etl-task-queue/duration-analytics",
    );
    return res;
  }

  // 6. GET /monitoring/etl-task-queue/trends
  async getTaskQueueTrends(query?: ETLTaskTrendsQuery): Promise<ETLTaskTrendsResponse> {
    const res = await this.request<ETLTaskTrendsResponse>(
      `/monitoring/etl-task-queue/trends${this.buildQueryParams(query as Record<string, unknown>)}`,
    );
    return res;
  }

  // 7. GET /monitoring/etl-task-queue/file-correlation
  async getTaskQueueFileCorrelation(): Promise<ETLTaskFileCorrelationResponse> {
    const res = await this.request<ETLTaskFileCorrelationResponse>(
      "/monitoring/etl-task-queue/file-correlation",
    );
    return res;
  }

  // 8. GET /monitoring/etl-task-queue/job-correlation
  async getTaskQueueJobCorrelation(): Promise<ETLTaskJobCorrelationResponse> {
    const res = await this.request<ETLTaskJobCorrelationResponse>(
      "/monitoring/etl-task-queue/job-correlation",
    );
    return res;
  }
}

export const etlService = new EtlService();
