import { offerService } from "../../offers/services/offerService";
import type { CampaignOffer } from "../types/campaign";

export type MappedOfferPatch = Pick<
  CampaignOffer,
  "name" | "description" | "offer_type" | "code"
>;

/** Latest offer fields to show on Map Segments to Offers after an in-place edit. */
export async function fetchMappedOfferPatch(
  offerId: number,
): Promise<MappedOfferPatch | null> {
  const response = await offerService.getOfferById(offerId, true);
  const offer = response?.data;
  if (!offer) return null;
  return {
    name: offer.name,
    description: offer.description,
    offer_type: offer.offer_type_label || offer.offer_type || "General",
    code: offer.code,
  };
}

export function applyMappedOfferPatch(
  offer: CampaignOffer,
  offerId: number,
  patch: MappedOfferPatch,
): CampaignOffer {
  if (String(offer.id) !== String(offerId)) return offer;
  return {
    ...offer,
    name: patch.name?.trim() || offer.name,
    description: patch.description ?? offer.description,
    offer_type: patch.offer_type || offer.offer_type,
    code: patch.code ?? offer.code,
  };
}
