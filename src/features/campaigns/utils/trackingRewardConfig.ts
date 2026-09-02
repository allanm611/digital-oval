import type { OfferReward } from "../../offers/types/offerReward";
import type { OfferTrackingSource } from "../../offers/types/offerTrackingSource";
import { offerTypeExemptFromTrackingRewardMapping } from "../../offers/utils/offerTypeTrackingPolicy";
import { TRACKING_TYPE_OPTIONS } from "../../offers/utils/trackingSourcesConfig";
import { engineSourceTypeLabel } from "../../configurations/types/engineTrackingSource";
import {
  TRACKING_REWARD_CONDITION_KEY,
  TRACKING_REWARD_CONFIG_VERSION,
  createEmptyMappingTrackingRewardConfig,
  emptyAttributionWindow,
  type AttributionWindow,
  type FilteringCriteria,
  type MappingTrackingRewardConfig,
  type TrackingSourceCampaignConfig,
} from "../types/trackingRewardConfig";

export function mappingKey(segmentId: string | number, offerId: string | number): string {
  return `${segmentId}:${offerId}`;
}

export function hoursToAttributionWindow(totalHours: number): AttributionWindow {
  const safe = Number.isFinite(totalHours) ? Math.max(0, Math.round(totalHours * 60)) : 0;
  const days = Math.floor(safe / (24 * 60));
  const remainder = safe % (24 * 60);
  return {
    days,
    hours: Math.floor(remainder / 60),
    minutes: remainder % 60,
  };
}

export function attributionWindowToMinutes(window: AttributionWindow): number {
  const days = toNonNegativeInt(window?.days);
  const hours = toNonNegativeInt(window?.hours);
  const minutes = toNonNegativeInt(window?.minutes);
  return days * 24 * 60 + hours * 60 + minutes;
}

export function formatAttributionWindow(window: AttributionWindow | undefined): string {
  if (!window) return "Catalog default";
  const parts: string[] = [];
  if (window.days > 0) parts.push(`${window.days}d`);
  if (window.hours > 0) parts.push(`${window.hours}h`);
  if (window.minutes > 0) parts.push(`${window.minutes}m`);
  return parts.length > 0 ? parts.join(" ") : "Catalog default";
}

export function formatLimit(limit: number | null | undefined): string {
  return limit == null ? "No limit" : String(limit);
}

export function trackingSourceTypeLabel(type: string | undefined): string {
  if (!type) return "—";
  return (
    TRACKING_TYPE_OPTIONS.find((option) => option.value === type)?.label ||
    engineSourceTypeLabel(type)
  );
}

