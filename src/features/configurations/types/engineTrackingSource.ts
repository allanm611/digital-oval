/**
 * Engine attribution catalog types for `/tracking-sources`
 * (app.use("/tracking-sources", TrackingSourcesRouter)).
 *
 * Distinct from Configuration → Offer Tracking Sources (`/offer-tracking-sources`).
 * Reward mappings FK `cvm.tracking_sources.id` — these IDs.
 */

export type EngineTrackingSourceType =
  | "recharge"
  | "bundle_purchase"
  | "usage_data"
  | "usage_voice"
  | "usage_sms"
  | "revenue"
  | "app_event"
  | "api_event"
  | "custom";

export type EngineFieldDataType =
  | "text"
  | "number"
  | "integer"
  | "boolean"
  | "date"
  | "timestamp"
  | "json";

export const ENGINE_TRACKING_SOURCE_TYPE_OPTIONS: {
  value: EngineTrackingSourceType;
  label: string;
}[] = [
  { value: "recharge", label: "Recharge" },
  { value: "bundle_purchase", label: "Bundle Purchase" },
  { value: "usage_data", label: "Data Usage" },
  { value: "usage_voice", label: "Voice Usage" },
  { value: "usage_sms", label: "SMS Usage" },
  { value: "revenue", label: "Revenue" },
  { value: "app_event", label: "App Event" },
  { value: "api_event", label: "API Event" },
  { value: "custom", label: "Custom" },
];

export const ENGINE_FIELD_DATA_TYPE_OPTIONS: {
  value: EngineFieldDataType;
  label: string;
}[] = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "integer", label: "Integer" },
  { value: "boolean", label: "Boolean" },
  { value: "date", label: "Date" },
  { value: "timestamp", label: "Timestamp" },
  { value: "json", label: "JSON" },
];

/**
 * Nested operator from GET /tracking-sources/selector-config
 * (`fields[].operators[]`).
 */
export interface TrackingSelectorOperator {
  id: number;
  code: string;
  symbol: string;
  /** Human label from API (`label`), e.g. "equals". */
  label: string;
  /** Alias of label for older call sites. */
  name: string;
  displayOrder: number;
  requiresValue: boolean;
  requiresTwoValues: boolean;
  applicableFieldTypes?: string[];
}

export interface EngineTrackingSourceField {
  id: number;
  trackingSourceId: number;
  fieldName: string;
  fieldKey: string;
  dataType: EngineFieldDataType | string;
  isRequired: boolean;
  isPrimaryKey: boolean;
  isAmountField: boolean;
  isRevenueField: boolean;
  isProductField: boolean;
  displayOrder: number;
  description?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  /** Present when the payload (selector-config or GET :id) nests operators. */
  operators?: TrackingSelectorOperator[];
}

export interface EngineTrackingSource {
  id: number;
  name: string;
  code: string;
  sourceType: EngineTrackingSourceType | string;
  description?: string | null;
  attributionWindowHours: number;
  cooldownHours: number;
  criteria?: Record<string, unknown> | unknown[] | null;
  rules?: unknown;
  includedProductCodes?: string[] | null;
  excludedProductCodes?: string[] | null;
  minAmount?: number | null;
  maxAmount?: number | null;
  isActive: boolean;
  fields?: EngineTrackingSourceField[];
  createdAt?: string;
  updatedAt?: string;
  metadata?: Record<string, unknown> | null;
}

export interface CreateEngineTrackingSourceFieldPayload {
  fieldName: string;
  fieldKey?: string;
  dataType: EngineFieldDataType | string;
  isRequired?: boolean;
  isPrimaryKey?: boolean;
  isAmountField?: boolean;
  isRevenueField?: boolean;
  isProductField?: boolean;
  displayOrder?: number;
  description?: string | null;
}

export type UpdateEngineTrackingSourceFieldPayload =
  Partial<CreateEngineTrackingSourceFieldPayload> & {
    isActive?: boolean;
  };

