import type {
  CreateManualRewardImmediateData,
  CreateManualRewardResponse,
  ManualRewardResource,
} from "../types/manualRewardApi";

export function resolveCreatedRewardId(
  result: CreateManualRewardResponse,
): number | undefined {
  const data = result.data;
  if (!data) return undefined;

  const immediate = data as CreateManualRewardImmediateData;
  if (immediate.reward_id != null) {
    return immediate.reward_id;
  }

  const resource = data as ManualRewardResource;
  if (resource.id != null) {
    return resource.id;
  }

  return undefined;
}
