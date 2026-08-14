import type { ManualReward } from "../types/manualReward";
import type { ManualRewardResource } from "../types/manualRewardApi";

function readConfigId(preview?: Record<string, unknown>): number | undefined {
  if (!preview) return undefined;
  const raw = preview.reward_configuration_id ?? preview.rewardConfigId;
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

export function mapManualRewardFromApi(row: ManualRewardResource): ManualReward {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    rewardType: row.reward_type,
    rewardValue: row.reward_value,
    recipientCount: row.recipient_count,
    status: row.status,
    appliedCount: row.applied_count,
    failedCount: row.failed_count,
    applyType: row.apply_type ?? "now",
    audienceType: row.audience_type,
    quicklistId: row.quicklist_id,
    rewardConfigurationId: readConfigId(row.preview_data),
    scheduledAt: row.scheduled_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
    createdBy: row.created_by != null ? String(row.created_by) : "—",
  };
}
