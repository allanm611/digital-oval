import type { ManualReward } from "../types/manualReward";
import type { ManualRewardApiStatus } from "../types/manualRewardApi";

type EditableStatus = ManualReward["status"] | ManualRewardApiStatus;

/** Applied grants are immutable; use view-only or create a new grant. */
export function canEditManualReward(status: EditableStatus | undefined): boolean {
  return status != null && status !== "applied";
}
