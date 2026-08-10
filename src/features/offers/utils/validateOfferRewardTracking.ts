import type { OfferReward } from "../types/offerReward";
import type { OfferTrackingSource } from "../types/offerTrackingSource";
import {
  findDefaultReward,
  isDefaultImmediateRewardConfigured,
} from "./seedingRewardDefaults";

/**
 * Ensures offer tracking instances do not reuse the same catalog source.
 */
export function findDuplicateTrackingCatalogIds(
  trackingSources: OfferTrackingSource[],
): string[] {
  const counts = new Map<string, number>();
  for (const source of trackingSources) {
    if (source.catalog_source_id == null || source.catalog_source_id === "") {
      continue;
    }
    const key = String(source.catalog_source_id);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return Array.from(counts.entries())
    .filter(([, n]) => n > 1)
    .map(([id]) => id);
}

/**
 * Offer tracking sources that lack an engine attribution FK
 * (`/tracking-sources` → cvm.tracking_sources). Reward mappings need this id.
 */
export function findTrackingSourcesMissingEngineId(
  trackingSources: OfferTrackingSource[],
): OfferTrackingSource[] {
  return trackingSources.filter(
    (s) =>
      s.enabled !== false &&
      (s.engine_tracking_source_id == null ||
        !Number.isFinite(Number(s.engine_tracking_source_id))),
  );
}

/**
 * Ensures each offer reward is bound to a distinct tracking source.
 */
export function findDuplicateRewardTrackingSourceIds(
  rewards: OfferReward[],
): string[] {
  const counts = new Map<string, number>();
  for (const reward of rewards) {
    const id = reward.tracking_source_id?.trim();
    if (!id) continue;
    counts.set(id, (counts.get(id) || 0) + 1);
  }
  return Array.from(counts.entries())
    .filter(([, n]) => n > 1)
    .map(([id]) => id);
}

/**
 * Within a reward, each tracking rule should map to at most one enabled
 * reward configuration (deterministic fulfilment).
 */
export function findDuplicateTrackingRuleBindings(
  rewards: OfferReward[],
): string[] {
  const duplicates: string[] = [];
  for (const reward of rewards) {
    const counts = new Map<string, number>();
    for (const rule of reward.rules) {
      if (!rule.enabled) continue;
      const ruleId = rule.tracking_rule_id?.trim();
      if (!ruleId) continue;
      counts.set(ruleId, (counts.get(ruleId) || 0) + 1);
    }
    for (const [ruleId, n] of counts) {
      if (n > 1) duplicates.push(`${reward.id}:${ruleId}`);
    }
  }
  return duplicates;
}

export function validateOfferRewardTrackingMapping(
  rewards: OfferReward[],
  trackingSources: OfferTrackingSource[],
  requiresMapping: boolean,
  options?: { usesDefaultReward?: boolean },
): Record<string, string> {
  const errors: Record<string, string> = {};
  const usesDefaultReward = options?.usesDefaultReward === true;

  const duplicateCatalog = findDuplicateTrackingCatalogIds(trackingSources);
  if (duplicateCatalog.length > 0) {
    errors.tracking =
      "Each tracking source from the catalog can only be added once.";
  }

  const unlinkedCatalog = trackingSources.some(
    (s) => s.catalog_source_id == null || s.catalog_source_id === "",
  );
  if (unlinkedCatalog) {
    errors.tracking =
      "Every tracking source must be linked to a catalog tracking source.";
  }

  const defaultCount = trackingSources.filter((s) => s.is_default).length;
  if (defaultCount > 1) {
    errors.tracking =
      "Only one tracking source can be set as the default.";
  }

  // Immediate reward (is_immediate_reward): tracking optional; default reward mandatory.
  if (usesDefaultReward) {
    if (!findDefaultReward(rewards)) {
      errors.rewards =
        "Immediate-reward offers require a default reward. It should be created automatically — refresh this step.";
    } else if (!isDefaultImmediateRewardConfigured(rewards)) {
      errors.rewards =
        "Configure the default reward (provider and reward template). Tracking is not required for immediate-reward offer types.";
    }

    const dupRewards = findDuplicateRewardTrackingSourceIds(rewards);
    if (dupRewards.length > 0) {
      errors.rewards =
        "Each tracking source can only be assigned to one reward.";
    }

    const sourceIds = new Set(
      trackingSources.filter((s) => s.enabled !== false).map((s) => s.id),
    );
    const rulesBySource = new Map(
      trackingSources.map((s) => [
        s.id,
        new Set(
          (s.rules || [])
            .filter((r) => r.enabled !== false)
            .map((r) => r.id),
        ),
      ]),
    );

    const linkedEnabled = rewards.flatMap((reward) => {
      if (reward.is_default) return [];
      const sourceId = reward.tracking_source_id?.trim();
      if (!sourceId) return [];
      return reward.rules
        .filter((rule) => rule.enabled)
        .map((rule) => ({ rule, sourceId }));
    });

    const badOptionalBinding = linkedEnabled.some(({ rule, sourceId }) => {
      if (!sourceIds.has(sourceId)) return true;
      const ruleId = rule.tracking_rule_id?.trim();
      if (!ruleId) return true;
      return !rulesBySource.get(sourceId)?.has(ruleId);
    });

    if (badOptionalBinding) {
      errors.rewards =
        "Optional tracking-bound reward configurations must target a specific tracking rule.";
    }

    return errors;
  }

  // Optional tracking without default reward: if the user linked sources/configs,
  // enforce the same rule-binding shape as create/edit required flows.
  if (!requiresMapping) {
    const dupRewards = findDuplicateRewardTrackingSourceIds(rewards);
    if (dupRewards.length > 0) {
      errors.rewards =
        "Each tracking source can only be assigned to one reward.";
    }

    const sourceIds = new Set(
      trackingSources.filter((s) => s.enabled !== false).map((s) => s.id),
    );
    const rulesBySource = new Map(
      trackingSources.map((s) => [
        s.id,
        new Set(
          (s.rules || [])
            .filter((r) => r.enabled !== false)
            .map((r) => r.id),
        ),
      ]),
    );

    const linkedEnabled = rewards.flatMap((reward) => {
      if (reward.is_default) return [];
      const sourceId = reward.tracking_source_id?.trim();
      if (!sourceId) return [];
      return reward.rules
        .filter((rule) => rule.enabled)
        .map((rule) => ({ reward, rule, sourceId }));
    });

    const badOptionalBinding = linkedEnabled.some(({ rule, sourceId }) => {
      if (!sourceIds.has(sourceId)) return true;
      const ruleId = rule.tracking_rule_id?.trim();
      if (!ruleId) return true;
      return !rulesBySource.get(sourceId)?.has(ruleId);
    });

    if (badOptionalBinding) {
      errors.rewards =
        "Each enabled reward configuration linked to a tracking source must target a specific tracking rule.";
    }

    const dupRuleBindings = findDuplicateTrackingRuleBindings(rewards);
    if (dupRuleBindings.length > 0) {
      errors.rewards =
        "Each tracking rule can only be mapped to one enabled reward configuration.";
    }

    return errors;
  }

  const activeSources = trackingSources.filter((s) => s.enabled !== false);
  const activeSourceIds = new Set(activeSources.map((s) => s.id));
  const rulesBySource = new Map(
    activeSources.map((s) => [
      s.id,
      new Set(
        (s.rules || [])
          .filter((r) => r.enabled !== false)
          .map((r) => r.id),
      ),
    ]),
  );

  if (activeSourceIds.size === 0) {
    errors.tracking =
      "At least one enabled tracking source is required for this offer type.";
  }

  const enabledRules = rewards.flatMap((r) =>
    r.rules.filter((rule) => rule.enabled),
  );

  if (enabledRules.length === 0) {
    errors.rewards =
      "At least one enabled reward configuration is required for this offer type.";
  } else {
    const unmappedReward = rewards.some((reward) => {
      if (reward.is_default) return false;
      const hasEnabled = reward.rules.some((r) => r.enabled);
      if (!hasEnabled) return false;
      const sourceId = reward.tracking_source_id?.trim();
      return !sourceId || !activeSourceIds.has(sourceId);
    });

    const badBinding = enabledRules.some((rule) => {
      const parent = rewards.find((r) =>
        r.rules.some((rr) => rr.id === rule.id),
      );
      if (parent?.is_default) return false;
      const sourceId =
        parent?.tracking_source_id?.trim() || rule.tracking_source_id?.trim();
      if (!sourceId || !activeSourceIds.has(sourceId)) return true;
      const ruleId = rule.tracking_rule_id?.trim();
      if (!ruleId) return true;
      const allowed = rulesBySource.get(sourceId);
      return !allowed?.has(ruleId);
    });

    if (unmappedReward || badBinding) {
      errors.rewards =
        "Each enabled reward configuration must be linked to a specific tracking rule on its tracking source.";
    }
  }

  const dupRewards = findDuplicateRewardTrackingSourceIds(rewards);
  if (dupRewards.length > 0) {
    errors.rewards =
      "Each tracking source can only be assigned to one reward.";
  }

  const dupRuleBindings = findDuplicateTrackingRuleBindings(rewards);
  if (dupRuleBindings.length > 0) {
    errors.rewards =
      "Each tracking rule can only be mapped to one enabled reward configuration.";
  }

  return errors;
}
