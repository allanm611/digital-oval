import { WhatsAppGatewayEnum } from "../constants/whatsappRouteEnums";

export type RequestMethod = "POST" | "GET" | "PUT" | "PATCH" | "DELETE";
export type RequestFormat = "JSON" | "XML" | "FORM_DATA";

export interface WhatsAppRoute {
  id: number;
  name: string;
  description?: string;
  gateway_provider?: WhatsAppGatewayEnum;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}

export interface CreateWhatsAppRouteRequest {
  name: string;
  description?: string;
  gateway_provider?: WhatsAppGatewayEnum;
  is_active?: boolean;
}

export interface UpdateWhatsAppRouteRequest {
  name?: string;
  description?: string;
  gateway_provider?: WhatsAppGatewayEnum;
  is_active?: boolean;
}
