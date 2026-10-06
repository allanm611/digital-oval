export type JsonValueKind =
  | "string"
  | "integer"
  | "decimal"
  | "boolean"
  | "date"
  | "datetime"
  | "time"
  | "uuid"
  | "null";

export interface JsonParamRow {
  id: string;
  key: string;
  kind: JsonValueKind;
  value: string;
}

export interface JsonParamIssue {
  rowId?: string;
  message: string;
}

export const JSON_PARAM_KIND_OPTIONS: Array<{
  value: JsonValueKind;
  label: string;
}> = [
  { value: "string", label: "Text" },
  { value: "integer", label: "Integer" },
  { value: "decimal", label: "Decimal" },
  { value: "boolean", label: "Boolean" },
  { value: "date", label: "Date" },
  { value: "datetime", label: "Date and time" },
  { value: "time", label: "Time" },
  { value: "uuid", label: "UUID" },
  { value: "null", label: "Empty" },
];

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATE_TIME_PATTERN = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::(\d{2}))?$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;
const UUID_PATTERN =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

function newRowId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `param-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createJsonParamRow(
  partial: Partial<JsonParamRow> = {},
): JsonParamRow {
  return {
    id: newRowId(),
    key: "",
    kind: "string",
    value: "",
    ...partial,
  };
}

function isRealDate(value: string): boolean {
  const match = DATE_PATTERN.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function isDateTime(value: string): boolean {
  const match = DATE_TIME_PATTERN.exec(value);
  if (!match || !isRealDate(match[1])) return false;
  return TIME_PATTERN.test(match[3] ? `${match[2]}:${match[3]}` : match[2]);
}

function kindForString(value: string): JsonValueKind {
  if (isRealDate(value)) return "date";
  if (isDateTime(value)) return "datetime";
  if (TIME_PATTERN.test(value)) return "time";
  if (UUID_PATTERN.test(value)) return "uuid";
  return "string";
}

function isJsonPrimitive(value: unknown): value is string | number | boolean | null {
  return (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

export function jsonParametersToRows(
  raw: string,
): { ok: true; rows: JsonParamRow[] } | { ok: false } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: true, rows: [createJsonParamRow()] };

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ok: false };
    }
    const entries = Object.entries(parsed as Record<string, unknown>);
    if (entries.some(([, value]) => !isJsonPrimitive(value))) {
      return { ok: false };
    }
    if (entries.length === 0) return { ok: true, rows: [createJsonParamRow()] };

    return {
      ok: true,
      rows: entries.map(([key, value]) => {
        if (value === null) {
          return createJsonParamRow({ key, kind: "null", value: "" });
        }
        if (typeof value === "boolean") {
          return createJsonParamRow({
            key,
            kind: "boolean",
            value: value ? "true" : "false",
          });
        }
        if (typeof value === "number") {
          return createJsonParamRow({
            key,
            kind: Number.isInteger(value) ? "integer" : "decimal",
            value: String(value),
          });
        }
        return createJsonParamRow({ key, kind: kindForString(value), value });
      }),
    };
  } catch {
    return { ok: false };
  }
}

export function sanitizeJsonParamValue(kind: JsonValueKind, raw: string): string {
  if (kind === "integer") {
    const negative = raw.trim().startsWith("-");
    const digits = raw.replace(/\D/g, "");
    if (!digits && !negative) return "";
    return `${negative ? "-" : ""}${digits}`;
  }
  if (kind === "decimal") {
    const trimmed = raw.trim();
    const negative = trimmed.startsWith("-");
    const body = trimmed.replace(/-/g, "").replace(/[^\d.]/g, "");
    const dot = body.indexOf(".");
    const next =
      dot === -1 ? body : `${body.slice(0, dot)}.${body.slice(dot + 1).replace(/\./g, "")}`;
    if (!next && !negative) return "";
    return `${negative ? "-" : ""}${next}`;
  }
  if (kind === "uuid") {
    const hex = raw.replace(/[^0-9a-fA-F]/g, "").slice(0, 32);
    const sizes = [8, 4, 4, 4, 12];
    const groups: string[] = [];
    let index = 0;
    sizes.forEach((size) => {
      if (index >= hex.length) return;
      groups.push(hex.slice(index, index + size));
      index += size;
    });
    return groups.join("-");
  }
  if (kind === "date") {
    return isRealDate(raw) ? raw : "";
  }
  if (kind === "datetime") {
    return isDateTime(raw) ? raw : "";
  }
  if (kind === "time") {
    return TIME_PATTERN.test(raw) ? raw : "";
  }
  return raw;
}

export function coerceJsonParamValue(kind: JsonValueKind, raw: string): string {
  if (kind === "boolean") return raw === "false" ? "false" : "true";
  if (kind === "null") return "";
  if (kind === "string") return raw;
  return sanitizeJsonParamValue(kind, raw);
}

export function valuePlaceholder(kind: JsonValueKind): string {
  switch (kind) {
    case "integer":
      return "100";
    case "decimal":
      return "3.5";
    case "uuid":
      return "550e8400-e29b-41d4-a716-446655440000";
    case "null":
      return "null";
    case "string":
      return "Value";
    default:
      return "";
  }
}

function normalizeDateTime(value: string): string {
  const match = DATE_TIME_PATTERN.exec(value);
  if (!match) return value;
  return `${match[1]}T${match[2]}:${match[3] || "00"}`;
}

function normalizeTime(value: string): string {
  return value.length === 5 ? `${value}:00` : value;
}

export function rowsToJsonParameters(rows: JsonParamRow[]): {
  json: string;
  issues: JsonParamIssue[];
} {
  const issues: JsonParamIssue[] = [];
  const seen = new Map<string, string>();
  const result: Record<string, unknown> = {};

  rows.forEach((row) => {
    const key = row.key.trim();
    const typed =
      row.kind === "null" || row.kind === "boolean" || row.value.trim().length > 0;
    if (!key) {
      if (typed && (row.kind !== "string" || row.value.trim())) {
        issues.push({ rowId: row.id, message: "Give this value a name." });
      }
      return;
    }

    if (seen.has(key)) {
      issues.push({
        rowId: row.id,
        message: `"${key}" is listed more than once. The last value is the one that will be saved.`,
      });
    }
    seen.set(key, row.id);

    const value = row.value.trim();
    if (row.kind === "string") {
      result[key] = row.value;
      return;
    }
    if (row.kind === "null") {
      result[key] = null;
      return;
    }
    if (row.kind === "boolean") {
      result[key] = value !== "false";
      return;
    }
    if (row.kind === "integer") {
      if (!/^-?\d+$/.test(value) || !Number.isSafeInteger(Number(value))) {
        issues.push({
          rowId: row.id,
          message: `"${key}" needs a whole number such as 100. Use Text for a very large id.`,
        });
        return;
      }
      result[key] = Number(value);
      return;
    }
    if (row.kind === "decimal") {
      if (!/^-?\d+(\.\d+)?$/.test(value) || !Number.isFinite(Number(value))) {
        issues.push({
          rowId: row.id,
          message: `"${key}" needs a decimal such as 3.5.`,
        });
        return;
      }
      result[key] = Number(value);
      return;
    }
    if (row.kind === "date") {
      if (!isRealDate(value)) {
        issues.push({ rowId: row.id, message: `"${key}" needs a date.` });
        return;
      }
      result[key] = value;
      return;
    }
    if (row.kind === "datetime") {
      if (!isDateTime(value)) {
        issues.push({ rowId: row.id, message: `"${key}" needs a date and time.` });
        return;
      }
      result[key] = normalizeDateTime(value);
      return;
    }
    if (row.kind === "time") {
      if (!TIME_PATTERN.test(value)) {
        issues.push({ rowId: row.id, message: `"${key}" needs a time.` });
        return;
      }
      result[key] = normalizeTime(value);
      return;
    }
    if (!UUID_PATTERN.test(value)) {
      issues.push({
        rowId: row.id,
        message: `"${key}" needs a UUID, such as 550e8400-e29b-41d4-a716-446655440000.`,
      });
      return;
    }
    result[key] = value.toLowerCase();
  });

  return {
    json: Object.keys(result).length === 0 ? "" : JSON.stringify(result, null, 2),
    issues,
  };
}

export function bodyTemplateError(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed || !trimmed.startsWith("{")) return "";
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return "A JSON body must be an object, for example { \"status\": \"active\" }.";
    }
    return "";
  } catch {
    return "This body is not valid JSON. Add one field per value, or match the example object.";
  }
}
