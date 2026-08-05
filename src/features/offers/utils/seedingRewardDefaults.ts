import type { OfferReward, OfferRewardRule } from "../types/offerReward";
import { normalizeOfferTypeKey } from "./offerTypeTrackingPolicy";

export const SEEDING_DEFAULT_REWARD_NAME = "Default Reward";
export const SEEDING_DEFAULT_CONFIG_NAME = "Seeding configuration";
/** Primary CTA label under Reward Configurations for seeding offers */
export const SEEDING_ADD_CONFIG_BUTTON_LABEL =
  "Add reward configuration for seeding";

const newId = () => Math.random().toString(36).slice(2, 11);

export function isSeedingOfferTypeName(offerTypeName?: string | null): boolean {
  return normalizeOfferTypeKey(offerTypeName) === "seeding";
}

export function createDefaultSeedingConfiguration(
  id: string = newId(),
): OfferRewardRule {
  return {
    id,
    name: SEEDING_DEFAULT_CONFIG_NAME,
    bundle_subscription_track: "",
    reward_configuration_id: "",
    reward_configuration_name: "",
    priority: 1,
    condition: "",
    value: "",
    reward_type: "bundle",
    reward_value: "",
    fulfillment_response: "success",
    success_text: "",
    default_failure: "failed",
    error_group_id: "",
    error_group: "",
    failure_text: "",
    enabled: true,
  };
}

function isPlaceholderSeedingConfiguration(rule: OfferRewardRule): boolean {
  const name = rule.name?.trim().toLowerCase() || "";
  const isPlaceholderName =
    name === "default configuration" ||
    name === SEEDING_DEFAULT_CONFIG_NAME.toLowerCase() ||
    name === "new rule";
  return (
    isPlaceholderName &&
    !rule.bundle_subscription_track?.trim() &&
    !rule.reward_configuration_id?.trim()
  );
}

/** Tracking-independent reward that seeding offers always carry (no config until user adds one). */
export function createDefaultSeedingReward(
  id: string = newId(),
): OfferReward {
  return {
    id,
    name: SEEDING_DEFAULT_REWARD_NAME,
    type: "default",
    is_default: true,
    rules: [],
  };
}

export function findDefaultReward(
  rewards: OfferReward[],
): OfferReward | undefined {
  return rewards.find(
    (reward) =>
      reward.is_default === true ||
      (reward.type === "default" && !reward.tracking_source_id?.trim()),
  );
}

export function isRewardConfigurationComplete(rule: OfferRewardRule): boolean {
  return Boolean(
    rule.enabled !== false &&
      rule.bundle_subscription_track?.trim() &&
      rule.reward_configuration_id?.trim(),
  );
}

export function isDefaultSeedingRewardConfigured(
  rewards: OfferReward[],
): boolean {
  const defaultReward = findDefaultReward(rewards);
  if (!defaultReward) return false;
  return defaultReward.rules.some(isRewardConfigurationComplete);
}

/**
 * Ensures seeding offers always have exactly one default reward.
 * Configurations are user-added (not auto-created). Safe for create/edit.
 */
export function ensureSeedingDefaultReward(
  rewards: OfferReward[],
): { rewards: OfferReward[]; changed: boolean } {
  const list = Array.isArray(rewards) ? [...rewards] : [];
  const existingIndex = list.findIndex(
    (reward) =>
      reward.is_default === true ||
      (reward.type === "default" && !reward.tracking_source_id?.trim()),
  );

  if (existingIndex < 0) {
    return {
      rewards: [createDefaultSeedingReward(), ...list],
      changed: true,
    };
  }

  const existing = list[existingIndex];
  let changed = false;
  let next = existing;

  if (!existing.is_default) {
    next = { ...next, is_default: true };
    changed = true;
  }
  if (!existing.name?.trim()) {
    next = { ...next, name: SEEDING_DEFAULT_REWARD_NAME };
    changed = true;
  }
  if (existing.tracking_source_id) {
    next = { ...next, tracking_source_id: undefined };
    changed = true;
  }

  const rules = next.rules || [];
  // Migrate older drafts that auto-inserted an empty "Default configuration".
  if (rules.length === 1 && isPlaceholderSeedingConfiguration(rules[0])) {
    next = { ...next, rules: [] };
    changed = true;
  } else if (rules.length > 0) {
    // Default reward configs must not carry tracking bindings.
    let rulesChanged = false;
    const cleanedRules = rules.map((rule) => {
      if (!rule.tracking_source_id && !rule.tracking_rule_id) return rule;
      rulesChanged = true;
      return {
        ...rule,
        tracking_source_id: undefined,
        tracking_rule_id: undefined,
      };
    });
    if (rulesChanged) {
      next = { ...next, rules: cleanedRules };
      changed = true;
    }
  }

  if (!changed) {
    return { rewards, changed: false };
  }

  list[existingIndex] = next;
  return { rewards: list, changed: true };
}

/** When leaving seeding, keep configured grants but drop the default flag. */
export function demoteSeedingDefaultRewards(
  rewards: OfferReward[],
): { rewards: OfferReward[]; changed: boolean } {
  let changed = false;
  const next = rewards.map((reward) => {
    if (!reward.is_default) return reward;
    changed = true;
    return { ...reward, is_default: false };
  });
  return { rewards: changed ? next : rewards, changed };
}
