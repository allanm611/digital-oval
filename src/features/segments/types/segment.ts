// Core Entity Types

export type SegmentType = {
  id: number;
  name: string;
  code: string | null;
  type:
    | "static"
    | "dynamic"
    | "predictive"
    | "behavioral"
    | "demographic"
    | "geographic"
    | "transactional";
  category: number | null;
  parent_segment: number | null;
  description: string | null;
  definition: Record<string, unknown> | null;
  query: string | null;
  count_query: string | null;
  size_estimate: number | null;
  last_computed_at: string | null;
  tags: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
  visibility: string;
  created_by_user_id: number | null;
};

export type SegmentCategoryType = {
  id: number;
  name: string;
  description: string | null;
  parent_category_id: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type SegmentRuleType = {
  id: number;
  segment_id: number;
  rule_json: object;
  rule_order: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
};

export type SegmentMemberType = {
  id: number;
  segment_id: number;
  customer_id: number;
  created_at: string;
  created_by?: string;
};

// Segment Criteria Types (for Dynamic Segments)

export type SegmentCriteriaType = {
  from: string; // Base table
  join?: JoinClauseType[]; // Optional joins
  select?: SelectFieldType[]; // Fields to select
  where?: ConditionGroupType[]; // Conditions
  group_by?: string[]; // GROUP BY fields
  having?: HavingConditionType[]; // HAVING conditions
  order_by?: OrderByClauseType[]; // ORDER BY clauses
  limit?: number; // LIMIT clause
};

export type JoinClauseType = {
  type: "LEFT" | "INNER" | "RIGHT";
  table: string;
  on: [string, string]; // [left_field, right_field]
};

export type SelectFieldType = {
  table: string;
  field: string;
  function?: "COUNT" | "SUM" | "AVG" | "MAX" | "MIN";
  alias?: string;
};

export type ConditionGroupType = {
  operator: "AND" | "OR";
  conditions: [
    {
      field: string;
      operator: "=" | "!=" | ">" | "<" | ">=" | "<=" | "IN" | "NOT IN" | "LIKE";
      value: unknown;
    },
  ];
};

export type HavingConditionType = {
  field: string;
  operator: string;
  value: unknown;
};

export type OrderByClauseType = {
  field: string;
  direction: "ASC" | "DESC";
};

// API Response Types

export type ApiSuccessResponse<T> = {
  success: true;
  message: string;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    pageSize?: number;
    totalPages?: number;
    sortBy?: string;
    sortDirection?: string;
    isCachedResponse?: boolean;
    cacheDurationSec?: number;
  };
};

export type ApiErrorResponse = {
  success: false;
  error: string;
  details?: string;
};

export type PaginatedResponse<T> = {
  success: true;
  data: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    sortBy: string;
    sortDirection: string;
    isCachedResponse: boolean;
    cacheDurationSec: number;
  };
};

// Request Types

export type CreateSegmentRequest = {
  name: string; // Required
  code?: string; // Optional (unique segment code)
  type:
    | "static"
    | "dynamic"
    | "predictive"
    | "behavioral"
    | "demographic"
    | "geographic"
    | "transactional"; // Required
  category?: number; // Optional
  parent_segment?: number; // Optional
  description?: string; // Optional
  definition?: Record<string, unknown>; // Optional
  query?: string; // Optional
  count_query?: string; // Optional
  size_estimate?: number; // Optional
  tags?: string[]; // Optional
  is_active?: boolean; // Optional (defaults to true)
  visibility?: string; // Optional
  created_by_user_id?: number; // Optional
};

export type UpdateSegmentRequest = {
  name?: string; // Optional
  code?: string; // Optional
  category?: number; // Optional
  parent_segment?: number; // Optional
  description?: string; // Optional
  definition?: Record<string, unknown>; // Optional
  query?: string; // Optional
  count_query?: string; // Optional
  size_estimate?: number; // Optional
  tags?: string[]; // Optional
  is_active?: boolean; // Optional
  visibility?: string; // Optional
  updated_by?: string; // Optional
};

export type CreateSegmentCategoryRequest = {
  name: string; // Required
  description?: string; // Optional
  parent_category_id?: number; // Optional (for hierarchical categories)
  is_active?: boolean; // Optional (defaults to true)
};

export type UpdateSegmentCategoryRequest = {
  name?: string; // Optional
  description?: string; // Optional
  parent_category_id?: number; // Optional
  is_active?: boolean; // Optional
};

