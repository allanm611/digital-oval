import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";
import type {
  CreateErrorGroupRequest,
  ErrorCodeOption,
  ErrorGroup,
  UpdateErrorGroupRequest,
} from "../types/errorGroup";
import { formatErrorGroupLabel } from "../types/errorGroup";

const API_BASE = buildApiUrl("/error-groups");
const LOCAL_STORAGE_KEY = "sentra_error_groups_catalog_v1";

/** Seed catalog used when the backend endpoint is unavailable */
const SEED_ERROR_GROUPS: ErrorGroup[] = [
  {
    id: "eg-low-balance-01",
    name: "Low balance Failure",
    code: "01",
    description: "Insufficient balance / credit for reward fulfilment",
    error_codes: ["INSUFFICIENT_BALANCE", "LOW_BALANCE", "ERR_BALANCE_01"],
    default_failure_message: "failed due to low balance",
    is_active: true,
  },
  {
    id: "eg-provider-timeout-02",
    name: "Provider Timeout",
    code: "02",
    description: "Upstream reward provider timed out",
    error_codes: ["TIMEOUT", "PROVIDER_TIMEOUT", "GATEWAY_TIMEOUT"],
    default_failure_message: "failed due to provider timeout",
    is_active: true,
  },
  {
    id: "eg-invalid-msisdn-03",
    name: "Invalid MSISDN",
    code: "03",
    description: "Subscriber identity could not be resolved",
    error_codes: ["INVALID_MSISDN", "UNKNOWN_SUBSCRIBER"],
    default_failure_message: "failed due to invalid subscriber",
    is_active: true,
  },
];

/** Known platform/provider error codes that can be attached to a group */
const SEED_ERROR_CODES: ErrorCodeOption[] = [
  { code: "INSUFFICIENT_BALANCE", label: "Insufficient Balance", description: "Wallet/airtime balance too low" },
  { code: "LOW_BALANCE", label: "Low Balance", description: "Generic low-balance rejection" },
  { code: "ERR_BALANCE_01", label: "Balance Error 01", description: "Legacy MICA balance failure" },
  { code: "TIMEOUT", label: "Timeout", description: "Request timed out" },
  { code: "PROVIDER_TIMEOUT", label: "Provider Timeout", description: "Upstream provider timeout" },
  { code: "GATEWAY_TIMEOUT", label: "Gateway Timeout", description: "Gateway layer timeout" },
  { code: "INVALID_MSISDN", label: "Invalid MSISDN", description: "Malformed or missing MSISDN" },
  { code: "UNKNOWN_SUBSCRIBER", label: "Unknown Subscriber", description: "Subscriber not found" },
  { code: "DUPLICATE_TRANSACTION", label: "Duplicate Transaction", description: "Idempotency conflict" },
  { code: "PROVIDER_REJECTED", label: "Provider Rejected", description: "Upstream business rejection" },
  { code: "SYSTEM_ERROR", label: "System Error", description: "Unhandled platform failure" },
];

