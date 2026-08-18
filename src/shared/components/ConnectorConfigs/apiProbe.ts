import { dataConnectorService } from "../../../features/data-connectors/services/dataConnectorService";
import { connectionProfileService } from "../../../features/connection-profiles/services/connectionProfileService";
import type { DataConnectorConfiguration } from "../../../features/data-connectors/types/dataConnector";
import {
  applyParamsToUrl,
  isValidHttpUrl,
  normalizeHttpMethod,
  rowsToRecord,
} from "./apiConfigUtils";
import type { ApiKeyValueRow } from "./apiConfigTypes";
import type {
  ApiProbeHeader,
  ApiProbeRequestSnapshot,
  ApiProbeResult,
} from "./apiProbeTypes";

function byteLength(text: string): number {
  try {
    return new TextEncoder().encode(text).length;
  } catch {
    return text.length;
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function pickString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value;
  }
  return undefined;
}

function pickNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) {
      return Number(value);
    }
  }
  return undefined;
}

function normalizeHeaders(input: unknown): ApiProbeHeader[] {
  if (!input) return [];

  if (Array.isArray(input)) {
    return input
      .map((item) => {
        const row = asRecord(item);
        if (!row) return null;
        const key = pickString(row.key, row.name, row.header);
        if (!key) return null;
        return { key, value: String(row.value ?? "") };
      })
      .filter((h): h is ApiProbeHeader => Boolean(h));
  }

  const record = asRecord(input);
  if (!record) return [];
  return Object.entries(record).map(([key, value]) => ({
    key,
    value: String(value ?? ""),
  }));
}

function stringifyBody(body: unknown): { text: string; isJson: boolean } {
  if (body == null) return { text: "", isJson: false };
  if (typeof body === "string") {
    const trimmed = body.trim();
    if (!trimmed) return { text: "", isJson: false };
    try {
      return {
        text: JSON.stringify(JSON.parse(trimmed), null, 2),
        isJson: true,
      };
    } catch {
      return { text: body, isJson: false };
    }
  }
  try {
    return { text: JSON.stringify(body, null, 2), isJson: true };
  } catch {
    return { text: String(body), isJson: false };
  }
}

export function formatBodyForDisplay(
  body: string | undefined,
  mode: "pretty" | "raw",
): string {
  if (!body) return "";
  if (mode === "raw") return body;
  try {
    return JSON.stringify(JSON.parse(body), null, 2);
  } catch {
    return body;
  }
}

/**
 * Build a clean request snapshot from the live API config form state.
 * Prefer local row state (URL/params/headers) over stale parent config.
 */
export function buildApiProbeSnapshot(
  config: Record<string, any>,
  overrides?: {
    url?: string;
    queryParams?: ApiKeyValueRow[];
    headerRows?: ApiKeyValueRow[];
  },
): ApiProbeRequestSnapshot {
  const method = normalizeHttpMethod(config.method);
  const urlFromOverrides =
    overrides?.url != null
      ? applyParamsToUrl(overrides.url, overrides.queryParams || [])
      : config.base_url || config.url || "";

  const headers = overrides?.headerRows
    ? rowsToRecord(overrides.headerRows, true)
    : (config.request_headers as Record<string, string>) ||
      (config.headers as Record<string, string>) ||
      {};

  const bodyMode = config.body_mode || "none";
  const body =
    method === "GET" || method === "HEAD" || bodyMode === "none"
      ? undefined
      : String(config.payload_template || "");

  const timeoutSeconds = Math.max(
    1,
    Number(config.response_timeout || config.response_timeout_seconds || 15),
  );

  return {
    method,
    url: urlFromOverrides.trim(),
    headers,
    body,
    timeoutSeconds,
    authType: String(config.auth_type || "none"),
    contentType: config.content_type,
    enableProxy: Boolean(config.enable_proxy || config.proxy_enabled),
    proxyUrl: config.proxy_url,
  };
}

