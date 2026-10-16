import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";
import { fetchWithAuthInterceptor } from "../../../shared/services/fetchInterceptor";
import {
  ConnectionProfilePipeline,
  PipelineActionType,
  PipelineExecutionResult,
  PipelineListQuery,
  PipelineListResponse,
  PipelineLoadStrategy,
  PipelineSourceType,
  PipelineUpdatePayload,
  PipelineWritePayload,
} from "../types/pipeline";
import {
  normalizeFieldMappings,
  normalizeSourceConfig,
} from "../utils/pipelineForm";
import { pipelineRuntimeService } from "./pipelineRuntimeService";
import {
  columnsFromApiPayload,
  DiscoveredColumn,
  DiscoveredTable,
  tablesFromApiPayload,
} from "../utils/sourceColumns";

const BASE_URL = buildApiUrl("/connection-profile-pipelines");

const ACTION_TYPES: PipelineActionType[] = ["PULL", "PUSH", "READ", "SYNC"];
const SOURCE_TYPES: PipelineSourceType[] = [
  "FTP_FILE",
  "DATABASE_QUERY",
  "REST_API",
  "KAFKA",
  "WEBSOCKET",
  "TCP",
  "SMS_INBOX",
];
const LOAD_STRATEGIES: PipelineLoadStrategy[] = [
  "BATCH_INSERT",
  "UPSERT",
  "APPEND",
];

function asEnum<T extends string>(value: unknown, allowed: T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value ? value : undefined;
}

function optionalNullableString(value: unknown): string | null | undefined {
  if (value === null) return null;
  return optionalString(value);
}

function errorMessage(payload: unknown, fallback: string): string {
  if (
    typeof payload === "string" &&
    payload.length < 500 &&
    !payload.trimStart().startsWith("<")
  ) {
    return payload;
  }
  if (!payload || typeof payload !== "object") return fallback;
  const body = payload as Record<string, unknown>;
  if (typeof body.error === "string") return body.error;
  if (body.error && typeof body.error === "object") {
    const nested = body.error as Record<string, unknown>;
    if (typeof nested.message === "string") return nested.message;
  }
  if (typeof body.message === "string") return body.message;
  if (Array.isArray(body.errors) && body.errors.length > 0) {
    const first = body.errors[0];
    if (first && typeof first === "object") {
      const detail = first as Record<string, unknown>;
      if (typeof detail.message === "string") return detail.message;
      if (typeof detail.error === "string") return detail.error;
    }
  }
  return fallback;
}

function requirePipelineId(id: number): void {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("A valid pipeline ID is required.");
  }
}

export function normalizePipeline(raw: unknown): ConnectionProfilePipeline {
  const row = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const id = Number(row.id);
  const connectionProfileId = Number(row.connection_profile_id);
  if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(connectionProfileId)) {
    throw new Error("The pipeline API returned an invalid pipeline record.");
  }
  return {
    id,
    connection_profile_id: connectionProfileId,
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
    schedule_enabled:
      typeof row.schedule_enabled === "boolean"
        ? row.schedule_enabled
        : undefined,
    schedule_cron: optionalNullableString(row.schedule_cron),
    schedule_timezone: optionalString(row.schedule_timezone),
    schedule_start_at: optionalNullableString(row.schedule_start_at),
    schedule_end_at: optionalNullableString(row.schedule_end_at),
    last_executed_at: optionalNullableString(row.last_executed_at),
    next_execution_at: optionalNullableString(row.next_execution_at),
    execution_count:
      row.execution_count === undefined
        ? undefined
        : Number(row.execution_count) || 0,
  };
}

