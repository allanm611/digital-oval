/**
 * Campaign-level tracking & reward overlays for a segment→offer mapping.
 *
 * Offer Management owns source definitions and reward templates.
 * This config is a one-record overlay per tracking source on the mapping:
 * attribution window, rule matching, and optional limits.
 */

export const TRACKING_REWARD_CONDITION_KEY = "tracking_reward" as const;
export const TRACKING_REWARD_CONFIG_VERSION = 1 as const;

export type FilteringCriteria = "match_any" | "no_rule";

export interface AttributionWindow {
  days: number;
  hours: number;
  minutes: number;
}

/** One configuration card for a single offer tracking source. */
export interface TrackingSourceCampaignConfig {
  id: string;
  tracking_source_id: string;
  tracking_source_name: string;
  tracking_source_type?: string;
  engine_tracking_source_id?: number;
  attribution_window: AttributionWindow;
  filtering_criteria: FilteringCriteria;
  /** null = no tracking-event cap */
  tracking_limit: number | null;
  /** null = no reward-grant cap */
  reward_limit: number | null;
  /** True after the mapping was saved with this source. Cannot be re-added. */
  committed: boolean;
  configured_at?: string;
}

export interface MappingTrackingRewardConfig {
  version: typeof TRACKING_REWARD_CONFIG_VERSION;
  sources: TrackingSourceCampaignConfig[];
}

export function emptyAttributionWindow(): AttributionWindow {
  return { days: 0, hours: 0, minutes: 0 };
}

export function createEmptyMappingTrackingRewardConfig(): MappingTrackingRewardConfig {
  return {
    version: TRACKING_REWARD_CONFIG_VERSION,
    sources: [],
  };
}
