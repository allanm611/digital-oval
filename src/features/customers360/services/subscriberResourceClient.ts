import { API_CONFIG, getAuthHeaders } from "../../../shared/services/api";
import type { CustomerListIdentifiers } from "../types/customerSubscribedList";
import { asRecord } from "../utils/customerSegmentHelpers";

export class SubscriberResourceError extends Error {
  status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = "SubscriberResourceError";
    this.status = status;
  }
}

function readErrorMessage(payload: unknown, fallback: string): string {
  const record = asRecord(payload);
  if (!record) return fallback;
  if (typeof record.error === "string" && record.error.trim()) return record.error;
  if (typeof record.message === "string" && record.message.trim()) {
    return record.message;
  }
  if (Array.isArray(record.errors) && record.errors.length > 0) {
    return record.errors
      .map((item) => {
        if (typeof item === "string") return item;
        const row = asRecord(item);
        return (
          (typeof row?.message === "string" && row.message) ||
          (typeof row?.msg === "string" && row.msg) ||
          ""
        );
      })
      .filter(Boolean)
      .join("; ");
  }
  return fallback;
}

export function buildSubscriberIdentifierQuery(
  _subscriberId: string,
  identifiers?: CustomerListIdentifiers | null,
): URLSearchParams {
  const params = new URLSearchParams();
  const msisdn = identifiers?.msisdns[0];
  const email = identifiers?.emails[0];

  if (msisdn) {
    params.set("identifier", msisdn);
    params.set("identifier_type", "msisdn");
    params.set("msisdn", msisdn);
  } else if (email) {
    params.set("identifier", email);
    params.set("identifier_type", "email");
  }

  if (email) params.set("email", email);
  return params;
}

export function subscriberResourceUrl(
  subscriberId: string,
  resourcePath: string,
  query?: URLSearchParams,
): string {
  const path = resourcePath.startsWith("/") ? resourcePath : `/${resourcePath}`;
  const base = `${API_CONFIG.BASE_URL}/subscribers/${encodeURIComponent(subscriberId)}${path}`;
  const qs = query?.toString();
  return qs ? `${base}?${qs}` : base;
}

export async function fetchSubscriberResource(
  subscriberId: string,
  resourcePaths: string[],
  query?: URLSearchParams,
): Promise<{ path: string; payload: unknown }> {
  const id = String(subscriberId ?? "").trim();
  if (!id) {
    throw new Error("Subscriber id is required");
  }

  let lastError: Error | null = null;

  for (const resourcePath of resourcePaths) {
    const url = subscriberResourceUrl(id, resourcePath, query);
    try {
      const response = await fetch(url, { headers: getAuthHeaders() });
      const text = await response.text();
      let payload: unknown = {};
      if (text.trim()) {
        try {
          payload = JSON.parse(text);
        } catch {
          lastError = new Error(
            `Invalid JSON from ${resourcePath} (HTTP ${response.status})`,
          );
          continue;
        }
      }

      const record = asRecord(payload);
      if (!response.ok || record?.success === false) {
        lastError = new SubscriberResourceError(
          readErrorMessage(
            payload,
            `Request failed for ${resourcePath} (HTTP ${response.status})`,
          ),
          response.status,
        );
        if ([400, 401, 403].includes(response.status)) {
          throw lastError;
        }
        continue;
      }

      return { path: resourcePath, payload };
    } catch (error) {
      if (error instanceof SubscriberResourceError) throw error;
      lastError =
        error instanceof Error
          ? error
          : new Error(`Failed to load ${resourcePath}`);
    }
  }

  throw lastError ?? new Error("Subscriber resource is not available");
}
