export interface SegmentType {
  id: number;
  name: string;
  description?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export interface CreateSegmentTypeRequest {
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdateSegmentTypeRequest {
  name?: string;
  description?: string;
  is_active?: boolean;
}
