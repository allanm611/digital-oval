export interface CloneCampaignModifications {
  name?: string;
  description?: string | null;
  objective?: string | null;
  category_id?: number | null;
  program_id?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  owner_team?: string | null;
}

export interface CloneCampaignWithModificationsRequest {
  newName: string;
  modifications: CloneCampaignModifications;
}

export interface CloneCampaignWithModificationsResponse {
  success: boolean;
  originalCampaignId: number;
  clonedCampaignId: number;
  newName: string;
  modifications: CloneCampaignModifications;
  clonedAt: string;
  clonedBy: number;
  message: string;
}
