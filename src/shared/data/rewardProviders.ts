/**
 * Reward provider runtime helpers.
 *
 * Backend model (cvm.reward_providers):
 * - Each provider has a single `reward_type` and integration schemas
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

/** Maps UI rule reward types to backend provider.reward_type query values */
export function mapRuleRewardTypeToProviderQuery(
  ruleType: RuleRewardType | string | undefined | null,
): string | undefined {
  if (!ruleType) return undefined;
  const mapping: Record<string, string> = {
    bundle: "bonus_units",
    airtime: "airtime",
    points: "points",
    discount: "discount",
    cashback: "cashback",
  };
  return mapping[ruleType] ?? ruleType;
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
