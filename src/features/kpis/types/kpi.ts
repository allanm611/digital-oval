export interface KPI {
  id: string;
  name: string;
  field_category_id?: number;
  category?: string;
  subcategory?: string;
  description: string;
  source: string;
  field_type?: string;
  is_active?: boolean;
  field_value?: string;
}
