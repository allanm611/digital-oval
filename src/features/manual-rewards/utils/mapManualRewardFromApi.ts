import type { ManualReward } from "../types/manualReward";
import type { ManualRewardResource } from "../types/manualRewardApi";

export function mapManualRewardFromApi(row: ManualRewardResource): ManualReward {
  return {
    id: row.id,
    name: row.name,
    rewardType: row.reward_type,
    rewardValue: row.reward_value,
    recipientCount: row.recipient_count,
    status: row.status,
    appliedCount: row.applied_count,
    failedCount: row.failed_count,
    scheduledAt: row.scheduled_at,
    createdAt: row.created_at,
    createdBy: row.created_by != null ? String(row.created_by) : "—",
  };
}