export type AddSegmentMembersRequest = {
  customer_ids: number[]; // Required, array of customer IDs
};

export type DeleteSegmentMembersRequest = {
  customer_ids?: number[]; // Optional, specific customer IDs
  remove_all?: boolean; // Optional, default false
};

export type CreateSegmentRuleRequest = {
  rule_json: object; // Required, rule definition
  rule_order?: number; // Optional, default 1
};

export type UpdateSegmentRuleRequest = {
  rule_json?: object; // Optional, rule definition
  rule_order?: number; // Optional
};

export type DuplicateSegmentRequest = {
  new_name: string; // Required, 1-128 chars
  copy_members?: boolean; // Optional, default false
  copy_rules?: boolean; // Optional, default true
};

export type ValidateCriteriaRequest = {
  criteria: SegmentCriteriaType; // Required, criteria to validate
};

export type ValidateRulesRequest = {
  rules: object[]; // Required, array of rules to validate
};

export type ComputeSegmentRequest = {
  force_recompute?: boolean; // Optional, default false
  incremental?: boolean; // Optional, default true
};

export type BatchComputeRequest = {
  segment_ids: number[]; // Required, array of segment IDs
  force_recompute?: boolean; // Optional, default false
};

export type PreviewSegmentRequest = {
  sample_size?: number; // Optional, default 10, max 1000
  criteria_override?: SegmentCriteriaType; // Optional, override criteria
};

export type SearchSegmentMembersRequest = {
  query?: string; // Optional, search term
  filters?: Record<string, unknown>; // Optional, additional filters
  page?: number; // Optional, default 1
  pageSize?: number; // Optional, default 10
};

export type ExportSegmentQuery = {
  format?: "csv" | "json"; // Optional, default "json"
};

export type CustomExportRequest = {
  format: "csv" | "json"; // Required
  fields?: string[]; // Optional, specific fields to export
  filters?: Record<string, unknown>; // Optional, additional filters
};

// Query Parameter Types

export type SearchSegmentsQuery = {
  q: string; // Required, search term
  category?: number; // Optional, category ID
  type?: "static" | "dynamic" | "trigger"; // Optional
  visibility?: "private" | "public"; // Optional
  tags?: string; // Optional, comma-separated
  page?: number; // Optional, default 1
  pageSize?: number; // Optional, default 10
  sortBy?: string; // Optional
  sortDirection?: "ASC" | "DESC"; // Optional
  skipCache?: boolean | "true" | "false"; // Optional, can be boolean or string
};

export type GetSegmentsQuery = {
  search?: string; // Optional
  categoryId?: number; // Optional
  type?: "static" | "dynamic" | "trigger"; // Optional
  page?: number; // Optional, default 1
  pageSize?: number; // Optional, default 10
  sortBy?: string; // Optional
  sortDirection?: "ASC" | "DESC"; // Optional
  skipCache?: boolean | "true" | "false"; // Optional, can be boolean or string
};

export type GetSegmentMembersQuery = {
  page?: number; // Optional, default 1
  pageSize?: number; // Optional, default 10
  sortBy?: string; // Optional
  sortDirection?: "ASC" | "DESC"; // Optional
};

// Status Response Types

export type ComputationStatusResponse = {
  segment_id: number;
  job_id: string;
  status: "processing" | "completed" | "failed";
  started_at: string;
  completed_at?: string;
  processed_count: number;
  total_count: number;
  message: string;
  error?: string;
};

// Analytics Response Types

export type HealthSummaryResponse = {
  total_segments: number;
  active_segments: number;
  inactive_segments: number;
  dynamic_segments: number;
  static_segments: number;
  trigger_segments: number;
  last_24h_created: number;
  last_7d_created: number;
  last_30d_created: number;
  health_score: number;
  issues: string[];
};

export type CreationTrendResponse = {
  period: string;
  data: Array<{
    date: string;
    count: number;
    type: string;
  }>;
};

export type TypeDistributionResponse = {
  dynamic: number;
  static: number;
  trigger: number;
  total: number;
};

export type CategoryDistributionResponse = {
  category_id?: number;
  category_name: string;
  segment_count?: number | string;
  count?: number | string;
  percentage?: number;
};

export type LargestSegmentsResponse = {
  segment_id: number;
  name: string;
  member_count: number;
  type: string;
  last_computed: string;
};

