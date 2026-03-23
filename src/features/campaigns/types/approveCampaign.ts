export interface ApproveCampaignRequest {
  comments?: string | null;
}

export interface ApproveCampaignResponse {
  success: boolean;
  campaignId: number;
  approvalStatus: 'approved';
  approvedAt: string;
  approvedBy: number;
  comments?: string | null;
  message: string;
}
