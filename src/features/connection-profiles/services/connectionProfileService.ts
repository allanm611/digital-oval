import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";
import {
  AutoDeactivateExpiredRequest,
  AutoDeactivateExpiredResponse,
  BulkActivateConnectionProfilesRequest,
  BulkActivateConnectionProfilesResponse,
  ConnectionProfileDataGovernanceStats,
  ConnectionProfileEnvironmentStatsItem,
  ConnectionProfileHealthCheckPayload,
  ConnectionProfileListQuery,
  ConnectionProfileListResponse,
  ConnectionProfileSearchQuery,
  ConnectionProfileSearchResponse,
  ConnectionProfileType,
  ConnectionProfileTypeStatsItem,
  ConnectionProfileValidityPayload,
  ConnectionProfileValidityResponse,
  CreateConnectionProfilePayload,
  UpdateConnectionProfilePayload,
} from "../types/connectionProfile";

const BASE_URL = buildApiUrl("/connection-profiles");

class ConnectionProfileService {
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
    const hasBody = responseText.length > 0;
    let parsed: unknown = undefined;

    if (hasBody) {
      try {
        parsed = JSON.parse(responseText);
      } catch {
        throw new Error(`Invalid JSON response from connection profiles API`);
      }
    }

    if (!response.ok) {
      const message =
        (parsed as { error?: string })?.error ||
        (parsed as { message?: string })?.message ||
        response.statusText ||
        "Request failed";
      throw new Error(message);
    }

    if (
      parsed &&
      typeof parsed === "object" &&
      "success" in parsed &&
      (parsed as { success?: boolean }).success === false
    ) {
      const message =
        (parsed as { error?: string })?.error ||
        (parsed as { message?: string })?.message ||
        "Operation failed";
      throw new Error(message);
    }