function toNonNegativeInt(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

function toOptionalPositiveInt(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.floor(n);
}

function isFilteringCriteria(value: unknown): value is FilteringCriteria {
  return value === "match_any" || value === "no_rule";
}

export function parseMappingTrackingRewardConfig(
  raw: unknown,
): MappingTrackingRewardConfig {
  if (!raw || typeof raw !== "object") {
    return createEmptyMappingTrackingRewardConfig();
  }
  const rec = raw as Record<string, unknown>;
  const sourcesRaw = Array.isArray(rec.sources) ? rec.sources : [];
  const seenSourceIds = new Set<string>();
  const sources: TrackingSourceCampaignConfig[] = [];

  for (const item of sourcesRaw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const trackingSourceId = String(row.tracking_source_id || "").trim();
    if (!trackingSourceId || seenSourceIds.has(trackingSourceId)) continue;
    seenSourceIds.add(trackingSourceId);

    const windowRaw =
      row.attribution_window && typeof row.attribution_window === "object"
        ? (row.attribution_window as Record<string, unknown>)
        : {};

    sources.push({
      id: String(row.id || `src-${trackingSourceId}`),
      tracking_source_id: trackingSourceId,
      tracking_source_name: String(row.tracking_source_name || trackingSourceId),
      tracking_source_type:
        row.tracking_source_type != null
          ? String(row.tracking_source_type)
          : undefined,
      engine_tracking_source_id:
        row.engine_tracking_source_id != null &&
        Number.isFinite(Number(row.engine_tracking_source_id))
          ? Number(row.engine_tracking_source_id)
          : undefined,
      attribution_window: {
        days: toNonNegativeInt(windowRaw.days),
        hours: toNonNegativeInt(windowRaw.hours),
        minutes: toNonNegativeInt(windowRaw.minutes),
      },
      filtering_criteria: isFilteringCriteria(row.filtering_criteria)
        ? row.filtering_criteria
        : "no_rule",
      tracking_limit: toOptionalPositiveInt(row.tracking_limit),
      reward_limit: toOptionalPositiveInt(row.reward_limit),
      committed: row.committed !== false,
      configured_at:
        typeof row.configured_at === "string" ? row.configured_at : undefined,
    });
  }

  return {
    version: TRACKING_REWARD_CONFIG_VERSION,
    sources,
  };
}

export function readTrackingRewardFromConditionRule(
  conditionRule: Record<string, unknown> | null | undefined,
): MappingTrackingRewardConfig {
  if (!conditionRule || typeof conditionRule !== "object") {
    return createEmptyMappingTrackingRewardConfig();
  }
  return parseMappingTrackingRewardConfig(
    conditionRule[TRACKING_REWARD_CONDITION_KEY],
  );
}

export function writeTrackingRewardToConditionRule(
  existing: Record<string, unknown> | null | undefined,
  config: MappingTrackingRewardConfig | undefined,
): Record<string, unknown> | undefined {
  const base =
    existing && typeof existing === "object" ? { ...existing } : {};

  if (!config || config.sources.length === 0) {
    delete base[TRACKING_REWARD_CONDITION_KEY];
    return Object.keys(base).length > 0 ? base : undefined;
  }

  base[TRACKING_REWARD_CONDITION_KEY] = {
    version: TRACKING_REWARD_CONFIG_VERSION,
    sources: config.sources.map((source) => ({
      ...source,
      tracking_limit: source.tracking_limit,
      reward_limit: source.reward_limit,
    })),
  };
  return base;
}

export function hasCommittedTrackingReward(
  config: MappingTrackingRewardConfig | undefined | null,
): boolean {
  return Boolean(config?.sources?.some((source) => source.committed));
}

/** Mapping overlays that were saved (committed) — these are what the UI should show. */
export function committedTrackingSources(
  config: MappingTrackingRewardConfig | undefined | null,
): TrackingSourceCampaignConfig[] {
  return (config?.sources || []).filter((source) => source.committed);
}

export function removeTrackingSourceFromConfig(
  config: MappingTrackingRewardConfig | undefined | null,
  sourceId: string,
): MappingTrackingRewardConfig {
  return parseMappingTrackingRewardConfig({
    version: TRACKING_REWARD_CONFIG_VERSION,
    sources: (config?.sources || []).filter((source) => source.id !== sourceId),
  });
}

export function mappingRequiresTrackingSource(offerType?: string): boolean {
  return !offerTypeExemptFromTrackingRewardMapping(offerType);
}

export function findMappingMissingTrackingSource(
  flows: Array<{
    segment_id?: string | number;
    offer_id?: string | number;
    condition_rule?: Record<string, unknown> | null;
  }>,
  offers: Array<{ id: string; name?: string; offer_type?: string }>,
  segments: Array<{ id: string; name?: string }>,
): { segmentName: string; offerName: string } | null {
  for (const flow of flows) {
    const offer = offers.find((item) => String(item.id) === String(flow.offer_id));
    if (offer && !mappingRequiresTrackingSource(offer.offer_type)) continue;
    if (
      hasCommittedTrackingReward(
        readTrackingRewardFromConditionRule(flow.condition_rule),
      )
    ) {
      continue;
    }
    const segment = segments.find(
      (item) => String(item.id) === String(flow.segment_id),
    );
    return {
      segmentName: segment?.name || `Segment #${flow.segment_id}`,
      offerName: offer?.name || `Offer #${flow.offer_id}`,
    };
  }
  return null;
}

export function configuredSourceIds(
  config: MappingTrackingRewardConfig | undefined | null,
): Set<string> {
  return new Set((config?.sources || []).map((s) => s.tracking_source_id));
}

export function unassignedTrackingSources(
  sources: OfferTrackingSource[],
  config: MappingTrackingRewardConfig | undefined | null,
): OfferTrackingSource[] {
  const taken = configuredSourceIds(config);
  return (sources || []).filter(
    (source) => source.enabled !== false && !taken.has(source.id),
  );
}

export function enabledRulesForSource(source: OfferTrackingSource | undefined) {
  return (source?.rules || []).filter((rule) => rule.enabled !== false);
}

export function defaultFilteringCriteria(
  source: OfferTrackingSource | undefined,
): FilteringCriteria {
  return enabledRulesForSource(source).length > 0 ? "match_any" : "no_rule";
}

export function createTrackingSourceCampaignConfig(input: {
  source: OfferTrackingSource;
  attributionWindow?: AttributionWindow;
}): TrackingSourceCampaignConfig {
  const { source, attributionWindow } = input;
  return {
    id: `cfg-${source.id}-${Date.now()}`,
    tracking_source_id: source.id,
    tracking_source_name: source.name || source.code || source.type || source.id,
    tracking_source_type: source.type,
    engine_tracking_source_id: source.engine_tracking_source_id,
    attribution_window: attributionWindow || emptyAttributionWindow(),
    filtering_criteria: defaultFilteringCriteria(source),
    tracking_limit: null,
    reward_limit: null,
    committed: false,
  };
}

export function rewardLabelForSource(
  rewards: OfferReward[],
  trackingSourceId: string,
): string | null {
  const reward = (rewards || []).find(
    (item) =>
      item.is_default !== true &&
      String(item.tracking_source_id || "") === String(trackingSourceId),
  );
  if (!reward) return null;
  const configCount = reward.rules?.length ?? 0;
  return `${reward.name || "Reward"}${
    configCount > 0 ? ` · ${configCount} configuration${configCount === 1 ? "" : "s"}` : ""
  }`;
}

export interface TrackingRewardValidationResult {
  isValid: boolean;
  errors: string[];
  fieldErrors: Record<string, string>;
}

export function validateMappingTrackingRewardConfig(
  config: MappingTrackingRewardConfig,
  sources: OfferTrackingSource[],
): TrackingRewardValidationResult {
  const errors: string[] = [];
  const fieldErrors: Record<string, string> = {};
  const sourceById = new Map((sources || []).map((s) => [s.id, s]));
  const seen = new Set<string>();

  for (const card of config.sources) {
    const prefix = card.id;
    if (!card.tracking_source_id) {
      errors.push("Each configuration must target a tracking source.");
      fieldErrors[`${prefix}.tracking_source_id`] = "Tracking source is required";
      continue;
    }
    if (seen.has(card.tracking_source_id)) {
      errors.push(
        `Tracking source "${card.tracking_source_name}" already has a configuration. Each source can only be configured once.`,
      );
      fieldErrors[`${prefix}.tracking_source_id`] = "Already configured";
      continue;
    }
    seen.add(card.tracking_source_id);

    const catalog = sourceById.get(card.tracking_source_id);
    const days = toNonNegativeInt(card.attribution_window?.days);
    const hours = toNonNegativeInt(card.attribution_window?.hours);
    const minutes = toNonNegativeInt(card.attribution_window?.minutes);
    if (days > 365) {
      fieldErrors[`${prefix}.days`] = "Days cannot exceed 365";
    }
    if (hours > 23) {
      fieldErrors[`${prefix}.hours`] = "Hours must be 0–23";
    }
    if (minutes > 59) {
      fieldErrors[`${prefix}.minutes`] = "Minutes must be 0–59";
    }

    const ruleCount = enabledRulesForSource(catalog).length;
    if (card.filtering_criteria === "match_any" && ruleCount === 0) {
      fieldErrors[`${prefix}.filtering_criteria`] =
        "This source has no tracking rules. Use “No rule”.";
      errors.push(
        `"${card.tracking_source_name}" has no rules, so “Match any rule” cannot be used.`,
      );
    }

    if (card.tracking_limit != null && card.tracking_limit <= 0) {
      fieldErrors[`${prefix}.tracking_limit`] =
        "Tracking limit must be a positive number, or left empty for no limit";
    }
    if (card.reward_limit != null && card.reward_limit <= 0) {
      fieldErrors[`${prefix}.reward_limit`] =
        "Reward limit must be a positive number, or left empty for no limit";
    }
  }

  const isValid = errors.length === 0 && Object.keys(fieldErrors).length === 0;
  return { isValid, errors, fieldErrors };
}

export function commitMappingTrackingRewardConfig(
  config: MappingTrackingRewardConfig,
): MappingTrackingRewardConfig {
  const now = new Date().toISOString();
  return {
    version: TRACKING_REWARD_CONFIG_VERSION,
    sources: config.sources.map((source) => ({
      ...source,
      committed: true,
      configured_at: source.configured_at || now,
    })),
  };
}

export function cloneMappingTrackingRewardConfig(
  config: MappingTrackingRewardConfig | undefined | null,
): MappingTrackingRewardConfig {
  if (!config) return createEmptyMappingTrackingRewardConfig();
  return parseMappingTrackingRewardConfig(
    JSON.parse(JSON.stringify(config)),
  );
}
