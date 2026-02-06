export type RequestMethod = "POST" | "GET" | "PUT" | "PATCH" | "DELETE";
export type RequestFormat = "JSON" | "XML" | "FORM_DATA";

export interface SMSRoute {
  id: number;
  name: string;
  gatewayType: string;
  apiEndpoint: string;
  apiKey: string;
  apiSecret: string;
  senderId: string; // ID from senderIds config
  senderIdName?: string; // Display name of the sender ID
  requestMethod: RequestMethod;
  requestFormat: RequestFormat;
  priority: number;
  status: "active" | "inactive";
  description: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateSMSRouteRequest {
  name: string;
  gatewayType: string;
  apiEndpoint: string;
  apiKey: string;
  apiSecret: string;
  senderId: string;
  requestMethod: RequestMethod;
  requestFormat: RequestFormat;
  priority: number;
  status: "active" | "inactive";
  description: string;
}

export interface UpdateSMSRouteRequest extends CreateSMSRouteRequest {
  id: number;
}