    return (parsed as T) ?? (undefined as T);
  }

  private unwrapData<T>(payload: unknown): T {
    if (
      payload &&
      typeof payload === "object" &&
      "data" in payload &&
      (payload as { data?: T }).data !== undefined
    ) {
      return (payload as { data: T }).data;
    }
    return payload as T;
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

    const query = searchParams.toString();
    return query ? `?${query}` : "";
  }

  private withSkipCache(endpoint: string, skipCache?: boolean): string {
    if (!skipCache) {
      return endpoint;
    }
    if (endpoint.includes("skipCache=")) {
      return endpoint;
    }
    const separator = endpoint.includes("?")
      ? "&"
      : endpoint.endsWith("/")
      ? "?"
      : "?";
    return `${endpoint}${separator}skipCache=true`;
  }

  // ========= CRUD =========

  async createProfile(
    payload: CreateConnectionProfilePayload
  ): Promise<ConnectionProfileType> {
    const response = await this.request<unknown>("/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    return this.unwrapData<ConnectionProfileType>(response);
  }

  async updateProfile(
    id: number,
    payload: UpdateConnectionProfilePayload
  ): Promise<ConnectionProfileType> {
    const response = await this.request<unknown>(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return this.unwrapData<ConnectionProfileType>(response);
  }

  async getProfile(
    id: number,
    skipCache: boolean = true
  ): Promise<ConnectionProfileType> {
    const endpoint = this.withSkipCache(`/${id}`, skipCache);
    const response = await this.request<unknown>(endpoint);
    return this.unwrapData<ConnectionProfileType>(response);
  }

  async listProfiles(
    query?: ConnectionProfileListQuery
  ): Promise<ConnectionProfileListResponse> {
    const queryString = this.buildQueryParams({
      limit: query?.limit,
      offset: query?.offset,
      skipCache: query?.skipCache,
    });
    const response = await this.request<
      | ConnectionProfileListResponse
      | ConnectionProfileType[]
      | { data: ConnectionProfileType[] }
    >(`/${queryString}`);

    if (Array.isArray(response)) {
      return { data: response };
    }

    if (response && typeof response === "object" && "data" in response) {
      return {
        data: (response as { data: ConnectionProfileType[] }).data ?? [],
        count: (response as { count?: number }).count,
        pagination: (response as ConnectionProfileListResponse).pagination,
      };
    }

    return {
      data: this.unwrapData<ConnectionProfileType[]>(response),
    };
  }

  // ========= Lifecycle =========

  async activateProfile(id: number, updated_by?: number) {
    const response = await this.request<unknown>(`/${id}/activate`, {
      method: "PATCH",
      body: updated_by ? JSON.stringify({ updated_by }) : undefined,
    });
    return this.unwrapData<ConnectionProfileType>(response);
  }

  async deactivateProfile(id: number, updated_by?: number) {
    const response = await this.request<unknown>(`/${id}/deactivate`, {
      method: "PATCH",
      body: updated_by ? JSON.stringify({ updated_by }) : undefined,
    });
    return this.unwrapData<ConnectionProfileType>(response);
  }

  async markProfileUsed(id: number): Promise<ConnectionProfileType> {
    const response = await this.request<unknown>(`/${id}/mark-used`, {
      method: "PATCH",
    });
    return this.unwrapData<ConnectionProfileType>(response);
  }

  async updateHealthStatus(
    id: number,
    payload: ConnectionProfileHealthCheckPayload
  ): Promise<ConnectionProfileType> {
    const response = await this.request<unknown>(`/${id}/health-check`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return this.unwrapData<ConnectionProfileType>(response);
  }

  async updateValidityPeriod(
    id: number,
    payload: ConnectionProfileValidityPayload
  ): Promise<ConnectionProfileType> {
    const response = await this.request<unknown>(`/${id}/validity-period`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return this.unwrapData<ConnectionProfileType>(response);
  }

  // ========= Bulk & Automation =========

  async bulkActivateProfiles(
    payload: BulkActivateConnectionProfilesRequest
  ): Promise<BulkActivateConnectionProfilesResponse> {
    return this.request<BulkActivateConnectionProfilesResponse>(
      "/bulk-activate",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  }

  async autoDeactivateExpired(
    payload?: AutoDeactivateExpiredRequest
  ): Promise<AutoDeactivateExpiredResponse> {
    return this.request<AutoDeactivateExpiredResponse>(
      "/auto-deactivate-expired",
      {
        method: "POST",
        body: payload ? JSON.stringify(payload) : undefined,
      }
    );
  }

  // ========= Stats & Analytics =========

  async getConnectionTypeStats(
    skipCache?: boolean
  ): Promise<ConnectionProfileTypeStatsItem[]> {
    const endpoint = this.withSkipCache("/stats/by-connection-type", skipCache);
    const response = await this.request<unknown>(endpoint);
    const data =
      this.unwrapData<ConnectionProfileTypeStatsItem[]>(response) || [];
    return data.map((item) => ({
      ...item,
      count: Number(item.count) || 0,
    }));
  }

  async getEnvironmentStats(
    skipCache?: boolean
  ): Promise<ConnectionProfileEnvironmentStatsItem[]> {
    const endpoint = this.withSkipCache("/stats/by-environment", skipCache);
    const response = await this.request<unknown>(endpoint);
    const data =
      this.unwrapData<ConnectionProfileEnvironmentStatsItem[]>(response) || [];
    return data.map((item) => ({
      ...item,
      count: Number(item.count) || 0,
    }));
  }

  async getDataGovernanceStats(
    skipCache?: boolean
  ): Promise<ConnectionProfileDataGovernanceStats> {
    const endpoint = this.withSkipCache("/stats/data-governance", skipCache);
    const response = await this.request<unknown>(endpoint);
    return this.unwrapData<ConnectionProfileDataGovernanceStats>(response);
  }

  async getMostUsedProfiles(
    skipCache?: boolean
  ): Promise<ConnectionProfileType[]> {
    const endpoint = this.withSkipCache("/most-used", skipCache);
    const response = await this.request<unknown>(endpoint);
    return this.unwrapData<ConnectionProfileType[]>(response);
  }

  async getActiveProfiles(
    skipCache?: boolean
  ): Promise<ConnectionProfileType[]> {
    const endpoint = this.withSkipCache("/active", skipCache);
    const response = await this.request<unknown>(endpoint);
    return this.unwrapData<ConnectionProfileType[]>(response);
  }

  async getProfilesWithPii(
    skipCache?: boolean
  ): Promise<ConnectionProfileType[]> {
    const endpoint = this.withSkipCache("/with-pii", skipCache);
    const response = await this.request<unknown>(endpoint);
    return this.unwrapData<ConnectionProfileType[]>(response);
  }

  async getHealthCheckEnabledProfiles(
    skipCache?: boolean
  ): Promise<ConnectionProfileType[]> {
    const endpoint = this.withSkipCache("/health-check-enabled", skipCache);
    const response = await this.request<unknown>(endpoint);
    return this.unwrapData<ConnectionProfileType[]>(response);
  }

  async getExpiredProfiles(
    skipCache?: boolean
  ): Promise<ConnectionProfileType[]> {
    const endpoint = this.withSkipCache("/expired", skipCache);
    const response = await this.request<unknown>(endpoint);
    return this.unwrapData<ConnectionProfileType[]>(response);
  }

  // ========= Search & Filters =========

  async searchProfiles(
    query: ConnectionProfileSearchQuery
  ): Promise<ConnectionProfileSearchResponse> {
    const queryString = this.buildQueryParams(query as Record<string, unknown>);
    const endpoint = this.withSkipCache(
      `/search${queryString}`,
      query.skipCache
    );
    const response = await this.request<ConnectionProfileSearchResponse>(
      endpoint
    );
    return {
      data: response.data ?? [],
      pagination: response.pagination,
      source: response.source,
      success: response.success,
    };
  }

  async getProfilesByConnectionType(
    type: string,
    query?: ConnectionProfileListQuery
  ): Promise<ConnectionProfileType[]> {
    const queryString = this.buildQueryParams({
      limit: query?.limit,
      offset: query?.offset,
      skipCache: query?.skipCache,
    });
    const endpoint = this.withSkipCache(
      `/connection-type/${encodeURIComponent(type)}${queryString}`,
      query?.skipCache
    );
    const response = await this.request<unknown>(endpoint);
    return this.unwrapData<ConnectionProfileType[]>(response);
  }

  async getProfilesByEnvironment(
    environment: string,
    query?: ConnectionProfileListQuery
  ): Promise<ConnectionProfileType[]> {
    const queryString = this.buildQueryParams({
      limit: query?.limit,
      offset: query?.offset,
      skipCache: query?.skipCache,
    });
    const endpoint = this.withSkipCache(
      `/environment/${encodeURIComponent(environment)}${queryString}`,
      query?.skipCache
    );
    const response = await this.request<unknown>(endpoint);
    return this.unwrapData<ConnectionProfileType[]>(response);
  }

  async getProfilesByServer(
    serverId: number,
    query?: ConnectionProfileListQuery
  ): Promise<ConnectionProfileType[]> {
    const queryString = this.buildQueryParams({
      limit: query?.limit,
      offset: query?.offset,
      skipCache: query?.skipCache,
    });
    const endpoint = this.withSkipCache(
      `/server/${serverId}${queryString}`,
      query?.skipCache
    );
    const response = await this.request<unknown>(endpoint);
    return this.unwrapData<ConnectionProfileType[]>(response);
  }

  async getProfilesByClassification(
    classification: string,
    query?: ConnectionProfileListQuery
  ): Promise<ConnectionProfileType[]> {
    const queryString = this.buildQueryParams({
      limit: query?.limit,
      offset: query?.offset,
      skipCache: query?.skipCache,
    });
    const endpoint = this.withSkipCache(
      `/classification/${encodeURIComponent(classification)}${queryString}`,
      query?.skipCache
    );
    const response = await this.request<unknown>(endpoint);
    return this.unwrapData<ConnectionProfileType[]>(response);
  }

  async checkProfileValidity(
    id: number,
    skipCache?: boolean
  ): Promise<ConnectionProfileValidityResponse> {
    const endpoint = this.withSkipCache(`/${id}/is-valid`, skipCache);
    return this.request<ConnectionProfileValidityResponse>(endpoint);
  }
}

export const connectionProfileService = new ConnectionProfileService();
