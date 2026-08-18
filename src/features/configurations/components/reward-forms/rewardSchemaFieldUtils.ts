import type { RewardProviderSchemaField } from "../../types/rewardProvider";

/**
 * Runtime display aliases for known schema field names/labels.
 * Keeps API payload keys (e.g. durationType) stable while showing product wording.
 * Prefer updating provider schema labels in Configurations when possible.
 */
const SCHEMA_FIELD_DISPLAY_LABELS: Record<string, string> = {
  durationtype: "Validity Type",
  duration_type: "Validity Type",
  validitytype: "Validity Type",
  validity_type: "Validity Type",
  durationperiod: "Validity Period",
  duration_period: "Validity Period",
  validityperiod: "Validity Period",
  validity_period: "Validity Period",
};

const SCHEMA_LABEL_TEXT_ALIASES: Record<string, string> = {
  "duration type": "Validity Type",
  "duration period": "Validity Period",
};

/**
 * Whether a schema field may be changed on reward templates / runtime overrides.
 * Accepts boolean or common API string/number encodings.
 * Legacy providers without `is_editable` remain fully editable.
 */
export function isSchemaFieldEditable(
  field: Pick<RewardProviderSchemaField, "is_editable">,
): boolean {
  const value = field.is_editable as unknown;
  if (value === false || value === 0 || value === "0" || value === "false") {
    return false;
  }
  return true;
}

export function resolveSchemaFieldDisplayLabel(
  field: Pick<RewardProviderSchemaField, "name" | "label">,
): string {
  const nameKey = String(field.name || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  const byName =
    SCHEMA_FIELD_DISPLAY_LABELS[nameKey] ||
    SCHEMA_FIELD_DISPLAY_LABELS[nameKey.replace(/_/g, "")];
  if (byName) return byName;

  const labelKey = String(field.label || "")
    .trim()
    .toLowerCase()
    .replace(/\s*\*$/, "")
    .replace(/\s+/g, " ");
  return SCHEMA_LABEL_TEXT_ALIASES[labelKey] || field.label;
}

export const BOOLEAN_SELECT_OPTIONS = [
  { value: "true", label: "True" },
  { value: "false", label: "False" },
] as const;

export const OPTIONAL_DEFAULT_OPTION = {
  value: "",
  label: "No default",
} as const;

export function parseBooleanValue(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === 1 || value === "1") return true;
  if (value === "false" || value === 0 || value === "0") return false;
  return false;
}

export function booleanToSelectValue(value: unknown): string {
  if (value === undefined || value === null || value === "") return "";
  return parseBooleanValue(value) ? "true" : "false";
}

export function emptyValueForFieldType(
  type: RewardProviderSchemaField["type"],
): unknown {
  if (type === "boolean") return false;
  if (type === "number") return "";
  return "";
}

export function coerceConfigValue(
  field: RewardProviderSchemaField,
  raw: unknown,
): unknown {
  if (raw === undefined || raw === null) {
    return emptyValueForFieldType(field.type);
  }

  switch (field.type) {
    case "boolean":
      return parseBooleanValue(raw);
    case "number": {
      if (raw === "") return "";
      const n = Number(raw);
      return Number.isFinite(n) ? n : raw;
    }
    default:
      return raw;
  }
}

const PLACEHOLDER_SECRET_RE = /^[\s•·\u2022*xX]+$/;

export function isSecretSchemaField(
  field: Pick<RewardProviderSchemaField, "name" | "type">,
): boolean {
  if (field.type === "password") return true;
  const key = String(field.name || "").toLowerCase();
  return (
    key.includes("password") ||
    key.includes("secret") ||
    key.includes("token") ||
    key.includes("api_key") ||
    key.includes("apikey")
  );
}

/** Empty, bullets, or asterisk-only values that must not overwrite a real secret. */
export function isPlaceholderSecretValue(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  const str = String(value).trim();
  if (!str) return true;
  return str.length >= 4 && PLACEHOLDER_SECRET_RE.test(str);
}

/**
 * Provider-owned value for a field (locked fields, and every field on the
 * system default template).
 *
 * Prefers the current schema default so provider edits like username
 * `YB` → `YBs` are reflected. Secrets keep the stored value when the
 * schema default is empty or masked (user did not re-enter the password).
 */
export function inheritProviderFieldValue(
  field: RewardProviderSchemaField,
  stored?: Record<string, unknown>,
): unknown {
  const schemaDefault = field.default;
  const storedValue = stored?.[field.name];
  const schemaIsPlaceholder =
    isSecretSchemaField(field) && isPlaceholderSecretValue(schemaDefault);
  const storedIsUsable =
    storedValue !== undefined &&
    !(isSecretSchemaField(field) && isPlaceholderSecretValue(storedValue));

  if (schemaIsPlaceholder && storedIsUsable) {
    return coerceConfigValue(field, storedValue);
  }

  if (
    schemaDefault !== undefined &&
    schemaDefault !== "" &&
    !schemaIsPlaceholder
  ) {
    return coerceConfigValue(field, schemaDefault);
  }

  if (storedIsUsable) {
    return coerceConfigValue(field, storedValue);
  }

  return coerceConfigValue(field, schemaDefault);
}

