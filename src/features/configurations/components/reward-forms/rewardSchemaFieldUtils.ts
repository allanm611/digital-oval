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
 * Whether a schema field may be changed after a reward configuration is created.
 * Legacy providers without `is_editable` remain fully editable.
 */
export function isSchemaFieldEditable(
  field: Pick<RewardProviderSchemaField, "is_editable">,
): boolean {
  return field.is_editable !== false;
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
