export interface UpdateCampaignRequest {
  name?: string;
  description?: string | null;
  objective?: string | null;
  category_id?: number | null;
  program_id?: number | null;
  status?: 'draft' | 'approved' | 'active' | 'paused' | 'archived';
  approval_status?: 'pending' | 'approved' | 'rejected';
  start_date?: string | null;
  end_date?: string | null;
  owner_team?: string | null;
}

export interface UpdateCampaignResponse {
  id: number;
  name: string;
  description?: string | null;
  objective?: string | null;
  category_id?: number | null;
  program_id?: number | null;
  status: 'draft' | 'approved' | 'active' | 'paused' | 'archived';
  approval_status: 'pending' | 'approved' | 'rejected';
  start_date?: string | null;
  end_date?: string | null;
  owner_team?: string | null;
  created_at: string;
  updated_at: string;
}