export interface CreateEngineTrackingSourcePayload {
  name: string;
  code: string;
  sourceType: EngineTrackingSourceType | string;
  description?: string | null;
  attributionWindowHours?: number;
  cooldownHours?: number;
  criteria?: Record<string, unknown> | unknown[] | null;
  includedProductCodes?: string[] | null;
  excludedProductCodes?: string[] | null;
  minAmount?: number | null;
  maxAmount?: number | null;
  isActive?: boolean;
  metadata?: Record<string, unknown> | null;
  fields?: CreateEngineTrackingSourceFieldPayload[];
}

export type UpdateEngineTrackingSourcePayload = Partial<
  Omit<CreateEngineTrackingSourcePayload, "fields">
>;

export interface EngineTrackingSourceListParams {
  is_active?: boolean;
  source_type?: EngineTrackingSourceType | string;
  limit?: number;
  offset?: number;
}

export interface EngineTrackingSourceSearchParams {
  q?: string;
  name?: string;
  code?: string;
  source_type?: EngineTrackingSourceType | string;
  is_active?: boolean;
  limit?: number;
  offset?: number;
}

/** Flat row from GET /tracking-sources/selector-config (view may use snake or camel). */
export interface TrackingSelectorConfigRow {
  tracking_source_id?: number;
  trackingSourceId?: number;
  source_id?: number;
  source_name?: string;
  sourceName?: string;
  source_code?: string;
  sourceCode?: string;
  source_type?: string;
  sourceType?: string;
  field_id?: number;
  fieldId?: number;
  field_name?: string;
  fieldName?: string;
  field_key?: string;
  fieldKey?: string;
  data_type?: string;
  dataType?: string;
  operator_id?: number;
  operatorId?: number;
  operator_code?: string;
  operatorCode?: string;
  operator_symbol?: string;
  operatorSymbol?: string;
  operator_name?: string;
  operatorName?: string;
  display_order?: number;
  displayOrder?: number;
  [key: string]: unknown;
}

export interface TrackingSelectorField {
  id: number;
  fieldName: string;
  fieldKey: string;
  dataType: string;
  displayOrder: number;
  isRequired?: boolean;
  isPrimaryKey?: boolean;
  isAmountField?: boolean;
  isRevenueField?: boolean;
  isProductField?: boolean;
  description?: string | null;
  operators: TrackingSelectorOperator[];
}

export interface TrackingSelectorSource {
  id: number;
  name: string;
  code: string;
  sourceType: string;
  description?: string | null;
  attributionWindowHours?: number;
  cooldownHours?: number;
  minAmount?: number | null;
  maxAmount?: number | null;
  isActive?: boolean;
  fields: TrackingSelectorField[];
}

export function engineSourceTypeLabel(
  type: string | undefined | null,
): string {
  if (!type) return "—";
  return (
    ENGINE_TRACKING_SOURCE_TYPE_OPTIONS.find((t) => t.value === type)?.label ||
    type
  );
}

export function isEngineTrackingSourceActive(
  item: Pick<EngineTrackingSource, "isActive"> & { is_active?: boolean },
): boolean {
  if (item.isActive === false || item.is_active === false) return false;
  return true;
}

export function trackingOperatorLabel(
  op: Pick<TrackingSelectorOperator, "label" | "name" | "symbol" | "code">,
): string {
  return op.label || op.name || op.symbol || op.code || "Operator";
}

export function trackingOperatorValue(
  op: Pick<TrackingSelectorOperator, "symbol" | "code" | "label">,
): string {
  return op.symbol || op.code || op.label || "";
}

export function trackingOperatorRequiresTwoValues(
  op: Pick<TrackingSelectorOperator, "requiresTwoValues" | "symbol" | "code">,
): boolean {
  if (op.requiresTwoValues) return true;
  return String(op.symbol || op.code || "").toUpperCase() === "BETWEEN";
}

export function trackingOperatorIsList(
  op: Pick<TrackingSelectorOperator, "symbol" | "code">,
): boolean {
  const symbol = String(op.symbol || op.code || "")
    .toUpperCase()
    .replace(/_/g, " ");
  return symbol === "IN" || symbol === "NOT IN";
}

export function activeCatalogFields(
  source: Pick<EngineTrackingSource, "fields">,
): EngineTrackingSourceField[] {
  return (source.fields || []).filter((f) => f.isActive !== false);
}

export function catalogFieldOperatorCount(
  fields: EngineTrackingSourceField[] | undefined | null,
): number {
  return (fields || []).reduce(
    (sum, f) => sum + (f.operators?.length || 0),
    0,
  );
}

