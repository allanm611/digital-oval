export interface TimeZone {
  id?: number;
  value: string;
  label: string;
  utc_offset: string;
  abbreviation?: string;
  region?: string;
  countries?: string[];
  representative_city?: string;
  description?: string;
  uses_dst: boolean;
  dst_offset?: string;
  dst_start_date?: string;
  dst_end_date?: string;
  sort_order?: number;
  windows_tz_id?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export interface CreateTimeZoneRequest {
  value: string;
  label: string;
  utc_offset: string;
  abbreviation?: string;
  region?: string;
  countries?: string[];
  representative_city?: string;
  description?: string;
  uses_dst: boolean;
  dst_offset?: string;
  dst_start_date?: string;
  dst_end_date?: string;
  sort_order?: number;
  windows_tz_id?: string;
}

export interface UpdateTimeZoneRequest {
  label?: string;
  utc_offset?: string;
  abbreviation?: string;
  region?: string;
  countries?: string[];
  representative_city?: string;
  description?: string;
  uses_dst?: boolean;
  dst_offset?: string;
  dst_start_date?: string;
  dst_end_date?: string;
  sort_order?: number;
  windows_tz_id?: string;
  is_active?: boolean;
}
