import type { UpdateManualRewardRequest } from "../types/manualRewardApi";
import type { ManualRewardData } from "../pages/CreateManualRewardPage";

function buildPreviewDataPatch(
  data: ManualRewardData,
): Record<string, unknown> | undefined {
  const patch: Record<string, unknown> = {};

  if (data.rewardConfigurationId != null) {
    patch.reward_configuration_id = data.rewardConfigurationId;
  }
  if (data.rewardProviderId) {
    const asNum = Number(data.rewardProviderId);
    patch.reward_provider_id = Number.isFinite(asNum)
      ? asNum
      : data.rewardProviderId;
  }
  if (data.rewardAuthConfig) {
    patch.auth_config = data.rewardAuthConfig;
  }
  if (data.rewardPayloadConfig) {
    patch.payload_config = data.rewardPayloadConfig;
  }

  return Object.keys(patch).length > 0 ? patch : undefined;
}

export function buildUpdateManualRewardPayload(
  data: ManualRewardData,
): UpdateManualRewardRequest {
  const payload: UpdateManualRewardRequest = {};

  if (data.audienceName?.trim()) {
    payload.audienceName = data.audienceName.trim();
  }
  if (data.description !== undefined) {
    payload.description = data.description;
  }
  if (data.rewardType) {
    payload.rewardType = data.rewardType;
  }
  if (data.rewardValue !== undefined) {
    payload.rewardValue = data.rewardValue.trim();
  }
  if (data.bundleTrack !== undefined) {
    payload.bundleTrack = data.bundleTrack;
  }
  if (data.inputMethod === "file" && data.quicklistId != null) {
    payload.uploadType = "quicklist";
    payload.quicklistId = data.quicklistId;
  }
  if (data.rowCount != null) {
    payload.rowCount = data.rowCount;
  }
  if (data.applyType) {
    payload.applyType = data.applyType;
  }
  if (data.applyDate) {
    payload.applyDate = data.applyDate;
  }
  if (data.applyTime) {
    payload.applyTime = data.applyTime;
  }

  const previewData = buildPreviewDataPatch(data);
  if (previewData) {
    payload.previewData = previewData;
  }

  return payload;
}
