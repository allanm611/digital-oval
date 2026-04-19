import { campaignService } from "../services/campaignService";
import { Campaign, CampaignDisplay } from "../types/campaign";

// Button visibility 

type CampaignButtonType = "pause" | "resume" | "activate" | "execute" | "submit" | "approve" | "reject";

/**
 *  function to check if a campaign button should be displayed
 */
export function canShowCampaignButton(
  campaign: Campaign | CampaignDisplay | undefined,
  buttonType: CampaignButtonType
): boolean {
  if (!campaign) return false;

  switch (buttonType) {
    case "pause":
      return campaign.approval_status === "approved" && campaign.status !== "paused";
    case "resume":
      return campaign.approval_status === "approved" && campaign.status === "paused";
    case "activate":
      return campaign.approval_status === "approved" && campaign.is_active === false;
    case "execute":
      return campaign.approval_status === "approved" && campaign.is_active === true;
    case "submit":
      return campaign.status === "draft";
    case "approve":
      return campaign.approval_status === "pending";
    case "reject":
      return campaign.approval_status === "pending";
    default:
      return false;
  }
}


// Action Handler


export interface CampaignActionParams {
  campaignId: number;
  campaignName?: string;
  action: "pause" | "resume" | "activate" | "submit" | "delete";
  successMessage: string;
  errorMessage: string;
  updateFields: Partial<CampaignDisplay> | Partial<Campaign>;
  errorProcessor?: (error: unknown) => { title: string; message: string };
}

export interface CampaignActionHandlerConfig {
  onSetLoading: (state: Set<number> | ((prev: Set<number>) => Set<number>)) => void;
  onCloseMenu: () => void;
  onUpdateCampaign?: (campaignId: number, updateFields: Partial<CampaignDisplay> | Partial<Campaign>) => void;
  onSetCampaign?: (campaign: Campaign) => void;
  onSuccess: (message: string) => void;
  onError: (title: string, message: string) => void;
}

export async function handleCampaignAction(
  params: CampaignActionParams,
  config: CampaignActionHandlerConfig,
) {
  const { campaignId, action, successMessage, errorMessage, updateFields, errorProcessor } = params;
  const { onSetLoading, onCloseMenu, onUpdateCampaign, onSetCampaign, onSuccess, onError } = config;

  onSetLoading((prev) => new Set([...prev, campaignId]));
  onCloseMenu();

  try {
    switch (action) {
      case "pause":
        await campaignService.pauseCampaign(campaignId);
        break;
      case "resume":
        await campaignService.resumeCampaign(campaignId);
        break;
      case "activate":
        await campaignService.activateCampaign(campaignId);
        break;
      case "submit":
        await campaignService.submitForApproval(campaignId);
        break;
      case "delete":
        await campaignService.deleteCampaign(campaignId);
        break;
    }

    // Optimistically update campaign in list or details view
    if (onUpdateCampaign) {
      onUpdateCampaign(campaignId, updateFields);
    } else if (onSetCampaign && 'id' in updateFields) {
      // For details page: update the full campaign object
      onSetCampaign({ ...(updateFields as Campaign) });
    }

    onSuccess(successMessage);
  } catch (error) {
    if (errorProcessor) {
      const { title, message } = errorProcessor(error);
      onError(title, message);
    } else {
      let message = errorMessage;
      if (error instanceof Error) {
        message = error.message;
      }
      onError(action, message);
    }
  } finally {
    onSetLoading((prev) => {
      const newSet = new Set(prev);
      newSet.delete(campaignId);
      return newSet;
    });
  }
}
