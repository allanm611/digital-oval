import { PushGatewayEnum } from "../constants/pushNotificationRouteEnums";

export type RequestMethod = "POST" | "GET" | "PUT" | "PATCH" | "DELETE";
export type RequestFormat = "JSON" | "XML" | "FORM_DATA";

export interface PushNotificationRoute {
  id: number;
  name: string;
  description?: string;
  gateway_provider?: PushGatewayEnum;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}

export interface CreatePushNotificationRouteRequest {
  name: string;
  description?: string;
  gateway_provider?: PushGatewayEnum;
  is_active?: boolean;
}

export interface UpdatePushNotificationRouteRequest {
  name?: string;
  description?: string;
  gateway_provider?: PushGatewayEnum;
  is_active?: boolean;
}
