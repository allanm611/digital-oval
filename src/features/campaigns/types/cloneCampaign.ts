export interface CloneCampaignRequest {
  newName: string;
}

export interface CloneCampaignResponse {
  success: boolean;
  originalCampaignId: number;
  clonedCampaignId: number;
  newName: string;
  clonedAt: string;
  clonedBy: number;
  message: string;
}
