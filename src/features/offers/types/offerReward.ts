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
   * Optional when the source has no enabled rules (source-level fulfilment).
   * Required when the source has enabled rules — fulfilment runs when that rule matches.
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
  /**
   * Selected error group catalog ids (numeric strings).
   * Prefer this for multi-group mapping; fulfilment also relies on
   * provider attachments created when groups are selected.
   */
  error_group_ids?: string[];
  /**
   * Primary / legacy single catalog id.
   * Kept in sync with `error_group_ids[0]` for older readers.
   */
  error_group_id?: string;
  /**
   * Display label(s) — comma-separated when multiple groups are selected.
   * Also holds legacy free-text when no catalog id was used.
   */
  error_group: string;
  /**
   * Offer-level override message per selected error group id.
   * Key = catalog id (string). Used when fulfilment matches that group's codes;
   * falls back to the group's mapping user_message, then `failure_text`.
   */
  error_group_messages?: Record<string, string>;
  /**
   * Catch-all failure message when no error-group mapping matches.
   * Selected from known catalog messages in the reward configuration UI.
   */
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
   * Seeding-reward offers carry a tracking-independent default reward.
   * Default rewards always exist when is_seeding_reward is true and do not require tracking.
   */
  is_default?: boolean;
  /**
   * Offer-wizard tracking source this reward is bound to.
   * One reward per tracking source; rules inherit this id.
   * Omitted for default / seeding rewards.
   */
  tracking_source_id?: string;
  rules: OfferRewardRule[];
}
