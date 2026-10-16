import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";
import { fetchWithAuthInterceptor } from "../../../shared/services/fetchInterceptor";
import {
  InboundAcceptance,
  PipelineExecutionResult,
  SchemaInferenceRequest,
  SchemaInferenceResult,
} from "../types/pipeline";

/**
 * ETL runtime on /data-connectors.
 * Pipeline CRUD stays on /connection-profile-pipelines.
 * These routes run a saved pipeline, infer mappings, and accept inbound pushes.
 */
const BASE_URL = buildApiUrl("/data-connectors");

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
  if (typeof body.message === "string" && body.success === false) return body.message;
  if (Array.isArray(body.errors) && body.errors.length > 0) {
    const first = body.errors[0];
    if (first && typeof first === "object") {
      const detail = first as Record<string, unknown>;
      if (typeof detail.message === "string") return detail.message;
      if (typeof detail.error === "string") return detail.error;
    }
  }
  if (typeof body.message === "string") return body.message;
  return fallback;
}

function requirePipelineId(id: number): void {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("A valid pipeline ID is required.");
  }
}

class PipelineRuntimeService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    expectJson = true,
  ): Promise<T> {
    const response = await fetchWithAuthInterceptor(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...getAuthHeaders(expectJson),
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
      const error = new Error(
        errorMessage(parsed, response.statusText || "Request failed"),
      ) as Error & { status?: number };
      error.status = response.status;
      throw error;
    }

    if (invalidJson) {
      throw new Error("Invalid JSON response from the pipeline runtime API");
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

  /** POST /data-connectors/pipelines/:id/execute */
  async executePipeline(id: number): Promise<PipelineExecutionResult> {
    requirePipelineId(id);
    const result = await this.request<PipelineExecutionResult>(
      `/pipelines/${id}/execute`,
      { method: "POST" },
    );
    if (
      !result ||
      typeof result !== "object" ||
      result.success !== true ||
      Number(result.pipeline_id) !== id
    ) {
      throw new Error("The pipeline runtime returned an invalid execution response.");
    }
    return result;
  }

  /** POST /data-connectors/pipelines/infer-schema */
  async inferSchema(payload: SchemaInferenceRequest): Promise<SchemaInferenceResult> {
    const hasSample = Array.isArray(payload.sample_data) && payload.sample_data.length > 0;
    const hasProfile =
      typeof payload.connection_profile_id === "number" &&
      payload.connection_profile_id > 0;
    if (!hasSample && !hasProfile) {
      throw new Error("Provide sample rows or a connection profile to infer the schema.");
    }
    const result = await this.request<SchemaInferenceResult>("/pipelines/infer-schema", {
      method: "POST",
      body: JSON.stringify({
        sample_data: hasSample ? payload.sample_data : undefined,
        connection_profile_id: hasProfile ? payload.connection_profile_id : undefined,
        query: payload.query,
        parameters: payload.parameters ?? {},
      }),
    });
    if (!result || !Array.isArray(result.inferred_mappings)) {
      throw new Error("The pipeline runtime returned an invalid schema response.");
    }
    return result;
  }

  /**
   * Stable JSON callback. The name slug and the push/webhook paths are aliases
   * of the same handler.
   */
  inboundJsonUrl(pipelineId: number): string {
    requirePipelineId(pipelineId);
    return buildApiUrl(`/data-connectors/inbound/${pipelineId}`);
  }

  inboundJsonAliases(pipelineId: number, pipelineName?: string): string[] {
    requirePipelineId(pipelineId);
    const aliases = [
      buildApiUrl(`/data-connectors/inbound-push/${pipelineId}`),
      buildApiUrl(`/data-connectors/webhook-callback/${pipelineId}`),
    ];
    const name = pipelineName?.trim();
    if (name && name !== String(pipelineId)) {
      aliases.unshift(
        buildApiUrl(`/data-connectors/inbound/${encodeURIComponent(name)}`),
      );
    }
    return aliases;
  }

  /**
   * Multipart callback. The form field name is `file`.
   * The id route is the one the handler resolves today.
   */
  inboundFileUrl(pipelineId: number): string {
    requirePipelineId(pipelineId);
    return buildApiUrl(`/data-connectors/inbound-file/${pipelineId}`);
  }

  /** POST /data-connectors/inbound-push/:pipeline_id */
  async submitInboundPayload(
    pipelineId: number,
    payload: unknown,
  ): Promise<InboundAcceptance> {
    requirePipelineId(pipelineId);
    return this.request<InboundAcceptance>(`/inbound-push/${pipelineId}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  /** POST /data-connectors/inbound-file/:pipeline_id */
  async submitInboundFile(
    pipelineId: number,
    file: File,
  ): Promise<InboundAcceptance> {
    requirePipelineId(pipelineId);
    const body = new FormData();
    body.append("file", file, file.name);
    return this.request<InboundAcceptance>(
      `/inbound-file/${pipelineId}`,
      { method: "POST", body },
      false,
    );
  }
}

export const pipelineRuntimeService = new PipelineRuntimeService();
