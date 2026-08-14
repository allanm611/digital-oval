export type ApiProbeStatus =
  | "idle"
  | "sending"
  | "success"
  | "error"
  | "cancelled";

export type ApiResponseViewTab = "body" | "headers" | "meta";

export type ApiBodyViewMode = "pretty" | "raw";

export interface ApiProbeHeader {
  key: string;
  value: string;
}

/**
 * Normalized Postman-style probe result.
 * Backend shapes vary; the probe layer maps whatever comes back into this.
 */
export interface ApiProbeResult {
  ok: boolean;
  status: ApiProbeStatus;
  statusCode?: number;
  statusText?: string;
  durationMs?: number;
  sizeBytes?: number;
  body?: string;
  bodyIsJson?: boolean;
  headers: ApiProbeHeader[];
  message?: string;
  errorDetails?: string;
  /** Where the probe ran: server-side connector test (preferred) */
  source: "backend" | "client";
  /** Optional evaluation against success_response / result paths */
  successMatch?: {
    matched: boolean;
    criteria?: string;
    detail?: string;
  };
  /** Raw payload for debugging / Meta tab */
  raw?: unknown;
  startedAt?: string;
  finishedAt?: string;
}

export interface ApiProbeRequestSnapshot {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
  timeoutSeconds: number;
  authType: string;
  contentType?: string;
  enableProxy?: boolean;
  proxyUrl?: string;
}
