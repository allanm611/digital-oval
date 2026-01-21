import { API_CONFIG, getAuthHeaders } from "../../../shared/services/api";
import {
  QuickListResponse,
  SingleQuickListResponse,
  QuickListDataResponseUnion,
  ImportLogsResponse,
  CreateQuickListRequest,
  UpdateQuickListRequest,
  QuickListStatsResponseUnion,
  TableMappingsResponseUnion,
  CreateQuickListResponseUnion,
  UpdateQuickListResponseUnion,
  DeleteQuickListResponseUnion,
} from "../types/quicklist";

const BASE_URL = `${API_CONFIG.BASE_URL}/quicklists`;

class QuickListService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (_) {
      // If response is not JSON, treat as error
      console.error("API Error Response (non-JSON):", {
        status: response.status,
        statusText: response.statusText,
        body: text,
        url,
      });
      throw new Error(
        `HTTP error! status: ${response.status}, details: ${text}`,
      );
    }

    // Check if response is an error response
    if (!response.ok || ("success" in data && !data.success)) {
      const errorMessage =
        "error" in data ? data.error : `HTTP error! status: ${response.status}`;
      console.error("API Error Response:", {
        status: response.status,
        statusText: response.statusText,
        body: data,
        url,
      });
      throw new Error(errorMessage);
    }

    return data;
  }

  // QuickList Management
  async getAllQuickLists(params?: {
    limit?: number;
    offset?: number;
    skipCache?: boolean;
  }): Promise<QuickListResponse> {
    const queryParams = new URLSearchParams();
    // Always skip cache by default
    queryParams.append("skipCache", "true");
    if (params) {
      if (params.limit) queryParams.append("limit", String(params.limit));
      if (params.offset) queryParams.append("offset", String(params.offset));
    }
    const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
    return this.request<QuickListResponse>(`${query}`);
  }

  async getQuickListById(
    id: number,
    skipCache: boolean = true,
  ): Promise<SingleQuickListResponse> {
    const query = skipCache ? "?skipCache=true" : "";
    return this.request<SingleQuickListResponse>(`/${id}${query}`);
  }

  async getQuickListData(
    id: number,
    params?: {
      limit?: number;
      offset?: number;
      skipCache?: boolean;
    },
  ): Promise<QuickListDataResponseUnion> {
    const queryParams = new URLSearchParams();
    // Always skip cache by default
    queryParams.append("skipCache", "true");
    if (params) {
      if (params.limit) queryParams.append("limit", String(params.limit));
      if (params.offset) queryParams.append("offset", String(params.offset));
    }
    const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
    return this.request<QuickListDataResponseUnion>(`/${id}/data${query}`);
  }

  async getImportLogs(
    id: number,
    params?: {
      status?: "success" | "failed" | "skipped";
      limit?: number;
      offset?: number;
      skipCache?: boolean;
    },
  ): Promise<ImportLogsResponse> {
    const queryParams = new URLSearchParams();
    // Always skip cache by default
    queryParams.append("skipCache", "true");
    if (params) {
      if (params.status) queryParams.append("status", params.status);
      if (params.limit) queryParams.append("limit", String(params.limit));
      if (params.offset) queryParams.append("offset", String(params.offset));
    }
    const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
    return this.request<ImportLogsResponse>(`/${id}/logs${query}`);
  }

  async createQuickList(
    request: CreateQuickListRequest,
  ): Promise<CreateQuickListResponseUnion> {
    const formData = new FormData();
    formData.append("name", request.name);
    if (request.description) {
      formData.append("description", request.description);
    }
    if (request.created_by) {
      formData.append("created_by", String(request.created_by));
    }
    if (request.file_text) {
      formData.append("file", new Blob([request.file_text], { type: "text/plain" }), request.file_name || "file.txt");
    }
    if (request.file_delimiter) {
      formData.append("file_delimiter", request.file_delimiter);
    }
    if (request.subscriber_id_col_name) {
      formData.append("subscriber_id_col_name", request.subscriber_id_col_name);
    }
    if (request.list_headers) {
      formData.append("list_headers", request.list_headers);
    }

    const url = `${BASE_URL}/upload`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
      },
      body: formData,
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (_) {
      // If response is not JSON, treat as error
      console.error("API Error Response (non-JSON):", {
        status: response.status,
        statusText: response.statusText,
        body: text,
        url,
      });
      throw new Error(
        `HTTP error! status: ${response.status}, details: ${text}`,
      );
    }

    // Check if response is an error response
    if (!response.ok || ("success" in data && !data.success)) {
      const errorMessage =
        "error" in data ? data.error : `HTTP error! status: ${response.status}`;
      console.error("API Error Response:", {
        status: response.status,
        statusText: response.statusText,
        body: data,
        url,
      });
      throw new Error(errorMessage);
    }

    return data;
  }

  async updateQuickList(
    id: number,
    request: UpdateQuickListRequest,
  ): Promise<UpdateQuickListResponseUnion> {
    return this.request<UpdateQuickListResponseUnion>(`/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });
  }

  async deleteQuickList(id: number): Promise<DeleteQuickListResponseUnion> {
    return this.request<DeleteQuickListResponseUnion>(`/${id}`, {
      method: "DELETE",
    });
  }

  // Search
  async searchQuickLists(params: {
    q: string;
    created_by?: string;
    limit?: number;
    offset?: number;
    skipCache?: boolean;
  }): Promise<QuickListResponse> {
    const queryParams = new URLSearchParams();
    // Always skip cache by default
    queryParams.append("skipCache", "true");
    queryParams.append("q", params.q);
    if (params.created_by) queryParams.append("created_by", params.created_by);
    if (params.limit) queryParams.append("limit", String(params.limit));
    if (params.offset) queryParams.append("offset", String(params.offset));

    return this.request<QuickListResponse>(`/search?${queryParams.toString()}`);
  }

  // Export
  async exportQuickList(
    id: number,
    format: "csv" | "json" = "csv",
  ): Promise<Blob> {
    const url = `${BASE_URL}/${id}/export?format=${format}`;
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Export failed: ${response.statusText}`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error) {
          errorMessage = errorJson.error;
        }
      } catch (_) {
        // If error is not JSON, use the text as-is
        if (errorText) {
          errorMessage = errorText;
        }
      }
      throw new Error(errorMessage);
    }

    return response.blob();
  }

  // Statistics
  async getStats(params?: {
    created_by?: string;
    start_date?: string;
    end_date?: string;
    skipCache?: boolean;
  }): Promise<QuickListStatsResponseUnion> {
    const queryParams = new URLSearchParams();
    // Always skip cache by default
    queryParams.append("skipCache", "true");
    if (params) {
      if (params.created_by)
        queryParams.append("created_by", params.created_by);
      if (params.start_date)
        queryParams.append("start_date", params.start_date);
      if (params.end_date) queryParams.append("end_date", params.end_date);
    }
    const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
    return this.request<QuickListStatsResponseUnion>(`/stats${query}`);
  }

  // Table Mappings
  async getTableMappings(params?: {
    activeOnly?: boolean;
    skipCache?: boolean;
  }): Promise<TableMappingsResponseUnion> {
    const queryParams = new URLSearchParams();
    const skipCache = params?.skipCache !== false; // Default to true
    queryParams.append("skipCache", String(skipCache));
    if (params?.activeOnly !== undefined) {
      queryParams.append("activeOnly", String(params.activeOnly));
    }
    const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
    return this.request<TableMappingsResponseUnion>(`/mappings${query}`);
  }
}

export const quicklistService = new QuickListService();
export default quicklistService;