class ConnectionProfilePipelineService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const response = await fetchWithAuthInterceptor(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    });

    const responseText = await response.text();
    let parsed: unknown = undefined;
    let invalidJson = false;
    if (responseText.length > 0) {
      try {
        parsed = JSON.parse(responseText);
      } catch {
        parsed = responseText;
        invalidJson = true;
      }
    }

    if (!response.ok) {
      const message = errorMessage(
        parsed,
        response.statusText || "Request failed",
      );
      const error = new Error(message) as Error & { status?: number };
      error.status = response.status;
      throw error;
    }

    if (invalidJson) {
      throw new Error(
        "Invalid JSON response from connection profile pipelines API",
      );
    }

    if (
      parsed &&
      typeof parsed === "object" &&
      "success" in parsed &&
      (parsed as { success?: boolean }).success === false
    ) {
      const error = new Error(errorMessage(parsed, "Operation failed")) as Error & {
        status?: number;
      };
      error.status = response.status;
      throw error;
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
    const queryString = this.buildQueryParams({
      connection_profile_id: query?.connection_profile_id,
      action_type: query?.action_type,
      source_type: query?.source_type,
      is_active: query?.is_active,
    });
    const response = await this.request<unknown>(`/${queryString}`);
    const rows = Array.isArray(response)
      ? response
      : this.unwrapData<unknown[]>(response);
    if (!Array.isArray(rows)) {
      throw new Error("The pipeline API returned an invalid list response.");
    }
    const data = rows.map(normalizePipeline);
    const count =
      !Array.isArray(response) &&
      typeof (response as { count?: unknown }).count === "number"
        ? (response as { count: number }).count
        : data.length;
    return { data, count };
  }

  async getPipeline(id: number): Promise<ConnectionProfilePipeline> {
    requirePipelineId(id);
    const response = await this.request<unknown>(`/${id}`);
    return normalizePipeline(this.unwrapData(response));
  }

  async createPipeline(
    payload: PipelineWritePayload,
  ): Promise<ConnectionProfilePipeline> {
    const response = await this.request<unknown>("/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return normalizePipeline(this.unwrapData(response));
  }

  async updatePipeline(
    id: number,
    payload: PipelineUpdatePayload,
  ): Promise<ConnectionProfilePipeline> {
    requirePipelineId(id);
    const response = await this.request<unknown>(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return normalizePipeline(this.unwrapData(response));
  }

  async deletePipeline(id: number): Promise<void> {
    requirePipelineId(id);
    await this.request<unknown>(`/${id}`, { method: "DELETE" });
  }

  async setActive(
    id: number,
    isActive: boolean,
  ): Promise<ConnectionProfilePipeline> {
    return this.updatePipeline(id, { is_active: isActive });
  }

  async previewQueryColumns(payload: {
    connection_profile_id: number;
    query: string;
    parameters?: Record<string, unknown>;
  }): Promise<DiscoveredColumn[]> {
    const response = await this.request<unknown>("/preview-columns", {
      method: "POST",
      body: JSON.stringify({
        connection_profile_id: payload.connection_profile_id,
        query: payload.query,
        parameters: payload.parameters ?? {},
        limit: 1,
      }),
    });
    const columns = columnsFromApiPayload(response);
    if (columns.length === 0) {
      throw new Error("The sample query did not return any columns.");
    }
    return columns;
  }

  async previewTables(payload: {
    connection_profile_id: number;
  }): Promise<DiscoveredTable[]> {
    const catalogQuery = [
      "SELECT table_schema, table_name",
      "FROM information_schema.tables",
      "WHERE table_type IN ('BASE TABLE', 'TABLE')",
      "AND table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'mysql', 'performance_schema', 'sys')",
    ].join(" ");
    let response: unknown;
    try {
      response = await this.request<unknown>("/preview-tables", {
        method: "POST",
        body: JSON.stringify({
          connection_profile_id: payload.connection_profile_id,
        }),
      });
    } catch (error) {
      const status = (error as { status?: number }).status;
      if (status !== 404 && status !== 405 && status !== 501) throw error;
      response = await this.request<unknown>("/preview-columns", {
        method: "POST",
        body: JSON.stringify({
          connection_profile_id: payload.connection_profile_id,
          query: catalogQuery,
          parameters: {},
          limit: 500,
        }),
      });
    }
    const tables = tablesFromApiPayload(response);
    if (tables.length === 0) {
      throw new Error(
        "The database catalog did not return schema and table names. The server should list tables for this connection profile.",
      );
    }
    return tables;
  }

  async executePipeline(id: number): Promise<PipelineExecutionResult> {
    return pipelineRuntimeService.executePipeline(id);
  }
}

export const connectionProfilePipelineService =
  new ConnectionProfilePipelineService();
