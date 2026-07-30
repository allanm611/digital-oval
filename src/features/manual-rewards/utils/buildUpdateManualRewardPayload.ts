import type { UpdateManualRewardRequest } from "../types/manualRewardApi";
import type { ManualRewardData } from "../pages/CreateManualRewardPage";

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

  return payload;
}
