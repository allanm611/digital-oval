export interface StepExecution {
  id: string;
  job_execution_id: string;
  step_id: number;
  execution_status: string;
  started_at?: string | null;
  completed_at?: string | null;
  duration_seconds?: number | null;
  error_message?: string | null;
  error_code?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface StepExecutionListResponse {
  data: StepExecution[];
  pagination?: {
    total?: number;
    limit?: number;
    offset?: number;
    hasMore?: boolean;
  };
  success?: boolean;
  source?: string;
}


