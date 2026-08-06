import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";
import { extractErrorMessage } from "../../../shared/utils/errorHandler";
import type {
  CreateErrorGroupMappingInput,
  CreateErrorGroupRequest,
  ErrorCodeOption,
  ErrorGroup,
  ErrorGroupMapping,
  UpdateErrorGroupRequest,
} from "../types/errorGroup";
import {
  formatErrorGroupLabel,
  resolveErrorGroupDefaultFailureMessage,
} from "../types/errorGroup";

const API_BASE = buildApiUrl("/error-groups");
const PROVIDERS_BASE = buildApiUrl("/reward-providers");

/**
 * Suggested provider/platform codes for the configure modal.
 * Backend stores codes only as mappings — there is no `/error-groups/error-codes` API.
 */
const SUGGESTED_ERROR_CODES: ErrorCodeOption[] = [
  {
    code: "INSUFFICIENT_BALANCE",
    label: "Insufficient Balance",
    description: "Wallet/airtime balance too low",
  },
  {
    code: "LOW_BALANCE",
    label: "Low Balance",
    description: "Generic low-balance rejection",
  },
  {
    code: "ERR_BALANCE_01",
    label: "Balance Error 01",
    description: "Legacy MICA balance failure",
  },
  {
    code: "TIMEOUT",
    label: "Timeout",
    description: "Request timed out",
  },
  {
    code: "PROVIDER_TIMEOUT",
    label: "Provider Timeout",
    description: "Upstream provider timeout",
  },
  {
    code: "GATEWAY_TIMEOUT",
    label: "Gateway Timeout",
    description: "Gateway layer timeout",
  },
  {
    code: "INVALID_MSISDN",
    label: "Invalid MSISDN",
    description: "Malformed or missing MSISDN",
  },
  {
    code: "UNKNOWN_SUBSCRIBER",
    label: "Unknown Subscriber",
    description: "Subscriber not found",
  },
  {
    code: "DUPLICATE_TRANSACTION",
    label: "Duplicate Transaction",
    description: "Idempotency conflict",
  },
  {
    code: "PROVIDER_REJECTED",
    label: "Provider Rejected",
    description: "Upstream business rejection",
  },
  {
    code: "SYSTEM_ERROR",
    label: "System Error",
    description: "Unhandled platform failure",
  },
];

async function parseErrorResponse(response: Response): Promise<string> {
  try {
    const body = await response.json();
    return (
      body.error ||
      body.message ||
      extractErrorMessage(JSON.stringify(body), response.status)
    );
  } catch {
    return `HTTP ${response.status}`;
  }
}

function unwrapList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === "object") {
    const data = (payload as { data?: unknown }).data;
    if (Array.isArray(data)) return data as T[];
  }
  return [];
}

function unwrapOne<T extends { id?: unknown }>(payload: unknown): T | null {
  if (!payload || typeof payload !== "object") return null;
  const obj = payload as { data?: T } & T;
  if (obj.data && typeof obj.data === "object" && "id" in obj.data) {
    return obj.data;
  }
  if ("id" in obj) return obj as T;
  return null;
}

function normalizeGroup(raw: ErrorGroup): ErrorGroup {
  return {
    ...raw,
    id: Number(raw.id),
    is_active: raw.is_active !== false,
    mappings: Array.isArray(raw.mappings)
      ? raw.mappings.map((m) => ({
          ...m,
          id: Number(m.id),
          error_group_id: Number(m.error_group_id),
          error_code: String(m.error_code || "").toUpperCase(),
          user_message: String(m.user_message || ""),
        }))
      : raw.mappings,
  };
}

class ErrorGroupService {
  private async request<T>(
    url: string,
    options: RequestInit = {},
  ): Promise<T> {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(await parseErrorResponse(response));
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  /** GET /error-groups — filter active client-side (list has no query params). */
  async getErrorGroups(options?: { activeOnly?: boolean }): Promise<ErrorGroup[]> {
    const activeOnly = options?.activeOnly !== false;
    const payload = await this.request<unknown>(API_BASE);
    const groups = unwrapList<ErrorGroup>(payload).map(normalizeGroup);
    return activeOnly ? groups.filter((g) => g.is_active !== false) : groups;
  }

  /** GET /error-groups/:id (includes mappings) */
  async getErrorGroupById(id: number | string): Promise<ErrorGroup> {
    const payload = await this.request<unknown>(
      `${API_BASE}/${encodeURIComponent(String(id))}`,
    );
    const group = unwrapOne<ErrorGroup>(payload);
    if (!group) {
      throw new Error(`Error group '${id}' not found`);
    }
    return normalizeGroup(group);
  }

  /**
   * GET /reward-providers/:id/error-groups
   * Groups attached to a provider — these are what RewardDeliveryService uses.
   */
  async getErrorGroupsForProvider(
    providerId: number | string,
    options?: { activeOnly?: boolean },
  ): Promise<ErrorGroup[]> {
    const activeOnly = options?.activeOnly !== false;
    const payload = await this.request<unknown>(
      `${PROVIDERS_BASE}/${encodeURIComponent(String(providerId))}/error-groups`,
    );
    const groups = unwrapList<ErrorGroup>(payload).map(normalizeGroup);
    return activeOnly ? groups.filter((g) => g.is_active !== false) : groups;
  }

  /** POST /reward-providers/:id/error-groups — treats already-attached as success */
  async attachErrorGroupToProvider(
    providerId: number | string,
    errorGroupId: number | string,
  ): Promise<void> {
    const response = await fetch(
      `${PROVIDERS_BASE}/${encodeURIComponent(String(providerId))}/error-groups`,
      {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ error_group_id: Number(errorGroupId) }),
      },
    );

