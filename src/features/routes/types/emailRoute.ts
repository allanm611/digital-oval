import type {
  CreateSMSRouteRequest,
  SMSRoute,
  UpdateSMSRouteRequest,
} from "./smsRoute";

/** Email routes share the unified `/routes` model. */
export type EmailRoute = SMSRoute;
export type CreateEmailRouteRequest = CreateSMSRouteRequest;
export type UpdateEmailRouteRequest = UpdateSMSRouteRequest;
