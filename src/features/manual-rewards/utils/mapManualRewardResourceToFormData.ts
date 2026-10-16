import type { SchedulingData } from "../../../shared/types/scheduling";
import { instantToWallClock } from "../../../shared/utils/wallClockTimezone";
import type {
  ManualRewardData,
  ManualRewardNotificationPreference,
  ManualRewardSeedRecipient,
} from "../pages/CreateManualRewardPage";
import type { ManualRewardResource } from "../types/manualRewardApi";
import { normalizeClockTime, splitScheduleDateTime } from "./manualRewardPreview";

function readProviderId(
  preview: Record<string, unknown>,
): string | undefined {
  const raw =
    preview.reward_provider_id ??
    preview.provider_id ??
    preview.rewardProviderId;
  if (raw == null || raw === "") return undefined;
  return String(raw);
}

function readConfigId(
  preview: Record<string, unknown>,
): number | undefined {
  const raw =
    preview.reward_configuration_id ?? preview.rewardConfigId;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw;
  }
  if (typeof raw === "string" && raw.trim() !== "") {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function readNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function readSeedRecipients(value: unknown): ManualRewardSeedRecipient[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const record = row as Record<string, unknown>;
    const id = readNumber(record.id);
    if (id == null) return [];
    return [
      {
        id,
        seed_list_id: readNumber(record.seed_list_id),
        customer_name:
          record.customer_name != null ? String(record.customer_name) : undefined,
        customer_email:
          record.customer_email != null
            ? String(record.customer_email)
            : undefined,
        customer_phone:
          record.customer_phone != null
            ? String(record.customer_phone)
            : undefined,
      },
    ];
  });
}

function readNotifications(
  value: unknown,
): ManualRewardNotificationPreference[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const preferences = value.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const record = row as Record<string, unknown>;
    if (typeof record.stage !== "string") return [];
    const channels = Array.isArray(record.channels)
      ? record.channels.filter(
          (channel): channel is ManualRewardNotificationPreference["channels"][number] =>
            channel === "email" ||
            channel === "sms" ||
            channel === "in_app" ||
            channel === "platform",
        )
      : [];
    return [{ stage: record.stage, channels }];
  });
  return preferences;
}

export function mapManualRewardResourceToFormData(
  row: ManualRewardResource,
): ManualRewardData {
  const preview = (row.preview_data || {}) as Record<string, unknown>;
  const msisdns = Array.isArray(preview.msisdns)
    ? (preview.msisdns as string[]).filter(Boolean)
    : [];
  const schedule =
    preview.schedule && typeof preview.schedule === "object"
      ? (preview.schedule as SchedulingData)
      : undefined;

  const sourceQuicklistId =
    readNumber(preview.source_quicklist_id) ?? row.quicklist_id;

  let inputMethod: ManualRewardData["inputMethod"];
  if (sourceQuicklistId) {
    inputMethod = "file";
  } else if (row.audience_type === "direct" || row.audience_type === "file") {
    inputMethod = "manual";
  }

  let applyDate: string | undefined;
  let applyTime: string | undefined;

  const offset =
    (typeof preview.time_zone_offset === "string" && preview.time_zone_offset) ||
    (typeof schedule?.time_zone_offset === "string" &&
      schedule.time_zone_offset) ||
    undefined;

  if (row.scheduled_at) {
    const wall = offset
      ? instantToWallClock(row.scheduled_at, offset)
      : undefined;
    if (wall) {
      applyDate = wall.split("T")[0];
      applyTime = normalizeClockTime(wall.split("T")[1]);
    } else {
      const scheduled = new Date(row.scheduled_at);
      if (!Number.isNaN(scheduled.getTime())) {
        applyDate = scheduled.toISOString().slice(0, 10);
        applyTime = `${String(scheduled.getUTCHours()).padStart(2, "0")}:${String(
          scheduled.getUTCMinutes(),
        ).padStart(2, "0")}`;
      }
    }
  } else if (schedule?.start_date) {
    const savedStart = splitScheduleDateTime(
      String(schedule.start_date),
      typeof schedule.start_time === "string" ? schedule.start_time : undefined,
    );
    applyDate = savedStart.date;
    applyTime = savedStart.time;
  }

  const seedRecipients = readSeedRecipients(preview.seed_recipients);
  const seedRecipientIds = Array.isArray(preview.seed_recipient_ids)
    ? preview.seed_recipient_ids
        .map((id) => readNumber(id))
        .filter((id): id is number => id != null)
    : seedRecipients.map((recipient) => recipient.id);

  const notificationPreferences =
    readNotifications(preview.notification_preferences) ||
    readNotifications(schedule?.notification_preferences);

  const channel = preview.channel;
  const restoredSchedule: SchedulingData | undefined = schedule
    ? {
        ...schedule,
        start_date: applyDate && applyTime ? `${applyDate}T${applyTime}` : schedule.start_date,
        start_time: applyTime || schedule.start_time,
        time_zone:
          (typeof preview.time_zone === "string" && preview.time_zone) ||
          schedule.time_zone,
        time_zone_offset: offset,
        notification_preferences: notificationPreferences,
      }
    : applyDate && applyTime
      ? {
          type: row.apply_type === "now" ? "immediate" : "scheduled",
          start_date: `${applyDate}T${applyTime}`,
          start_time: applyTime,
          time_zone:
            typeof preview.time_zone === "string" ? preview.time_zone : undefined,
          time_zone_offset: offset,
          notification_preferences: notificationPreferences,
        }
      : undefined;

  return {
    audienceName: row.name,
    description: row.description,
    rewardType: row.reward_type,
    rewardValue: row.reward_value,
    bundleTrack: row.bundle_track,
    rewardConfigurationId: readConfigId(preview),
    rewardProviderId: readProviderId(preview),
    rewardConfigurationName: row.bundle_track,
    rewardAuthConfig:
      (preview.auth_config as Record<string, unknown> | undefined) ??
      undefined,
    rewardPayloadConfig:
      (preview.payload_config as Record<string, unknown> | undefined) ??
      undefined,
    selectedCommunicationPolicyId: readNumber(preview.communication_policy_id),
    communicationPolicyName:
      typeof preview.communication_policy_name === "string"
        ? preview.communication_policy_name
        : undefined,
    channel:
      channel === "EMAIL" ||
      channel === "SMS" ||
      channel === "WHATSAPP" ||
      channel === "PUSH"
        ? channel
        : undefined,
    smsRoute: typeof preview.sms_route === "string" ? preview.sms_route : undefined,
    emailRoute:
      typeof preview.email_route === "string" ? preview.email_route : undefined,
    rewardTitle:
      typeof preview.reward_title === "string" ? preview.reward_title : undefined,
    seedRecipients,
    seedRecipientIds,
    seedTestContacts: Array.isArray(preview.seed_test_contacts)
      ? preview.seed_test_contacts.map((contact) => String(contact))
      : undefined,
    quicklistId: sourceQuicklistId,
    rowCount: row.recipient_count,
    inputMethod,
    uploadType: "Standard",
    audienceFileText: msisdns.join("\n"),
    applyType: applyDate ? "later" : row.apply_type,
    applyDate,
    applyTime,
    schedule: restoredSchedule,
    scheduleTimeZone: restoredSchedule?.time_zone,
    timeZoneOffset: offset,
    notificationPreferences,
    rewardValidation: {
      completed: true,
      passed: 1,
      failed: 0,
      testedAt: new Date().toISOString(),
    },
  };
}
