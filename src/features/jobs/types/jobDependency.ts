export type DependencyType =
  | "blocking"
  | "optional"
  | "cross_day"
  | "conditional";

export type WaitForStatus =
  // | "pending"
  // | "queued"
  // | "running"
  // | "success"
  // | "partial_success"
  // | "failure"
  // | "aborted"
  // | "timeout"
  // | "skipped"
  // | "cancelled";
  | "any"
  | "success"
  | "completed"
  | "failure";
export interface JobDependency {
  id: number;
  job_id: number;
  depends_on_job_id: number;
  dependency_type: DependencyType;
  wait_for_status: WaitForStatus;
  max_wait_minutes: number | null;
  lookback_days: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  created_by?: number;
  updated_by?: number | null;
}

export interface JobDependencyListResponse {
  data: JobDependency[];
  count?: number;
  success?: boolean;
  pagination?: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
  source?: "cache" | "database" | "database-forced";
}

export interface JobDependencySearchResponse {
  success: boolean;
  data: JobDependency[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
  source?: "cache" | "database" | "database-forced";
}

export interface CreateJobDependencyPayload {
  job_id: number;
  depends_on_job_id: number;
  dependency_type?: DependencyType;
  wait_for_status?: WaitForStatus;
  max_wait_minutes?: number | null;
  lookback_days?: number;
  is_active?: boolean;
  userId: number;
}

export interface UpdateJobDependencyPayload {
  dependency_type?: DependencyType;
  wait_for_status?: WaitForStatus;
  max_wait_minutes?: number | null;
  lookback_days?: number;
  is_active?: boolean;
  userId: number;
}

export interface JobDependencyListParams {
  activeOnly?: boolean;
  limit?: number;
  offset?: number;
  skipCache?: boolean;
}

export interface JobDependencySearchParams extends JobDependencyListParams {
  id?: number;
  job_id?: number;
  depends_on_job_id?: number;
  dependency_type?: DependencyType;
  wait_for_status?: WaitForStatus;
  is_active?: boolean;
  lookback_days_min?: number;
  lookback_days_max?: number;
  max_wait_minutes_min?: number;
  max_wait_minutes_max?: number;
}

export interface BatchActivatePayload {
  dependency_ids: number[];
}

export interface BatchDeactivatePayload {
  dependency_ids: number[];
}

export interface BatchOperationResponse {
  success: boolean;
  data: {
    activated?: number;
    deactivated?: number;
    errors?: Array<{ id: number; error: string }>;
  };
}

export interface DependencySatisfiedResponse {
  success: boolean;
  data: {
    satisfied: boolean;
  };
  source?: "cache" | "database" | "database-forced";
}

export interface UnsatisfiedDependency {
  dependency_id: number;
  depends_on_job_id: number;
  depends_on_job_name?: string;
  required_status: WaitForStatus;
  current_status?: string;
  status: "satisfied" | "unsatisfied";
}

export interface UnsatisfiedDependenciesResponse {
  success: boolean;
  data: UnsatisfiedDependency[];
  total?: number;
  source?: "cache" | "database" | "database-forced";
}

export interface DependencyStatusItem {
  dependency_id: number;
  depends_on_job_id: number;
  depends_on_job_name?: string;
  required_status: WaitForStatus;
  current_status?: string;
  status: "satisfied" | "unsatisfied";
  dependency_type: DependencyType;
  is_active: boolean;
}

export interface DependencyStatusResponse {
  success: boolean;
  data: DependencyStatusItem[];
  total?: number;
  source?: "cache" | "database" | "database-forced";
}

export interface DependencyChainItem {
  job_id: number;
  job_name?: string;
  level: number;
  depends_on?: number;
}

export interface DependencyChainResponse {
  success: boolean;
  data: DependencyChainItem[];
  total?: number;
  source?: "cache" | "database" | "database-forced";
}

export interface DependencyGraphNode {
  job_id: number;
  job_name?: string;
  dependencies: number[];
  dependents: number[];
}

export interface DependencyGraphResponse {
  success: boolean;
  data: DependencyGraphNode[];
  total?: number;
  source?: "cache" | "database" | "database-forced";
}

export interface MostDependedJob {
  job_id: number;
  job_name?: string;
  dependent_count: number;
  is_active?: boolean;
}

export interface MostDependedResponse {
  success: boolean;
  data: MostDependedJob[];
  total?: number;
  source?: "cache" | "database" | "database-forced";
}

export interface OrphanedJob {
  job_id: number;
  job_name?: string;
  has_dependencies: boolean;
  has_dependents: boolean;
}

export interface OrphanedJobsResponse {
  success: boolean;
  data: OrphanedJob[];
  total?: number;
  source?: "cache" | "database" | "database-forced";
}

export interface DependencyStatistics {
  total_dependencies: number;
  active_dependencies: number;
  inactive_dependencies: number;
  blocking_dependencies: number;
  optional_dependencies: number;
  cross_day_dependencies: number;
  conditional_dependencies: number;
  jobs_with_dependencies: number;
  jobs_with_no_dependencies: number;
  average_dependencies_per_job: number;
  max_dependencies_for_single_job: number;
}

export interface DependencyStatisticsResponse {
  success: boolean;
  data: DependencyStatistics;
  source?: "cache" | "database" | "database-forced";
}

export interface DependentsResponse {
  success: boolean;
  data: {
    jobIds: number[];
    total: number;
  };
  source?: "cache" | "database" | "database-forced";
}

export interface CriticalPathItem {
  job_id: number;
  job_name?: string;
  level: number;
  depends_on?: number;
  estimated_duration_minutes?: number;
}

export interface CriticalPathResponse {
  success: boolean;
  data: CriticalPathItem[];
  total?: number;
  source?: "cache" | "database" | "database-forced";
}

export interface DeleteAllResponse {
  success: boolean;
  data: {
    removed: number;
  };
}
