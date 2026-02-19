// Campaign Flow Types
// Backend Campaign Flow structure for executing campaigns

export type CampaignFlowType =
  | "STANDARD"
  | "AB_TEST"
  | "CHAMPION_CHALLENGER"
  | "MULTIPLE_LEVEL"
  | "ROUND_ROBIN";

export interface CampaignFlowConfig {
  campaign_id: number;
  segment_id: number;
  offer_id: number;
  offer_creative_id?: number; // OPTIONAL - backend uses default if not provided
  template_id?: number; // OPTIONAL - derived from creative
  flow_type: CampaignFlowType;
  step_order: number; // Sequence order (1, 2, 3...)
  wait_interval_hours: number; // Delay before this step
  bucket_allocation?: string; // e.g., "50-50" for A/B tests
  condition_rule?: Record<string, unknown>; // For conditional flows
  is_active?: boolean;
  created_by?: number;
}

export interface CampaignFlowResponse {
  success: boolean;
  data: {
    id: number;
    campaign_id: number;
    segment_id: number;
    offer_id: number;
    offer_creative_id: number | null;
    template_id: number | null;
    flow_type: CampaignFlowType;
    step_order: number;
    wait_interval_hours: number;
    bucket_allocation: string | null;
    condition_rule: Record<string, unknown> | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    created_by: number;
    updated_by: number;
  };
}

export interface GetCampaignFlowsResponse {
  success: boolean;
  data: Array<{
    id: number;
    campaign_id: number;
    segment_id: number;
    offer_id: number;
    offer_creative_id: number | null;
    template_id: number | null;
    flow_type: CampaignFlowType;
    step_order: number;
    wait_interval_hours: number;
    bucket_allocation: string | null;
    condition_rule: Record<string, unknown> | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    created_by: number;
    updated_by: number;
  }>;
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
  source: string;
}

export type CreateCampaignFlowRequest = CampaignFlowConfig;

export type UpdateCampaignFlowRequest = Partial<CampaignFlowConfig>;

// Search Parameters
export interface SearchCampaignFlowsParams {
  campaignId?: number;
  segmentId?: number;
  offerId?: number;
  flowType?: CampaignFlowType;
  activeOnly?: boolean;
  limit?: number;
  offset?: number;
  skipCache?: boolean;
}

// Single Flow Response
export interface GetCampaignFlowByIdResponse {
  success: boolean;
  data: {
    id: number;
    campaign_id: number;
    segment_id: number;
    offer_id: number;
    offer_creative_id: number | null;
    template_id: number | null;
    flow_type: CampaignFlowType;
    step_order: number;
    wait_interval_hours: number;
    bucket_allocation: string | null;
    condition_rule: Record<string, unknown> | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    created_by: number;
    updated_by: number;
  };
  source: string;
}

// Offers in Campaign
export interface CampaignOffer {
  id: number;
  name: string;
  code: string;
  campaign_count: number;
}

export interface CampaignOffersResponse {
  success: boolean;
  data: CampaignOffer[];
  total: number;
}

// Segments in Campaign
export interface CampaignSegment {
  id: number;
  name: string;
  code: string;
  flow_count: number;
}

export interface CampaignSegmentsResponse {
  success: boolean;
  data: CampaignSegment[];
  total: number;
}

// Unique Combinations
export interface FlowCombination {
  campaign_id: number;
  segment_id: number;
  offer_id: number;
  flow_type: CampaignFlowType;
  combination_id: string;
  total_flows: number;
}

export interface UniqueCombinationsResponse {
  success: boolean;
  data: FlowCombination[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

// Statistics
export interface FlowStatistics {
  total_flows: number;
  active_flows: number;
  inactive_flows: number;
  by_flow_type: {
    STANDARD: number;
    AB_TEST: number;
    CHAMPION_CHALLENGER: number;
    MULTIPLE_LEVEL: number;
    ROUND_ROBIN: number;
  };
  average_wait_hours: number;
  flows_with_conditions: number;
}

export interface FlowStatisticsResponse {
  success: boolean;
  data: FlowStatistics;
}

// Relationship Statistics
export interface RelationshipStatistics {
  campaigns_with_flows: number;
  segments_with_flows: number;
  offers_with_flows: number;
  campaigns_to_flows: {
    min: number;
    max: number;
    average: number;
  };
  segments_per_campaign: {
    min: number;
    max: number;
    average: number;
  };
}

export interface RelationshipStatisticsResponse {
  success: boolean;
  data: RelationshipStatistics;
}

// Growth Trends
export interface GrowthTrendRecord {
  date: string;
  total_flows: number;
  new_flows: number;
  deleted_flows: number;
  active_flows: number;
}

export interface GrowthTrendsSummary {
  total_created: number;
  total_deleted: number;
  net_growth: number;
}

export interface GrowthTrendsResponse {
  success: boolean;
  data: GrowthTrendRecord[];
  summary: GrowthTrendsSummary;
}

// Sync Segments
export interface SyncSegmentsRequest {
  force_sync?: boolean;
  segment_ids?: number[];
  updated_by?: number;
}

export interface SyncSegmentsResponse {
  success: boolean;
  data: {
    campaign_id: number;
    synced_segments: number;
    synced_flows: number;
    conflicts_resolved: number;
    sync_timestamp: string;
  };
  message: string;
}
