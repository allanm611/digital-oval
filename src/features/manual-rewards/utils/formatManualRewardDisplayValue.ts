import type { ManualReward } from "../types/manualReward";

/** Human-readable reward amount for summary cards and details (matches wizard display rules). */
export function formatManualRewardDisplayValue(
  rewardType: ManualReward["rewardType"] | undefined,
  rewardValue: string | undefined,
): string {
  if (!rewardValue?.trim()) {
    return "—";
  }
  const trimmed = rewardValue.trim();
  if (rewardType === "discount" && !trimmed.endsWith("%")) {
    return `${trimmed}%`;
  }
  if (rewardType === "points" && !/point/i.test(trimmed)) {
    return `${trimmed} Points`;
  }
  return trimmed;
}
