import { Offer } from "../types/offer";

/**
 * Check if offer can be paused
 * Conditions: Must be approved and active (not paused/archived)
 */
export function canPauseOffer(offer: Offer | undefined): boolean {
  if (!offer) return false;
  return offer.approval_status === "approved" && offer.lifecycle_status !== "paused";
}

/**
 * Check if offer can be resumed/activated
 * Conditions: Must be approved and paused
 */
export function canActivateOffer(offer: Offer | undefined): boolean {
  if (!offer) return false;
  return offer.approval_status === "approved" && offer.lifecycle_status === "paused";
}

/**
 * Check if offer can be archived
 * Conditions: Must be approved and not already archived
 */
export function canArchiveOffer(offer: Offer | undefined): boolean {
  if (!offer) return false;
  return (
    offer.approval_status === "approved" &&
    offer.lifecycle_status !== "archived"
  );
}

/**
 * Check if offer can be submitted for approval
 * Conditions: Must be in draft status
 */
export function canSubmitForApproval(offer: Offer | undefined): boolean {
  if (!offer) return false;
  return offer.lifecycle_status === "draft";
}

/**
 * Check if offer can be approved
 * Conditions: Must be pending approval
 */
export function canApproveOffer(offer: Offer | undefined): boolean {
  if (!offer) return false;
  return offer.approval_status === "pending";
}

/**
 * Check if offer can be rejected
 * Conditions: Must be pending approval
 */
export function canRejectOffer(offer: Offer | undefined): boolean {
  if (!offer) return false;
  return offer.approval_status === "pending";
}
