export interface CreateCampaignCategoryRequest {
  name: string; 
  description: string; 
  parent_category_id?: number | null; 
  display_order?: number;
  is_active?: boolean;
  created_by: number; 
}

export interface UpdateCampaignCategoryRequest {
  name?: string; 
  description?: string | null; 
}

export interface CampaignCategory {
  id: number;
  name: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export type CreateCampaignCategoryResponse = CampaignCategory;

export type UpdateCampaignCategoryResponse = CampaignCategory;
