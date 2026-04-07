export type RequestMethod = "POST" | "GET" | "PUT" | "PATCH" | "DELETE";
export type RequestFormat = "JSON" | "XML" | "FORM_DATA";

export interface SMSRoute {
  id: number;
  name: string;
  description?: string;
  gateway_provider?: string;
  communication_channel_id?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}

export interface CreateSMSRouteRequest {
  name: string;
  description?: string;
  gateway_provider?: string;
  communication_channel_id?: number;
  is_active?: boolean;
}

export interface UpdateSMSRouteRequest {
  name?: string;
  description?: string;
  gateway_provider?: string;
  communication_channel_id?: number;
  is_active?: boolean;
}
