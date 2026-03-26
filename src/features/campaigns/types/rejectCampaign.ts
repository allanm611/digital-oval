export interface RejectCampaignRequest {
  comments: string;
}

export interface RejectCampaignResponse {
  success: boolean;
  campaignId: number;
  approvalStatus: 'rejected';
  rejectedAt: string;
  rejectedBy: number;
  comments: string;
  message: string;
}
