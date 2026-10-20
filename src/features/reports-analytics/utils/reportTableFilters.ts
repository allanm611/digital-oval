import { parseISODate } from "./reportTimeWindow";

export type ReportFilterValueType = "text" | "number" | "date" | "select";

export type ReportFilterOperator =
  | "contains"
  | "does not contain"
  | "equals"
  | "does not equal"
  | "starts with"
  | "ends with"
  | "is empty"
  | "is not empty"
  | "is any of"
  | "="
  | "!="
  | ">"
  | ">="
  | "<"
  | "<="
  | "is"
  | "is not"
  | "is after"
  | "is on or after"
  | "is before"
  | "is on or before"
  | "is between";

export interface ReportFilterField {
  id: string;
  label: string;
  type: ReportFilterValueType;
  /** Property read from a table row. Defaults to `id`. */
  rowKey?: string;
  /** Wire field sent to the monitoring API. Defaults to `id`. */
  apiField?: string;
  options?: Array<{ label: string; value: string }>;
}

export interface ReportFilterRule {
  id: string;
  field: string;
  operator: ReportFilterOperator | "";
  value: string;
  valueTo?: string;
}

export interface SerializedReportFilter {
  field: string;
  operator: string;
  value?: string;
  valueTo?: string;
}

export const TEXT_FILTER_OPERATORS: Array<{
  value: ReportFilterOperator;
  label: string;
}> = [
  { value: "contains", label: "contains" },
  { value: "does not contain", label: "does not contain" },
  { value: "equals", label: "equals" },
  { value: "does not equal", label: "does not equal" },
  { value: "starts with", label: "starts with" },
  { value: "ends with", label: "ends with" },
  { value: "is empty", label: "is empty" },
  { value: "is not empty", label: "is not empty" },
];

export const NUMBER_FILTER_OPERATORS: Array<{
  value: ReportFilterOperator;
  label: string;
}> = [
  { value: "=", label: "=" },
  { value: "!=", label: "!=" },
  { value: ">", label: ">" },
  { value: ">=", label: ">=" },
  { value: "<", label: "<" },
  { value: "<=", label: "<=" },
  { value: "is empty", label: "is empty" },
  { value: "is not empty", label: "is not empty" },
];

export const DATE_FILTER_OPERATORS: Array<{
  value: ReportFilterOperator;
  label: string;
}> = [
  { value: "is", label: "is" },
  { value: "is not", label: "is not" },
  { value: "is after", label: "is after" },
  { value: "is on or after", label: "is on or after" },
  { value: "is before", label: "is before" },
  { value: "is on or before", label: "is on or before" },
  { value: "is between", label: "is between" },
  { value: "is empty", label: "is empty" },
  { value: "is not empty", label: "is not empty" },
];

export const SELECT_FILTER_OPERATORS: Array<{
  value: ReportFilterOperator;
  label: string;
}> = [
  { value: "is", label: "is" },
  { value: "is not", label: "is not" },
];

const EMPTY_OPERATORS = new Set<string>(["is empty", "is not empty"]);

export function operatorsForFilterType(
  type: ReportFilterValueType,
): Array<{ value: ReportFilterOperator; label: string }> {
  if (type === "number") return NUMBER_FILTER_OPERATORS;
  if (type === "date") return DATE_FILTER_OPERATORS;
  if (type === "select") return SELECT_FILTER_OPERATORS;
  return TEXT_FILTER_OPERATORS;
}

export function defaultOperatorForType(
  type: ReportFilterValueType,
): ReportFilterOperator {
  if (type === "number") return ">=";
  if (type === "date") return "is on or after";
  if (type === "select") return "is";
  return "contains";
}

export function createReportFilterRule(
  field: ReportFilterField,
): ReportFilterRule {
  return {
    id: `filter-${field.id}-${Math.random().toString(36).slice(2, 8)}`,
    field: field.id,
    operator: defaultOperatorForType(field.type),
    value: "",
    valueTo: "",
  };
}

export function isCompleteReportFilter(
  rule: ReportFilterRule,
  field?: ReportFilterField,
): boolean {
  if (!rule.field || !rule.operator) return false;
  if (EMPTY_OPERATORS.has(rule.operator)) return true;
  if (rule.operator === "is between") {
    return Boolean(rule.value.trim() && rule.valueTo?.trim());
  }
  if (field?.type === "number") {
    return rule.value.trim() !== "" && Number.isFinite(Number(rule.value));
  }
  return rule.value.trim() !== "";
}

function readRowValue(
  row: Record<string, unknown>,
  field: ReportFilterField,
): unknown {
  return row[field.rowKey || field.id];
}

