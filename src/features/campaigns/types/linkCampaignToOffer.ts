export interface LinkCampaignToOfferRequest {
  offer_id: number;
  created_by: number;
}

export interface LinkCampaignToOfferResponse {
  success: boolean;
  campaignId: number;
  offerId: number;
  linkedAt: string;
  linkedBy: number;
  message: string;
}
