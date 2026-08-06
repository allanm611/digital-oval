import type { RuleRewardType } from "../../../shared/data/rewardProviders";

export interface OfferRewardRule {
  id: string;
  name: string;
  /** Reward provider id (legacy field name retained for API compatibility) */
  bundle_subscription_track: string;
  /** Selected reward configuration id */
  reward_configuration_id?: string;
  reward_configuration_name?: string;
  /** Runtime overrides for provider auth/payload (stored on offer metadata) */
  auth_config?: Record<string, unknown>;
  payload_config?: Record<string, unknown>;
  /** Offer wizard tracking source id — fulfillment runs when this source’s rules match */
  tracking_source_id?: string;
  /**
   * Specific tracking rule id within the linked tracking source.
   * Fulfilment for this configuration runs when that rule matches.
   */
  tracking_rule_id?: string;
  priority: number;
  condition: string;
  value: string;
  reward_type: RuleRewardType;
  reward_value: string;
  fulfillment_response: string;
  success_text: string;
  default_failure: string;
  /** Stable catalog id (numeric string) when selected from Error Group dropdown */
  error_group_id?: string;
  /** Display label / legacy free-text (kept for API compatibility) */
  error_group: string;
  failure_text: string;
  enabled: boolean;
}

export interface OfferReward {
  id: string;
  /**
   * Display name — auto-derived from the linked tracking source when set.
   * Kept for API / review compatibility (no longer edited in the UI).
   */
  name: string;
  /** Legacy catalog key; retained for API compatibility */
  type: "default" | "sms_night" | "custom" | string;
  /**
   * Immediate-reward offers carry a tracking-independent default reward.
   * Default rewards always exist when is_immediate_reward is true and do not require tracking.
   */
  is_default?: boolean;
  /**
   * Offer-wizard tracking source this reward is bound to.
   * One reward per tracking source; rules inherit this id.
   * Omitted for default / immediate rewards.
   */
  tracking_source_id?: string;
  rules: OfferRewardRule[];
}
