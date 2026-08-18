/** Information-architecture paths for reward providers and templates. */

export const CONFIGURATION_HUB_PATH = "/dashboard/configuration";
export const REWARD_PROVIDERS_PATH = "/dashboard/reward-providers";
export const REWARD_TEMPLATES_PATH = "/dashboard/reward-configurations";

export type RewardNavFrom = "list" | "details" | "provider";

export type RewardNavState = {
  from?: RewardNavFrom;
  parentLabel?: string;
  providerId?: number;
};

export function rewardProviderDetailsPath(id: number | string): string {
  return `${REWARD_PROVIDERS_PATH}/${id}/details`;
}

export function rewardProviderEditPath(id: number | string): string {
  return `${REWARD_PROVIDERS_PATH}/${id}/edit`;
}

export function rewardTemplateDetailsPath(id: number | string): string {
  return `${REWARD_TEMPLATES_PATH}/${id}/details`;
}

export function rewardTemplateEditPath(id: number | string): string {
  return `${REWARD_TEMPLATES_PATH}/${id}/edit`;
}

export function rewardTemplatesListPath(providerId?: number | string | null): string {
  if (providerId == null || providerId === "") return REWARD_TEMPLATES_PATH;
  return `${REWARD_TEMPLATES_PATH}?provider_id=${providerId}`;
}

export function rewardTemplateCreatePath(providerId?: number | string | null): string {
  if (providerId == null || providerId === "") {
    return `${REWARD_TEMPLATES_PATH}/create`;
  }
  return `${REWARD_TEMPLATES_PATH}/create?provider_id=${providerId}`;
}

export function readRewardNavState(state: unknown): RewardNavState | null {
  if (!state || typeof state !== "object") return null;
  return state as RewardNavState;
}
