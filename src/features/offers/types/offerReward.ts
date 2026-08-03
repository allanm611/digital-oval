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
  priority: number;
  condition: string;
  value: string;
  reward_type: RuleRewardType;
  reward_value: string;
  fulfillment_response: string;
  success_text: string;
  default_failure: string;
  error_group: string;
  failure_text: string;
  enabled: boolean;
}

export interface OfferReward {
  id: string;
  name: string;
  type: "default" | "sms_night" | "custom";
  rules: OfferRewardRule[];
}
