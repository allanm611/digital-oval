import type { CreateManualRewardRequest } from "../types/manualRewardApi";
import type { ManualRewardData } from "../pages/CreateManualRewardPage";
import { parseRecipientMsisdns } from "./parseRecipientMsisdns";
import {
  buildManualRewardPreviewData,
  normalizeClockTime,
} from "./manualRewardPreview";
import { convertWallClockBetweenOffsets } from "../../../shared/utils/wallClockTimezone";

export function buildCreateManualRewardPayload(
  data: ManualRewardData,
): CreateManualRewardRequest {
  if (!data.rewardConfigurationId) {
    throw new Error(
      "Select a reward template that defines how the reward is delivered.",
    );
  }

  const manualMsisdns = parseRecipientMsisdns(data);
  const quicklistMsisdns =
    data.inputMethod === "file" ? data.quicklistMsisdns || [] : [];
  const msisdns = quicklistMsisdns.length > 0 ? quicklistMsisdns : manualMsisdns;

  if (data.inputMethod === "manual" && msisdns.length === 0) {
    throw new Error(
      "Enter at least one valid MSISDN with country code (one per line). Email addresses cannot receive telecom rewards.",
    );
  }

  if (data.inputMethod === "file" && !data.quicklistId) {
    throw new Error("Select a quicklist containing subscriber MSISDNs.");
  }

  if (data.inputMethod === "file" && msisdns.length === 0) {
    throw new Error(
      "The selected quicklist has no subscriber MSISDNs to grant.",
    );
  }

  const applyTime = normalizeClockTime(data.applyTime);
  const applyType = data.applyDate && applyTime ? "later" : data.applyType || "now";
  let applyDate = applyType === "later" ? data.applyDate : undefined;
  let storedTime = applyType === "later" ? applyTime : undefined;
  if (applyDate && storedTime && data.timeZoneOffset && data.timeZoneOffset !== "+00:00") {
    const utc = convertWallClockBetweenOffsets(
      `${applyDate}T${storedTime}`,
      data.timeZoneOffset,
      "+00:00",
    );
    applyDate = utc.split("T")[0];
    storedTime = utc.split("T")[1];
  }

  const payload: CreateManualRewardRequest = {
    reward_configuration_id: data.rewardConfigurationId,
    rewardType: data.rewardType || "bundle",
    rewardValue: data.rewardValue?.trim() || "N/A",
    bundleTrack: data.rewardConfigurationName || data.bundleTrack,
    description: data.description,
    audienceName: data.audienceName,
    audienceDescription: data.audienceDescription,
    rowCount: msisdns.length || data.rowCount,
    applyType,
    applyDate,
    applyTime: storedTime,
    previewData: buildManualRewardPreviewData(data),
  };

  if (msisdns.length > 0) {
    payload.uploadType = "direct";
  }

  if (msisdns.length === 1) {
    payload.msisdn = msisdns[0];
  } else if (msisdns.length > 1) {
    payload.msisdns = msisdns;
  }

  return payload;
}