export type StaleSegmentsResponse = {
  segment_id: number;
  name: string;
  last_computed: string;
  days_since_computed: number;
  refresh_frequency: string;
};

// Advanced Query Types

export type SegmentHierarchyResponse = {
  segment: SegmentType;
  children: SegmentType[];
  parent?: SegmentType;
  depth: number;
};

export type GrowthTrendResponse = {
  period: string;
  data: Array<{
    date: string;
    member_count: number;
    growth_rate: number;
  }>;
};

export type PerformanceMetricsResponse = {
  segment_id: number;
  computation_time: number;
  last_computed: string;
  member_count: number;
  growth_rate: number;
  churn_rate: number;
  engagement_score: number;
};

export type UsageInCampaignsResponse = {
  campaign_id: number;
  campaign_name: string;
  usage_count: number;
  last_used: string;
};

export type SegmentOverlapResponse = {
  segment1_id: number;
  segment2_id: number;
  overlap_count: number;
  overlap_percentage: number;
  union_count: number;
  intersection_count: number;
};

// Activation Types

export type BatchActivationRequest = {
  segment_ids: number[];
  activate: boolean;
};

export type BatchActivationResponse = {
  success_count: number;
  failed_count: number;
  results: Array<{
    segment_id: number;
    success: boolean;
    error?: string;
  }>;
};

// Advanced Search Types

export type AdvancedSearchQuery = {
  name?: string;
  type?: "static" | "dynamic" | "trigger";
  category?: number;
  visibility?: "private" | "public";
  creator?: number;
  tags?: string[];
  created_after?: string;
  created_before?: string;
  last_computed_after?: string;
  last_computed_before?: string;
  member_count_min?: number;
  member_count_max?: number;
  is_active?: boolean;
  has_parent?: boolean;
  is_empty?: boolean;
  needs_refresh?: boolean;
  sort_by?: string;
  sort_direction?: "ASC" | "DESC";
  page?: number;
  page_size?: number;
};

// Tag Management Types

export type TagManagementRequest = {
  tags: string[];
};

export type TagManagementResponse = {
  segment_id: number;
  added_tags: string[];
  removed_tags: string[];
  current_tags: string[];
};

// Query Management Types

export type QueryUpdateRequest = {
  query: string;
  validate?: boolean;
};

export type QueryValidationResponse = {
  valid: boolean;
  errors: string[];
  warnings: string[];
  estimated_member_count?: number;
};

// Size Estimation Types

export type SizeEstimateRequest = {
  force_recompute?: boolean;
};

export type SizeEstimateResponse = {
  segment_id: number;
  estimated_size: number;
  confidence: number;
  last_estimated: string;
  method: string;
};

export type ExportStatusResponse = {
  job_id: string;
  segment_id: number;
  format: "csv" | "json";
  status: "processing" | "completed" | "failed";
  progress: number;
  total_items: number;
  completed_at?: string;
  download_url?: string;
  error?: string;
};

export type PreviewResponse = {
  preview_id: string;
  sample_size: number;
  total_records: number;
  execution_time: string;
  sample_data: unknown[];
  view_full_preview: string;
};

export type PreviewSampleResponse = {
  preview_id: string;
  sample_size: number;
  results: unknown[];
};

// Enums

export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  INTERNAL_SERVER_ERROR = 500,
}

export enum SegmentTypeEnum {
  STATIC = "static",
  DYNAMIC = "dynamic",
  TRIGGER = "trigger",
}

export enum VisibilityEnum {
  PRIVATE = "private",
  PUBLIC = "public",
}

export enum SortDirectionEnum {
  ASC = "ASC",
  DESC = "DESC",
}

export enum ExportFormatEnum {
  CSV = "csv",
  JSON = "json",
}

export enum ComputationStatusEnum {
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
}

// Legacy/Compatibility Types (for existing frontend components)

export interface SegmentCondition {
  id: string;
  conditionType: "360_profile" | "segment" | "list" | "system_event" | "customer_profile_kpi" | "revenue_metric_kpi" | "usage_metric_kpi" | "device_info_kpi"; // Type of condition

  // For 360 Profile conditions
  category?: number; // Category ID for filtering fields
  field?: string; // field_value (e.g., "customer_id")
  field_id?: number; // Backend field ID - used for API calls

  // For Segment conditions
  segment_id?: number; // Referenced segment ID
  segment_name?: string; // Referenced segment name (for display)

