import type { OfferReward, OfferRewardRule } from "../types/offerReward";
import type { OfferTrackingSource } from "../types/offerTrackingSource";

/**
 * Keeps create and edit wizard state aligned:
 * - reward configurations inherit the parent reward's tracking source
 * - invalid / deleted tracking_rule_id bindings are cleared
 * - unambiguous single-rule sources soft-migrate missing bindings
 */
export function normalizeOfferRewardsWithTracking(
  rewards: OfferReward[],
  trackingSources: OfferTrackingSource[],
): { rewards: OfferReward[]; changed: boolean } {
  if (!Array.isArray(rewards) || rewards.length === 0) {
    return { rewards: rewards || [], changed: false };
  }

  const sourcesById = new Map(
    (trackingSources || []).map((source) => [source.id, source]),
  );
  let changed = false;

  const nextRewards = rewards.map((reward) => {
    // Default / immediate rewards are tracking-independent.
    if (reward.is_default) {
      let defaultChanged = Boolean(reward.tracking_source_id);
      const cleanedRules = (reward.rules || []).map((rule) => {
        if (!rule.tracking_source_id && !rule.tracking_rule_id) return rule;
        defaultChanged = true;
        return {
          ...rule,
          tracking_source_id: undefined,
          tracking_rule_id: undefined,
        };
      });
      if (!defaultChanged) return reward;
      changed = true;
      return {
        ...reward,
        tracking_source_id: undefined,
        rules: cleanedRules,
      };
    }

    const sourceId = reward.tracking_source_id?.trim() || undefined;
    const source = sourceId ? sourcesById.get(sourceId) : undefined;
    const enabledRuleIds = new Set(
      (source?.rules || [])
        .filter((rule) => rule.enabled !== false)
        .map((rule) => rule.id),
    );

    const claimedRuleIds = new Set<string>();
    const nextRules = (reward.rules || []).map((rule) => {
      const syncedSourceId = sourceId || rule.tracking_source_id?.trim() || undefined;
      let trackingRuleId = rule.tracking_rule_id?.trim() || undefined;

      if (trackingRuleId && !enabledRuleIds.has(trackingRuleId)) {
        trackingRuleId = undefined;
      }

      if (
        !trackingRuleId &&
        rule.enabled !== false &&
        enabledRuleIds.size === 1
      ) {
        const onlyRuleId = [...enabledRuleIds][0];
        if (!claimedRuleIds.has(onlyRuleId)) {
          trackingRuleId = onlyRuleId;
        }
      }

      if (trackingRuleId) {
        claimedRuleIds.add(trackingRuleId);
      }

      const nextRule: OfferRewardRule = {
        ...rule,
        tracking_source_id: syncedSourceId,
        tracking_rule_id: trackingRuleId,
      };

      if (
        nextRule.tracking_source_id !== rule.tracking_source_id ||
        nextRule.tracking_rule_id !== rule.tracking_rule_id
      ) {
        changed = true;
      }

      return nextRule;
    });

    if (nextRules === reward.rules) {
      return reward;
    }

    return { ...reward, rules: nextRules };
  });

  return { rewards: changed ? nextRewards : rewards, changed };
}

/** True when a reward configuration should expose / require a tracking-rule binding. */
export function rewardConfigShouldBindTrackingRule(
  trackingSourceId: string | undefined,
  requiresOfferTypeMapping: boolean,
  isDefaultReward = false,
): boolean {
  if (isDefaultReward) return false;
  return requiresOfferTypeMapping || Boolean(trackingSourceId?.trim());
}
