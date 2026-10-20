/**
 * Offer-type reward policy.
 *
 * - offer type SEEDING (name or code), or `is_seeding_reward === true`
 *   → tracking optional; a default reward is always present and must be configured
 * - every other offer type
 *   → tracking is required; rewards are optional
 *   → any reward the user adds must still be complete and bound to tracking
 *
 * `offer_type == SEEDING` always uses the default reward, even when the
 * `is_seeding_reward` flag was left off. The flag still opts other type names
 * into the same seeding-reward behavior.
 */

export type OfferTypePolicyFields = {
  id: number;
  name: string;
  /** Catalog code when the API sends one (e.g. "SEEDING"). */
  code?: string | null;
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

const SEEDING_OFFER_TYPE_KEYS = new Set([
  "seeding",
  "seed",
  "seeding_reward",
  "seeding_rewards",
]);

/** True when the offer type identity is SEEDING, independent of the flag. */
export function isSeedingOfferTypeKey(name?: string | null): boolean {
  const key = normalizeOfferTypeKey(name);
  return key.length > 0 && SEEDING_OFFER_TYPE_KEYS.has(key);
}

/**
 * Resolve whether this offer type always carries a default reward.
 * `offer_type == SEEDING` (name or code) wins even if `is_seeding_reward` is false.
 * Other types follow `is_seeding_reward`, then the legacy `is_immediate_reward` flag.
 */
export function resolveIsSeedingReward(
  offerTypeId: number | undefined,
  offerTypes: OfferTypePolicyFields[] | undefined,
  fallbackLabel?: string,
): boolean {
  const match = resolveOfferType(offerTypeId, offerTypes);
  if (
    isSeedingOfferTypeKey(match?.code) ||
    isSeedingOfferTypeKey(match?.name)
  ) {
    return true;
  }
  // Types not loaded yet: honor the offer's own type label (e.g. "SEEDING").
  if (!match && isSeedingOfferTypeKey(fallbackLabel)) {
    return true;
  }

  if (match && typeof match.is_seeding_reward === "boolean") {
    return match.is_seeding_reward;
  }
  // Transitional: older API / cached payloads may still send the previous flag.
  if (match && typeof match.is_immediate_reward === "boolean") {
    return match.is_immediate_reward;
  }

  return false;
}

/** @deprecated Use resolveIsSeedingReward */
export const resolveIsImmediateReward = resolveIsSeedingReward;

/** @deprecated Prefer resolveIsSeedingReward — kept for call-site clarity during migration */
export function offerTypeExemptFromTrackingRewardMapping(
  offerTypeName?: string,
): boolean {
  return isSeedingOfferTypeKey(offerTypeName);
}

/**
 * True when the offer must define at least one tracking source.
 * Rewards stay optional for these types; seeding types skip the requirement.
 * Kept name: callers pass this as the tracking gate, not a reward mandate.
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
 * True when the offer type always includes a tracking-independent default reward.
 * That is offer type SEEDING, or any type flagged `is_seeding_reward`.
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