  // For List conditions
  list_id?: number; // Referenced quicklist ID
  list_name?: string; // Referenced quicklist name (for display)

  // For System Event conditions
  system_event_id?: number; // System event ID
  system_event_code?: string; // Event code (e.g., "email_opened")
  system_event_name?: string; // Event name (for display)

  // For KPI conditions
  kpi_id?: string; // KPI ID
  kpi_name?: string; // KPI name (for display)
  kpi_category?: string; // KPI category

  // Common fields
  operator:
    | "equals"
    | "not_equals"
    | "contains"
    | "not_contains"
    | "greater_than"
    | "less_than"
    | "in"
    | "not_in";
  operator_id?: number; // Backend operator ID - used for API calls
  value: string | number | string[];
  type: "string" | "number" | "boolean" | "array";
}

export interface SegmentConditionGroup {
  id: string;
  operator: "AND" | "OR"; // Operator within conditions in this group
  groupOperator?: "AND" | "OR"; // Operator between this group and the next
  conditions: SegmentCondition[]; // Each condition can have its own type (360_profile, segment, or list)
}

// Legacy aliases for backward compatibility
export type Segment = SegmentType;
export type SegmentCategory = SegmentCategoryType;
export type SegmentRule = SegmentRuleType;
export type SegmentMember = SegmentMemberType;
export type SegmentVisibility = "private" | "public";
export type SortDirection = "ASC" | "DESC";
export type ExportFormat = "csv" | "json";

// Legacy Response Types
export interface SegmentResponse {
  success: boolean;
  message?: string;
  data: SegmentType[];
  segments?: SegmentType[];
  meta?: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    sortBy?: string;
    sortDirection?: string;
    isCachedResponse?: boolean;
    cacheDurationSec?: number;
  };
  total?: number;
  page?: number;
  limit?: number;
}

export interface SegmentFilters {
  search?: string;
  categoryId?: number;
  type?: "static" | "dynamic" | "trigger";
  page?: number;
  pageSize?: number;
  sortBy?: "id" | "name" | "type" | "category" | "created_at" | "updated_at";
  sortDirection?: SortDirection;
  skipCache?: boolean;
  tags?: string[];
  is_active?: boolean;
}

export interface SegmentSearchFilters {
  q?: string;
  category?: number;
  type?: "static" | "dynamic" | "trigger";
  visibility?: "private" | "public";
  tags?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "id" | "name" | "type" | "created_at" | "updated_at";
  sortDirection?: SortDirection;
  skipCache?: boolean;
}

