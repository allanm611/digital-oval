// Core control group definition
export interface ControlGroupDefinition {
  id: number;
  code: string;
  name: string;
  description: string | null;
  type: "manual" | "auto";
  campaign_id: number | null;
  customer_source_type:
    | "active_subscribers"
    | "all_customers"
    | "saved_segment"
    | "manual"
    | null;
  customer_source_ref: number | null;
  generation_method: "random" | "stratified" | null;
  percentage: number | null;
  recurrence_pattern:
    | "one_time"
    | "daily"
    | "weekly"
    | "monthly"
    | null;
  start_date: string | null;
  end_date: string | null;
  target_render_config: TargetRenderTime | null;
  is_universal: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: number | null;
  updated_by: number | null;
}

// Target rendering configuration
export type TargetRenderTime =
  | {
      mode: "pre_render";
      hours_before_start: 1 | 2 | 4 | 6 | 12 | 24;
      hours_after_start?: 0.5 | 1 | 2;
      segment_ids?: string[];
      eligible_group_ids?: string[];
    }
  | {
      mode: "real_time";
      segment_match_strategy: "any" | "all" | "exclude";
      segment_ids: string[];
      max_delay_ms?: number;
      eligible_group_ids?: string[];
    }
  | {
      mode: "scheduled";
      cron?: string;
      scheduled_at?: string;
      timezone: string;
      segment_ids?: string[];
      eligible_group_ids?: string[];
    };

// Control group with member count
export interface ControlGroupWithCount extends ControlGroupDefinition {
  member_count: number;
}

// API response model
export interface ControlGroupApiModel extends ControlGroupWithCount {
  kind?: string;
}

// Member tracking
export interface ControlGroupMember {
  id: number;
  control_group_id: number;
  subscriber_id: number;
  added_at: string;
  added_by: number | null;
  reason: string | null;
  removed_at: string | null;
  removed_by: number | null;
}

// Create request
export interface CreateControlGroupRequest {
  code: string;
  name: string;
  description?: string;
  type: "manual" | "auto";
  campaign_id?: number;
  percentage?: number;
  customer_source_type?:
    | "active_subscribers"
    | "all_customers"
    | "saved_segment"
    | "manual";
  customer_source_ref?: number;
  generation_method?: "random" | "stratified";
  recurrence_pattern?: "one_time" | "daily" | "weekly" | "monthly";
  fixed_number?: number;
  start_date?: string;
  end_date?: string;
  is_universal?: boolean;
  is_active?: boolean;
  target_render_config?: TargetRenderTime | null;
  custom_conditions?: any;
}

// Universal control group creation request (different schema from regular)
export interface CreateUniversalControlGroupRequest {
  name: string;
  percentage: number;
  customer_source: {
    type: "active_subscribers" | "all_customers" | "saved_segment";
    saved_segment_id?: number;
  };
  generation_method: "random" | "stratified";
  recurrence: {
    pattern: "one_time" | "daily" | "weekly" | "monthly";
    start_date: string;
    end_date?: string;
  };
  target_render_config: TargetRenderTime;
  is_active?: boolean;
  custom_conditions?: any;
}

// Update request (use same structure as create)
export interface UpdateControlGroupRequest
  extends Partial<CreateControlGroupRequest> {}

// Segment control configuration
export interface CampaignSegmentControlConfig {
  campaign_id: number;
  segment_id: number;
  control_group_type: "none" | "with_control" | "universal";
  config_method?: "fixed_percentage" | "fixed_number" | "advanced";
  percentage?: number;
  fixed_number?: number;
  advanced_params?: any;
  control_group_id?: number;
}

// List response
export interface ControlGroupListResponse {
  control_groups: ControlGroupApiModel[];
  total_count: number;
}

// Statistics response
export interface ControlGroupStatistics {
  total_control_groups: number;
  manual_groups: number;
  auto_groups: number;
  active_groups: number;
  inactive_groups: number;
  total_members: number;
  unique_subscribers_in_groups: number;
}

// Members list response
export interface ControlGroupMembersResponse {
  members: ControlGroupMember[];
  total_count: number;
}

// Member add response
export interface AddMemberResponse extends ControlGroupMember {}

// Membership check response
export interface MembershipCheckResponse {
  is_member: boolean;
  control_group_codes: string[];
}

// Scheduled run response
export interface ScheduledRunResponse {
  success: boolean;
  processed_groups: number;
  total_members_added: number;
  total_members_removed: number;
  failed_count: number;
}

// Bulk add members response
export interface BulkAddMembersResponse {
  control_group_id: number;
  created_members: ControlGroupMember[];
  created_count: number;
  skipped_count: number;
  skipped_subscriber_ids: number[];
}

// Generate members response
export interface GenerateMembersResponse {
  campaign_id: number;
  segment_id: number;
  control_group_type: "none" | "with_control" | "universal";
  control_group_id: number;
  segment_size: number;
  target_count: number;
  added_count: number;
  skipped_count: number;
  dry_run: boolean;
  message: string;
}

// Add member request
export interface AddMemberRequest {
  control_group_id: number;
  subscriber_id: number;
  reason?: string;
}

// Remove member request
export interface RemoveMemberRequest {
  control_group_id: number;
  subscriber_id: number;
}

// Bulk add members request
export interface BulkAddMembersRequest {
  control_group_id: number;
  subscriber_ids: number[];
  reason?: string;
}
