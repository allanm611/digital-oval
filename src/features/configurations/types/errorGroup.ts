/**
 * Error groups map provider error codes to user-facing failure messages.
 * Backend: database-service `/error-groups` (+ nested `/mappings`).
 * Runtime fulfilment resolves mappings via provider attachments
 * (`/reward-providers/:id/error-groups`), not offer metadata alone.
 */

export interface ErrorGroupMapping {
  id: number;
  error_group_id: number;
  error_code: string;
  user_message: string;
  created_at?: string;
  updated_at?: string;
}

export interface ErrorGroup {
  id: number;
  name: string;
  description?: string | null;
  is_active: boolean;
  /** Present on GET /error-groups/:id */
  mappings?: ErrorGroupMapping[];
  /** Present on GET /reward-providers/:id/error-groups */
  attached_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateErrorGroupMappingInput {
  error_code: string;
  user_message: string;
}

export interface CreateErrorGroupRequest {
  name: string;
  description?: string | null;
  is_active?: boolean;
  /** Created via POST /error-groups/:id/mappings after the group exists */
  mappings?: CreateErrorGroupMappingInput[];
  /** When set, also POST /reward-providers/:id/error-groups */
  provider_id?: number;
}

export interface UpdateErrorGroupRequest {
  name?: string;
  description?: string | null;
  is_active?: boolean;
}

/** Curated codes shown in the configure modal (backend has no /error-codes catalog). */
export interface ErrorCodeOption {
  code: string;
  label: string;
  description?: string;
}

/** Display label for reward-rule dropdowns and metadata */
export function formatErrorGroupLabel(
  group: Pick<ErrorGroup, "name" | "id">,
): string {
  const name = group.name?.trim();
  return name || `Error group #${group.id}`;
}

/**
 * Prefer a shared mapping message when all mappings agree; otherwise first mapping.
 * Used to seed the offer-rule `failure_text` field (UI convenience only).
 */
export function resolveErrorGroupDefaultFailureMessage(
  group: Pick<ErrorGroup, "mappings">,
): string {
  const messages = (group.mappings || [])
    .map((m) => m.user_message?.trim())
    .filter(Boolean) as string[];
  if (messages.length === 0) return "";
  const first = messages[0];
  return messages.every((m) => m === first) ? first : first;
}

export function errorGroupIdKey(id: number | string | undefined | null): string {
  if (id === undefined || id === null || id === "") return "";
  return String(id);
}
