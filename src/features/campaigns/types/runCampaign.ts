export type CampaignChannel =
  | "NORMAL_SMS"
  | "FLASH_SMS"
  | "USSD"
  | "EMAIL"
  | "PUSH"
  | "WHATSAPP"
  | "INAPP";

export interface RunCampaignRequest {
  campaignId: number;
  offerId: number;
  controlGroupId: number;
  blackoutPoliciesId: number;
  calendarId: number;
  trackingSourcesId: number;
  segmentId?: number;
  sampleSize?: number;
  includeDetails?: boolean;
  validateOnly?: boolean;
  channel?: CampaignChannel;
  startTime?: string;
}

export interface RunCampaignResponse {
  success: boolean;
  campaignId: number;
  executionId?: string;
  message: string;
  details?: {
    totalRecipients: number;
    estimatedCost: number;
    validationResults?: Record<string, unknown>;
  };
}
