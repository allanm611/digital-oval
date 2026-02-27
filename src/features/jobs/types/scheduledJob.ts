export type JobStatus =
  | "draft"
  | "active"
  | "paused"
  | "archived"
  | "deleted"
  | "disabled";

export type ScheduleType =
  | "manual"
  | "cron"
  | "interval"
  | "event_driven"
  | "dependency_based";

export type TriggerType =
  | "webhook"
  | "event_bus"
  | "message_queue"
  | "data_ingest"
  | "custom"
  | null;

export type ExecutionStatus =
  | "success"
  | "failed"
  | "running"
  | "queued"
  | "cancelled"
  | "unknown";

export interface ScheduledJob {
  id: number;
  job_uuid: string;
  name: string;
  code: string;
  description: string | null;
  job_type_id: number | null;
  job_category: string | null;
  business_owner: string | null;
  technical_owner_id: number | null;
  schedule_type: ScheduleType;
  cron_expression: string | null;
  interval_seconds: number | null;
  timezone: string;
  trigger_event_type: TriggerType;
  trigger_condition: Record<string, unknown> | null;
  max_concurrent_executions: number;
  execution_timeout_minutes: number;
  priority: number;
  resource_pool: string | null;
  max_memory_mb: number | null;
  max_cpu_cores: number | null;
  depends_on_jobs: number[] | null;
  dependency_mode: string;
  triggers_on_success: number[] | null;
  triggers_on_failure: number[] | null;
  connection_profile_id: number | null;
  processing_mode: string;
  sla_duration_minutes: number | null;
  sla_breach_action: string | null;
  alert_threshold_percent: number;
  performance_baseline_seconds: number | null;
  execution_window_start: string | null;
  execution_window_end: string | null;
  blackout_dates: string[] | null;
  last_run_at: string | null;
  last_run_status: ExecutionStatus | null;
  last_success_at: string | null;
  last_failure_at: string | null;
  next_run_at: string | null;
  consecutive_failures: number;
  total_executions: number;
  total_failures: number;
  success_rate_percent: number | null;
  notify_on_success: boolean;
  notify_on_failure: boolean;
  notify_on_sla_breach: boolean;
  notification_recipients: string[] | null;
  version: number;
  previous_version_id: number | null;
  tenant_id: number | null;
  client_id: number | null;
  gdpr_processing_purpose: string | null;
  compliance_tags: string[] | null;
  status: JobStatus;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by: number | null;
  deleted_at: string | null;
  deleted_by: number | null;
  metadata: Record<string, unknown> | null;
  tags: string[] | null;
}

export interface ScheduledJobListResponse {
  success?: boolean;
  data: ScheduledJob[];
  pagination?: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
  count?: number;
  source?: "cache" | "database";
}

export interface CreateScheduledJobPayload {
  name: string;
  code: string;
  description?: string | null;
  job_type_id?: number;
  status?: JobStatus;
  schedule_type?: ScheduleType;
  cron_expression?: string | null;
  interval_seconds?: number | null;
  technical_owner_id?: number | null;
  tenant_id?: number | null;
  client_id?: number | null;
  connection_profile_id?: number | null;
  priority?: number;
  max_concurrent_executions?: number;
  execution_timeout_minutes?: number;
  execution_window_start?: string | null;
  execution_window_end?: string | null;
  tags?: string[];
  notification_recipients?: string[];
  is_active?: boolean;
  created_by: number;
  processing_mode?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateScheduledJobPayload
  extends Partial<CreateScheduledJobPayload> {
  updated_by?: number;
}

export interface ScheduledJobSearchParams {
  searchTerm?: string;
  name?: string;
  code?: string;
  status?: JobStatus;
  job_type_id?: number;
  schedule_type?: ScheduleType;
  technical_owner_id?: number;
  tenant_id?: number;
  client_id?: number;
  tag?: string;
  hasDependencies?: boolean;
  notify_on_failure?: boolean;
  is_active?: boolean;
  last_run_after?: string;
  last_run_before?: string;
  next_run_before?: string;
  limit?: number;
  offset?: number;
  skipCache?: boolean;
}

export interface ExecutionStatsPayload {
  total_executions?: number;
  total_failures?: number;
  consecutive_failures?: number;
  success_rate_percent?: number;
}

export interface LastRunPayload {
  last_run_at: string;
  last_run_status: ExecutionStatus;
}

export interface NextRunPayload {
  next_run_at: string;
}

export interface FailureCountPayload {
  amount?: number;
}

export interface NotificationRecipientsPayload {
  recipient: string; // API expects singular "recipient"
}

export interface VersionPayload {
  created_by: number;
  note?: string;
}

export interface RollbackPayload {
  created_by: number;
  reason?: string;
}
