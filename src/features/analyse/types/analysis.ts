import type { SegmentConditionGroup, SegmentPayload } from "../../segments/types/segment";

/** Tag stored on the segment row that backs an analysis. */
export const ANALYSIS_TAG = "cvm-analysis";

/** Second tag used so favourite analyses can be listed without a second store. */
export const ANALYSIS_FAVOURITE_TAG = "cvm-analysis-favourite";

export const ANALYSIS_KIND = "cvm-analysis" as const;

export type AudienceSource = "new" | "existing" | "saved_segments";

export type AnalysisRuleType = "rule" | "sql";

/**
 * Persisted on the backing segment's `definition` field.
 * The segment row is the analysis record until a dedicated analyses API exists.
 */
export interface AnalysisDefinition {
  kind: typeof ANALYSIS_KIND;
  audienceSource: AudienceSource;
  sourceSegmentId: number | null;
  conditions: SegmentConditionGroup[];
  ruleType: AnalysisRuleType;
  sqlQuery: string;
  countIndividualAsRecipient: boolean;
  uniqueIdentifier: string | null;
  isFavourite: boolean;
  segmentPayload: SegmentPayload | null;
}

export interface AnalysisRecord {
  id: number;
  name: string;
  description: string;
  code: string;
  isFavourite: boolean;
  audienceSource: AudienceSource;
  sourceSegmentId: number | null;
  conditions: SegmentConditionGroup[];
  ruleType: AnalysisRuleType;
  sqlQuery: string;
  countIndividualAsRecipient: boolean;
  uniqueIdentifier: string | null;
  sizeEstimate: number | null;
  createdAt: string;
  updatedAt: string;
  visibility: string;
}

export interface SaveAnalysisInput {
  name: string;
  description: string;
  isFavourite: boolean;
  audienceSource: AudienceSource;
  sourceSegmentId: number | null;
  conditions: SegmentConditionGroup[];
  ruleType?: AnalysisRuleType;
  sqlQuery?: string;
  countIndividualAsRecipient: boolean;
  uniqueIdentifier: string | null;
  createdByUserId?: number | null;
}

export interface AnalysisListQuery {
  search?: string;
  favouritesOnly?: boolean;
  audienceSource?: "all" | "new" | "existing" | "saved_segments";
  limit: number;
  offset: number;
}

export interface AnalysisStats {
  total: number;
  favourites: number;
  newAudiences: number;
  savedBases: number;
}

export interface AnalysisInsight {
  segmentId: number;
  memberCount: number | null;
  growthRate: number | null;
  engagementScore: number | null;
  churnRate: number | null;
  growth: Array<{ date: string; memberCount: number; growthRate: number }>;
  campaigns: Array<{ id: number; name: string; usageCount: number; lastUsed: string }>;
  sample: Array<Record<string, unknown>>;
  warnings: string[];
}
