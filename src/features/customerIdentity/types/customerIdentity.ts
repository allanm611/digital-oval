export type FieldOperator = {
  id: number;
  symbol: string;
  label: string;
  requires_value: boolean;
  requires_two_values: boolean;
  applicable_field_types: string[];
};

export type FieldValidation = {
  strategy: string | null;
  distinct_values: number | null;
  range_min: number | null;
  range_max: number | null;
  value_length: number | null;
};

export type FieldUIConfig = {
  component_type: string | null;
  is_multi_select: boolean;
  is_required: boolean;
};

export type CustomerIdentityField = {
  id: number;
  field_name: string;
  field_value: string;
  description: string;
  field_type: string;
  field_pg_type: string | null;
  field_type_precision: string | number | null;
  source_table: string;
  validation: FieldValidation | null;
  ui: FieldUIConfig | null;
  operators: FieldOperator[];
  default_operator: string | null;
};

export type FieldCategory = {
  id: number;
  name: string;
  value: string;
  description: string;
  parent_category_id: number | null;
  display_order: number;
  fields: CustomerIdentityField[];
};

export type SegmentationProfile = {
  field_selector_config: FieldCategory[];
};

export type SegmentationProfilesResponse = {
  success: boolean;
  data: SegmentationProfile[];
  source?: string;
};