function asText(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

function asNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function asDateMs(value: unknown): number | null {
  if (value == null || value === "" || value === "—") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const raw = String(value);
  const iso = parseISODate(raw.slice(0, 10));
  if (iso) return iso.getTime();
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
}

export function matchReportFilterRule(
  row: Record<string, unknown>,
  rule: ReportFilterRule,
  field: ReportFilterField,
): boolean {
  const value = readRowValue(row, field);
  if (rule.operator === "is empty") {
    return asText(value) === "";
  }
  if (rule.operator === "is not empty") {
    return asText(value) !== "";
  }

  if (field.type === "text") {
    const current = asText(value).toLowerCase();
    const needle = rule.value.trim().toLowerCase();
    switch (rule.operator) {
      case "contains":
        return current.includes(needle);
      case "does not contain":
        return !current.includes(needle);
      case "equals":
        return current === needle;
      case "does not equal":
        return current !== needle;
      case "starts with":
        return current.startsWith(needle);
      case "ends with":
        return current.endsWith(needle);
      case "is any of":
        return needle
          .split(",")
          .map((part) => part.trim())
          .filter(Boolean)
          .includes(current);
      default:
        return true;
    }
  }

  if (field.type === "number") {
    const current = asNumber(value);
    const target = asNumber(rule.value);
    if (current == null || target == null) return false;
    switch (rule.operator) {
      case "=":
        return current === target;
      case "!=":
        return current !== target;
      case ">":
        return current > target;
      case ">=":
        return current >= target;
      case "<":
        return current < target;
      case "<=":
        return current <= target;
      default:
        return true;
    }
  }

  if (field.type === "select") {
    const current = asText(value);
    const target = rule.value.trim();
    if (rule.operator === "is") return current === target;
    if (rule.operator === "is not") return current !== target;
    return true;
  }

  const current = asDateMs(value);
  const target = asDateMs(rule.value);
  if (rule.operator === "is between") {
    const end = asDateMs(rule.valueTo);
    if (current == null || target == null || end == null) return false;
    const from = Math.min(target, end);
    const to = Math.max(target, end) + 24 * 60 * 60 * 1000 - 1;
    return current >= from && current <= to;
  }
  if (current == null || target == null) return false;
  switch (rule.operator) {
    case "is":
      return new Date(current).toDateString() === new Date(target).toDateString();
    case "is not":
      return new Date(current).toDateString() !== new Date(target).toDateString();
    case "is after":
      return current > target;
    case "is on or after":
      return current >= target;
    case "is before":
      return current < target;
    case "is on or before":
      return current <= target;
    default:
      return true;
  }
}

export function matchReportFilters<T extends Record<string, unknown>>(
  row: T,
  rules: ReportFilterRule[],
  fields: ReportFilterField[],
): boolean {
  const fieldById = new Map(fields.map((field) => [field.id, field]));
  return rules.every((rule) => {
    const field = fieldById.get(rule.field);
    if (!field || !isCompleteReportFilter(rule, field)) return true;
    return matchReportFilterRule(row, rule, field);
  });
}

export function serializeReportFilters(
  rules: ReportFilterRule[],
  fields: ReportFilterField[],
): string {
  const fieldById = new Map(fields.map((field) => [field.id, field]));
  const payload: SerializedReportFilter[] = [];
  for (const rule of rules) {
    const field = fieldById.get(rule.field);
    if (!field || !isCompleteReportFilter(rule, field)) continue;
    payload.push({
      field: field.apiField || field.id,
      operator: rule.operator,
      value: rule.value,
      valueTo: rule.valueTo,
    });
  }
  return payload.length ? JSON.stringify(payload) : "";
}

export function firstNameContains(
  rules: ReportFilterRule[],
  fieldId = "name",
): string {
  const rule = rules.find(
    (item) => item.field === fieldId && item.operator === "contains",
  );
  return rule?.value.trim() || "";
}

export const CAMPAIGN_REPORT_FILTER_FIELDS: ReportFilterField[] = [
  { id: "name", label: "Name", type: "text" },
  { id: "lastRunDate", label: "Last run", type: "date" },
  { id: "sent", label: "Sent", type: "number" },
  { id: "delivered", label: "Delivered", type: "number" },
  { id: "conversions", label: "Converted", type: "number" },
  {
    id: "tgConversionPercentage",
    label: "Target group %",
    type: "number",
  },
];

export const OFFER_REPORT_FILTER_FIELDS: ReportFilterField[] = [
  { id: "offerName", label: "Name", type: "text", apiField: "name" },
  { id: "sent", label: "Sent", type: "number" },
  { id: "delivered", label: "Delivered", type: "number" },
  { id: "conversions", label: "Converted", type: "number" },
  { id: "lastUpdated", label: "Last updated", type: "date" },
];

export const SEGMENT_REPORT_FILTER_FIELDS: ReportFilterField[] = [
  { id: "name", label: "Name", type: "text" },
  { id: "memberCount", label: "Subscribers", type: "number" },
  { id: "campaignsUsed", label: "Campaigns targeting", type: "number" },
  { id: "conversionRate", label: "Take-up rate", type: "number" },
];

export const CUSTOMER_REPORT_FILTER_FIELDS: ReportFilterField[] = [
  { id: "name", label: "Name", type: "text" },
  { id: "email", label: "Email", type: "text" },
  { id: "msisdn", label: "MSISDN", type: "text" },
];

export const DELIVERY_REPORT_FILTER_FIELDS: ReportFilterField[] = [
  { id: "campaign", label: "Campaign", type: "text" },
  { id: "offer", label: "Offer", type: "text" },
  { id: "segment", label: "Segment", type: "text" },
];
