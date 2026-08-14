/**
 * Unique integer priority (1–20) for offer tracking rules (per source)
 * and reward configurations (per reward). Lower values are evaluated first.
 * Taken priorities are omitted from the form dropdown so they cannot be reused.
 */

export type PriorityScopedItem = {
  id: string;
  priority: number;
};

/** Inclusive priority bounds for evaluation order. */
export const TRACKING_RULE_PRIORITY_MIN = 1;
export const TRACKING_RULE_PRIORITY_MAX = 20;

export const OFFER_PRIORITY_MIN = TRACKING_RULE_PRIORITY_MIN;
export const OFFER_PRIORITY_MAX = TRACKING_RULE_PRIORITY_MAX;

export function isTrackingRulePriorityInRange(priority: number): boolean {
  return (
    Number.isInteger(priority) &&
    priority >= TRACKING_RULE_PRIORITY_MIN &&
    priority <= TRACKING_RULE_PRIORITY_MAX
  );
}

export function getUsedPriorities(
  items: PriorityScopedItem[],
  excludeId?: string,
): Set<number> {
  return new Set(
    (items || [])
      .filter((item) => !excludeId || item.id !== excludeId)
      .map((item) => item.priority)
      .filter((priority) => Number.isInteger(priority)),
  );
}

/**
 * Unused priorities in range. Pass `excludeId` when editing so the current
 * item's priority remains selectable.
 */
export function getAvailablePriorities(
  items: PriorityScopedItem[],
  excludeId?: string,
): number[] {
  const used = getUsedPriorities(items, excludeId);
  const available: number[] = [];
  for (
    let p = TRACKING_RULE_PRIORITY_MIN;
    p <= TRACKING_RULE_PRIORITY_MAX;
    p += 1
  ) {
    if (!used.has(p)) available.push(p);
  }
  return available;
}

/**
 * Dropdown options for a unique-priority select. Used values are omitted.
 * The item being edited keeps its current in-range priority in the list.
 */
export function getAvailablePrioritySelectOptions(
  items: PriorityScopedItem[],
  excludeId?: string,
  currentPriority?: number,
): { value: string; label: string }[] {
  const values = getAvailablePriorities(items, excludeId);
  if (
    currentPriority != null &&
    isTrackingRulePriorityInRange(currentPriority) &&
    !values.includes(currentPriority)
  ) {
    values.push(currentPriority);
    values.sort((a, b) => a - b);
  }
  return values.map((p) => ({ value: String(p), label: String(p) }));
}

/**
 * Lowest unused priority in range.
 * Returns null when all priorities 1–20 are taken.
 */
export function getNextAvailableTrackingRulePriority(
  items: PriorityScopedItem[],
  excludeId?: string,
): number | null {
  const available = getAvailablePriorities(items, excludeId);
  return available.length > 0 ? available[0] : null;
}

export const getNextAvailablePriority = getNextAvailableTrackingRulePriority;

function validateUniquePriority(
  priority: number,
  existingItems: PriorityScopedItem[],
  excludeId: string | undefined,
  scopeLabel: string,
): string | null {
  if (!Number.isFinite(priority) || !Number.isInteger(priority)) {
    return `Priority must be a whole number from ${TRACKING_RULE_PRIORITY_MIN} to ${TRACKING_RULE_PRIORITY_MAX}.`;
  }
  if (!isTrackingRulePriorityInRange(priority)) {
    return `Priority must be between ${TRACKING_RULE_PRIORITY_MIN} and ${TRACKING_RULE_PRIORITY_MAX}.`;
  }

  const conflict = getUsedPriorities(existingItems, excludeId).has(priority);
  if (conflict) {
    return `Priority ${priority} is already used on ${scopeLabel}. Choose a unique priority (${TRACKING_RULE_PRIORITY_MIN}–${TRACKING_RULE_PRIORITY_MAX}).`;
  }

  return null;
}

/**
 * Validates priority for create/update within one tracking source.
 * Priorities must be unique among all rules on that source (enabled or not).
 */
export function validateTrackingRulePriority(
  priority: number,
  existingRules: PriorityScopedItem[],
  excludeRuleId?: string,
): string | null {
  return validateUniquePriority(
    priority,
    existingRules,
    excludeRuleId,
    "this source",
  );
}

/**
 * Validates priority for create/update within one reward.
 * Priorities must be unique among all configurations on that reward.
 */
export function validateRewardConfigPriority(
  priority: number,
  existingConfigs: PriorityScopedItem[],
  excludeConfigId?: string,
): string | null {
  return validateUniquePriority(
    priority,
    existingConfigs,
    excludeConfigId,
    "this reward",
  );
}

/** Duplicate priorities within a single scope (for wizard / review validation). */
export function findDuplicatePrioritiesInSource(
  items: PriorityScopedItem[],
): number[] {
  const counts = new Map<number, number>();
  for (const item of items || []) {
    if (!Number.isInteger(item.priority)) continue;
    counts.set(item.priority, (counts.get(item.priority) || 0) + 1);
  }
  return Array.from(counts.entries())
    .filter(([, n]) => n > 1)
    .map(([p]) => p)
    .sort((a, b) => a - b);
}

function findInvalidPriorityGroups(
  groups: { id: string; name: string; items: PriorityScopedItem[] }[],
  noun: string,
): { id: string; name: string; reason: string }[] {
  const issues: { id: string; name: string; reason: string }[] = [];

  for (const group of groups || []) {
    const items = group.items || [];
    const outOfRange = items.filter(
      (item) => !isTrackingRulePriorityInRange(item.priority),
    );
    if (outOfRange.length > 0) {
      issues.push({
        id: group.id,
        name: group.name,
        reason: `${noun} priorities must be ${TRACKING_RULE_PRIORITY_MIN}–${TRACKING_RULE_PRIORITY_MAX}.`,
      });
      continue;
    }

    const dupes = findDuplicatePrioritiesInSource(items);
    if (dupes.length > 0) {
      issues.push({
        id: group.id,
        name: group.name,
        reason: `Duplicate ${noun.toLowerCase()} priorities: ${dupes.join(", ")}.`,
      });
    }
  }

  return issues;
}

export function findTrackingSourcesWithInvalidPriorities(
  sources: { id: string; name: string; rules: PriorityScopedItem[] }[],
): { sourceId: string; sourceName: string; reason: string }[] {
  return findInvalidPriorityGroups(
    (sources || []).map((source) => ({
      id: source.id,
      name: source.name,
      items: source.rules,
    })),
    "Rule",
  ).map((issue) => ({
    sourceId: issue.id,
    sourceName: issue.name,
    reason: issue.reason,
  }));
}

export function findRewardsWithInvalidPriorities(
  rewards: { id: string; name: string; rules: PriorityScopedItem[] }[],
): { rewardId: string; rewardName: string; reason: string }[] {
  return findInvalidPriorityGroups(
    (rewards || []).map((reward) => ({
      id: reward.id,
      name: reward.name,
      items: reward.rules,
    })),
    "Configuration",
  ).map((issue) => ({
    rewardId: issue.id,
    rewardName: issue.name,
    reason: issue.reason,
  }));
}
