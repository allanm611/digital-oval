/** Offer types that do not require reward ↔ tracking-source mapping (proactive grants / seed lists). */
export const OFFER_TYPES_EXEMPT_FROM_TRACKING_REWARD_MAP = new Set([
  "bonus",
  "seeding",
]);

/** Offer types that always ship a tracking-independent default reward. */
export const OFFER_TYPES_WITH_DEFAULT_REWARD = new Set(["seeding"]);

export function normalizeOfferTypeKey(name?: string | null): string {
  return (name ?? "").trim().toLowerCase().replace(/\s+/g, "_");
}

export function resolveOfferTypeName(
  offerTypeId: number | undefined,
  offerTypes: { id: number; name: string }[] | undefined,
  fallbackLabel?: string,
): string | undefined {
  if (offerTypeId != null && offerTypes?.length) {
    const match = offerTypes.find((t) => t.id === offerTypeId);
    if (match?.name) return match.name;
  }
  return fallbackLabel;
}

export function offerTypeExemptFromTrackingRewardMapping(
  offerTypeName?: string,
): boolean {
  return OFFER_TYPES_EXEMPT_FROM_TRACKING_REWARD_MAP.has(
    normalizeOfferTypeKey(offerTypeName),
  );
}

/** True when the offer must define tracking sources and map each enabled reward rule to one. */
export function offerRequiresTrackingAndRewardMapping(
  offerTypeId: number | undefined,
  offerTypes: { id: number; name: string }[] | undefined,
  fallbackLabel?: string,
): boolean {
  const name = resolveOfferTypeName(offerTypeId, offerTypes, fallbackLabel);
  if (!name) return true;
  return !offerTypeExemptFromTrackingRewardMapping(name);
}

/** True when the offer type always includes a default (non-tracking) reward. */
export function offerUsesDefaultReward(
  offerTypeId: number | undefined,
  offerTypes: { id: number; name: string }[] | undefined,
  fallbackLabel?: string,
): boolean {
  const name = resolveOfferTypeName(offerTypeId, offerTypes, fallbackLabel);
  if (!name) return false;
  return OFFER_TYPES_WITH_DEFAULT_REWARD.has(normalizeOfferTypeKey(name));
}
