import type { OfferTrackingRule } from "../types/offerTrackingSource";

/** Inclusive priority bounds for offer tracking rules (evaluation order). */
export const TRACKING_RULE_PRIORITY_MIN = 1;
export const TRACKING_RULE_PRIORITY_MAX = 20;

export function isTrackingRulePriorityInRange(priority: number): boolean {
  return (
    Number.isInteger(priority) &&
    priority >= TRACKING_RULE_PRIORITY_MIN &&
    priority <= TRACKING_RULE_PRIORITY_MAX
  );
}

/**
 * Lowest unused priority in range for a source's rules.
 * Returns null when all priorities 1–20 are taken.
 */
export function getNextAvailableTrackingRulePriority(
  rules: OfferTrackingRule[],
  excludeRuleId?: string,
): number | null {
  const used = new Set(
    (rules || [])
      .filter((r) => !excludeRuleId || r.id !== excludeRuleId)
      .map((r) => r.priority)
      .filter((p) => Number.isInteger(p)),
  );

  for (
    let p = TRACKING_RULE_PRIORITY_MIN;
    p <= TRACKING_RULE_PRIORITY_MAX;
    p += 1
  ) {
    if (!used.has(p)) return p;
  }
  return null;
}

/**
 * Validates priority for create/update within one tracking source.
 * Priorities must be unique among all rules on that source (enabled or not).
 */
export function validateTrackingRulePriority(
  priority: number,
  existingRules: OfferTrackingRule[],
  excludeRuleId?: string,
): string | null {
  if (!Number.isFinite(priority) || !Number.isInteger(priority)) {
    return `Priority must be a whole number from ${TRACKING_RULE_PRIORITY_MIN} to ${TRACKING_RULE_PRIORITY_MAX}.`;
  }
  if (!isTrackingRulePriorityInRange(priority)) {
    return `Priority must be between ${TRACKING_RULE_PRIORITY_MIN} and ${TRACKING_RULE_PRIORITY_MAX}.`;
  }

  const conflict = (existingRules || []).some(
    (r) =>
      r.priority === priority &&
      (!excludeRuleId || r.id !== excludeRuleId),
  );
  if (conflict) {
    return `Priority ${priority} is already used by another rule on this source. Choose a unique priority (${TRACKING_RULE_PRIORITY_MIN}–${TRACKING_RULE_PRIORITY_MAX}).`;
  }

  return null;
}

/** Duplicate priorities within a single source (for wizard / review validation). */
export function findDuplicatePrioritiesInSource(
  rules: OfferTrackingRule[],
): number[] {
  const counts = new Map<number, number>();
  for (const rule of rules || []) {
    if (!Number.isInteger(rule.priority)) continue;
    counts.set(rule.priority, (counts.get(rule.priority) || 0) + 1);
  }
  return Array.from(counts.entries())
    .filter(([, n]) => n > 1)
    .map(([p]) => p)
    .sort((a, b) => a - b);
}

export function findTrackingSourcesWithInvalidPriorities(
  sources: { id: string; name: string; rules: OfferTrackingRule[] }[],
): { sourceId: string; sourceName: string; reason: string }[] {
  const issues: { sourceId: string; sourceName: string; reason: string }[] = [];

  for (const source of sources || []) {
    const rules = source.rules || [];
    const outOfRange = rules.filter(
      (r) => !isTrackingRulePriorityInRange(r.priority),
    );
    if (outOfRange.length > 0) {
      issues.push({
        sourceId: source.id,
        sourceName: source.name,
        reason: `Rule priorities must be ${TRACKING_RULE_PRIORITY_MIN}–${TRACKING_RULE_PRIORITY_MAX}.`,
      });
      continue;
    }

    const dupes = findDuplicatePrioritiesInSource(rules);
    if (dupes.length > 0) {
      issues.push({
        sourceId: source.id,
        sourceName: source.name,
        reason: `Duplicate rule priorities: ${dupes.join(", ")}.`,
      });
    }
  }

  return issues;
}