/** Configuration payload the backend connector test expects. */
export function buildBackendTestConfiguration(
  config: Record<string, any>,
  snapshot: ApiProbeRequestSnapshot,
): DataConnectorConfiguration {
  return {
    ...config,
    base_url: snapshot.url,
    url: snapshot.url,
    method: snapshot.method as DataConnectorConfiguration["method"],
    request_headers: snapshot.headers,
    headers: snapshot.headers,
    payload_template: snapshot.body || config.payload_template || "",
    content_type: config.content_type,
    auth_type: config.auth_type,
    username: config.username,
    password: config.password,
    api_key: config.api_key,
    enable_proxy: snapshot.enableProxy,
    proxy_enabled: snapshot.enableProxy,
    proxy_url: config.proxy_url,
    proxy_username: config.proxy_username,
    proxy_password: config.proxy_password,
    response_timeout: snapshot.timeoutSeconds,
    response_timeout_seconds: snapshot.timeoutSeconds,
    success_response: config.success_response,
    result_code: config.result_code,
    result_description: config.result_description,
    xpath: config.xpath,
  } as DataConnectorConfiguration;
}

function evaluateSuccessCriteria(
  config: Record<string, any>,
  statusCode: number | undefined,
  bodyText: string,
  headers: ApiProbeHeader[],
): ApiProbeResult["successMatch"] | undefined {
  const criteria = String(config.success_response || "").trim();
  if (!criteria) return undefined;

  const haystacks = [
    statusCode != null ? String(statusCode) : "",
    bodyText,
    headers.map((h) => `${h.key}: ${h.value}`).join("\n"),
  ];

  const matched = haystacks.some((h) =>
    h.toLowerCase().includes(criteria.toLowerCase()),
  );

  return {
    matched,
    criteria,
    detail: matched
      ? "Matched success response criteria"
      : "Success criteria not found in status, body, or headers",
  };
}

export function normalizeProbeResult(
  raw: unknown,
  config: Record<string, any>,
  meta: {
    source: "backend" | "client";
    durationMs?: number;
    startedAt: string;
    finishedAt: string;
  },
): ApiProbeResult {
  const root = asRecord(raw) || {};
  const nested =
    asRecord(root.data) ||
    asRecord(root.result) ||
    asRecord(root.response) ||
    {};

  const success =
    typeof root.success === "boolean"
      ? root.success
      : typeof nested.success === "boolean"
        ? nested.success
        : undefined;

  const statusCode = pickNumber(
    root.status_code,
    root.statusCode,
    root.http_status,
    root.status,
    nested.status_code,
    nested.statusCode,
    nested.http_status,
    nested.status,
  );

  const statusText = pickString(
    root.status_text,
    root.statusText,
    nested.status_text,
    nested.statusText,
    root.message,
    nested.message,
  );

  const durationMs =
    meta.durationMs ??
    pickNumber(
      root.response_time_ms,
      root.duration_ms,
      root.elapsed_ms,
      nested.response_time_ms,
      nested.duration_ms,
    );

  const headers = normalizeHeaders(
    root.headers ||
      root.response_headers ||
      nested.headers ||
      nested.response_headers,
  );

  const bodyCandidate =
    root.body ??
    root.response_body ??
    root.payload ??
    nested.body ??
    nested.response_body ??
    nested.payload ??
    (root.data !== undefined && typeof root.data !== "boolean"
      ? root.data
      : undefined) ??
    (Object.keys(nested).length ? nested : undefined);

  // Prefer an explicit body; otherwise show a compact JSON summary of the result.
  let bodyText = "";
  let bodyIsJson = false;
  if (bodyCandidate !== undefined && bodyCandidate !== raw) {
    const formatted = stringifyBody(bodyCandidate);
    bodyText = formatted.text;
    bodyIsJson = formatted.isJson;
  } else {
    const summary = {
      success,
      message: pickString(root.message, nested.message),
      status_code: statusCode,
      response_time_ms: durationMs,
      error_details: pickString(
        root.error_details,
        root.error,
        nested.error_details,
        nested.error,
      ),
    };
    const formatted = stringifyBody(summary);
    bodyText = formatted.text;
    bodyIsJson = formatted.isJson;
  }

  const message = pickString(root.message, nested.message, statusText);
  const errorDetails = pickString(
    root.error_details,
    root.error,
    nested.error_details,
    nested.error,
  );

  const ok =
    success !== undefined
      ? success
      : statusCode != null
        ? statusCode >= 200 && statusCode < 400
        : !errorDetails;

  const successMatch = evaluateSuccessCriteria(
    config,
    statusCode,
    bodyText,
    headers,
  );

  return {
    ok: successMatch ? successMatch.matched && ok : ok,
    status: ok ? "success" : "error",
    statusCode,
    statusText: statusText || (ok ? "OK" : "Error"),
    durationMs,
    sizeBytes: bodyText ? byteLength(bodyText) : undefined,
    body: bodyText,
    bodyIsJson,
    headers,
    message,
    errorDetails,
    source: meta.source,
    successMatch,
    raw,
    startedAt: meta.startedAt,
    finishedAt: meta.finishedAt,
  };
}