function generateLocalId(): string {
  return `eg-local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function readLocalCatalog(): ErrorGroup[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [...SEED_ERROR_GROUPS];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [...SEED_ERROR_GROUPS];
    return parsed as ErrorGroup[];
  } catch {
    return [...SEED_ERROR_GROUPS];
  }
}

function writeLocalCatalog(groups: ErrorGroup[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(groups));
  } catch {
    // Ignore quota / private-mode failures; in-memory still works for session
  }
}

function unwrapList(payload: unknown): ErrorGroup[] {
  if (Array.isArray(payload)) return payload as ErrorGroup[];
  if (payload && typeof payload === "object") {
    const data = (payload as { data?: unknown }).data;
    if (Array.isArray(data)) return data as ErrorGroup[];
  }
  return [];
}

function unwrapOne(payload: unknown): ErrorGroup | null {
  if (!payload || typeof payload !== "object") return null;
  const obj = payload as { data?: ErrorGroup } & ErrorGroup;
  if (obj.data && typeof obj.data === "object" && "id" in obj.data) {
    return obj.data;
  }
  if ("id" in obj && "name" in obj) return obj as ErrorGroup;
  return null;
}

class ErrorGroupService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      let message = `HTTP ${response.status}`;
      try {
        const body = await response.json();
        message = body.error || body.message || message;
      } catch {
        // keep status message
      }
      throw new Error(message);
    }

    return response.json();
  }

  /**
   * Loads active error groups from API when available; otherwise uses
   * seed + locally created groups so the reward wizard remains usable.
   */
  async getErrorGroups(options?: { activeOnly?: boolean }): Promise<ErrorGroup[]> {
    const activeOnly = options?.activeOnly !== false;
    try {
      const payload = await this.request<unknown>(activeOnly ? "?is_active=true" : "");
      const groups = unwrapList(payload);
      if (groups.length > 0) {
        return activeOnly ? groups.filter((g) => g.is_active !== false) : groups;
      }
    } catch {
      // Backend endpoint may not exist yet — fall through to local catalog
    }

    const local = readLocalCatalog();
    return activeOnly ? local.filter((g) => g.is_active !== false) : local;
  }

  async getErrorGroupById(id: string): Promise<ErrorGroup | null> {
    try {
      const payload = await this.request<unknown>(`/${encodeURIComponent(id)}`);
      return unwrapOne(payload);
    } catch {
      return readLocalCatalog().find((g) => g.id === id) ?? null;
    }
  }

  /**
   * Fetches the catalog of attachable error codes.
   * Tries API first; falls back to a curated platform list.
   */
  async fetchErrorCodes(): Promise<ErrorCodeOption[]> {
    try {
      const payload = await this.request<unknown>("/error-codes");
      if (Array.isArray(payload)) return payload as ErrorCodeOption[];
      if (payload && typeof payload === "object") {
        const data = (payload as { data?: unknown }).data;
        if (Array.isArray(data)) return data as ErrorCodeOption[];
      }
    } catch {
      // Fall through
    }
    return [...SEED_ERROR_CODES];
  }

  async createErrorGroup(data: CreateErrorGroupRequest): Promise<ErrorGroup> {
    const body: CreateErrorGroupRequest = {
      name: data.name.trim(),
      code: data.code.trim(),
      description: data.description?.trim() || undefined,
      error_codes: data.error_codes || [],
      default_failure_message: data.default_failure_message?.trim() || undefined,
      is_active: data.is_active !== false,
    };

    try {
      const payload = await this.request<unknown>("", {
        method: "POST",
        body: JSON.stringify(body),
      });
      const created = unwrapOne(payload);
      if (created) return created;
    } catch {
      // Persist locally until backend is ready
    }

    const now = new Date().toISOString();
    const created: ErrorGroup = {
      id: generateLocalId(),
      name: body.name,
      code: body.code,
      description: body.description,
      error_codes: body.error_codes || [],
      default_failure_message: body.default_failure_message,
      is_active: body.is_active !== false,
      created_at: now,
      updated_at: now,
    };

    const next = [...readLocalCatalog(), created];
    writeLocalCatalog(next);
    return created;
  }

  async updateErrorGroup(
    id: string,
    data: UpdateErrorGroupRequest,
  ): Promise<ErrorGroup> {
    try {
      const payload = await this.request<unknown>(`/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      const updated = unwrapOne(payload);
      if (updated) return updated;
    } catch {
      // Fall through to local update
    }

    const catalog = readLocalCatalog();
    const index = catalog.findIndex((g) => g.id === id);
    if (index < 0) {
      throw new Error("Error group not found");
    }

    const updated: ErrorGroup = {
      ...catalog[index],
      ...data,
      name: data.name?.trim() ?? catalog[index].name,
      code: data.code?.trim() ?? catalog[index].code,
      description:
        data.description !== undefined
          ? data.description.trim() || undefined
          : catalog[index].description,
      default_failure_message:
        data.default_failure_message !== undefined
          ? data.default_failure_message.trim() || undefined
          : catalog[index].default_failure_message,
      updated_at: new Date().toISOString(),
    };
    catalog[index] = updated;
    writeLocalCatalog(catalog);
    return updated;
  }

  toSelectOptions(groups: ErrorGroup[]): Array<{ value: string; label: string }> {
    return groups.map((g) => ({
      value: g.id,
      label: formatErrorGroupLabel(g),
    }));
  }
}

export const errorGroupService = new ErrorGroupService();
