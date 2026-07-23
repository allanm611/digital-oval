import type {
  CreateSMSRouteRequest,
  SMSRoute,
  UpdateSMSRouteRequest,
} from "./smsRoute";

export type PushNotificationRoute = SMSRoute;
export type CreatePushNotificationRouteRequest = CreateSMSRouteRequest;
export type UpdatePushNotificationRouteRequest = UpdateSMSRouteRequest;
