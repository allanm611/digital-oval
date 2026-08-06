/**
 * Offer-type policy driven by backend `is_immediate_reward`.
 *
 * - is_immediate_reward === true  → tracking optional; default (immediate) reward required
 * - is_immediate_reward === false → tracking + reward↔tracking mapping required
 *
 * Name-based "seeding" / "bonus" hardcoding is no longer the source of truth.
 * A transitional name fallback remains only when the API omits the flag.
 */

export type OfferTypePolicyFields = {
  id: number;
  name: string;
  is_immediate_reward?: boolean | null;
};

export function normalizeOfferTypeKey(name?: string | null): string {
  return (name ?? "").trim().toLowerCase().replace(/\s+/g, "_");
}

export function resolveOfferType(
  offerTypeId: number | undefined,
  offerTypes: OfferTypePolicyFields[] | undefined,
): OfferTypePolicyFields | undefined {
  if (offerTypeId == null || !offerTypes?.length) return undefined;
  return offerTypes.find((t) => t.id === offerTypeId);
}

export function resolveOfferTypeName(
  offerTypeId: number | undefined,
  offerTypes: OfferTypePolicyFields[] | undefined,
  fallbackLabel?: string,
): string | undefined {
  const match = resolveOfferType(offerTypeId, offerTypes);
  if (match?.name) return match.name;
  return fallbackLabel;
}

/**
 * Resolve whether this offer type grants rewards immediately (no tracking dependency).
 * Prefers API `is_immediate_reward`; falls back to legacy name === "seeding" when unset.
 */
export function resolveIsImmediateReward(
  offerTypeId: number | undefined,
  offerTypes: OfferTypePolicyFields[] | undefined,
  fallbackLabel?: string,
): boolean {
  const match = resolveOfferType(offerTypeId, offerTypes);
  if (match && typeof match.is_immediate_reward === "boolean") {
    return match.is_immediate_reward;
  }

  // Transitional fallback for older payloads that omit the flag.
  const name = match?.name || fallbackLabel;
  return normalizeOfferTypeKey(name) === "seeding";
}

/** @deprecated Prefer resolveIsImmediateReward — kept for call-site clarity during migration */
export function offerTypeExemptFromTrackingRewardMapping(
  offerTypeName?: string,
): boolean {
  return normalizeOfferTypeKey(offerTypeName) === "seeding";
}

/**
 * True when the offer must define tracking sources and map each enabled reward
 * rule to a tracking rule. Immediate-reward types skip this requirement.
 */
export function offerRequiresTrackingAndRewardMapping(
  offerTypeId: number | undefined,
  offerTypes: OfferTypePolicyFields[] | undefined,
  fallbackLabel?: string,
): boolean {
  // No type selected yet — keep tracking required so incomplete forms stay strict.
  if (offerTypeId == null && !fallbackLabel) return true;
  return !resolveIsImmediateReward(offerTypeId, offerTypes, fallbackLabel);
}

/**
 * True when the offer type always includes a tracking-independent default reward
 * (former seeding behavior).
 */
export function offerUsesDefaultReward(
  offerTypeId: number | undefined,
  offerTypes: OfferTypePolicyFields[] | undefined,
  fallbackLabel?: string,
): boolean {
  return resolveIsImmediateReward(offerTypeId, offerTypes, fallbackLabel);
}

/** Alias matching product language on offer types. */
export const offerIsImmediateReward = resolveIsImmediateReward;
