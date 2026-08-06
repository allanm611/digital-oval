export interface OfferType {
  id: number;
  name: string;
  description?: string;
  is_active?: boolean;
  /**
   * When true, offers of this type grant rewards immediately without requiring
   * tracking sources (former seeding behavior). When false, tracking is mandatory.
   */
  is_immediate_reward?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface CreateOfferTypeRequest {
  name: string;
  description?: string;
  is_active?: boolean;
  is_immediate_reward?: boolean;
}

export interface UpdateOfferTypeRequest {
  name?: string;
  description?: string;
  is_active?: boolean;
  is_immediate_reward?: boolean;
}
