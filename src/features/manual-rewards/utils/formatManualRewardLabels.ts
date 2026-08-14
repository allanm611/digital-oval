import type { ManualRewardResource } from "../types/manualRewardApi";

const AUDIENCE_LABELS: Record<string, string> = {
  direct: "Direct MSISDN entry",
  quicklist: "Quicklist",
  file: "Uploaded file",
};

export function formatManualRewardApplyMode(
  applyType: ManualRewardResource["apply_type"] | undefined,
): string {
  if (applyType === "later") {
    return "Scheduled";
  }
  return "Immediate";
}

export function formatManualRewardAudienceType(
  audienceType: ManualRewardResource["audience_type"] | undefined,
): string {
  if (!audienceType) {
    return "—";
  }
  return AUDIENCE_LABELS[audienceType] || audienceType;
}
