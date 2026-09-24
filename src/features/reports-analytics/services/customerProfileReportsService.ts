import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";
import type {
  CustomerProfileReportsResponse,
  ReportQueryParams,
} from "../types/ReportsAPI";

const BASE_URL = buildApiUrl("/monitoring/reporting/subscribers");

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export class SubscriberReportError extends Error {
  status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = "SubscriberReportError";
    this.status = status;
  }
}

export interface CustomerProfileEnvelope {
  success: boolean;
  data?: CustomerProfileReportsResponse;
  meta?: CustomerProfileReportsResponse["meta"];
  total?: number;
  error?: string;
  message?: string;
}

function toQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

function windowQuery(params: ReportQueryParams = {}) {
  return toQuery({
    range: params.range,
    startDate: params.startDate,
    endDate: params.endDate,
    grain: params.grain,
    preset: params.preset,
  });
}

function readErrorMessage(payload: unknown, fallback: string): string {
  const record = asRecord(payload);
  if (!record) return fallback;
  if (typeof record.error === "string" && record.error.trim()) return record.error;
  if (typeof record.message === "string" && record.message.trim()) {
    return record.message;
  }
  return fallback;
}

function parseJsonBody(text: string): unknown {
  if (!text.trim()) return { success: true, data: null };
  try {
    return JSON.parse(text);
  } catch {
    throw new SubscriberReportError("Invalid JSON from subscriber report", 0);
  }
}

export const SUBSCRIBER_REPORT_RESOURCES = [
  "activity",
  "profile",
  "engagement",
  "consent",
  "segments",
  "devices",
  "conversions",
  "lifecycle",
  "touchpoints",
] as const;

export type SubscriberReportResource =
  (typeof SUBSCRIBER_REPORT_RESOURCES)[number];

const RESOURCE_ALIASES: Record<SubscriberReportResource, string[]> = {
  activity: ["activity", "events", "timeline"],
  profile: ["profile", "summary", "profile-summary"],
  engagement: ["engagement"],
  consent: ["consent"],
  segments: ["segments"],
  devices: ["devices"],
  conversions: ["conversions", "conversion"],
  lifecycle: ["lifecycle"],
  touchpoints: ["touchpoints"],
};

class CustomerProfileReportsService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const text = await response.text();
    let payload: unknown = { success: true, data: null };
    if (text.trim()) {
      try {
        payload = parseJsonBody(text);
      } catch (error) {
        if (response.status === 404) {
          throw new SubscriberReportError("Not found", 404);
        }
        if (!response.ok) {
          throw new SubscriberReportError(
            `Request failed (${response.status})`,
            response.status,
          );
        }
        throw error;
      }
    }

    if (response.status === 404) {
      throw new SubscriberReportError(
        readErrorMessage(payload, "Not found"),
        404,
      );
    }

    if (!response.ok) {
      throw new SubscriberReportError(
        readErrorMessage(payload, `Request failed (${response.status})`),
        response.status,
      );
    }

    const record = asRecord(payload);
    if (record?.success === false) {
      const hasData =
        record.data != null &&
        !(Array.isArray(record.data) && record.data.length === 0);
      if (!hasData) {
        return { success: true, data: record.data ?? null } as T;
      }
      throw new SubscriberReportError(
        readErrorMessage(
          payload,
          "Subscriber report returned an unsuccessful response",
        ),
        response.status,
      );
    }

    return payload as T;
  }

  private async requestWithQueryFallback(path: string, query: string) {
    try {
      return await this.request(`${path}${query}`);
    } catch (error) {
      const status =
        error instanceof SubscriberReportError ? error.status : 0;
      if (query && status === 400) {
        return this.request(path);
      }
      throw error;
    }
  }

  /**
   * GET /monitoring/reporting/subscribers/portfolio
   * Full Customer Profile Reports payload for Real Data mode.
   */
  async getPortfolio(params: ReportQueryParams = {}): Promise<CustomerProfileEnvelope> {
    const query = toQuery({
      range: params.range,
      startDate: params.startDate,
      endDate: params.endDate,
      grain: params.grain,
      preset: params.preset,
      page: params.page,
      pageSize: params.pageSize,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      search: params.search,
      segment: params.segment,
    });
    return this.request<CustomerProfileEnvelope>(`/portfolio${query}`);
  }

  /** GET /monitoring/reporting/subscribers/lifecycle */
  async getLifecycle(params: ReportQueryParams = {}): Promise<CustomerProfileEnvelope> {
    const query = toQuery({
      range: params.range,
      startDate: params.startDate,
      endDate: params.endDate,
      grain: params.grain,
      preset: params.preset,
    });
    return this.request<CustomerProfileEnvelope>(`/lifecycle${query}`);
  }

  async getCustomers(params: ReportQueryParams = {}) {
    const query = toQuery({
      range: params.range,
      startDate: params.startDate,
      endDate: params.endDate,
      grain: params.grain,
      preset: params.preset,
      page: params.page,
      pageSize: params.pageSize,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      search: params.search,
      segment: params.segment,
    });
    return this.request<{
      success: boolean;
      data: Array<Record<string, unknown>>;
      total: number;
    }>(`/customers${query}`);
  }

  /**
   * GET /monitoring/reporting/subscribers/search?q=
   * Header search by ID, name, email, or phone.
   */
  async searchCustomers(q: string, limit = 20) {
    return this.request<{
      success: boolean;
      data: CustomerProfileReportsResponse["customers"];
      total: number;
    }>(`/search${toQuery({ q, limit })}`);
  }

  /**
   * GET /monitoring/reporting/subscribers/:id/{resource}
   * 404 is an empty widget, not a hard failure.
   */
  async getSubscriberResource(
    subscriberId: string | number,
    resource: SubscriberReportResource,
    params: ReportQueryParams = {},
  ): Promise<unknown> {
    const id = encodeURIComponent(String(subscriberId));
    const query = windowQuery(params);
    const aliases = RESOURCE_ALIASES[resource] ?? [resource];
    let sawNotFound = false;

    for (const alias of aliases) {
      try {
        return await this.requestWithQueryFallback(`/${id}/${alias}`, query);
      } catch (error) {
        const status =
          error instanceof SubscriberReportError ? error.status : 0;
        if (status === 404) {
          sawNotFound = true;
          continue;
        }
        throw error;
      }
    }

    if (sawNotFound) {
      return { success: true, data: null };
    }
    throw new SubscriberReportError("Subscriber resource is not available", 0);
  }

  /**
   * GET /monitoring/reporting/subscribers/:id
   * Legacy combined subscriber report.
   */
  async getSubscriberReport(
    subscriberId: string | number,
    params: ReportQueryParams = {},
  ): Promise<unknown> {
    const id = encodeURIComponent(String(subscriberId));
    const query = windowQuery(params);
    try {
      return await this.requestWithQueryFallback(`/${id}`, query);
    } catch (error) {
      const status =
        error instanceof SubscriberReportError ? error.status : 0;
      if (status === 404) return { success: true, data: null };
      throw error;
    }
  }
}

export const customerProfileReportsService = new CustomerProfileReportsService();
