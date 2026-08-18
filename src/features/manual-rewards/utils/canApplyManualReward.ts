import type { ManualReward } from "../types/manualReward";

/** Backend rejects apply when status is already "applied". */
export function canApplyManualReward(
  status: ManualReward["status"],
): boolean {
  return (
    status === "pending" || status === "scheduled" || status === "failed"
  );
}
