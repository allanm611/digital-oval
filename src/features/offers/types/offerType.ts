export interface OfferType {
  id: number;
  name: string;
  description?: string;
  is_active?: boolean;
  /**
   * When true, offers of this type grant rewards without requiring tracking
   * sources (seeding-style grants). When false, tracking is mandatory.
   * Aligns with backend `is_seeding_reward`.
   */
  is_seeding_reward?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface CreateOfferTypeRequest {
  name: string;
  description?: string;
  is_active?: boolean;
  is_seeding_reward?: boolean;
}

export interface UpdateOfferTypeRequest {
  name?: string;
  description?: string;
  is_active?: boolean;
  is_seeding_reward?: boolean;
}
