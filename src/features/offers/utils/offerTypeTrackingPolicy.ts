/**
 * Offer-type policy driven by backend `is_seeding_reward`.
 *
 * - is_seeding_reward === true  → tracking optional; default (seeding) reward required
 * - is_seeding_reward === false → tracking + reward↔tracking mapping required
 *
 * Name-based "seeding" / "bonus" hardcoding is no longer the source of truth.
 * A transitional name fallback remains only when the API omits the flag.
 */

export type OfferTypePolicyFields = {
  id: number;
  name: string;
  is_seeding_reward?: boolean | null;
  /** @deprecated Backend renamed to `is_seeding_reward`; accepted on read only. */
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
 * Resolve whether this offer type is a seeding reward type (no tracking dependency).
 * Prefers API `is_seeding_reward`; accepts legacy `is_immediate_reward` on read;
 * falls back to name === "seeding" when both are unset.
 */
export function resolveIsSeedingReward(
  offerTypeId: number | undefined,
  offerTypes: OfferTypePolicyFields[] | undefined,
  fallbackLabel?: string,
): boolean {
  const match = resolveOfferType(offerTypeId, offerTypes);
  if (match && typeof match.is_seeding_reward === "boolean") {
    return match.is_seeding_reward;
  }
  // Transitional: older API / cached payloads may still send the previous flag.
  if (match && typeof match.is_immediate_reward === "boolean") {
    return match.is_immediate_reward;
  }

  // Transitional fallback for older payloads that omit the flag.
  const name = match?.name || fallbackLabel;
  return normalizeOfferTypeKey(name) === "seeding";
}

/** @deprecated Use resolveIsSeedingReward */
export const resolveIsImmediateReward = resolveIsSeedingReward;

/** @deprecated Prefer resolveIsSeedingReward — kept for call-site clarity during migration */
export function offerTypeExemptFromTrackingRewardMapping(
  offerTypeName?: string,
): boolean {
  return normalizeOfferTypeKey(offerTypeName) === "seeding";
}

/**
 * True when the offer must define tracking sources and map each enabled reward
 * rule to a tracking rule. Seeding-reward types skip this requirement.
 */
export function offerRequiresTrackingAndRewardMapping(
  offerTypeId: number | undefined,
  offerTypes: OfferTypePolicyFields[] | undefined,
  fallbackLabel?: string,
): boolean {
  // No type selected yet — keep tracking required so incomplete forms stay strict.
  if (offerTypeId == null && !fallbackLabel) return true;
  return !resolveIsSeedingReward(offerTypeId, offerTypes, fallbackLabel);
}

/**
 * True when the offer type always includes a tracking-independent default reward
 * (seeding behavior).
 */
export function offerUsesDefaultReward(
  offerTypeId: number | undefined,
  offerTypes: OfferTypePolicyFields[] | undefined,
  fallbackLabel?: string,
): boolean {
  return resolveIsSeedingReward(offerTypeId, offerTypes, fallbackLabel);
}

/** Alias matching product language on offer types. */
export const offerIsSeedingReward = resolveIsSeedingReward;

/** @deprecated Use offerIsSeedingReward */
export const offerIsImmediateReward = resolveIsSeedingReward;
