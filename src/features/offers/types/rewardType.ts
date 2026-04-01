export interface RewardType {
  id: number;
  name: string;
  description?: string;
  reward_key: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export interface CreateRewardTypeRequest {
  name: string;
  description?: string;
  reward_key: string;
  is_active?: boolean;
}

export interface UpdateRewardTypeRequest {
  name?: string;
  description?: string;
  is_active?: boolean;
}
