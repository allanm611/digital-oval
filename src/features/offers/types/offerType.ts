export interface OfferType {
  id: number;
  name: string;
  description?: string;
  is_active?: boolean;
  /**
   * When true, offers of this type always include a default reward and do not
   * require tracking. Offer type SEEDING does this even when the flag is false.
   * For every other type, rewards are optional and tracking stays required.
   * Aligns with backend `is_seeding_reward`.
   */
  is_seeding_reward?: boolean;
  /** Catalog code when the API sends one (for example SEEDING). */
  code?: string | null;
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
