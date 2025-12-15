export interface Workflow {
  id: number;
  name: string;
  description: string | null;
  workflow_type: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: number | null;
  updated_by: number | null;
}

export interface WorkflowListResponse {
  success?: boolean;
  data: Workflow[];
  pagination?: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
  source?: "cache" | "database" | "database-forced";
  count?: number;
}

export interface CreateWorkflowPayload {
  name: string;
  description?: string | null;
  workflow_type?: string | null;
  is_active?: boolean;
  created_by?: number | null;
}

export interface UpdateWorkflowPayload {
  name?: string;
  description?: string | null;
  workflow_type?: string | null;
}

export interface WorkflowSearchParams {
  q?: string;
  activeOnly?: boolean;
  limit?: number;
  offset?: number;
  skipCache?: boolean;
}

export interface AdvancedWorkflowSearchParams {
  id?: number;
  name?: string;
  description?: string;
  workflow_type?: string;
  is_active?: boolean;
  created_by?: number;
  created_at_from?: string;
  created_at_to?: string;
  updated_at_from?: string;
  updated_at_to?: string;
  limit?: number;
  offset?: number;
  skipCache?: boolean;
}

export interface BatchActivateWorkflowsPayload {
  workflowIds: number[];
}

export interface BatchDeactivateWorkflowsPayload {
  workflowIds: number[];
}

export interface CloneWorkflowPayload {
  newName: string;
  created_by?: number | null;
}

export interface CountByTypeResponse {
  success?: boolean;
  data: Array<{
    workflow_type: string | null;
    count: number;
  }>;
  source?: string;
}

export interface StatusCountsResponse {
  success?: boolean;
  data: {
    active: number;
    inactive: number;
    total: number;
  };
  source?: string;
}

export interface WorkflowTypesResponse {
  success?: boolean;
  data: string[] | { types: string[]; total: number };
  source?: string;
}

