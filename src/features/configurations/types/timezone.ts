export interface TimeZone {
  id?: number;
  value: string;
  label: string;
  utc_offset?: string;
  is_daylight_savings?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateTimeZoneRequest {
  value: string;
  label: string;
  utc_offset?: string;
  is_daylight_savings?: boolean;
}

export interface UpdateTimeZoneRequest {
  is_active?: boolean;
  label?: string;
  utc_offset?: string;
  is_daylight_savings?: boolean;
}
