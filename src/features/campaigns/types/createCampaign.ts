export interface CreateCampaignRequest {
  name: string;

  code?: string;
  description?: string | null;
  objective?: string | null;
  priority?: "low" | "medium" | "high" | "critical";
  priority_rank?: number | null;

  category_id?: number | null;
  program_id?: number | null;

  status?:
    | "draft"
    | "pending_approval"
    | "approved"
    | "active"
    | "paused"
    | "completed"
    | "cancelled"
    | "archived"
    | "rejected";

  start_date?: string | null;
  end_date?: string | null;
  timezone?: string | null;

  budget_allocated?: number | string | null;
  budget_spent?: number | string | null;

  max_participants?: number | null;
  current_participants?: number | null;
  target_reach?: number | null;
  target_conversion_rate?: number | null;
  target_revenue?: number | null;

  owner_team?: string | null;
  campaign_manager_id?: number | null;

  control_group_enabled?: boolean;
  control_group_percentage?: number | null;

  tenant_id?: number | null;
  client_id?: number | null;

  is_active?: boolean;

  created_by?: number | null;
  updated_by?: number | null;

  tags?: string[];
  metadata?: Record<string, unknown>;

  scheduling?: {
    type?: "scheduled" | "recurring" | "trigger_based" | "immediate";
    time_zone?: string;
    start_date?: string;
    end_date?: string;
    delivery_times?: string[];
    frequency?: {
      type?: "daily" | "weekly" | "monthly";
      interval?: number;
      days_of_week?: number[];
      days_of_month?: number[];
    };
    frequency_capping?: {
      max_per_day?: number;
      max_per_week?: number;
      max_per_month?: number;
    };
    throttling?: {
      max_per_hour?: number;
      max_per_day?: number;
    };
  };

  campaign_type?:
    | "multiple_target_group"
    | "champion_challenger"
    | "ab_test"
    | "round_robin"
    | "multiple_level";
  step_order?: number;
  tag?: string;
  department_id?: number;
}

export interface CreateCampaignResponse {
  success: boolean;
  message?: string;
  data: {
    id: number;
    campaign_uuid: string;
    name: string;
    code?: string;
    description?: string | null;
    objective?: string | null;
    category_id?: number | null;
    program_id?: number | null;
    status: "draft" | "approved" | "active" | "paused" | "archived";
    approval_status: "pending" | "approved" | "rejected";
    start_date?: string | null;
    end_date?: string | null;
    timezone?: string | null;
    budget_allocated?: string; 
    budget_spent?: string; 
    max_participants?: number | null;
    current_participants?: number;
    target_reach?: number | null;
    target_conversion_rate?: string; 
    target_revenue?: string; 
    owner_team?: string | null;
    campaign_manager_id?: number | null;
    approved_by?: number | null;
    approved_at?: string | null;
    rejection_reason?: string | null;
    control_group_enabled?: boolean;
    control_group_percentage?: string; 
    tenant_id?: number | null;
    client_id?: number | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    created_by?: number | null;
    updated_by?: number | null;
    deleted_at?: string | null;
    deleted_by?: number | null;
    metadata?: Record<string, unknown>;
    tags?: string[];
    attribution_model_id?: number | null;
  };
}
