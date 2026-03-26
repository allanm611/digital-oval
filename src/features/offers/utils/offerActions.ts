import { offerService } from "../services/offerService";
import type { Offer } from "../types/offer";

// ============================================================================
// Button Visibility Functions
// ============================================================================

type OfferButtonType = "pause" | "activate" | "archive" | "submit" | "approve" | "reject";

/**
 * Unified function to check if an offer button should be shown/enabled
 */
export function canShowOfferButton(
  offer: Offer | undefined,
  buttonType: OfferButtonType
): boolean {
  if (!offer) return false;

  switch (buttonType) {
    case "pause":
      return offer.status === "active";
    case "activate":
      return offer.status === "paused";
    case "archive":
      return offer.status === "active" || offer.status === "paused";
    case "submit":
      return offer.status === "draft";
    case "approve":
      return offer.status === "pending_approval";
    case "reject":
      return offer.status === "pending_approval";
    default:
      return false;
  }
}

// ============================================================================
// Action Handler
// ============================================================================

export interface OfferActionParams {
  offerId: number;
  offerName?: string;
  action: "activate" | "pause" | "archive" | "approve" | "reject";
  successMessage: string;
  updateFields: Partial<Offer>;
  userId?: string; // For approve/reject actions
}

export interface OfferActionHandlerConfig {
  onSetLoading: (state: { offerId: number; action: string } | null) => void;
  onCloseMenu: () => void;
  onUpdateOffers?: (offerId: number, updateFields: Partial<Offer>) => void;
  onSuccess: (message: string) => void;
  onError: (title: string, message: string) => void;
  onRefreshStats?: () => void;
}

export async function handleOfferAction(
  params: OfferActionParams,
  config: OfferActionHandlerConfig,
) {
  const { offerId, action, successMessage, updateFields, userId } = params;
  const { onSetLoading, onCloseMenu, onUpdateOffers, onSuccess, onError, onRefreshStats } = config;

  onSetLoading({ offerId, action });
  onCloseMenu();

  try {
    switch (action) {
      case "activate":
        await offerService.activateOffer(offerId);
        break;
      case "pause":
        await offerService.pauseOffer(offerId);
        break;
      case "archive":
        await offerService.archiveOffer(offerId);
        break;
      case "approve":
        await offerService.approveOffer(offerId, { approved_by: userId });
        break;
      case "reject":
        await offerService.rejectOffer(offerId, { rejected_by: userId });
        break;
    }

    // Optimistically update offer in list
    if (onUpdateOffers) {
      onUpdateOffers(offerId, updateFields);
    }

    onSuccess(successMessage);
    onRefreshStats?.();
  } catch (error) {
    const message = error instanceof Error ? error.message : `Failed to ${action} offer`;
    onError(`Failed to ${action}`, message);
  } finally {
    onSetLoading(null);
  }
}
