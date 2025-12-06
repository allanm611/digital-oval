export type StepType =
  | "sql"
  | "stored_proc"
  | "api_call"
  | "python_script"
  | "node_js_script"
  | "shell_script"
  | "file_transfer"
  | "data_validation"
  | "notification"
  | "wait";

export type FailureAction = "abort" | "continue" | "retry" | "skip_remaining";

export interface JobWorkflowStep {
  id: number;
  job_id: number;
  step_order: number;
  step_name: string;
  step_code: string;
  step_description: string | null;
  step_type: StepType;
  step_action: string;
  is_parallel: boolean;
  parallel_group_id: number | null;
  depends_on_step_codes: string[] | null;
  execution_condition: string | null;
  skip_on_condition: string | null;
  retry_count: number;
  retry_delay_seconds: number;
  timeout_seconds: number;
  on_failure_action: FailureAction;
  pre_validation_query: string | null;
  post_validation_query: string | null;
  expected_row_count_min: number | null;
  expected_row_count_max: number | null;
  parameters: Record<string, unknown> | null;
  is_active: boolean;
  is_critical: boolean;
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by: number | null;
}

export interface JobWorkflowStepListResponse {
  success?: boolean;
  data: JobWorkflowStep[];
  pagination?: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
  count?: number;
  source?: "cache" | "database" | "database-forced";
}

export interface JobWorkflowStepSearchParams {
  job_id?: number;
  step_name?: string;
  step_code?: string;
  step_type?: StepType;
  step_action?: string;
  step_order?: number;
  is_critical?: boolean;
  is_parallel?: boolean;
  is_active?: boolean;
  on_failure_action?: FailureAction;
  parallel_group_id?: number;
  limit?: number;
  offset?: number;
  skipCache?: boolean;
}

export interface CreateJobWorkflowStepPayload {
  job_id: number;
  step_order: number;
  step_name: string;
  step_code: string;
  step_description?: string | null;
  step_type: StepType;
  step_action: string;
  is_parallel?: boolean;
  parallel_group_id?: number | null;
  depends_on_step_codes?: string[] | null;
  execution_condition?: string | null;
  skip_on_condition?: string | null;
  retry_count?: number;
  retry_delay_seconds?: number;
  timeout_seconds?: number;
  on_failure_action?: FailureAction;
  pre_validation_query?: string | null;
  post_validation_query?: string | null;
  expected_row_count_min?: number | null;
  expected_row_count_max?: number | null;
  parameters?: Record<string, unknown> | null;
  is_active?: boolean;
  is_critical?: boolean;
  userId: number;
}

export interface UpdateJobWorkflowStepPayload
  extends Partial<CreateJobWorkflowStepPayload> {
  userId?: number;
}

export interface BatchCreateStepsPayload {
  job_id: number;
  steps: Omit<CreateJobWorkflowStepPayload, "job_id" | "userId">[];
  userId: number;
}

export interface BatchActivateStepsPayload {
  stepIds: number[];
  userId: number;
}

export interface BatchDeactivateStepsPayload {
  stepIds: number[];
  userId: number;
}

export interface DuplicateStepPayload {
  new_step_order?: number;
  new_step_code?: string;
  userId: number;
}

export interface ReorderStepsPayload {
  stepOrderMapping: Array<{ stepId: number; newOrder: number }>;
  userId: number;
}

export interface BatchUpdateStepsPayload {
  updates: Array<{
    id: number;
    [key: string]: unknown;
  }>;
  userId: number;
}

export interface ExecutionOrderResponse {
  success?: boolean;
  data: Array<{
    step_id: number;
    step_order: number;
    step_code: string;
    step_name: string;
    can_execute: boolean;
    depends_on: string[];
    parallel_group?: number | null;
  }>;
  source?: string;
}

export interface ParallelGroupsResponse {
  success?: boolean;
  data: Array<{
    parallel_group_id: number;
    steps: JobWorkflowStep[];
  }>;
  source?: string;
}

export interface DependenciesResponse {
  success?: boolean;
  data: Array<{
    step: JobWorkflowStep;
    depends_on: JobWorkflowStep[];
    dependents: JobWorkflowStep[];
  }>;
  source?: string;
}

export interface HealthSummaryResponse {
  success?: boolean;
  data: {
    total_steps: number;
    active_steps: number;
    critical_steps: number;
    steps_with_retry: number;
    steps_with_validation: number;
    parallel_groups: number;
    steps_with_dependencies: number;
  };
  source?: string;
}

export interface StatisticsResponse {
  success?: boolean;
  data: {
    total_steps: number;
    steps_by_type: Record<StepType, number>;
    steps_by_failure_action: Record<FailureAction, number>;
    average_timeout: number;
    average_retry_count: number;
    critical_steps_percentage: number;
  };
  source?: string;
}

export interface MostFailedStepsResponse {
  success?: boolean;
  data: Array<{
    step_id: number;
    step_name: string;
    step_code: string;
    job_id: number;
    failure_count: number;
    last_failure_at: string | null;
  }>;
  source?: string;
}

export interface LongestRunningStepsResponse {
  success?: boolean;
  data: Array<{
    step_id: number;
    step_name: string;
    step_code: string;
    job_id: number;
    average_duration_seconds: number;
    max_duration_seconds: number;
  }>;
  source?: string;
}

export interface TypeDistributionResponse {
  success?: boolean;
  data: Array<{
    step_type: StepType;
    count: number;
    percentage: number;
  }>;
  source?: string;
}

export interface ComplexWorkflowsResponse {
  success?: boolean;
  data: Array<{
    job_id: number;
    job_name: string;
    total_steps: number;
    parallel_groups: number;
    dependencies: number;
    complexity_score: number;
  }>;
  source?: string;
}

export interface ValidationStepsResponse {
  success?: boolean;
  data: JobWorkflowStep[];
  source?: string;
}

export interface RetryStepsResponse {
  success?: boolean;
  data: JobWorkflowStep[];
  source?: string;
}

export interface OrphanedStepsResponse {
  success?: boolean;
  data: JobWorkflowStep[];
  source?: string;
}

export interface DependencyComplexityResponse {
  success?: boolean;
  data: Array<{
    job_id: number;
    job_name: string;
    max_depth: number;
    total_dependencies: number;
    circular_dependencies: boolean;
  }>;
  source?: string;
}

export interface TimeoutAnalysisResponse {
  success?: boolean;
  data: Array<{
    step_id: number;
    step_name: string;
    configured_timeout: number;
    average_execution_time: number;
    timeout_utilization_percent: number;
    risk_level: "low" | "medium" | "high";
  }>;
  source?: string;
}

export interface ValidateIntegrityResponse {
  success: boolean;
  valid: boolean;
  errors: string[];
  warnings: string[];
}