/**
 * Canonical value for a locked schema field: current provider default,
 * with stored secret fallback when the schema default is empty/masked.
 */
export function lockedSchemaFieldValue(
  field: RewardProviderSchemaField,
  masterValues?: Record<string, unknown>,
): unknown {
  return inheritProviderFieldValue(field, masterValues);
}

export type ResolveSchemaConfigMode = "default_template" | "custom_template";

/**
 * Merge stored template config with the current provider schema.
 *
 * - Default template: every field follows the provider (system-owned mirror).
 * - Custom template: locked fields follow the provider; editable fields keep
 *   the stored template value.
 * Keys that were removed from the schema are dropped.
 */
export function resolveSchemaConfigValues(
  fields: RewardProviderSchemaField[],
  stored?: Record<string, unknown>,
  mode: ResolveSchemaConfigMode = "custom_template",
): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  fields.forEach((field) => {
    const inheritFromProvider =
      mode === "default_template" || !isSchemaFieldEditable(field);
    if (inheritFromProvider) {
      values[field.name] = inheritProviderFieldValue(field, stored);
      return;
    }
    if (stored && stored[field.name] !== undefined) {
      values[field.name] = coerceConfigValue(field, stored[field.name]);
      return;
    }
    if (field.default !== undefined && field.default !== "") {
      values[field.name] = coerceConfigValue(field, field.default);
      return;
    }
    values[field.name] = coerceConfigValue(field, undefined);
  });
  return values;
}

export function normalizeConfigValueForApi(
  field: RewardProviderSchemaField,
  raw: unknown,
): unknown {
  switch (field.type) {
    case "boolean":
      return parseBooleanValue(raw);
    case "number": {
      if (raw === "" || raw === undefined || raw === null) return raw ?? "";
      const n = Number(raw);
      return Number.isFinite(n) ? n : raw;
    }
    default:
      return raw ?? "";
  }
}

export function coerceSchemaDefaultValue(
  field: RewardProviderSchemaField,
  raw: unknown,
): unknown | undefined {
  if (raw === undefined || raw === null || raw === "") return undefined;

  switch (field.type) {
    case "boolean":
      return parseBooleanValue(raw);
    case "number": {
      const n = Number(raw);
      return Number.isFinite(n) ? n : undefined;
    }
    case "select": {
      const str = String(raw);
      const options = field.options || [];
      return options.includes(str) ? str : undefined;
    }
    default:
      return String(raw);
  }
}

export function validateRequiredSchemaValue(
  field: RewardProviderSchemaField,
  value: unknown,
): string | undefined {
  if (!field.required) return undefined;

  if (field.type === "boolean") return undefined;

  const label = resolveSchemaFieldDisplayLabel(field);

  if (value === undefined || value === null) {
    return `${label} is required`;
  }

  if (field.type === "number") {
    if (value === "") return `${label} is required`;
    const n = Number(value);
    if (!Number.isFinite(n)) {
      return `${label} must be a valid number`;
    }
    return undefined;
  }

  if (String(value).trim() === "") {
    return `${label} is required`;
  }

  return undefined;
}

export function patchFieldForTypeChange(
  field: RewardProviderSchemaField,
  newType: RewardProviderSchemaField["type"],
): Partial<RewardProviderSchemaField> {
  return {
    type: newType,
    default: undefined,
    options: newType === "select" ? field.options || [] : undefined,
    placeholder:
      newType === "boolean" || newType === "select" ? "" : field.placeholder,
  };
}

export function buildInitialConfigValues(
  fields: RewardProviderSchemaField[],
  existing?: Record<string, unknown>,
): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  fields.forEach((field) => {
    if (existing && existing[field.name] !== undefined) {
      values[field.name] = coerceConfigValue(field, existing[field.name]);
      return;
    }
    if (field.default !== undefined && field.default !== "") {
      values[field.name] = coerceConfigValue(field, field.default);
      return;
    }
    values[field.name] = coerceConfigValue(field, undefined);
  });
  return values;
}

export function normalizeConfigFields(
  fields: RewardProviderSchemaField[],
  values: Record<string, unknown>,
): Record<string, unknown> {
  const config: Record<string, unknown> = {};
  fields.forEach((field) => {
    config[field.name] = normalizeConfigValueForApi(field, values[field.name]);
  });
  return config;
}

export function collectSchemaFieldErrors(
  fields: RewardProviderSchemaField[],
  values: Record<string, unknown>,
  section: string,
): Record<string, string> {
  const errors: Record<string, string> = {};
  fields.forEach((field) => {
    const message = validateRequiredSchemaValue(field, values[field.name]);
    if (message) {
      errors[`${section}.${field.name}`] = message;
    }
  });
  return errors;
}
