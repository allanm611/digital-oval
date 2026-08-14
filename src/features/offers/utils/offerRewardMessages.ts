import {
  getRuleErrorGroupIds,
  getRuleErrorGroupMessages,
} from "../../configurations/types/errorGroup";
import type { OfferReward, OfferRewardRule } from "../types/offerReward";

/** Matches error-group mapping `user_message` length on the backend. */
export const OFFER_REWARD_MESSAGE_MAX_LENGTH = 1000;

export type OfferRewardMessageField =
  | "success_text"
  | "failure_text"
  | "error_group_messages";

export type OfferRewardMessageValidationError = {
  field: OfferRewardMessageField;
  message: string;
};

export const DEFAULT_SUCCESS_MESSAGE_HINT =
  "Sent to the customer when this reward is fulfilled successfully.";

/**
 * Copy for the default failure field. Error groups override this only when a
 * provider code matches a selected group; otherwise this catch-all is sent.
 */
export function getDefaultFailureMessageHint(hasErrorGroups: boolean): string {
  return hasErrorGroups
    ? "Sent when the provider error does not match a selected error group."
    : "Sent on fulfilment failure because no error group is configured.";
}

function trimMessage(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function tooLong(value: string): boolean {
  return value.length > OFFER_REWARD_MESSAGE_MAX_LENGTH;
}

/**
 * Fulfilment failure copy, in priority order:
 * 1. Offer override for the matched error group (when groups are configured)
 * 2. Default `failure_text` — always used when no group is configured, and as
 *    the catch-all when a provider error does not match a selected group
 */
export function resolveOfferRewardFailureMessage(
  rule: Pick<
    OfferRewardRule,
    | "failure_text"
    | "error_group_ids"
    | "error_group_id"
    | "error_group_messages"
  >,
  matchedErrorGroupId?: string | null,
): string {
  const groupIds = getRuleErrorGroupIds(rule);
  const matchedId =
    matchedErrorGroupId != null && matchedErrorGroupId !== ""
      ? String(matchedErrorGroupId)
      : "";

  if (matchedId && groupIds.includes(matchedId)) {
    const groupMessage = trimMessage(
      getRuleErrorGroupMessages(rule)[matchedId],
    );
    if (groupMessage) return groupMessage;
  }

  return trimMessage(rule.failure_text);
}

export function validateOfferRewardMessages(
  rule: Pick<
    OfferRewardRule,
    | "success_text"
    | "failure_text"
    | "error_group_ids"
    | "error_group_id"
    | "error_group_messages"
  >,
): OfferRewardMessageValidationError | null {
  const success = trimMessage(rule.success_text);
  if (!success) {
    return {
      field: "success_text",
      message: "Enter a default success message.",
    };
  }
  if (tooLong(success)) {
    return {
      field: "success_text",
      message: `Default success message must be ${OFFER_REWARD_MESSAGE_MAX_LENGTH} characters or less.`,
    };
  }

  const groupIds = getRuleErrorGroupIds(rule);
  const failure = trimMessage(rule.failure_text);
  if (!failure) {
    return {
      field: "failure_text",
      message:
        groupIds.length === 0
          ? "Enter a default failure message. It is sent when no error group is configured."
          : "Enter a default failure message. It is sent when no error group matches the provider response.",
    };
  }
  if (tooLong(failure)) {
    return {
      field: "failure_text",
      message: `Default failure message must be ${OFFER_REWARD_MESSAGE_MAX_LENGTH} characters or less.`,
    };
  }

  const messages = getRuleErrorGroupMessages(rule);
  const missingGroup = groupIds.find((id) => !trimMessage(messages[id]));
  if (missingGroup) {
    return {
      field: "error_group_messages",
      message: "Each selected error group needs a user-facing message.",
    };
  }

  const oversizedGroup = groupIds.find((id) => tooLong(trimMessage(messages[id])));
  if (oversizedGroup) {
    return {
      field: "error_group_messages",
      message: `Error group messages must be ${OFFER_REWARD_MESSAGE_MAX_LENGTH} characters or less.`,
    };
  }

  return null;
}

/**
 * Trim user-facing copy and keep legacy `default_failure` in sync with the
 * catch-all `failure_text` so older readers still receive the same string.
 */
export function normalizeOfferRewardMessages<T extends OfferRewardRule>(
  rule: T,
): T {
  const success_text = trimMessage(rule.success_text);
  const failure_text = trimMessage(rule.failure_text);
  const messages = getRuleErrorGroupMessages(rule);
  const error_group_messages: Record<string, string> = {};
  Object.entries(messages).forEach(([id, message]) => {
    error_group_messages[id] = trimMessage(message);
  });

  return {
    ...rule,
    success_text,
    failure_text,
    default_failure: failure_text || rule.default_failure || "failed",
    error_group_messages,
  };
}

/** Wizard-level gate so Review cannot proceed with incomplete message copy. */
export function findEnabledRulesWithInvalidMessages(
  rewards: OfferReward[],
): OfferRewardMessageValidationError | null {
  for (const reward of rewards) {
    for (const rule of reward.rules || []) {
      if (rule.enabled === false) continue;
      if (
        !rule.bundle_subscription_track?.trim() ||
        !rule.reward_configuration_id?.trim()
      ) {
        continue;
      }
      const error = validateOfferRewardMessages(rule);
      if (error) {
        return {
          ...error,
          message: `${reward.name || "Reward"}: ${error.message}`,
        };
      }
    }
  }
  return null;
}
