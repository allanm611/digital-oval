import type { SegmentType } from "../../segments/types/segment";
import type {
  AnalysisInsight,
  AnalysisListQuery,
  AnalysisRecord,
  AnalysisStats,
  SaveAnalysisInput,
} from "../types/analysis";
import { analysisCode } from "../utils/analysisDefinition";
import {
  SAMPLE_AUDIENCE_SEGMENTS,
  buildSampleInsight,
  createSampleAnalyses,
} from "./analyseSamples";

const STORAGE_KEY = "sentra.analyse.sampleCatalog.v1";

/**
 * Walkthrough catalog for Analyse.
 * Create, clone, favourite, and delete change this copy only.
 * A refresh keeps the walkthrough. A new browser session restores the samples.
 */
class AnalyseSampleStore {
  private analyses = this.restore();

  list(query: AnalysisListQuery): { items: AnalysisRecord[]; total: number } {
    const search = query.search?.trim().toLowerCase() ?? "";
    const matched = this.analyses.filter((item) => {
      if (query.favouritesOnly && !item.isFavourite) return false;
      if (
        query.audienceSource &&
        query.audienceSource !== "all" &&
        item.audienceSource !== query.audienceSource
      ) {
        return false;
      }
      if (!search) return true;
      return (
        item.name.toLowerCase().includes(search) ||
        item.description.toLowerCase().includes(search)
      );
    });
    return {
      items: matched.slice(query.offset, query.offset + query.limit).map(cloneAnalysis),
      total: matched.length,
    };
  }

  stats(): AnalysisStats {
    return {
      total: this.analyses.length,
      favourites: this.analyses.filter((item) => item.isFavourite).length,
      newAudiences: this.analyses.filter((item) => item.audienceSource === "new").length,
      savedBases: this.analyses.filter((item) => item.audienceSource !== "new").length,
    };
  }

  get(id: number): AnalysisRecord {
    const found = this.analyses.find((item) => item.id === id);
    if (!found) throw new Error("This analysis was not found in the sample catalog.");
    return cloneAnalysis(found);
  }

  getAudienceSegment(
    source: "existing" | "saved_segments",
    id: number,
  ): SegmentType | null {
    const segment = SAMPLE_AUDIENCE_SEGMENTS.find((item) => item.id === id);
    if (!segment) return null;
    const saved = segment.visibility === "private";
    if (source === "saved_segments" ? !saved : saved) return null;
    return { ...segment };
  }

  listAudienceSegments(
    source: "existing" | "saved_segments",
    search: string,
  ): SegmentType[] {
    const term = search.trim().toLowerCase();
    return SAMPLE_AUDIENCE_SEGMENTS.filter((segment) => {
      const saved = segment.visibility === "private";
      if (source === "saved_segments" ? !saved : saved) return false;
      if (!term) return true;
      return (
        segment.name.toLowerCase().includes(term) ||
        (segment.description || "").toLowerCase().includes(term)
      );
    }).map((segment) => ({ ...segment }));
  }

  save(input: SaveAnalysisInput, existingId?: number): AnalysisRecord {
    const name = input.name.trim();
    if (!name) throw new Error("Enter a name for this analysis.");
    if (input.countIndividualAsRecipient && !input.uniqueIdentifier) {
      throw new Error("Select the customer identity field that identifies one person.");
    }
    if (input.audienceSource !== "new" && !input.sourceSegmentId) {
      throw new Error("Select a segment to analyse.");
    }
    const source = input.sourceSegmentId
      ? SAMPLE_AUDIENCE_SEGMENTS.find((segment) => segment.id === input.sourceSegmentId)
      : undefined;
    if (input.audienceSource !== "new" && !source) {
      throw new Error("Select a segment from the sample catalog.");
    }
    if (input.audienceSource === "new" && input.conditions.length === 0) {
      throw new Error("Add at least one condition to the customer base.");
    }

    const now = new Date().toISOString();
    const current = existingId
      ? this.analyses.find((item) => item.id === existingId)
      : undefined;
    if (existingId && !current) {
      throw new Error("This analysis was not found in the sample catalog.");
    }

    const next: AnalysisRecord = {
      id: current?.id ?? this.nextId(),
      name,
      description: input.description.trim(),
      code: current?.code || analysisCode(name),
      isFavourite: input.isFavourite,
      audienceSource: input.audienceSource,
      sourceSegmentId: input.audienceSource === "new" ? null : input.sourceSegmentId,
      conditions: input.audienceSource === "new" ? input.conditions : [],
      ruleType: "rule",
      sqlQuery: "",
      countIndividualAsRecipient: input.countIndividualAsRecipient,
      uniqueIdentifier: input.countIndividualAsRecipient ? input.uniqueIdentifier : null,
      sizeEstimate:
        input.audienceSource === "new"
          ? current?.sizeEstimate ?? 12840
          : source?.size_estimate ?? null,
      createdAt: current?.createdAt ?? now,
      updatedAt: now,
      visibility: "public",
    };

    this.analyses = current
      ? this.analyses.map((item) => (item.id === current.id ? next : item))
      : [next, ...this.analyses];
    this.persist();
    return cloneAnalysis(next);
  }

  setFavourite(id: number, isFavourite: boolean): void {
    const current = this.analyses.find((item) => item.id === id);
    if (!current) throw new Error("This analysis was not found in the sample catalog.");
    this.analyses = this.analyses.map((item) =>
      item.id === id ? { ...item, isFavourite, updatedAt: new Date().toISOString() } : item,
    );
    this.persist();
  }

  remove(id: number): void {
    if (!this.analyses.some((item) => item.id === id)) {
      throw new Error("This analysis was not found in the sample catalog.");
    }
    this.analyses = this.analyses.filter((item) => item.id !== id);
    this.persist();
  }

  insight(id: number): AnalysisInsight {
    return buildSampleInsight(this.get(id));
  }

  private nextId(): number {
    return this.analyses.reduce((highest, item) => Math.max(highest, item.id), 9100) + 1;
  }

  private restore(): AnalysisRecord[] {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return createSampleAnalyses();
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed) || parsed.length === 0) return createSampleAnalyses();
      return parsed as AnalysisRecord[];
    } catch {
      return createSampleAnalyses();
    }
  }

  private persist(): void {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this.analyses));
  }
}

function cloneAnalysis(analysis: AnalysisRecord): AnalysisRecord {
  return {
    ...analysis,
    conditions: analysis.conditions.map((group) => ({
      ...group,
      conditions: group.conditions.map((condition) => ({ ...condition })),
    })),
  };
}

export const analyseSampleStore = new AnalyseSampleStore();
