import type { RewardProviderSchemaField } from "../../types/rewardProvider";

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

  if (value === undefined || value === null) {
    return `${field.label} is required`;
  }

  if (field.type === "number") {
    if (value === "") return `${field.label} is required`;
    const n = Number(value);
    if (!Number.isFinite(n)) {
      return `${field.label} must be a valid number`;
    }
    return undefined;
  }

  if (String(value).trim() === "") {
    return `${field.label} is required`;
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
