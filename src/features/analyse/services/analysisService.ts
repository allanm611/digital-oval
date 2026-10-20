import type { SegmentType } from "../../segments/types/segment";
import type {
  AnalysisInsight,
  AnalysisListQuery,
  AnalysisRecord,
  AnalysisStats,
  SaveAnalysisInput,
} from "../types/analysis";
import { analyseSampleStore } from "../data/analyseSampleStore";

/**
 * Analyse endpoint used by the list, editor, and results pages.
 * It is served by the session catalog until a dedicated analyses API exists.
 * Pages keep calling these methods; only this file changes when that API arrives.
 */
class AnalysisService {
  list(query: AnalysisListQuery): Promise<{ items: AnalysisRecord[]; total: number }> {
    return Promise.resolve(analyseSampleStore.list(query));
  }

  stats(): Promise<AnalysisStats> {
    return Promise.resolve(analyseSampleStore.stats());
  }

  get(id: number): Promise<AnalysisRecord> {
    return Promise.resolve(analyseSampleStore.get(id));
  }

  listAudienceSegments(
    source: "existing" | "saved_segments",
    search: string,
  ): Promise<SegmentType[]> {
    return Promise.resolve(analyseSampleStore.listAudienceSegments(source, search));
  }

  getAudienceSegment(
    source: "existing" | "saved_segments",
    id: number,
  ): Promise<SegmentType | null> {
    return Promise.resolve(analyseSampleStore.getAudienceSegment(source, id));
  }

  save(input: SaveAnalysisInput, existingId?: number): Promise<AnalysisRecord> {
    return Promise.resolve(analyseSampleStore.save(input, existingId));
  }

  clone(
    id: number,
    input: Pick<
      SaveAnalysisInput,
      | "name"
      | "description"
      | "isFavourite"
      | "countIndividualAsRecipient"
      | "uniqueIdentifier"
      | "createdByUserId"
    >,
  ): Promise<AnalysisRecord> {
    const source = analyseSampleStore.get(id);
    return Promise.resolve(
      analyseSampleStore.save({
        name: input.name,
        description: input.description,
        isFavourite: input.isFavourite,
        audienceSource: source.audienceSource,
        sourceSegmentId: source.sourceSegmentId,
        conditions: source.conditions,
        countIndividualAsRecipient: input.countIndividualAsRecipient,
        uniqueIdentifier: input.countIndividualAsRecipient
          ? input.uniqueIdentifier || source.uniqueIdentifier
          : null,
        createdByUserId: input.createdByUserId,
      }),
    );
  }

  setFavourite(id: number, isFavourite: boolean): Promise<void> {
    analyseSampleStore.setFavourite(id, isFavourite);
    return Promise.resolve();
  }

  remove(id: number): Promise<void> {
    analyseSampleStore.remove(id);
    return Promise.resolve();
  }

  loadInsight(analysis: AnalysisRecord): Promise<AnalysisInsight> {
    return Promise.resolve(analyseSampleStore.insight(analysis.id));
  }
}

export const analysisService = new AnalysisService();
