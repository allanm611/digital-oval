import type { CreateCampaignRequest } from "./createCampaign";

export type CampaignType =
  | "multiple_target_group"
  | "champion_challenger"
  | "ab_test"
  | "round_robin"
  | "multiple_level";

export interface BackendCampaignType {
  id: number;
  campaign_uuid: string;
  name: string;
  code: string;
  description: string | null;
  objective: string;
  category_id: number | null;
  program_id: number | null;
  status:
    | "draft"
    | "active"
    | "paused"
    | "completed"
    | "cancelled"
    | "scheduled";
  approval_status: "pending" | "approved" | "rejected";
  start_date: string | null;
  end_date: string | null;
  timezone: string | null;
  budget_allocated: string | null;
  budget_spent: string | null;
  max_participants: number | null;
  current_participants: number | null;
  target_reach: number | null;
  target_conversion_rate: string | null;
  target_revenue: string | null;
  owner_team: string | null;
  campaign_manager_id: number | null;
  approved_by: number | null;
  approved_at: string | null;
  rejection_reason: string | null;
  control_group_enabled: boolean;
  control_group_percentage: string | null;
  tenant_id: number | null;
  client_id: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: number | null;
  updated_by: number | null;
  deleted_at: string | null;
  deleted_by: number | null;
  metadata: Record<string, unknown> | null;
  tags: string[];
  attribution_model_id: number | null;
  suppression_list_ids: number[] | null;
  priority?: string | null;
  priority_rank?: number | null;
  line_of_business?: string | null;
  communication_policy?: string | null;
  department?: string | null;
  offer_count?: number;
  segment_count?: number;
  offers?: Array<{
    offer_id: number;
    offer_name: string;
    flow_count?: string | number;
  }>;
  segments?: Array<{
    id: string | number;
    segment_id: number;
    segment_name: string;
    include_exclude?: "include" | "exclude";
    is_primary?: boolean;
  }>;
}