export interface ProbeApiOptions {
  /** Saved connection profile id — uses /connection-profiles/:id/test-connection */
  profileId?: number;
  signal?: AbortSignal;
  url?: string;
  queryParams?: ApiKeyValueRow[];
  headerRows?: ApiKeyValueRow[];
}

/**
 * Prefer server-side probe (handles proxy, avoids browser CORS).
 * Falls back cleanly with a structured error if the backend rejects the call.
 */
export async function probeApiConfiguration(
  config: Record<string, any>,
  options: ProbeApiOptions = {},
): Promise<ApiProbeResult> {
  const startedAt = new Date().toISOString();
  const started = performance.now();
  const snapshot = buildApiProbeSnapshot(config, {
    url: options.url,
    queryParams: options.queryParams,
    headerRows: options.headerRows,
  });

  if (!snapshot.url.trim()) {
    return {
      ok: false,
      status: "error",
      headers: [],
      source: "backend",
      message: "URL is required",
      errorDetails: "Enter a valid request URL before sending.",
      startedAt,
      finishedAt: new Date().toISOString(),
    };
  }

  if (!isValidHttpUrl(snapshot.url)) {
    return {
      ok: false,
      status: "error",
      headers: [],
      source: "backend",
      message: "Invalid URL",
      errorDetails:
        "URL must start with http:// or https:// (Postman-style absolute URL).",
      startedAt,
      finishedAt: new Date().toISOString(),
    };
  }

  const configuration = buildBackendTestConfiguration(config, snapshot);

  try {
    let raw: unknown;

    if (options.profileId != null && Number.isFinite(options.profileId)) {
      raw = await connectionProfileService.testConnectionProfile(
        options.profileId,
        {
          auth_config: (config.auth_config as Record<string, unknown>) || {},
          connection_config: configuration as Record<string, unknown>,
          timeout_seconds: snapshot.timeoutSeconds,
        },
      );
    } else {
      raw = await dataConnectorService.testConnectionConfig(
        "api",
        configuration,
      );
    }

    if (options.signal?.aborted) {
      return {
        ok: false,
        status: "cancelled",
        headers: [],
        source: "backend",
        message: "Request cancelled",
        startedAt,
        finishedAt: new Date().toISOString(),
      };
    }

    const finishedAt = new Date().toISOString();
    return normalizeProbeResult(raw, config, {
      source: "backend",
      durationMs: Math.round(performance.now() - started),
      startedAt,
      finishedAt,
    });
  } catch (error) {
    const finishedAt = new Date().toISOString();
    const message =
      error instanceof Error ? error.message : "Connection test failed";
    return {
      ok: false,
      status: options.signal?.aborted ? "cancelled" : "error",
      headers: [],
      source: "backend",
      message: options.signal?.aborted ? "Request cancelled" : message,
      errorDetails: message,
      durationMs: Math.round(performance.now() - started),
      body: JSON.stringify(
        {
          success: false,
          message,
          method: snapshot.method,
          url: snapshot.url,
        },
        null,
        2,
      ),
      bodyIsJson: true,
      sizeBytes: undefined,
      startedAt,
      finishedAt,
    };
  }
}