/**
 * Shared operator catalog harvested from selector-config.
 * Used as a seed so new fields can attach operators even when none are
 * currently bound on any source.
 */
export const ENGINE_OPERATOR_CATALOG: TrackingSelectorOperator[] = [
  {
    id: 1,
    code: "=",
    symbol: "=",
    label: "equals",
    name: "equals",
    displayOrder: 1,
    requiresValue: true,
    requiresTwoValues: false,
    applicableFieldTypes: ["Numeric", "Text", "Date"],
  },
  {
    id: 2,
    code: "!=",
    symbol: "!=",
    label: "not equals",
    name: "not equals",
    displayOrder: 2,
    requiresValue: true,
    requiresTwoValues: false,
    applicableFieldTypes: ["Numeric", "Text", "Date"],
  },
  {
    id: 3,
    code: ">",
    symbol: ">",
    label: "greater than",
    name: "greater than",
    displayOrder: 3,
    requiresValue: true,
    requiresTwoValues: false,
    applicableFieldTypes: ["Numeric", "Date"],
  },
  {
    id: 4,
    code: "<",
    symbol: "<",
    label: "less than",
    name: "less than",
    displayOrder: 4,
    requiresValue: true,
    requiresTwoValues: false,
    applicableFieldTypes: ["Numeric", "Date"],
  },
  {
    id: 5,
    code: ">=",
    symbol: ">=",
    label: "greater than or equal",
    name: "greater than or equal",
    displayOrder: 5,
    requiresValue: true,
    requiresTwoValues: false,
    applicableFieldTypes: ["Numeric", "Date"],
  },
  {
    id: 6,
    code: "<=",
    symbol: "<=",
    label: "less than or equal",
    name: "less than or equal",
    displayOrder: 6,
    requiresValue: true,
    requiresTwoValues: false,
    applicableFieldTypes: ["Numeric", "Date"],
  },
  {
    id: 7,
    code: "IN",
    symbol: "IN",
    label: "in list",
    name: "in list",
    displayOrder: 7,
    requiresValue: true,
    requiresTwoValues: false,
    applicableFieldTypes: ["Numeric", "Text"],
  },
  {
    id: 8,
    code: "NOT IN",
    symbol: "NOT IN",
    label: "not in list",
    name: "not in list",
    displayOrder: 8,
    requiresValue: true,
    requiresTwoValues: false,
    applicableFieldTypes: ["Numeric", "Text"],
  },
  {
    id: 9,
    code: "BETWEEN",
    symbol: "BETWEEN",
    label: "between",
    name: "between",
    displayOrder: 9,
    requiresValue: true,
    requiresTwoValues: true,
    applicableFieldTypes: ["Numeric", "Date"],
  },
  {
    id: 13,
    code: "BETWEEN",
    symbol: "BETWEEN",
    label: "between dates",
    name: "between dates",
    displayOrder: 13,
    requiresValue: true,
    requiresTwoValues: true,
    applicableFieldTypes: ["Date"],
  },
];

export function dataTypeToApplicableGroup(
  dataType: string | undefined | null,
): string {
  switch (String(dataType || "").toLowerCase()) {
    case "number":
    case "integer":
      return "Numeric";
    case "date":
    case "timestamp":
      return "Date";
    default:
      return "Text";
  }
}

export function operatorAppliesToDataType(
  op: Pick<TrackingSelectorOperator, "applicableFieldTypes">,
  dataType: string | undefined | null,
): boolean {
  if (!op.applicableFieldTypes?.length) return true;
  const group = dataTypeToApplicableGroup(dataType).toLowerCase();
  return op.applicableFieldTypes.some((t) => String(t).toLowerCase() === group);
}

export function mergeOperatorCatalog(
  fromApi: TrackingSelectorOperator[],
): TrackingSelectorOperator[] {
  const byId = new Map(ENGINE_OPERATOR_CATALOG.map((op) => [op.id, op]));
  for (const op of fromApi) {
    byId.set(op.id, op);
  }
  return Array.from(byId.values()).sort(
    (a, b) => a.displayOrder - b.displayOrder || a.id - b.id,
  );
}
