export interface CampaignType {
  id: number;
  name: string;
  description?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export interface CreateCampaignTypeRequest {
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdateCampaignTypeRequest {
  name?: string;
  description?: string;
  is_active?: boolean;
}