    if (response.ok) return;

    let message = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      message = body.error || body.message || message;
    } catch {
      // keep status message
    }

    // Backend returns 400 when already attached — treat as idempotent success.
    if (
      response.status === 400 &&
      /already attached/i.test(message)
    ) {
      return;
    }

    throw new Error(message);
  }

  /** DELETE /reward-providers/:id/error-groups/:groupId */
  async detachErrorGroupFromProvider(
    providerId: number | string,
    errorGroupId: number | string,
  ): Promise<void> {
    await this.request(
      `${PROVIDERS_BASE}/${encodeURIComponent(String(providerId))}/error-groups/${encodeURIComponent(String(errorGroupId))}`,
      { method: "DELETE" },
    );
  }

  /** Suggested codes for the configure UI (not a backend catalog). */
  getSuggestedErrorCodes(): ErrorCodeOption[] {
    return [...SUGGESTED_ERROR_CODES];
  }

  /**
   * @deprecated Prefer getSuggestedErrorCodes — backend has no error-codes endpoint.
   */
  async fetchErrorCodes(): Promise<ErrorCodeOption[]> {
    return this.getSuggestedErrorCodes();
  }

  /** POST /error-groups/:id/mappings */
  async addMapping(
    groupId: number | string,
    mapping: CreateErrorGroupMappingInput,
  ): Promise<ErrorGroupMapping> {
    const payload = await this.request<unknown>(
      `${API_BASE}/${encodeURIComponent(String(groupId))}/mappings`,
      {
        method: "POST",
        body: JSON.stringify({
          error_code: mapping.error_code.trim().toUpperCase(),
          user_message: mapping.user_message.trim(),
        }),
      },
    );
    const created = unwrapOne<ErrorGroupMapping>(payload);
    if (!created) {
      throw new Error("Failed to create error group mapping");
    }
    return created;
  }

  /** DELETE /error-groups/:id/mappings/:mappingId */
  async deleteMapping(
    groupId: number | string,
    mappingId: number | string,
  ): Promise<void> {
    await this.request(
      `${API_BASE}/${encodeURIComponent(String(groupId))}/mappings/${encodeURIComponent(String(mappingId))}`,
      { method: "DELETE" },
    );
  }

  /**
   * Creates a group, then mappings, then optionally attaches to a provider.
   * Throws on API failure — no silent localStorage fallback (avoids orphan local IDs on offers).
   */
  async createErrorGroup(data: CreateErrorGroupRequest): Promise<ErrorGroup> {
    const body = {
      name: data.name.trim(),
      description: data.description?.trim() || null,
      is_active: data.is_active !== false,
    };

    const createPayload = await this.request<unknown>(API_BASE, {
      method: "POST",
      body: JSON.stringify(body),
    });
    const created = unwrapOne<ErrorGroup>(createPayload);
    if (!created?.id) {
      throw new Error("Failed to create error group");
    }

    const groupId = Number(created.id);
    const mappingsInput = (data.mappings || []).filter(
      (m) => m.error_code?.trim() && m.user_message?.trim(),
    );

    const mappingErrors: string[] = [];
    const mappings: ErrorGroupMapping[] = [];
    for (const mapping of mappingsInput) {
      try {
        const saved = await this.addMapping(groupId, mapping);
        mappings.push(saved);
      } catch (err) {
        mappingErrors.push(
          err instanceof Error ? err.message : `Failed mapping ${mapping.error_code}`,
        );
      }
    }

    if (data.provider_id != null && Number.isFinite(Number(data.provider_id))) {
      try {
        await this.attachErrorGroupToProvider(data.provider_id, groupId);
      } catch (err) {
        mappingErrors.push(
          err instanceof Error
            ? `Group created but provider attach failed: ${err.message}`
            : "Group created but provider attach failed",
        );
      }
    }

    const full = await this.getErrorGroupById(groupId).catch(() =>
      normalizeGroup({ ...created, id: groupId, mappings }),
    );

    if (mappingErrors.length > 0 && mappings.length === 0 && mappingsInput.length > 0) {
      throw new Error(
        `Error group created, but mappings failed: ${mappingErrors.join("; ")}`,
      );
    }

    return full;
  }

  async updateErrorGroup(
    id: number | string,
    data: UpdateErrorGroupRequest,
  ): Promise<ErrorGroup> {
    const payload = await this.request<unknown>(
      `${API_BASE}/${encodeURIComponent(String(id))}`,
      {
        method: "PUT",
        body: JSON.stringify({
          ...(data.name !== undefined ? { name: data.name.trim() } : {}),
          ...(data.description !== undefined
            ? { description: data.description?.trim() || null }
            : {}),
          ...(data.is_active !== undefined ? { is_active: data.is_active } : {}),
        }),
      },
    );
    const updated = unwrapOne<ErrorGroup>(payload);
    if (!updated) {
      throw new Error("Failed to update error group");
    }
    return normalizeGroup(updated);
  }

  async deleteErrorGroup(id: number | string): Promise<void> {
    await this.request(`${API_BASE}/${encodeURIComponent(String(id))}`, {
      method: "DELETE",
    });
  }

  toSelectOptions(groups: ErrorGroup[]): Array<{ value: string; label: string }> {
    return groups.map((g) => ({
      value: String(g.id),
      label: formatErrorGroupLabel(g),
    }));
  }

  /** Convenience for offer-rule auto-fill */
  getSuggestedFailureText(group: ErrorGroup): string {
    return resolveErrorGroupDefaultFailureMessage(group);
  }
}

export const errorGroupService = new ErrorGroupService();
