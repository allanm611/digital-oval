import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";
import {
  CategoryFileStatsResponse,
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
}

export const etlService = new EtlService();
