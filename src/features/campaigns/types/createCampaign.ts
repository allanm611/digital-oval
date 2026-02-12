export interface CreateCampaignRequest {
  // Required fields
  name: string; // required, 1-128 chars

  // Basic information
  code?: string; // Campaign code/identifier
  description?: string | null; // optional, max 1000 chars, can be null
  objective?: string | null; // optional, max 256 chars, can be null
  priority?: "low" | "medium" | "high" | "critical"; // optional priority bucket
  priority_rank?: number | null; // optional rank within the bucket

  // Category and program
  category_id?: number | null; // optional, positive integer, can be null
  program_id?: number | null; // optional, positive integer, can be null

  // Status
  status?:
    | "draft"
    | "pending_approval"
    | "approved"
    | "active"
    | "paused"
    | "completed"
    | "cancelled"
    | "archived"
    | "rejected"; // optional, default: 'draft'

  // Schedule
  start_date?: string | null; // optional, ISO date format, can be null
  end_date?: string | null; // optional, ISO date format, can be null
  timezone?: string | null; // optional, timezone (e.g., "America/New_York")

  // Budget
  budget_allocated?: number | string | null; // optional, accepts decimal string or number
  budget_spent?: number | string | null; // optional, accepts decimal string or number

  // Participants and targets
  max_participants?: number | null; // optional, integer
  current_participants?: number | null; // optional, integer
  target_reach?: number | null; // optional, integer
  target_conversion_rate?: number | null; // optional, decimal percentage
  target_revenue?: number | null; // optional, decimal

  // Team and ownership
  owner_team?: string | null; // optional, max 64 chars, can be null
  campaign_manager_id?: number | null; // optional, integer

  // Control group
  control_group_enabled?: boolean; // optional, default: false
  control_group_percentage?: number | null; // optional, decimal percentage

  // Tenant and client
  tenant_id?: number | null; // optional, integer
  client_id?: number | null; // optional, integer

  // Active status
  is_active?: boolean; // optional, default: true

  // Audit
  created_by?: number | null; // optional, user ID who created the campaign
  updated_by?: number | null; // optional, user ID who updated the campaign

  // Additional data
  tags?: string[]; // optional, array of tags
  metadata?: Record<string, unknown>; // optional, JSON object for additional data

  // Scheduling (frontend-only, maps to individual date/time fields for backend)
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

  // Frontend-only fields
  campaign_type?:
    | "multiple_target_group"
    | "champion_challenger"
    | "ab_test"
    | "round_robin"
    | "multiple_level";
  step_order?: number; // Step order for flow execution (default: 1)
  tag?: string; // Temporary UI field for comma-separated tags
  department_id?: number; // UI field for department selection (maps to owner_team)
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
    budget_allocated?: string; // Backend returns as string decimal
    budget_spent?: string; // Backend returns as string decimal
    max_participants?: number | null;
    current_participants?: number;
    target_reach?: number | null;
    target_conversion_rate?: string; // Backend returns as string decimal
    target_revenue?: string; // Backend returns as string decimal
    owner_team?: string | null;
    campaign_manager_id?: number | null;
    approved_by?: number | null;
    approved_at?: string | null;
    rejection_reason?: string | null;
    control_group_enabled?: boolean;
    control_group_percentage?: string; // Backend returns as string decimal
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
