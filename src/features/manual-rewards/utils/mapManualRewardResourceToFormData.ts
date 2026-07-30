import type { ManualRewardData } from "../pages/CreateManualRewardPage";
import type { ManualRewardResource } from "../types/manualRewardApi";

function readConfigId(
  preview: Record<string, unknown>,
): number | undefined {
  const raw =
    preview.reward_configuration_id ?? preview.rewardConfigId;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw;
  }
  if (typeof raw === "string" && raw.trim() !== "") {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

export function mapManualRewardResourceToFormData(
  row: ManualRewardResource,
): ManualRewardData {
  const preview = (row.preview_data || {}) as Record<string, unknown>;
  const msisdns = Array.isArray(preview.msisdns)
    ? (preview.msisdns as string[]).filter(Boolean)
    : [];

  let inputMethod: ManualRewardData["inputMethod"];
  if (row.audience_type === "quicklist") {
    inputMethod = "file";
  } else if (row.audience_type === "direct") {
    inputMethod = "manual";
  }

  let applyDate: string | undefined;
  let applyTime: string | undefined;
  if (row.scheduled_at) {
    const scheduled = new Date(row.scheduled_at);
    applyDate = scheduled.toISOString().slice(0, 10);
    applyTime = `${String(scheduled.getUTCHours()).padStart(2, "0")}:${String(
      scheduled.getUTCMinutes(),
    ).padStart(2, "0")}`;
  }

  return {
    audienceName: row.name,
    description: row.description,
    rewardType: row.reward_type,
    rewardValue: row.reward_value,
    bundleTrack: row.bundle_track,
    rewardConfigurationId: readConfigId(preview),
    rewardConfigurationName: row.bundle_track,
    quicklistId: row.quicklist_id,
    rowCount: row.recipient_count,
    inputMethod,
    uploadType: "Standard",
    audienceFileText: msisdns.join("\n"),
    applyType: row.apply_type,
    applyDate,
    applyTime,
    rewardValidation: {
      completed: true,
      passed: 1,
      failed: 0,
      testedAt: new Date().toISOString(),
    },
  };
}
