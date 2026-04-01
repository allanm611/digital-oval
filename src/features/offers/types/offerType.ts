export interface OfferType {
  id: number;
  name: string;
  description?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export interface CreateOfferTypeRequest {
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdateOfferTypeRequest {
  name?: string;
  description?: string;
  is_active?: boolean;
}
