export interface Program {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  program_type?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  budget_total?: string | null;
  budget_spent?: string | null;
  is_active: boolean;
  created_at: string;
  created_by?: number | null;
  updated_at?: string;
  updated_by?: number | null;
}

export interface CreateProgramRequest {
  name: string;
  code: string;
  description?: string | null;
  program_type?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  budget_total?: number;
  created_by: number;
}

export interface UpdateProgramRequest {
  name?: string;
  code?: string;
  description?: string | null;
  program_type?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  budget_total?: number;
  is_active?: boolean;
}

export interface ProgramResponse {
  success: boolean;
  data: Program[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
  source?: string;
  message?: string;
}

export interface SingleProgramResponse {
  success: boolean;
  data: Program;
  message?: string;
}
