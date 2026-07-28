/**
 * Reward Provider ↔ Reward Type association.
 *
 * Runtime data is loaded from `/reward-providers` via `useRewardProviders`.
 * `FALLBACK_REWARD_PROVIDERS` is used when the API is unavailable (dev / rollout).
 *
 * API field values use `provider_key` — mapped to
 * `bundle_subscription_track` (offers) and `bundleTrack` (manual rewards).
 */

export type RuleRewardType = "bundle" | "points" | "discount" | "cashback";

/** Normalized provider record for UI and validation helpers */
export interface RewardProviderRecord {
  id?: number;
  providerKey: string;
  name: string;
  allowedRewardTypes: RuleRewardType[];
  isActive?: boolean;
  description?: string;
}

export const ALL_RULE_REWARD_TYPES: readonly RuleRewardType[] = [
  "bundle",
  "points",
  "discount",
  "cashback",
] as const;

export const RULE_REWARD_TYPE_LABELS: Record<RuleRewardType, string> = {
  bundle: "Bundle",
  points: "Points",
  discount: "Discount",
  cashback: "Cashback",
};

/** Offline fallback — seed backend with these keys during migration */
export const FALLBACK_REWARD_PROVIDERS: readonly RewardProviderRecord[] = [
  {
    providerKey: "R2TPersAdjustBalCount2",
    name: "R2TPersAdjustBalCount2",
    allowedRewardTypes: ["bundle", "points", "cashback"],
    isActive: true,
  },
  {
    providerKey: "SelectDependantProduct",
    name: "SelectDependantProduct",
    allowedRewardTypes: ["bundle", "discount"],
    isActive: true,
  },
  {
    providerKey: "SYSDATE",
    name: "SYSDATE",
    allowedRewardTypes: ["bundle", "points", "discount", "cashback"],
    isActive: true,
  },
] as const;

export function mapApiRewardProvider(provider: {
  id: number;
  provider_key: string;
  name: string;
  allowed_reward_types: RuleRewardType[];
  is_active?: boolean;
  description?: string;
}): RewardProviderRecord {
  return {
    id: provider.id,
    providerKey: provider.provider_key,
    name: provider.name,
    allowedRewardTypes: [...(provider.allowed_reward_types || [])],
    isActive: provider.is_active !== false,
    description: provider.description,
  };
}

export function getActiveProviders(
  providers: readonly RewardProviderRecord[],
): RewardProviderRecord[] {
  return providers.filter((p) => p.isActive !== false);
}

export function getRewardProviderByKey(
  providers: readonly RewardProviderRecord[],
  providerKey: string | undefined | null,
): RewardProviderRecord | undefined {
  if (!providerKey) return undefined;
  return providers.find((p) => p.providerKey === providerKey);
}

export function getAllowedRewardTypes(
  providers: readonly RewardProviderRecord[],
  providerKey: string | undefined | null,
): RuleRewardType[] {
  const provider = getRewardProviderByKey(providers, providerKey);
  if (!provider) return [...ALL_RULE_REWARD_TYPES];
  return [...provider.allowedRewardTypes];
}

export function isRewardTypeAllowedForProvider(
  providers: readonly RewardProviderRecord[],
  providerKey: string | undefined | null,
  rewardType: RuleRewardType | undefined | null,
): boolean {
  if (!rewardType) return false;
  return getAllowedRewardTypes(providers, providerKey).includes(rewardType);
}

export function resolveRewardTypeForProvider(
  providers: readonly RewardProviderRecord[],
  providerKey: string | undefined | null,
  currentRewardType: RuleRewardType | undefined | null,
): RuleRewardType {
  const allowed = getAllowedRewardTypes(providers, providerKey);
  if (currentRewardType && allowed.includes(currentRewardType)) {
    return currentRewardType;
  }
  return allowed[0] ?? "bundle";
}

export function getRewardProviderOptions(
  providers: readonly RewardProviderRecord[],
): Array<{ value: string; label: string }> {
  return providers.map((p) => ({
    value: p.providerKey,
    label: p.name || p.providerKey,
  }));
}

export function getDefaultRewardProviderKey(
  providers: readonly RewardProviderRecord[],
): string {
  const active = getActiveProviders(providers);
  return active[0]?.providerKey ?? FALLBACK_REWARD_PROVIDERS[0]?.providerKey ?? "";
}

/** Validates provider_key format (immutable after create, like gateway field keys) */
export function validateProviderKey(key: string): string | null {
  const trimmed = key.trim();
  if (!trimmed) return "Provider key is required";
  if (trimmed.length > 128) return "Provider key must be 128 characters or less";
  if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(trimmed)) {
    return "Use letters, numbers, and underscores; must start with a letter";
  }
  return null;
}

export function validateAllowedRewardTypes(
  types: RuleRewardType[],
): string | null {
  if (!types.length) return "Select at least one reward type";
  const invalid = types.filter((t) => !ALL_RULE_REWARD_TYPES.includes(t));
  if (invalid.length) return "One or more reward types are invalid";
  return null;
}
