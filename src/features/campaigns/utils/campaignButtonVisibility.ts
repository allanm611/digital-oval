import { Campaign } from "../types/campaign";

/**
 * Check if campaign can be paused
 * Conditions: Must be approved and not already paused
 */
export function canPauseCampaign(campaign: Campaign | undefined): boolean {
  if (!campaign) return false;
  return campaign.approval_status === "approved" && campaign.status !== "paused";
}

/**
 * Check if campaign can be resumed
 * Conditions: Must be approved and paused
 */
export function canResumeCampaign(campaign: Campaign | undefined): boolean {
  if (!campaign) return false;
  return campaign.approval_status === "approved" && campaign.status === "paused";
}

/**
 * Check if campaign can be activated
 * Conditions: Must be approved and not active
 */
export function canActivateCampaign(campaign: Campaign | undefined): boolean {
  if (!campaign) return false;
  return campaign.approval_status === "approved" && campaign.is_active === false;
}

/**
 * Check if campaign can be executed
 * Conditions: Must be approved and active
 */
export function canExecuteCampaign(campaign: Campaign | undefined): boolean {
  if (!campaign) return false;
  return campaign.approval_status === "approved" && campaign.is_active === true;
}

/**
 * Check if campaign can be submitted for approval
 * Conditions: Must be in draft status
 */
export function canSubmitForApproval(campaign: Campaign | undefined): boolean {
  if (!campaign) return false;
  return campaign.status === "draft";
}

/**
 * Check if campaign can be approved
 * Conditions: Must be pending approval
 */
export function canApproveCampaign(campaign: Campaign | undefined): boolean {
  if (!campaign) return false;
  return campaign.approval_status === "pending";
}

/**
 * Check if campaign can be rejected
 * Conditions: Must be pending approval
 */
export function canRejectCampaign(campaign: Campaign | undefined): boolean {
  if (!campaign) return false;
  return campaign.approval_status === "pending";
}
