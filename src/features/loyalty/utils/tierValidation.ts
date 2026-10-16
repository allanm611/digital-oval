export interface TierRangeInput {
  name: string;
  pointsFrom: string;
  pointsTo: string;
  pointsToUnlimited: boolean;
}

/**
 * Automated tiers must cover every point from 0 upward without gaps or
 * shared boundaries. Ranges are inclusive, so the next tier starts at
 * previous Point To + 1. Example: 0–999, 1000–4999, 5000–Unlimited.
 */
export function validateAutomatedTiers(tiers: TierRangeInput[]): string[] {
  if (tiers.length === 0) {
    return ["Add at least one segmentation tier."];
  }

  const errors: string[] = [];
  const seenNames = new Set<string>();
  const parsed: Array<{ name: string; from: number; to: number | null }> = [];

  tiers.forEach((tier, index) => {
    const label = `Tier ${index + 1}`;
    const name = tier.name.trim();
    if (!name) {
      errors.push(`${label} needs a name.`);
      return;
    }
    const nameKey = name.toLowerCase();
    if (seenNames.has(nameKey)) {
      errors.push(`Tier name "${name}" is used more than once.`);
    }
    seenNames.add(nameKey);

    if (!isWholeNumber(tier.pointsFrom)) {
      errors.push(`${name} needs a whole-number Point From value.`);
      return;
    }
    const from = Number(tier.pointsFrom);

    if (tier.pointsToUnlimited) {
      parsed.push({ name, from, to: null });
      return;
    }

    if (!isWholeNumber(tier.pointsTo)) {
      errors.push(`${name} needs a Point To value, or Unlimited.`);
      return;
    }
    const to = Number(tier.pointsTo);
    if (to < from) {
      errors.push(`${name} Point To must be greater than or equal to Point From.`);
    }
    parsed.push({ name, from, to });
  });

  if (parsed.length !== tiers.length) return errors;

  if (!parsed.some((tier) => tier.from === 0)) {
    errors.push("The Point From value of at least one tier must be 0.");
  }

  const unlimited = parsed.filter((tier) => tier.to === null);
  if (unlimited.length === 0) {
    errors.push("The Point To value of at least one tier must be Unlimited.");
  } else if (unlimited.length > 1) {
    errors.push("Only the highest tier can have an Unlimited Point To.");
  }

  const sorted = [...parsed].sort(
    (left, right) => left.from - right.from || compareUpper(left.to, right.to),
  );

  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1];
    const current = sorted[index];
    if (!previous || !current) continue;

    if (previous.to === null) {
      errors.push(
        `${previous.name} is Unlimited, so no tier can start above it.`,
      );
      break;
    }

    if (current.from <= previous.to) {
      errors.push(
        `${current.name} overlaps ${previous.name}. Values between any two tiers must not be the same.`,
      );
    } else if (current.from !== previous.to + 1) {
      errors.push(
        `There is a gap between ${previous.name} (ends at ${previous.to}) and ${current.name} (starts at ${current.from}). Tiers must be continuous.`,
      );
    }
  }

  const highest = sorted[sorted.length - 1];
  if (unlimited.length === 1 && highest && highest.to !== null) {
    errors.push("The Unlimited tier must be the highest tier.");
  }

  return errors;
}

export function validateManualTiers(tiers: Array<{ name: string }>): string[] {
  if (tiers.length === 0) {
    return ["Add at least one segmentation tier."];
  }

  const errors: string[] = [];
  const seenNames = new Set<string>();
  tiers.forEach((tier, index) => {
    const name = tier.name.trim();
    if (!name) {
      errors.push(`Tier ${index + 1} needs a name.`);
      return;
    }
    const nameKey = name.toLowerCase();
    if (seenNames.has(nameKey)) {
      errors.push(`Tier name "${name}" is used more than once.`);
    }
    seenNames.add(nameKey);
  });
  return errors;
}

function isWholeNumber(value: string): boolean {
  return /^\d+$/.test(value.trim());
}

function compareUpper(left: number | null, right: number | null): number {
  if (left === null && right === null) return 0;
  if (left === null) return 1;
  if (right === null) return -1;
  return left - right;
}
