import type { SchedulingData } from "../../../shared/types/scheduling";
import type {
  ManualRewardData,
  ManualRewardSeedRecipient,
} from "../pages/CreateManualRewardPage";

export function normalizeClockTime(value?: string | null): string | undefined {
  if (!value) return undefined;
  const match = value.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return undefined;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return undefined;
  if (hours > 23 || minutes > 59) return undefined;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function splitScheduleDateTime(
  startDate?: string,
  startTime?: string,
): { date?: string; time?: string } {
  if (!startDate) return {};
  const datePart = startDate.split("T")[0];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return {};
  const timePart = startDate.includes("T") ? startDate.split("T")[1] : undefined;
  return {
    date: datePart,
    time: normalizeClockTime(startTime || timePart) || "08:00",
  };
}

export function slimSeedRecipient(recipient: {
  id: number;
  seed_list_id?: number;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
}): ManualRewardSeedRecipient {
  return {
    id: recipient.id,
    seed_list_id: recipient.seed_list_id,
    customer_name: recipient.customer_name,
    customer_email: recipient.customer_email,
    customer_phone: recipient.customer_phone,
  };
}

export function buildManualRewardPreviewData(
  data: ManualRewardData,
): Record<string, unknown> {
  const preview: Record<string, unknown> = {};

  if (data.rewardConfigurationId != null) {
    preview.reward_configuration_id = data.rewardConfigurationId;
  }
  if (data.rewardProviderId) {
    const asNum = Number(data.rewardProviderId);
    preview.reward_provider_id = Number.isFinite(asNum)
      ? asNum
      : data.rewardProviderId;
  }
  if (data.rewardAuthConfig) {
    preview.auth_config = data.rewardAuthConfig;
  }
  if (data.rewardPayloadConfig) {
    preview.payload_config = data.rewardPayloadConfig;
  }
  if (data.selectedCommunicationPolicyId != null) {
    preview.communication_policy_id = data.selectedCommunicationPolicyId;
  }
  if (data.communicationPolicyName) {
    preview.communication_policy_name = data.communicationPolicyName;
  }
  if (data.channel) preview.channel = data.channel;
  if (data.smsRoute) preview.sms_route = data.smsRoute;
  if (data.emailRoute) preview.email_route = data.emailRoute;
  if (data.rewardTitle) preview.reward_title = data.rewardTitle;
  if (data.seedRecipients && data.seedRecipients.length > 0) {
    preview.seed_recipients = data.seedRecipients;
  }
  if (data.seedRecipientIds && data.seedRecipientIds.length > 0) {
    preview.seed_recipient_ids = data.seedRecipientIds;
  }
  if (data.seedTestContacts && data.seedTestContacts.length > 0) {
    preview.seed_test_contacts = data.seedTestContacts;
  }
  if (data.schedule) preview.schedule = data.schedule;
  if (data.notificationPreferences) {
    preview.notification_preferences = data.notificationPreferences;
  }
  if (data.quicklistId != null) {
    preview.source_quicklist_id = data.quicklistId;
  }
  if (data.scheduleTimeZone) preview.time_zone = data.scheduleTimeZone;
  if (data.timeZoneOffset) preview.time_zone_offset = data.timeZoneOffset;

  return preview;
}

export function schedulingFromReward(data: ManualRewardData): SchedulingData {
  const saved = data.schedule;
  const time =
    normalizeClockTime(data.applyTime) ||
    normalizeClockTime(saved?.start_time) ||
    "08:00";

  if (saved && (saved.start_date || saved.time_zone || saved.notification_preferences)) {
    const start = saved.start_date
      ? splitScheduleDateTime(String(saved.start_date), saved.start_time || time)
      : undefined;
    return {
      ...saved,
      type: data.applyType === "now" ? "immediate" : saved.type || "scheduled",
      start_date: start?.date ? `${start.date}T${start.time}` : saved.start_date,
      start_time: start?.time || saved.start_time,
      time_zone: saved.time_zone || data.scheduleTimeZone,
      time_zone_offset: saved.time_zone_offset || data.timeZoneOffset,
      notification_preferences:
        saved.notification_preferences || data.notificationPreferences || [],
    };
  }

  return {
    type: data.applyType === "now" ? "immediate" : "scheduled",
    start_date: data.applyDate ? `${data.applyDate}T${time}` : undefined,
    start_time: data.applyDate ? time : undefined,
    time_zone: data.scheduleTimeZone,
    time_zone_offset: data.timeZoneOffset,
    notification_preferences: data.notificationPreferences || [],
  };
}
