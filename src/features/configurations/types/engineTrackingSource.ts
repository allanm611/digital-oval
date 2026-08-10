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

export interface TrackingSelectorOperator {
  id: number;
  code: string;
  symbol: string;
  name: string;
  displayOrder: number;
}

export interface TrackingSelectorField {
  id: number;
  fieldName: string;
  fieldKey: string;
  dataType: string;
  displayOrder: number;
  operators: TrackingSelectorOperator[];
}

export interface TrackingSelectorSource {
  id: number;
  name: string;
  code: string;
  sourceType: string;
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
