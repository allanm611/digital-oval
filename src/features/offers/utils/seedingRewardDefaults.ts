import type { OfferReward, OfferRewardRule } from "../types/offerReward";
import { resolveIsImmediateReward } from "./offerTypeTrackingPolicy";

export const IMMEDIATE_DEFAULT_REWARD_NAME = "Default Reward";
export const IMMEDIATE_DEFAULT_CONFIG_NAME = "Immediate reward configuration";
/** Fallback CTA when offer type name is unavailable */
export const IMMEDIATE_ADD_CONFIG_BUTTON_LABEL =
  "Add reward configuration for immediate reward";

/**
 * CTA under Reward Configurations for immediate-reward offer types.
 * Uses the offer type display name, e.g. "Add reward configuration for Seeding".
 */
export function formatImmediateAddConfigButtonLabel(
  offerTypeName?: string | null,
): string {
  const name = offerTypeName?.trim();
  return name
    ? `Add reward configuration for ${name}`
    : IMMEDIATE_ADD_CONFIG_BUTTON_LABEL;
}

/** @deprecated Use IMMEDIATE_* constants */
export const SEEDING_DEFAULT_REWARD_NAME = IMMEDIATE_DEFAULT_REWARD_NAME;
/** @deprecated Use IMMEDIATE_* constants */
export const SEEDING_DEFAULT_CONFIG_NAME = IMMEDIATE_DEFAULT_CONFIG_NAME;
/** @deprecated Use formatImmediateAddConfigButtonLabel */
export const SEEDING_ADD_CONFIG_BUTTON_LABEL = IMMEDIATE_ADD_CONFIG_BUTTON_LABEL;

const newId = () => Math.random().toString(36).slice(2, 11);

/**
 * @deprecated Prefer resolveIsImmediateReward / offerUsesDefaultReward from
 * offerTypeTrackingPolicy (flag-driven, not name-driven).
 */
export function isSeedingOfferTypeName(offerTypeName?: string | null): boolean {
  return resolveIsImmediateReward(
    undefined,
    undefined,
    offerTypeName ?? undefined,
  );
}

export function createDefaultImmediateConfiguration(
  id: string = newId(),
): OfferRewardRule {
  return {
    id,
    name: IMMEDIATE_DEFAULT_CONFIG_NAME,
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
    error_group_ids: [],
    error_group_id: "",
    error_group: "",
    error_group_messages: {},
    failure_text: "",
    enabled: true,
  };
}

/** @deprecated Use createDefaultImmediateConfiguration */
export const createDefaultSeedingConfiguration =
  createDefaultImmediateConfiguration;

function isPlaceholderImmediateConfiguration(rule: OfferRewardRule): boolean {
  const name = rule.name?.trim().toLowerCase() || "";
  const isPlaceholderName =
    name === "default configuration" ||
    name === IMMEDIATE_DEFAULT_CONFIG_NAME.toLowerCase() ||
    name === "seeding configuration" ||
    name === "new rule";
  return (
    isPlaceholderName &&
    !rule.bundle_subscription_track?.trim() &&
    !rule.reward_configuration_id?.trim()
  );
}

/** Tracking-independent reward that immediate-reward offers always carry. */
export function createDefaultImmediateReward(
  id: string = newId(),
): OfferReward {
  return {
    id,
    name: IMMEDIATE_DEFAULT_REWARD_NAME,
    type: "default",
    is_default: true,
    rules: [],
  };
}

/** @deprecated Use createDefaultImmediateReward */
export const createDefaultSeedingReward = createDefaultImmediateReward;

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

export function isDefaultImmediateRewardConfigured(
  rewards: OfferReward[],
): boolean {
  const defaultReward = findDefaultReward(rewards);
  if (!defaultReward) return false;
  return defaultReward.rules.some(isRewardConfigurationComplete);
}

/** @deprecated Use isDefaultImmediateRewardConfigured */
export const isDefaultSeedingRewardConfigured =
  isDefaultImmediateRewardConfigured;

/**
 * Ensures immediate-reward offers always have exactly one default reward.
 * Configurations are user-added (not auto-created). Safe for create/edit.
 */
export function ensureImmediateDefaultReward(
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
      rewards: [createDefaultImmediateReward(), ...list],
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
    next = { ...next, name: IMMEDIATE_DEFAULT_REWARD_NAME };
    changed = true;
  }
  if (existing.tracking_source_id) {
    next = { ...next, tracking_source_id: undefined };
    changed = true;
  }

  const rules = next.rules || [];
  // Migrate older drafts that auto-inserted an empty placeholder configuration.
  if (rules.length === 1 && isPlaceholderImmediateConfiguration(rules[0])) {
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

/** @deprecated Use ensureImmediateDefaultReward */
export const ensureSeedingDefaultReward = ensureImmediateDefaultReward;

/** When leaving an immediate-reward type, keep configured grants but drop the default flag. */
export function demoteImmediateDefaultRewards(
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

/** @deprecated Use demoteImmediateDefaultRewards */
export const demoteSeedingDefaultRewards = demoteImmediateDefaultRewards;
