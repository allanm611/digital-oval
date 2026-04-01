export interface ProductType {
  id: number;
  name: string;
  description?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export interface CreateProductTypeRequest {
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdateProductTypeRequest {
  name?: string;
  description?: string;
  is_active?: boolean;
}
