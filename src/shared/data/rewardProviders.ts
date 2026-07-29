/**
 * Reward provider runtime helpers.
 *
 * Backend model (cvm.reward_providers):
 * - Each provider has a single `reward_type` (matches reward_types.reward_key)
 * - GET /reward-providers?reward_type= filters providers for a fulfilment type
 *
 * Offers / manual rewards store provider id in bundleTrack / bundle_subscription_track.
 */

import type { RewardProvider } from "../../features/configurations/types/rewardProvider";

export type RuleRewardType = "bundle" | "points" | "discount" | "cashback";

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

/**
 * Legacy aliases where UI keys and stored provider.reward_type differ.
 * Prefer matching reward_types.reward_key exactly when configuring providers.
 */
export const REWARD_TYPE_ALIASES: Record<string, readonly string[]> = {
  bundle: ["bundle", "bonus_units"],
  bonus_units: ["bundle", "bonus_units"],
  airtime: ["airtime"],
  points: ["points"],
  discount: ["discount"],
  cashback: ["cashback"],
};

export function normalizeRewardTypeKey(
  value: string | undefined | null,
): string {
  if (!value) return "";
  return String(value).trim().toLowerCase();
}

/** All backend reward_type values that satisfy a UI / rule reward type */
export function getRewardTypeMatchKeys(
  ruleType: RuleRewardType | string | undefined | null,
): string[] {
  const key = normalizeRewardTypeKey(ruleType);
  if (!key) return [];
  const aliases = REWARD_TYPE_ALIASES[key];
  return aliases ? [...aliases] : [key];
}

/**
 * Maps UI rule reward types to backend provider.reward_type query values.
 * Uses reward_key as-is; aliases are resolved client-side when filtering.
 */
export function mapRuleRewardTypeToProviderQuery(
  ruleType: RuleRewardType | string | undefined | null,
): string | undefined {
  const key = normalizeRewardTypeKey(ruleType);
  return key || undefined;
}

export interface RewardProviderRecord {
  id: number;
  name: string;
  rewardType: string;
  apiPath: string;
  httpMethod: string;
  isActive?: boolean;
  description?: string | null;
}

export function mapApiRewardProvider(
  provider: RewardProvider,
): RewardProviderRecord {
  return {
    id: provider.id,
    name: provider.name,
    rewardType: provider.reward_type,
    apiPath: provider.api_path,
    httpMethod: provider.http_method,
    isActive: provider.is_active !== false,
    description: provider.description,
  };
}

export function providerMatchesRewardType(
  provider: RewardProviderRecord,
  ruleType: RuleRewardType | string | undefined | null,
): boolean {
  const matchKeys = getRewardTypeMatchKeys(ruleType);
  if (matchKeys.length === 0) return true;
  const providerType = normalizeRewardTypeKey(provider.rewardType);
  return matchKeys.includes(providerType);
}

export function filterProvidersByRewardType(
  providers: readonly RewardProviderRecord[],
  ruleType: RuleRewardType | string | undefined | null,
): RewardProviderRecord[] {
  const active = providers.filter((p) => p.isActive !== false);
  const matchKeys = getRewardTypeMatchKeys(ruleType);
  if (matchKeys.length === 0) return active;
  return active.filter((p) =>
    matchKeys.includes(normalizeRewardTypeKey(p.rewardType)),
  );
}

export function getRewardProviderOptions(
  providers: readonly RewardProviderRecord[],
): Array<{ value: string; label: string }> {
  return providers.map((p) => ({
    value: String(p.id),
    label: p.name,
  }));
}

export function getRewardProviderById(
  providers: readonly RewardProviderRecord[],
  providerId: string | number | undefined | null,
): RewardProviderRecord | undefined {
  if (providerId == null || providerId === "") return undefined;
  const id = Number(providerId);
  if (Number.isNaN(id)) return undefined;
  return providers.find((p) => p.id === id);
}

export function getDefaultRewardProviderId(
  providers: readonly RewardProviderRecord[],
): string {
  return providers[0] ? String(providers[0].id) : "";
}

export function resolveProviderForRewardType(
  providers: readonly RewardProviderRecord[],
  currentProviderId: string | undefined | null,
): string {
  if (
    currentProviderId &&
    providers.some((p) => String(p.id) === currentProviderId)
  ) {
    return currentProviderId;
  }
  return getDefaultRewardProviderId(providers);
}