export interface GetCampaignsResponse {
  success: boolean;
  data: BackendCampaignType[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
  source: string;
}

export interface CampaignCategory {
  id: number;
  name: string;
  description: string | null;
  parent_category_id: number | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface GetCampaignCategoriesResponse {
  success: boolean;
  data: CampaignCategory[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
  source: string;
}

export type CampaignStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "scheduled"
  | "active"
  | "paused"
  | "completed"
  | "cancelled"
  | "archived"
  | "rejected";

export type CampaignApprovalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled";

export type CacheSource = "cache" | "database" | "database-forced";

export interface PaginationMeta {
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
}

export type PaginatedResponse<T> = {
  success: true;
  data: T[];
  pagination: PaginationMeta;
  source: CacheSource;
  message?: string;
};

export type CacheableResponse<T> = {
  success: true;
  data: T;
  source: CacheSource;
  message?: string;
};

export type ErrorResponse = {
  success: false;
  error: string;
  code?: string;
};

export type ApiResponse<T> = CacheableResponse<T> | ErrorResponse;

export type PaginatedApiResponse<T> = PaginatedResponse<T> | ErrorResponse;

export interface CampaignOverview {
  total_campaigns: number;
  non_deleted_campaigns: number;
  deleted_campaigns: number;
}

export interface CampaignStatusBreakdown {
  draft: number;
  pending_approval: number;
  approved: number;
  active: number;
  paused: number;
  completed: number;
  cancelled: number;
  archived?: number;
  rejected?: number;
}

export interface ApprovalStatusBreakdown {
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
}

export interface ActivityStatus {
  is_active_flag_true: number;
  is_active_flag_false: number;
  currently_running: number;
  scheduled_future: number;
  in_date_range: number;
  no_start_date: number;
  past_end_date: number;
}

export interface BudgetDistribution {
  under_10k: number;
  from_10k_to_50k: number;
  from_50k_to_100k: number;
  over_100k: number;
}

export interface BudgetMetrics {
  total_allocated: number;
  total_spent: number;
  total_remaining: number;
  average_allocated: number;
  average_spent: number;
  overall_utilization_percentage: number;
}

export interface ControlGroups {
  campaigns_with_control_groups: number;
  campaigns_without_control_groups: number;
  average_percentage: number;
}

export interface Organization {
  unique_categories_used: number;
  unique_programs_used: number;
  campaigns_without_category: number;
  campaigns_without_manager: number;
  campaigns_without_program: number;
  unique_managers: number;
}

export interface ParticipantMetrics {
  total_participants: number;
  total_max_participants: number;
  average_per_campaign: number;
}

export interface RecentActivity {
  created_last_7_days: number;
  created_last_30_days: number;
  updated_last_7_days: number;
  updated_last_30_days: number;
}

export interface Targets {
  campaigns_with_target_reach: number;
  campaigns_with_target_conversion: number;
  campaigns_with_target_revenue: number;
  total_target_reach?: number;
  total_target_revenue?: number;
}

export interface Timeline {
  starting_next_7_days: number;
  starting_next_30_days: number;
  ending_next_7_days: number;
  ending_next_30_days: number;
}

export interface TopPerformerCampaign {
  id: number;
  name: string;
  code: string;
  current_participants?: number;
  max_participants?: number;
  participation_rate?: number;
  budget_allocated?: number;
  budget_spent?: number;
  utilization_percentage?: number | null;
  conversion_rate?: number | string;
  status?: string;
}

export interface TopPerformers {
  by_participants: TopPerformerCampaign[];
  by_spend: TopPerformerCampaign[];
}

export interface CampaignStatsSummary {
  overview?: CampaignOverview;
  status_breakdown?: CampaignStatusBreakdown;
  approval_status_breakdown?: ApprovalStatusBreakdown;
  activity_status?: ActivityStatus;
  budget_distribution?: BudgetDistribution;
  budget_metrics?: BudgetMetrics;
  control_groups?: ControlGroups;
  organization?: Organization;
  participant_metrics?: ParticipantMetrics;
  recent_activity?: RecentActivity;
  targets?: Targets;
  timeline?: Timeline;
  top_performers?: TopPerformers;
  generated_at?: string;
  source?: string;
  total_campaigns?: number | string;
  active_campaigns?: number | string;
  currently_active?: number | string;
  in_draft?: number | string;
  pending_approval?: number | string;
  completed?: number | string;
  archived?: number | string;
  rejected?: number | string;
  total_budget_allocated?: number | string;
  total_budget_spent?: number | string;
  avg_campaign_budget?: number | string;
  with_control_groups?: number | string;
}

export interface CampaignBudgetUtilisation {
  utilization_percentage: number;
  remaining_budget: number;
}

export interface CampaignParticipantUtilisation {
  utilization_percentage: number;
  remaining_participants: number;
}

export interface CampaignPerformanceMetrics {
  campaign: {
    id: number;
    name: string;
    code: string;
    status: CampaignStatus;
  };
  budget: {
    allocated: number;
    spent: number;
    remaining: number;
    utilization_percentage: number;
  };
  participants: {
    current: number;
    max?: number;
    utilization_percentage: number;
    remaining: number;
  };
  targets: {
    reach?: number;
    conversion_rate?: number;
    revenue?: number;
  };
  control_group: {
    enabled: boolean;
    percentage: number;
  };
}

export interface CampaignSegmentDetail {
  id: number;
  campaign_id: number;
  segment_id: number;
  segment_name: string;
  segment_type: string;
  segment_description: string;
  is_primary: boolean;
  include_exclude: "include" | "exclude";
  created_at: string;
  created_by?: number;
}

export interface CampaignExecutionRequestPayload {
  campaign_id: number;
  segments: Array<{
    segment_id: number;
    channel_codes: string[];
  }>;
  mode: "immediate" | "schedule";
  schedule?: {
    date_iso_string: string;
  };
}

export interface CampaignExecutionSummary {
  campaign_id: number;
  total_broadcasts: number;
  broadcasts_completed: number;
  broadcasts_failed: number;
  total_messages_attempted: number;
  total_messages_sent: number;
  total_messages_failed: number;
  execution_time_ms: number;
  broadcast_summaries: Array<{
    broadcast_id: string;
    segment_id: number;
    channel_code: string;
    messages_sent: number;
    messages_failed: number;
    status: string;
  }>;
}

export type CampaignExecutionResponse =
  | {
      success: true;
      data: CampaignExecutionSummary;
      execution_time_ms: number;
    }
  | ErrorResponse;

export type CampaignCollection = PaginatedApiResponse<BackendCampaignType>;

export type CampaignDetail = ApiResponse<BackendCampaignType>;

export type CampaignStatsResponse = ApiResponse<CampaignStatsSummary>;

export type CampaignPerformanceResponse =
  ApiResponse<CampaignPerformanceMetrics>;

export type CampaignBudgetUtilResponse = ApiResponse<CampaignBudgetUtilisation>;

export type CampaignParticipantUtilResponse =
  ApiResponse<CampaignParticipantUtilisation>;

export type CampaignSegmentsResponse = ApiResponse<{
  data: CampaignSegmentDetail[];
  total: number;
}>;

export interface CampaignListQuery {
  [key: string]: unknown;
  limit?: number;
  offset?: number;
  skipCache?: boolean;
}

export interface CampaignSearchQuery extends CampaignListQuery {
  searchTerm?: string;
}

export interface CampaignDateRangeQuery extends CampaignListQuery {
  startDate: string;
  endDate: string;
}

export interface CampaignBudgetRangeQuery extends CampaignListQuery {
  minBudget: number;
  maxBudget: number;
}

export interface CampaignSuperSearchQuery extends CampaignListQuery {
  name?: string;
  code?: string;
  status?: CampaignStatus;
  approvalStatus?: CampaignApprovalStatus;
  categoryId?: number;
  programId?: number;
  managerId?: number;
  ownerTeam?: string;
  isActive?: boolean;
  minBudget?: number;
  maxBudget?: number;
  startDateFrom?: string;
  startDateTo?: string;
  endDateFrom?: string;
  endDateTo?: string;
  controlGroupEnabled?: boolean;
  tenantId?: number;
  clientId?: number;
}

export interface CampaignStatusQuery extends CampaignListQuery {
  status: CampaignStatus;
}

interface CampaignBase {
  id: string;
  name: string;
  description?: string;
  objective:
    | "acquisition"
    | "retention"
    | "churn_prevention"
    | "upsell_cross_sell"
    | "reactivation";
  category_id?: number;
  status:
    | "draft"
    | "pending_approval"
    | "approved"
    | "active"
    | "paused"
    | "completed"
    | "cancelled";
  approval_status?: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
  created_by: string;
  start_date?: string;
  end_date?: string;
  scheduling: CampaignScheduling;
  approval_workflow?: ApprovalWorkflow;
  is_definitive?: boolean;
  priority?: "low" | "medium" | "high" | "critical";
  priority_rank?: number;
  performance?: {
    delivered: number;
    response: number;
    converted: number;
    revenue: number;
    last_updated?: string;
  };
  tags?: string[];
  budget_allocated?: string | number | null;
  budget_spent?: string | number | null;
  rejection_reason?: string | null;
  is_active?: boolean;
}

export interface MultipleTargetGroupCampaign extends CampaignBase {
  campaign_type: "multiple_target_group";
  config: {
    segments: CampaignSegment[];
    offer_mappings: CampaignOfferMapping[];
    mutually_exclusive?: boolean;
  };
}

export interface ChampionChallengerCampaign extends CampaignBase {
  campaign_type: "champion_challenger";
  config: {
    champion: CampaignSegment;
    challengers: CampaignSegment[];
    offer_mappings: CampaignOfferMapping[];
  };
}

export interface ABTestCampaign extends CampaignBase {
  campaign_type: "ab_test";
  config: {
    variant_a: CampaignSegment;
    variant_b: CampaignSegment;
    offer_mappings: CampaignOfferMapping[];
  };
}

export interface RoundRobinCampaign extends CampaignBase {
  campaign_type: "round_robin";
  config: {
    segment: CampaignSegment;
    offer_sequence: SequentialOfferMapping[];
  };
}

export interface MultipleLevelCampaign extends CampaignBase {
  campaign_type: "multiple_level";
  config: {
    segment: CampaignSegment;
    offer_sequence: SequentialOfferMapping[];
  };
}

export type Campaign =
  | MultipleTargetGroupCampaign
  | ChampionChallengerCampaign
  | ABTestCampaign
  | RoundRobinCampaign
  | MultipleLevelCampaign;

export interface CampaignSegment {
  id: string;
  name: string;
  description?: string;
  customer_count: number;
  criteria: SegmentCriteria;
  created_at: string;
  control_group_config?: SegmentControlGroupConfig;
  include_exclude?: "include" | "exclude";
  is_primary?: boolean;
  priority?: number;
}

export interface SegmentCriteria {
  age_range?: { min: number; max: number };
  customer_tier?: string[];
  spending_range?: { min: number; max: number };
  account_age_days?: { min: number; max: number };
  purchase_behavior?: string[];
  location?: string[];
  channel_preference?: string[];
  custom_attributes?: Record<string, string | number | boolean>;
}

export interface CampaignOffer {
  id: string;
  name: string;
  description?: string;
  offer_type: string;
  reward_type: "bundle" | "points" | "discount" | "cashback" | "free_service";
  reward_value: string;
  validity_period: number;
  terms_conditions?: string;
  personalization?: OfferPersonalization;
  code?: string;
  category_id?: number;
  product_ids?: number[];
}

export interface OfferPersonalization {
  dynamic_variables: Record<string, string>;
  segment_adapted_content: Record<string, string>;
  localization: Record<string, string>;
}

export interface CampaignScheduling {
  type: "immediate" | "scheduled" | "recurring" | "trigger_based";
  start_date?: string;
  end_date?: string;
  time_zone: string;
  delivery_times?: string[];
  frequency?: {
    type: "daily" | "weekly" | "monthly";
    interval: number;
    days_of_week?: number[];
    days_of_month?: number[];
  };
  frequency_capping?: {
    max_per_day?: number;
    max_per_week?: number;
    max_per_month?: number;
  };
  throttling?: {
    max_per_hour: number;
    max_per_day: number;
  };
  blackout_windows?: BlackoutWindow[];
  trigger_conditions?: TriggerCondition[];
}

export interface BlackoutWindow {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  reason?: string;
}

export interface TriggerCondition {
  id: string;
  name: string;
  event_type: string;
  conditions: Record<string, string | number | boolean>;
  delay_minutes?: number;
}

export interface ControlGroup {
  enabled: boolean;
  percentage: number;
  type: "standard" | "universal";
  universal_frequency?: "monthly" | "quarterly";
  exclusion_criteria?: Record<string, string | number | boolean>;
}

export interface SegmentControlGroupConfig {
  type: "none" | "with_control_group" | "multiple_control_group";
  control_group_method?:
    | "fixed_percentage"
    | "fixed_number"
    | "advanced_parameters";
  percentage?: number;
  set_limits?: boolean;
  lower_limit?: number;
  upper_limit?: number;
  fixed_number?: number;
  confidence_level?: number;
  margin_of_error?: number;
  selected_control_group_id?: string;
}

export interface AvailableControlGroup {
  id: string;
  name: string;
  description: string;
  percentage: number;
  created_at: string;
}

export interface ApprovalWorkflow {
  required: boolean;
  approvers: string[];
  status: "pending" | "approved" | "rejected";
  comments?: string;
  approved_by?: string;
  approved_at?: string;
}

export type { CreateCampaignRequest } from "./createCampaign";

export interface CampaignOfferMapping {
  offer_id: string;
  segment_ids: string[];
  priority: number;
  personalization?: OfferPersonalization;
}

export interface CampaignTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  primary_objective: Campaign["objective"];
  default_segments: string[];
  default_offers: string[];
  default_scheduling: Partial<CampaignScheduling>;
}

export interface CampaignPreview {
  estimated_reach: number;
  segment_breakdown: { segment_name: string; count: number }[];
  offer_mapping: {
    offer_name: string;
    segments: string[];
    estimated_reach: number;
  }[];
  estimated_cost: number;
  estimated_revenue: number;
  roi_projection: number;
  delivery_schedule: { date: string; estimated_sends: number }[];
}


export interface CampaignDisplay {
  is_active: boolean;
  id: number;
  name: string;
  description?: string;
  status: string;
  type?: string;
  category?: string;
  category_id?: number;
  segment?: string;
  offer?: string;
  objective?: string;
  startDate?: string;
  endDate?: string;
  approval_status?: string;
  code?: string;
  created_at?: string;
  offer_count?: number;
  segment_count?: number;
  offers?: Array<{
    offer_id: number;
    offer_name: string;
    flow_count?: string | number;
  }>;
  segments?: Array<{
    id: string | number;
    segment_id: number;
    segment_name: string;
    include_exclude?: "include" | "exclude";
    is_primary?: boolean;
  }>;
  performance?: {
    sent: number;
    delivered: number;
    opened?: number;
    converted: number;
    revenue: number;
  };
}

export interface CampaignFormData extends CreateCampaignRequest {
  scheduling?: CampaignScheduling;
  segments?: CampaignSegment[];
  segmentOfferMappings?: SegmentOfferMapping[];
}

export interface SegmentOfferMapping {
  segment_id: string;
  offer_id: number | string;
  priority?: number;
}

export interface StepProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSubmit: () => void;
  formData: CreateCampaignRequest;
  setFormData: (data: CreateCampaignRequest) => void;
  selectedSegments: CampaignSegment[];
  setSelectedSegments: (segments: CampaignSegment[]) => void;
  selectedOffers: CampaignOffer[];
  setSelectedOffers: (offers: CampaignOffer[]) => void;
  segmentOfferMappings?: SegmentOfferMapping[];
  setSegmentOfferMappings?: (mappings: SegmentOfferMapping[]) => void;
  campaignFlows?: Record<string, unknown>[];
  setCampaignFlows?: (flows: Record<string, unknown>[]) => void;
  controlGroup: ControlGroup;
  setControlGroup: (group: ControlGroup) => void;
  seedListMode?: "all" | "per-segment";
  setSeedListMode?: (mode: "all" | "per-segment") => void;
  segmentSeedLists?: Record<string, string[]>;
  setSegmentSeedLists?: (seedLists: Record<string, string[]>) => void;
  isLoading?: boolean;
  onSaveDraft?: () => void;
  onCancel?: () => void;
  validationErrors?: { [key: string]: string };
  clearValidationErrors?: () => void;
  setValidationErrors?: (errors: { [key: string]: string }) => void;
}

export interface IntervalConfig {
  interval_type: "hours" | "days" | "weeks";
  interval_value: number;
  description?: string;
}

export interface ConditionConfig {
  condition_type: "customer_attribute" | "behavior" | "transaction" | "custom";
  operator:
    | "equals"
    | "not_equals"
    | "greater_than"
    | "less_than"
    | "contains"
    | "not_contains";
  field: string;
  value: string | number | boolean;
  description?: string;
}

export interface SequentialOfferMapping {
  offer_id: string;
  segment_id: string;
  sequence_order: number;
  interval_config?: IntervalConfig;
  condition_config?: ConditionConfig;
}

export interface CampaignResponse {
  success: boolean;
  data: unknown[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}
