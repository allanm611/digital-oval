import type { OfferReward } from "../types/offerReward";
import type { OfferTrackingSource } from "../types/offerTrackingSource";
import {
  findDefaultReward,
  isDefaultImmediateRewardConfigured,
} from "./seedingRewardDefaults";
import { findTrackingSourcesWithInvalidPriorities } from "./trackingRulePriority";

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

/**
 * When a tracking source has no enabled rules, at most one enabled
 * reward configuration may use source-level fulfilment (no rule id).
 */
export function findDuplicateSourceLevelBindings(
  rewards: OfferReward[],
  trackingSources: OfferTrackingSource[],
): string[] {
  const sourcesWithoutRules = new Set(
    trackingSources
      .filter(
        (s) =>
          s.enabled !== false &&
          !(s.rules || []).some((r) => r.enabled !== false),
      )
      .map((s) => s.id),
  );

  const duplicates: string[] = [];
  for (const reward of rewards) {
    if (reward.is_default) continue;
    const sourceId = reward.tracking_source_id?.trim();
    if (!sourceId || !sourcesWithoutRules.has(sourceId)) continue;

    const sourceLevelCount = reward.rules.filter(
      (rule) => rule.enabled && !rule.tracking_rule_id?.trim(),
    ).length;
    if (sourceLevelCount > 1) {
      duplicates.push(reward.id);
    }
  }
  return duplicates;
}

function enabledRuleIdsBySource(
  trackingSources: OfferTrackingSource[],
): Map<string, Set<string>> {
  return new Map(
    trackingSources.map((s) => [
      s.id,
      new Set(
        (s.rules || [])
          .filter((r) => r.enabled !== false)
          .map((r) => r.id),
      ),
    ]),
  );
}

/**
 * A linked reward config is invalid when:
 * - its tracking source is missing, or
 * - the source has enabled rules but the config does not target one of them.
 * Source-level configs (no tracking_rule_id) are allowed when the source has no rules.
 */
function hasInvalidOptionalTrackingBinding(
  rewards: OfferReward[],
  trackingSources: OfferTrackingSource[],
): boolean {
  const sourceIds = new Set(
    trackingSources.filter((s) => s.enabled !== false).map((s) => s.id),
  );
  const rulesBySource = enabledRuleIdsBySource(trackingSources);

  return rewards.some((reward) => {
    if (reward.is_default) return false;
    const sourceId = reward.tracking_source_id?.trim();
    if (!sourceId) return false;

    return reward.rules
      .filter((rule) => rule.enabled)
      .some((rule) => {
        if (!sourceIds.has(sourceId)) return true;
        const allowed = rulesBySource.get(sourceId);
        const hasRules = (allowed?.size || 0) > 0;
        const ruleId = rule.tracking_rule_id?.trim();
        if (!hasRules) return Boolean(ruleId); // source-level only when no rules
        if (!ruleId) return true;
        return !allowed?.has(ruleId);
      });
  });
}

function applySharedLinkedBindingChecks(
  errors: Record<string, string>,
  rewards: OfferReward[],
  trackingSources: OfferTrackingSource[],
): void {
  const dupRewards = findDuplicateRewardTrackingSourceIds(rewards);
  if (dupRewards.length > 0) {
    errors.rewards =
      "Each tracking source can only be assigned to one reward.";
  }

  if (hasInvalidOptionalTrackingBinding(rewards, trackingSources)) {
    errors.rewards =
      "When a tracking source has rules, each enabled reward configuration must target one of those rules. When it has no rules, use a single source-level configuration.";
  }

  const dupRuleBindings = findDuplicateTrackingRuleBindings(rewards);
  if (dupRuleBindings.length > 0) {
    errors.rewards =
      "Each tracking rule can only be mapped to one enabled reward configuration.";
  }

  const dupSourceLevel = findDuplicateSourceLevelBindings(
    rewards,
    trackingSources,
  );
  if (dupSourceLevel.length > 0) {
    errors.rewards =
      "A tracking source without rules can have only one enabled source-level reward configuration.";
  }
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

  const priorityIssues =
    findTrackingSourcesWithInvalidPriorities(trackingSources);
  if (priorityIssues.length > 0) {
    const first = priorityIssues[0];
    errors.tracking = `${first.sourceName}: ${first.reason} Priorities must be unique within each source (1–20).`;
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

    applySharedLinkedBindingChecks(errors, rewards, trackingSources);
    return errors;
  }

  // Optional tracking without default reward: if the user linked sources/configs,
  // enforce consistent binding shape (rule-level when rules exist).
  if (!requiresMapping) {
    applySharedLinkedBindingChecks(errors, rewards, trackingSources);
    return errors;
  }

  const activeSources = trackingSources.filter((s) => s.enabled !== false);
  const activeSourceIds = new Set(activeSources.map((s) => s.id));

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

    const badBinding = hasInvalidOptionalTrackingBinding(
      rewards,
      trackingSources,
    );

    if (unmappedReward || badBinding) {
      errors.rewards =
        "Each enabled reward configuration must be linked to its tracking source. Bind a tracking rule when the source has rules; otherwise use a single source-level configuration.";
    }
  }

  applySharedLinkedBindingChecks(errors, rewards, trackingSources);

  return errors;
}
