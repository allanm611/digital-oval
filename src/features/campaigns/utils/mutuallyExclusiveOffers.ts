import type { CampaignSegment } from "../types/campaign";

export const MUTUALLY_EXCLUSIVE_METADATA_KEY = "mutually_exclusive" as const;

export function isMutuallyExclusiveCampaign(
  segments: Array<Pick<CampaignSegment, "is_mutually_exclusive">> = [],
  metadata?: Record<string, unknown> | null,
): boolean {
  if (metadata?.[MUTUALLY_EXCLUSIVE_METADATA_KEY] === true) return true;
  return segments.some((segment) => segment.is_mutually_exclusive === true);
}

export function stampMutuallyExclusiveOnSegments(
  segments: CampaignSegment[],
  enabled: boolean,
): CampaignSegment[] {
  return segments.map((segment) => ({
    ...segment,
    is_mutually_exclusive: enabled,
  }));
}

export function countOffersBySegment(
  flows: Array<{ segment_id?: number | string }>,
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const flow of flows) {
    if (flow.segment_id == null || flow.segment_id === "") continue;
    const id = String(flow.segment_id);
    counts.set(id, (counts.get(id) || 0) + 1);
  }
  return counts;
}

export function segmentsExceedingExclusiveOfferLimit(
  flows: Array<{ segment_id?: number | string }>,
  segments: Array<Pick<CampaignSegment, "id" | "name">>,
): Array<{ id: string; name: string; offerCount: number }> {
  const counts = countOffersBySegment(flows);
  return segments
    .map((segment) => ({
      id: String(segment.id),
      name: segment.name,
      offerCount: counts.get(String(segment.id)) || 0,
    }))
    .filter((segment) => segment.offerCount > 1);
}

export function exclusiveOfferLimitMessage(segmentName: string): string {
  return `Mutually exclusive campaigns allow only one offer per segment. Remove extra offers from "${segmentName}" before continuing.`;
}

export function mergeCampaignMetadata(
  formData: {
    metadata?: Record<string, unknown>;
    scheduling?: unknown;
    priority_rank?: number | null;
  },
  mutuallyExclusive: boolean,
): Record<string, unknown> {
  return {
    ...(formData.metadata || {}),
    ...(formData.scheduling
      ? { broadcast_schedule: formData.scheduling }
      : {}),
    ...(formData.priority_rank != null
      ? { priority_rank: formData.priority_rank }
      : {}),
    [MUTUALLY_EXCLUSIVE_METADATA_KEY]: mutuallyExclusive,
  };
}