export interface SegmentMembersResponse {
  success: boolean;
  data: SegmentMemberType[];
  meta?: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface SegmentCategoriesResponse {
  success: boolean;
  data: SegmentCategoryType[];
  message?: string;
}

// Available fields for segment conditions
export interface SegmentField {
  key: string;
  label: string;
  type: "string" | "number" | "boolean" | "array";
  operators: string[];
}

export const SEGMENT_FIELDS: SegmentField[] = [
  {
    key: "customer_profile.device_category",
    label: "Device Category",
    type: "string",
    operators: ["equals", "not_equals", "in", "not_in"],
  },
  {
    key: "customer_profile.age",
    label: "Age",
    type: "number",
    operators: ["equals", "not_equals", "greater_than", "less_than"],
  },
  {
    key: "customer_profile.gender",
    label: "Gender",
    type: "string",
    operators: ["equals", "not_equals"],
  },
  {
    key: "customer_profile.location",
    label: "Location",
    type: "string",
    operators: ["equals", "not_equals", "contains", "not_contains"],
  },
  {
    key: "customer_profile.subscription_status",
    label: "Subscription Status",
    type: "string",
    operators: ["equals", "not_equals", "in", "not_in"],
  },
  {
    key: "customer_profile.total_spent",
    label: "Total Spent",
    type: "number",
    operators: ["equals", "not_equals", "greater_than", "less_than"],
  },
  {
    key: "customer_profile.last_activity",
    label: "Last Activity",
    type: "string",
    operators: ["equals", "not_equals", "greater_than", "less_than"],
  },
];

// 360 Profile specific fields
export const PROFILE_360_FIELDS: SegmentField[] = [
  {
    key: "engagement_score",
    label: "Engagement Score",
    type: "number",
    operators: ["equals", "not_equals", "greater_than", "less_than"],
  },
  {
    key: "lifetime_value",
    label: "Lifetime Value",
    type: "number",
    operators: ["equals", "not_equals", "greater_than", "less_than"],
  },
  {
    key: "churn_risk",
    label: "Churn Risk",
    type: "string",
    operators: ["equals", "not_equals", "in", "not_in"],
  },
  {
    key: "purchase_frequency",
    label: "Purchase Frequency",
    type: "string",
    operators: ["equals", "not_equals", "in", "not_in"],
  },
  {
    key: "preferred_channel",
    label: "Preferred Channel",
    type: "string",
    operators: ["equals", "not_equals", "in", "not_in"],
  },
  {
    key: "customer_segment",
    label: "Customer Segment",
    type: "string",
    operators: ["equals", "not_equals", "in", "not_in"],
  },
  {
    key: "satisfaction_score",
    label: "Satisfaction Score",
    type: "number",
    operators: ["equals", "not_equals", "greater_than", "less_than"],
  },
  {
    key: "recency_score",
    label: "Recency Score",
    type: "number",
    operators: ["equals", "not_equals", "greater_than", "less_than"],
  },
];

export const OPERATOR_LABELS: Record<string, string> = {
  equals: "Equals",
  not_equals: "Not Equals",
  contains: "Contains",
  not_contains: "Does Not Contain",
  greater_than: "Greater Than",
  less_than: "Less Than",
  in: "In",
  not_in: "Not In",
};

// ==================== SEGMENTATION FIELDS API TYPES ====================

/**
 * Operator definition from backend
 */
export type SegmentationOperator = {
  id: number;
  symbol: string; // "=", "!=", ">", "<", "IN", etc.
  label: string; // "equals", "not equals", "in list", etc.
  requires_value: boolean;
  requires_two_values: boolean;
  applicable_field_types: string[]; // ["numeric", "text", "boolean", etc.]
};

/**
 * Field definition from backend
 */
export type SegmentationField = {
  id: number;
  field_name: string; // Display name (e.g., "Customer ID")
  field_value: string; // Backend field name (e.g., "customer_id")
  description: string;
  field_type: string; // "numeric", "text", "boolean", "date", "timestamp"
  field_pg_type: string; // PostgreSQL type (e.g., "integer", "varchar(20)")
  field_type_precision: string | null;
  source_table: string; // e.g., "cvm.cdr_customer_subscription_data"
  validation: {
    strategy: string; // "none", "pattern", "range", etc.
    distinct_values: string[] | null;
    range_min: number | null;
    range_max: number | null;
    value_length: number | null;
  };
  ui: {
    component_type: string | null;
    is_multi_select: boolean;
    is_required: boolean;
  };
  operators: SegmentationOperator[];
  default_operator: number | null;
};

/**
 * Field category from backend
 */
export type SegmentationFieldCategory = {
  id: number;
  name: string; // Display name (e.g., "Customer Identity")
  value: string; // Backend value (e.g., "customer_identity")
  description: string;
  parent_category_id: number | null;
  display_order: number;
  fields: SegmentationField[];
};

/**
 * Response from /segmentation-fields/profile endpoint
 */
export type SegmentationFieldsResponse = {
  success: boolean;
  data: Array<{
    field_selector_config: SegmentationFieldCategory[];
  }>;
  source: string; // "cache" or "database"
};

// ==================== QUERY GENERATION TYPES ====================

/**
 * Condition for query generation
 */
export type QueryGenerationCondition = {
  field_id: number;
  operator_id: number;
  value: string | number | string[];
};

/**
 * Condition group for query generation
 */
export type QueryGenerationGroup = {
  logic: "AND" | "OR";
  conditions: QueryGenerationCondition[];
};

/**
 * Order by clause for query generation
 */
export type QueryGenerationOrderBy = {
  field_id: number;
  direction: "ASC" | "DESC";
};

/**
 * Request for query generation preview
 */
export type GenerateQueryPreviewRequest = {
  fields: number[]; // Array of field IDs to select
  filters: {
    logic: "AND" | "OR";
    groups: QueryGenerationGroup[];
  };
  order_by?: QueryGenerationOrderBy[];
  limit?: number;
};

/**
 * Response from query generation preview
 */
export type GenerateQueryPreviewResponse = {
  success: boolean;
  data: {
    segment_query: string; // The generated SQL SELECT query
    count_query: string; // The generated SQL COUNT query
  };
  source: string; // "database" or "cache"
};
