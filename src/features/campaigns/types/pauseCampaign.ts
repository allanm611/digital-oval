export interface PauseCampaignRequest {
  comments?: string | null;
}

export interface PauseCampaignResponse {
  success: boolean;
  campaignId: number;
  status: 'paused';
  pausedAt: string;
  pausedBy: number;
  comments?: string | null;
  message: string;
}
