import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";
import { fetchWithAuthInterceptor } from "../../../shared/services/fetchInterceptor";
import {
  ConnectionProfilePipeline,
  PipelineActionType,
  PipelineListQuery,
  PipelineListResponse,
  PipelineLoadStrategy,
  PipelineSourceType,
  PipelineWritePayload,
} from "../types/pipeline";
import {
  normalizeFieldMappings,
  normalizeSourceConfig,
} from "../utils/pipelineForm";
import { createDummyPipelines } from "../data/dummyPipelines";

const BASE_URL = buildApiUrl("/connection-profile-pipelines");

const ACTION_TYPES: PipelineActionType[] = ["PULL", "PUSH", "READ", "SYNC"];
const SOURCE_TYPES: PipelineSourceType[] = [
  "FTP_FILE",
  "DATABASE_QUERY",
  "REST_API",
];
const LOAD_STRATEGIES: PipelineLoadStrategy[] = [
  "BATCH_INSERT",
  "UPSERT",
  "APPEND",
];

function asEnum<T extends string>(value: unknown, allowed: T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

const MAX_LIST_LIMIT = 100;

function isEndpointMissing(error: unknown): boolean {
  const status = (error as { status?: number }).status;
  if (status === 404 || status === 405 || status === 501 || status === 502 || status === 503) {
    return true;
  }
  if (status) return false;
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return (
    message.includes("failed to fetch") ||
    message.includes("network") ||
    message.includes("invalid json") ||
    message.includes("not found")
  );
}

function canShowSampleData(error: unknown): boolean {
  const status = (error as { status?: number }).status;
  if (status === 401 || status === 403) return false;
  return true;
}

/** In-memory stand-in for cvm.connection_profile_pipelines. */
class SamplePipelineStore {
  private rows = createDummyPipelines();

  private clone(pipeline: ConnectionProfilePipeline): ConnectionProfilePipeline {
    return {
      ...pipeline,
      source_config: { ...pipeline.source_config },
      field_mappings: pipeline.field_mappings.map((mapping) => ({ ...mapping })),
    };
  }

  list(query?: PipelineListQuery): PipelineListResponse {
    let data = this.rows.map((row) => this.clone(row));
    if (query?.connection_profile_id) {
      data = data.filter(
        (row) => row.connection_profile_id === query.connection_profile_id,
      );
    }
    if (query?.action_type) {
      data = data.filter((row) => row.action_type === query.action_type);
    }
    if (query?.source_type) {
      data = data.filter((row) => row.source_type === query.source_type);
    }
    if (query?.is_active !== undefined) {
      data = data.filter((row) => row.is_active === query.is_active);
    }
    const offset = query?.offset ?? 0;
    const limit = query?.limit ?? data.length;
    const page = data.slice(offset, offset + limit);
    return {
      data: page,
      count: data.length,
      source: "sample",
      pagination: {
        limit,
        offset,
        total: data.length,
        hasMore: offset + page.length < data.length,
      },
    };
  }

  get(id: number): ConnectionProfilePipeline {
    const row = this.rows.find((pipeline) => pipeline.id === id);
    if (!row) throw new Error("Pipeline not found");
    return this.clone(row);
  }

  create(payload: PipelineWritePayload): ConnectionProfilePipeline {
    const now = new Date().toISOString();
    const nextId = this.rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
    const created: ConnectionProfilePipeline = {
      ...payload,
      id: nextId,
      created_at: now,
      updated_at: now,
    };
    this.rows = [created, ...this.rows];
    return this.clone(created);
  }

  update(id: number, payload: PipelineWritePayload): ConnectionProfilePipeline {
    const current = this.get(id);
    const updated: ConnectionProfilePipeline = {
      ...current,
      ...payload,
      id,
      updated_at: new Date().toISOString(),
    };
    this.rows = this.rows.map((row) => (row.id === id ? updated : row));
    return this.clone(updated);
  }

  delete(id: number): void {
    this.get(id);
    this.rows = this.rows.filter((row) => row.id !== id);
  }
}

const samplePipelines = new SamplePipelineStore();

export function normalizePipeline(raw: unknown): ConnectionProfilePipeline {
  const row = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  return {
    id: Number(row.id),
    connection_profile_id: Number(row.connection_profile_id),
    pipeline_name: String(row.pipeline_name ?? ""),
    action_type: asEnum(row.action_type, ACTION_TYPES, "PULL"),
    source_type: asEnum(row.source_type, SOURCE_TYPES, "DATABASE_QUERY"),
    source_config: normalizeSourceConfig(row.source_config),
    field_mappings: normalizeFieldMappings(row.field_mappings),
    target_schema: String(row.target_schema ?? "cvm"),
    target_table: String(row.target_table ?? ""),
    load_strategy: asEnum(row.load_strategy, LOAD_STRATEGIES, "BATCH_INSERT"),
    batch_size: Number(row.batch_size ?? 1000) || 1000,
    is_active: row.is_active !== false && row.is_active !== "false",
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
    profile_name:
      typeof row.profile_name === "string" ? row.profile_name : undefined,
    connection_type:
      typeof row.connection_type === "string" ? row.connection_type : undefined,
  };
}

class ConnectionProfilePipelineService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const response = await fetchWithAuthInterceptor(`${BASE_URL}${endpoint}`, {
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    });

    const responseText = await response.text();
    let parsed: unknown = undefined;
    if (responseText.length > 0) {
      try {
        parsed = JSON.parse(responseText);
      } catch {
        throw new Error("Invalid JSON response from connection profile pipelines API");
      }
    }

    if (!response.ok) {
      const message =
        (parsed as { error?: string })?.error ||
        (parsed as { message?: string })?.message ||
        response.statusText ||
        "Request failed";
      const error = new Error(message) as Error & { status?: number };
      error.status = response.status;
      throw error;
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
      if (value === undefined || value === null || value === "") return;
      searchParams.append(key, String(value));
    });
    const query = searchParams.toString();
    return query ? `?${query}` : "";
  }

  async listPipelines(query?: PipelineListQuery): Promise<PipelineListResponse> {
    const safeQuery: PipelineListQuery = {
      ...query,
      limit: Math.min(query?.limit ?? MAX_LIST_LIMIT, MAX_LIST_LIMIT),
    };
    const queryString = this.buildQueryParams({
      connection_profile_id: safeQuery.connection_profile_id,
      action_type: safeQuery.action_type,
      source_type: safeQuery.source_type,
      is_active: safeQuery.is_active,
      limit: safeQuery.limit,
      offset: safeQuery.offset,
      skipCache: safeQuery.skipCache,
    });
    try {
      const response = await this.request<unknown>(`/${queryString}`);
      const rows = Array.isArray(response)
        ? response
        : this.unwrapData<unknown[]>(response);

      const data = (Array.isArray(rows) ? rows : []).map(normalizePipeline);
      if (data.length === 0) {
        return samplePipelines.list(safeQuery);
      }
      const envelope = response as PipelineListResponse | undefined;
      return {
        data,
        count: envelope && !Array.isArray(response) ? envelope.count : data.length,
        source: "api",
        pagination:
          envelope && !Array.isArray(response) ? envelope.pagination : undefined,
      };
    } catch (error) {
      if (!canShowSampleData(error)) throw error;
      return samplePipelines.list(safeQuery);
    }
  }

  async getPipeline(id: number): Promise<ConnectionProfilePipeline> {
    try {
      const response = await this.request<unknown>(`/${id}?skipCache=true`);
      return normalizePipeline(this.unwrapData(response));
    } catch (error) {
      if (!isEndpointMissing(error)) throw error;
      return samplePipelines.get(id);
    }
  }

  async createPipeline(
    payload: PipelineWritePayload,
  ): Promise<ConnectionProfilePipeline> {
    try {
      const response = await this.request<unknown>("/", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return normalizePipeline(this.unwrapData(response));
    } catch (error) {
      if (!isEndpointMissing(error)) throw error;
      return samplePipelines.create(payload);
    }
  }

  async updatePipeline(
    id: number,
    payload: PipelineWritePayload,
  ): Promise<ConnectionProfilePipeline> {
    try {
      const response = await this.request<unknown>(`/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      return normalizePipeline(this.unwrapData(response));
    } catch (error) {
      if (!isEndpointMissing(error)) throw error;
      return samplePipelines.update(id, payload);
    }
  }

  async deletePipeline(id: number): Promise<void> {
    try {
      await this.request<unknown>(`/${id}`, { method: "DELETE" });
    } catch (error) {
      if (!isEndpointMissing(error)) throw error;
      samplePipelines.delete(id);
    }
  }

  async setActive(
    id: number,
    isActive: boolean,
  ): Promise<ConnectionProfilePipeline> {
    try {
      const response = await this.request<unknown>(
        `/${id}/${isActive ? "activate" : "deactivate"}`,
        { method: "PATCH" },
      );
      return normalizePipeline(this.unwrapData(response));
    } catch (error) {
      const status = (error as { status?: number }).status;
      if (status !== 404 && status !== 405) throw error;
      const current = await this.getPipeline(id);
      return this.updatePipeline(id, {
        connection_profile_id: current.connection_profile_id,
        pipeline_name: current.pipeline_name,
        action_type: current.action_type,
        source_type: current.source_type,
        source_config: current.source_config,
        field_mappings: current.field_mappings,
        target_schema: current.target_schema,
        target_table: current.target_table,
        load_strategy: current.load_strategy,
        batch_size: current.batch_size,
        is_active: isActive,
      });
    }
  }
}

export const connectionProfilePipelineService =
  new ConnectionProfilePipelineService();
