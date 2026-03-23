export interface CampaignType {
  id: number;
  name: string;
  description?: string;
  isActive?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCampaignTypeRequest {
  name: string;
  description?: string;
}

export interface UpdateCampaignTypeRequest {
  name?: string;
  description?: string;
}
