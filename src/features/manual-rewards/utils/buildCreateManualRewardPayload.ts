import type { CreateManualRewardRequest } from "../types/manualRewardApi";
import type { ManualRewardData } from "../pages/CreateManualRewardPage";
import { parseRecipientMsisdns } from "./parseRecipientMsisdns";

export function buildCreateManualRewardPayload(
  data: ManualRewardData,
): CreateManualRewardRequest {
  if (!data.rewardConfigurationId) {
    throw new Error(
      "Select a reward configuration that defines how the reward is delivered.",
    );
  }

  const msisdns = parseRecipientMsisdns(data);

  if (data.inputMethod === "manual" && msisdns.length === 0) {
    throw new Error(
      "Enter at least one valid MSISDN with country code (one per line). Email addresses cannot receive telecom rewards.",
    );
  }

  if (data.inputMethod === "file" && !data.quicklistId) {
    throw new Error("Select a quicklist containing subscriber MSISDNs.");
  }

  const payload: CreateManualRewardRequest = {
    reward_configuration_id: data.rewardConfigurationId,
    rewardType: data.rewardType || "bundle",
    rewardValue: data.rewardValue?.trim() || "N/A",
    bundleTrack: data.rewardConfigurationName || data.bundleTrack,
    description: data.description,
    audienceName: data.audienceName,
    audienceDescription: data.audienceDescription,
    quicklistId: data.inputMethod === "file" ? data.quicklistId : undefined,
    rowCount: data.rowCount ?? (msisdns.length || undefined),
    applyType: data.applyType || "now",
    applyDate: data.applyDate,
    applyTime: data.applyTime,
    previewData: {
      reward_configuration_id: data.rewardConfigurationId,
      ...(data.selectedCommunicationPolicyId
        ? { communication_policy_id: data.selectedCommunicationPolicyId }
        : {}),
    },
  };

  if (data.inputMethod === "file") {
    payload.uploadType = "quicklist";
  } else if (msisdns.length > 0) {
    payload.uploadType = "direct";
  }

  if (msisdns.length === 1) {
    payload.msisdn = msisdns[0];
  } else if (msisdns.length > 1) {
    payload.msisdns = msisdns;
  }

  return payload;
}
