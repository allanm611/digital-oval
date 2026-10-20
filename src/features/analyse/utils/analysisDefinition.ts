import type { SegmentType } from "../../segments/types/segment";
import {
  ANALYSIS_FAVOURITE_TAG,
  ANALYSIS_KIND,
  ANALYSIS_TAG,
  type AnalysisDefinition,
  type AnalysisRecord,
  type AudienceSource,
} from "../types/analysis";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value) return null;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return parsed && typeof parsed === "object"
        ? (parsed as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  }
  if (typeof value === "object") return value as Record<string, unknown>;
  return null;
}

function asAudienceSource(value: unknown): AudienceSource {
  if (value === "existing" || value === "saved_segments" || value === "new") {
    return value;
  }
  return "new";
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

export function isAnalysisSegment(
  segment: Pick<SegmentType, "tags" | "definition"> | null | undefined,
): boolean {
  if (!segment) return false;
  if (segment.tags?.includes(ANALYSIS_TAG)) return true;
  return asRecord(segment.definition)?.kind === ANALYSIS_KIND;
}

export function readAnalysisDefinition(value: unknown): AnalysisDefinition {
  const record = asRecord(value);
  const conditions = Array.isArray(record?.conditions) ? record.conditions : [];
  return {
    kind: ANALYSIS_KIND,
    audienceSource: asAudienceSource(record?.audienceSource),
    sourceSegmentId: asNumber(record?.sourceSegmentId),
    conditions: conditions as AnalysisDefinition["conditions"],
    ruleType: record?.ruleType === "sql" ? "sql" : "rule",
    sqlQuery: typeof record?.sqlQuery === "string" ? record.sqlQuery : "",
    countIndividualAsRecipient: record?.countIndividualAsRecipient === true,
    uniqueIdentifier:
      typeof record?.uniqueIdentifier === "string" && record.uniqueIdentifier
        ? record.uniqueIdentifier
        : null,
    isFavourite: record?.isFavourite === true,
    segmentPayload:
      record?.segmentPayload && typeof record.segmentPayload === "object"
        ? (record.segmentPayload as AnalysisDefinition["segmentPayload"])
        : null,
  };
}

export function analysisTags(isFavourite: boolean): string[] {
  return isFavourite
    ? [ANALYSIS_TAG, ANALYSIS_FAVOURITE_TAG]
    : [ANALYSIS_TAG];
}

export function toAnalysisRecord(segment: SegmentType): AnalysisRecord {
  const definition = readAnalysisDefinition(segment.definition);
  const favourite =
    definition.isFavourite ||
    Boolean(segment.tags?.includes(ANALYSIS_FAVOURITE_TAG));
  return {
    id: segment.id,
    name: segment.name,
    description: segment.description || "",
    code: segment.code || "",
    isFavourite: favourite,
    audienceSource: definition.audienceSource,
    sourceSegmentId: definition.sourceSegmentId,
    conditions: definition.conditions,
    ruleType: definition.ruleType,
    sqlQuery: definition.sqlQuery,
    countIndividualAsRecipient: definition.countIndividualAsRecipient,
    uniqueIdentifier:
      definition.uniqueIdentifier || segment.unique_identifier || null,
    sizeEstimate: segment.size_estimate,
    createdAt: segment.created_at,
    updatedAt: segment.updated_at,
    visibility: segment.visibility,
  };
}

export function defaultAnalysisName(date = new Date()): string {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return `Analysis_${day}_${month}/${day}/${year}`;
}

export function analysisCode(name: string): string {
  const slug = name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 36);
  const suffix = Date.now().toString(36).toUpperCase();
  return `${slug || "ANALYSIS"}-${suffix}`.slice(0, 60);
}

export function audienceSourceLabel(source: AudienceSource): string {
  if (source === "existing") return "Existing";
  if (source === "saved_segments") return "Saved segments";
  return "New";
}

export function excludeAnalysisSegments<T extends Pick<SegmentType, "tags" | "definition">>(
  segments: T[],
): T[] {
  return segments.filter((segment) => !isAnalysisSegment(segment));
}
