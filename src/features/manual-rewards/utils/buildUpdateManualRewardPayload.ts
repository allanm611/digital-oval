import type { UpdateManualRewardRequest } from "../types/manualRewardApi";
import type { ManualRewardData } from "../pages/CreateManualRewardPage";
import { convertWallClockBetweenOffsets } from "../../../shared/utils/wallClockTimezone";
import { normalizeClockTime } from "./manualRewardPreview";

/**
 * The update endpoint stores applyDate + applyTime as a UTC timestamp
 * (`date T time :00Z`). Convert the selected timezone's wall clock first.
 * previewData is intentionally omitted: the current update schema rejects it.
 */
function toUtcApplyParts(
  date: string,
  time: string,
  offset?: string,
): { applyDate: string; applyTime: string } {
  if (!offset || offset === "Z" || offset === "+00:00") {
    return { applyDate: date, applyTime: time };
  }
  const utc = convertWallClockBetweenOffsets(
    `${date}T${time}`,
    offset,
    "+00:00",
  );
  const [applyDate, applyTime] = utc.split("T");
  return { applyDate, applyTime };
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
  if (data.rowCount != null) {
    payload.rowCount = data.rowCount;
  }

  const applyTime = normalizeClockTime(data.applyTime);
  if (data.applyDate && applyTime) {
    const utc = toUtcApplyParts(data.applyDate, applyTime, data.timeZoneOffset);
    payload.applyType = "later";
    payload.applyDate = utc.applyDate;
    payload.applyTime = utc.applyTime;
  } else if (data.applyType) {
    payload.applyType = data.applyType;
  }

  return payload;
}
