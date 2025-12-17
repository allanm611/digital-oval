import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";
import {
  BulkServerStatusRequest,
  BulkServerStatusResponse,
  CreateServerPayload,
  PaginatedServersResponse,
  ServerCountByEnvironment,
  ServerCountByProtocol,
  ServerCountByRegion,
  ServerFilterQuery,
  ServerHealthCheckEnablePayload,
  ServerHealthCheckResultPayload,
  ServerHealthStats,
  ServerListQuery,
  ServerSearchQuery,
  ServerType,
  UpdateServerPayload,
} from "../types/server";

const BASE_URL = buildApiUrl("/servers");

class ServerService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    });

    const responseText = await response.text();
    if (!responseText) {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }
      return undefined as T;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(responseText);
    } catch (_) {
      throw new Error(
        `Invalid JSON response from servers API. First 200 chars: ${responseText.substring(
          0,
          200
        )}`
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
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        return;
      }
      if (Array.isArray(value)) {
        value.forEach((item) => searchParams.append(key, String(item)));
        return;
      }
      searchParams.append(key, String(value));
    });

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : "";
  }

  private unwrapSuccessPayload<T>(response: unknown): T {
    if (
      response &&
      typeof response === "object" &&
      "success" in response &&
      (response as { success?: boolean }).success === true &&
      "data" in response
    ) {
      return (response as { data: T }).data;
    }
    return response as T;
  }

  private appendSkipCache(endpoint: string): string {
    if (endpoint.includes("skipCache=")) {
      return endpoint;
    }
    if (!endpoint || endpoint.length === 0) {
      return "?skipCache=true";
    }
    if (endpoint.endsWith("?")) {
      return `${endpoint}skipCache=true`;
    }
    const separator = endpoint.includes("?")
      ? "&"
      : endpoint.startsWith("/")
      ? "?"
      : "?";
    return `${endpoint}${separator}skipCache=true`;
  }

  private unwrapServer(response: unknown): ServerType {
    const payload = this.unwrapSuccessPayload<unknown>(response);

    if (!payload || typeof payload !== "object") {
      throw new Error("Unexpected response shape from servers API");
    }

    if ("data" in payload && payload.data && typeof payload.data === "object") {
      return payload.data as ServerType;
    }

    if (
      "server" in payload &&
      payload.server &&
      typeof payload.server === "object"
    ) {
      return payload.server as ServerType;
    }

    return payload as ServerType;
  }

  private unwrapServerList(response: unknown): ServerType[] {
    const payload = this.unwrapSuccessPayload<unknown>(response);

    if (Array.isArray(payload)) {
      return payload as ServerType[];
    }

    if (payload && typeof payload === "object") {
      const casted = payload as {
        data?: unknown;
        servers?: unknown;
      };

      if (Array.isArray(casted.data)) {
        return casted.data as ServerType[];
      }

      if (Array.isArray(casted.servers)) {
        return casted.servers as ServerType[];
      }
    }

    throw new Error("Unexpected list response shape from servers API");
  }

  // ==================== Analytics ====================

  async getEnvironmentCounts(): Promise<ServerCountByEnvironment> {
    const response = await this.request<unknown>(
      this.appendSkipCache("/analytics/environment-count")
    );
    const data = this.unwrapSuccessPayload<ServerCountByEnvironment>(response);
    return (data || []).map((item) => ({
      ...item,
      count: Number(item.count),
    }));
  }

  async getProtocolCounts(): Promise<ServerCountByProtocol> {
    const response = await this.request<unknown>(
      this.appendSkipCache("/analytics/protocol-count")
    );
    const data = this.unwrapSuccessPayload<ServerCountByProtocol>(response);
    return (data || []).map((item) => ({
      ...item,
      count: Number(item.count),
    }));
  }

  async getHealthStats(): Promise<ServerHealthStats> {
    const response = await this.request<unknown>(
      this.appendSkipCache("/analytics/health-stats")
    );
    const data = this.unwrapSuccessPayload<ServerHealthStats>(response);
    return {
      ...data,
      total_servers: Number(data.total_servers ?? 0),
      health_check_enabled: Number(data.health_check_enabled ?? 0),
      healthy: Number(data.healthy ?? 0),
      unhealthy: Number(data.unhealthy ?? 0),
      never_checked: Number(data.never_checked ?? 0),
    };
  }

  async getRegionDistribution(): Promise<ServerCountByRegion> {
    const response = await this.request<unknown>(
      this.appendSkipCache("/analytics/region-distribution")
    );
    const data = this.unwrapSuccessPayload<ServerCountByRegion>(response);
    return (data || []).map((item) => ({
      ...item,
      count: Number(item.count),
    }));
  }

  // ==================== Health Check Listings ====================

  async listHealthCheckEnabled(): Promise<ServerType[]> {
    const response = await this.request<unknown>(
      this.appendSkipCache("/health-check/enabled")
    );
    return this.unwrapServerList(response);
  }

  async listHealthCheckFailing(): Promise<ServerType[]> {
    const response = await this.request<unknown>(
      this.appendSkipCache("/health-check/failing")
    );
    return this.unwrapServerList(response);
  }

  async listHealthCheckDue(): Promise<ServerType[]> {
    const response = await this.request<unknown>(
      this.appendSkipCache("/health-check/due")
    );
    return this.unwrapServerList(response);
  }

  // ==================== Bulk Activation ====================

  async bulkActivateServers(
    payload: BulkServerStatusRequest
  ): Promise<BulkServerStatusResponse> {
    return this.request<BulkServerStatusResponse>("/bulk/activate", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  }

  async bulkDeactivateServers(
    payload: BulkServerStatusRequest
  ): Promise<BulkServerStatusResponse> {
    return this.request<BulkServerStatusResponse>("/bulk/deactivate", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  }

  // ==================== Search & Lookups ====================

  async searchServers(query: ServerSearchQuery): Promise<ServerType[]> {
    const queryString = this.buildQueryParams({
      searchTerm: query.searchTerm,
      ...(query.limit != null ? { limit: query.limit } : {}),
      ...(query.offset != null ? { offset: query.offset } : {}),
      ...(query.activeOnly != null ? { activeOnly: query.activeOnly } : {}),
    });
    const response = await this.request<unknown>(
      this.appendSkipCache(`/search${queryString}`)
    );
    return this.unwrapServerList(response);
  }

  async getDeprecatedServers(query?: ServerListQuery): Promise<ServerType[]> {
    const queryString = this.buildQueryParams(
      query as unknown as Record<string, unknown> | undefined
    );
    const response = await this.request<unknown>(`/deprecated${queryString}`);
    return this.unwrapServerList(response);
  }

  async getActiveServers(query?: ServerListQuery): Promise<ServerType[]> {
    const queryString = this.buildQueryParams(
      query as Record<string, unknown> | undefined
    );
    const response = await this.request<unknown>(`/active${queryString}`);
    return this.unwrapServerList(response);
  }

  async getServersByEnvironment(
    environment: string,
    query?: ServerFilterQuery
  ): Promise<ServerType[]> {
    const queryString = this.buildQueryParams(
      query as Record<string, unknown> | undefined
    );
    const response = await this.request<unknown>(
      `/environment/${encodeURIComponent(environment)}${queryString}`
    );
    return this.unwrapServerList(response);
  }

  async getServersByType(
    serverType: string,
    query?: ServerFilterQuery
  ): Promise<ServerType[]> {
    const queryString = this.buildQueryParams(
      query as Record<string, unknown> | undefined
    );
    const response = await this.request<unknown>(
      `/type/${encodeURIComponent(serverType)}${queryString}`
    );
    return this.unwrapServerList(response);
  }

  async getServersByProtocol(
    protocol: string,
    query?: ServerFilterQuery
  ): Promise<ServerType[]> {
    const queryString = this.buildQueryParams(
      query as Record<string, unknown> | undefined
    );
    const response = await this.request<unknown>(
      `/protocol/${encodeURIComponent(protocol)}${queryString}`
    );
    return this.unwrapServerList(response);
  }

  async getServersByRegion(
    region: string,
    query?: ServerFilterQuery
  ): Promise<ServerType[]> {
    const queryString = this.buildQueryParams(
      query as Record<string, unknown> | undefined
    );
    const response = await this.request<unknown>(
      `/region/${encodeURIComponent(region)}${queryString}`
    );
    return this.unwrapServerList(response);
  }

  async getServerByName(name: string): Promise<ServerType> {
    const response = await this.request<unknown>(
      `/name/${encodeURIComponent(name)}`
    );
    return this.unwrapServer(response);
  }

  async getServerByCode(code: string): Promise<ServerType> {
    const response = await this.request<unknown>(
      `/code/${encodeURIComponent(code)}`
    );
    return this.unwrapServer(response);
  }

  // ==================== CRUD ====================

  async listServers(
    query?: ServerListQuery
  ): Promise<PaginatedServersResponse> {
    const queryString = this.buildQueryParams(
      query as Record<string, unknown> | undefined
    );
    const endpoint = this.appendSkipCache(queryString || "");
    const response = await this.request<
      PaginatedServersResponse | ServerType[]
    >(endpoint);
    const payload = this.unwrapSuccessPayload<
      | ServerType[]
      | {
          data?: ServerType[];
          pagination?: {
            limit?: number;
            offset?: number;
            total?: number;
            hasMore?: boolean;
          };
        }
    >(response);

    if (Array.isArray(payload)) {
      return { data: payload };
    }

    if (payload && Array.isArray(payload.data)) {
      return {
        data: payload.data,
        meta: {
          limit: payload.pagination?.limit,
          offset: payload.pagination?.offset,
          total: payload.pagination?.total,
          hasMore: payload.pagination?.hasMore,
        },
      };
    }

    return payload as PaginatedServersResponse;
  }

  async createServer(payload: CreateServerPayload): Promise<ServerType> {
    const response = await this.request<unknown>(`/`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return this.unwrapServer(response);
  }

  async getServerById(id: number): Promise<ServerType> {
    const response = await this.request<unknown>(`/${id}`);
    return this.unwrapServer(response);
  }

  async updateServer(
    id: number,
    payload: UpdateServerPayload
  ): Promise<ServerType> {
    const response = await this.request<unknown>(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return this.unwrapServer(response);
  }

  // ==================== Health Check Operations ====================

  async pushHealthCheckResult(
    id: number,
    payload: ServerHealthCheckResultPayload
  ): Promise<ServerType> {
    const response = await this.request<unknown>(`/${id}/health-check/result`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return this.unwrapServer(response);
  }

  async resetHealthCheck(id: number): Promise<ServerType> {
    const response = await this.request<unknown>(`/${id}/health-check/reset`, {
      method: "PATCH",
    });
    return this.unwrapServer(response);
  }

  async enableHealthCheck(
    id: number,
    payload?: ServerHealthCheckEnablePayload
  ): Promise<ServerType> {
    const response = await this.request<unknown>(`/${id}/health-check/enable`, {
      method: "PATCH",
      body: payload ? JSON.stringify(payload) : undefined,
    });
    return this.unwrapServer(response);
  }

  async disableHealthCheck(id: number): Promise<ServerType> {
    const response = await this.request<unknown>(
      `/${id}/health-check/disable`,
      {
        method: "PATCH",
      }
    );
    return this.unwrapServer(response);
  }

  // ==================== Circuit Breaker ====================

  async enableCircuitBreaker(id: number): Promise<ServerType> {
    const response = await this.request<unknown>(
      `/${id}/circuit-breaker/enable`,
      {
        method: "PATCH",
      }
    );
    return this.unwrapServer(response);
  }

  async disableCircuitBreaker(id: number): Promise<ServerType> {
    const response = await this.request<unknown>(
      `/${id}/circuit-breaker/disable`,
      {
        method: "PATCH",
      }
    );
    return this.unwrapServer(response);
  }

  // ==================== Status Operations ====================

  async activateServer(id: number): Promise<ServerType> {
    const response = await this.request<unknown>(`/${id}/activate`, {
      method: "PATCH",
    });
    return this.unwrapServer(response);
  }

  async deactivateServer(id: number): Promise<ServerType> {
    const response = await this.request<unknown>(`/${id}/deactivate`, {
      method: "PATCH",
    });
    return this.unwrapServer(response);
  }

  async deprecateServer(id: number): Promise<ServerType> {
    const response = await this.request<unknown>(`/${id}/deprecate`, {
      method: "PATCH",
    });
    return this.unwrapServer(response);
  }

  async undeprecateServer(id: number): Promise<ServerType> {
    const response = await this.request<unknown>(`/${id}/undeprecate`, {
      method: "PATCH",
    });
    return this.unwrapServer(response);
  }
}

export const serverService = new ServerService();
