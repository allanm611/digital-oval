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
 * Used to seed per-group offer override messages (not the catch-all `failure_text`).
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

/** Normalize selected error group ids from multi + legacy single fields. */
export function getRuleErrorGroupIds(rule: {
  error_group_ids?: string[] | null;
  error_group_id?: string | null;
}): string[] {
  const fromArray = (rule.error_group_ids || [])
    .map((id) => errorGroupIdKey(id))
    .filter(Boolean);
  if (fromArray.length > 0) {
    return Array.from(new Set(fromArray));
  }
  const legacy = errorGroupIdKey(rule.error_group_id);
  return legacy ? [legacy] : [];
}

/** Per-group offer override messages keyed by catalog id. */
export function getRuleErrorGroupMessages(rule: {
  error_group_messages?: Record<string, string> | null;
}): Record<string, string> {
  const raw = rule.error_group_messages || {};
  const next: Record<string, string> = {};
  Object.entries(raw).forEach(([id, message]) => {
    const key = errorGroupIdKey(id);
    if (!key) return;
    next[key] = typeof message === "string" ? message : String(message ?? "");
  });
  return next;
}

/**
 * Apply selected error group ids onto a rule, keeping legacy single fields
 * in sync (primary = first selected) for backward-compatible offer metadata.
 * Also prunes/seeds `error_group_messages` for the active selection.
 */
export function withRuleErrorGroups<T extends {
  error_group_ids?: string[];
  error_group_id?: string;
  error_group: string;
  error_group_messages?: Record<string, string>;
}>(
  rule: T,
  selectedIds: Array<string | number>,
  groups: Array<Pick<ErrorGroup, "id" | "name" | "mappings">>,
  options?: {
    messages?: Record<string, string>;
    seedMissingMessages?: boolean;
  },
): T {
  const ids = Array.from(
    new Set(selectedIds.map((id) => errorGroupIdKey(id)).filter(Boolean)),
  );
  const labels = ids.map((id) => {
    const group = groups.find((g) => errorGroupIdKey(g.id) === id);
    return group ? formatErrorGroupLabel(group) : `Error group (${id})`;
  });

  const previousMessages = getRuleErrorGroupMessages(rule);
  const incoming = options?.messages
    ? getRuleErrorGroupMessages({ error_group_messages: options.messages })
    : previousMessages;
  const seedMissing = options?.seedMissingMessages !== false;
  const nextMessages: Record<string, string> = {};

  ids.forEach((id) => {
    if (Object.prototype.hasOwnProperty.call(incoming, id)) {
      nextMessages[id] = incoming[id];
      return;
    }
    if (Object.prototype.hasOwnProperty.call(previousMessages, id)) {
      nextMessages[id] = previousMessages[id];
      return;
    }
    if (seedMissing) {
      const group = groups.find((g) => errorGroupIdKey(g.id) === id);
      nextMessages[id] = group
        ? resolveErrorGroupDefaultFailureMessage(group)
        : "";
    } else {
      nextMessages[id] = "";
    }
  });

  return {
    ...rule,
    error_group_ids: ids,
    error_group_id: ids[0] || "",
    error_group: labels.join(", "),
    error_group_messages: nextMessages,
  };
}
