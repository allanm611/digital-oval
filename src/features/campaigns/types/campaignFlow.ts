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

export interface CreateCampaignFlowRequest extends CampaignFlowConfig {}

export interface UpdateCampaignFlowRequest extends Partial<CampaignFlowConfig> {}
