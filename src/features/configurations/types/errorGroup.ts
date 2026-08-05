/**
 * Catalog of failure groupings used when configuring offer reward rules.
 * Maps provider/platform error codes to a reusable group + default message.
 */
export interface ErrorGroup {
  id: string;
  name: string;
  /** Short group code shown in UI, e.g. "01" */
  code: string;
  description?: string;
  /** Provider/platform error codes that belong to this group */
  error_codes: string[];
  /** Suggested default failure message when this group is selected */
  default_failure_message?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateErrorGroupRequest {
  name: string;
  code: string;
  description?: string;
  error_codes?: string[];
  default_failure_message?: string;
  is_active?: boolean;
}

export interface UpdateErrorGroupRequest {
  name?: string;
  code?: string;
  description?: string;
  error_codes?: string[];
  default_failure_message?: string;
  is_active?: boolean;
}

export interface ErrorCodeOption {
  code: string;
  label: string;
  description?: string;
}

/** Display label used on reward rules and dropdown options */
export function formatErrorGroupLabel(group: Pick<ErrorGroup, "name" | "code">): string {
  const name = group.name?.trim() || "Error group";
  const code = group.code?.trim();
  return code ? `${name} (${code})` : name;
}
