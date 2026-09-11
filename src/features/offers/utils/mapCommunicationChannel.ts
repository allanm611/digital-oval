import type { CreativeChannel } from "../types/offerCreative";
import { VALID_CHANNELS } from "../types/offerCreative";

export interface CommunicationChannelLike {
  id?: number;
  code?: string;
  name?: string;
  value?: string;
  label?: string;
  is_active?: boolean;
}

const CODE_TO_PROFILE: Record<string, CreativeChannel> = {
  sms: "SMS",
  sms_flash: "SMS",
  sms_normal: "SMS",
  normal_sms: "SMS",
  messenger: "WhatsApp",
  whatsapp: "WhatsApp",
  whatsapp_messenger: "WhatsApp",
  email: "Email",
  e_mail: "Email",
  push: "Push",
  push_notification: "Push",
  ussd: "USSD",
  digital: "Web",
  digital_channels: "Web",
  inapp: "InApp",
  in_app: "InApp",
  web: "Web",
  ivr: "IVR",
};

function token(value: unknown): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function profileFromToken(value: string): CreativeChannel | null {
  if (!value) return null;
  if (CODE_TO_PROFILE[value]) return CODE_TO_PROFILE[value];
  const exact = VALID_CHANNELS.find((name) => name.toLowerCase() === value);
  if (exact) return exact;
  if (value.includes("messenger") || value.includes("whatsapp")) return "WhatsApp";
  if (value.includes("ussd")) return "USSD";
  if (value.includes("email") || value.includes("e_mail")) return "Email";
  if (value.includes("push")) return "Push";
  if (value.includes("sms")) return "SMS";
  if (value.includes("ivr")) return "IVR";
  if (value.includes("inapp") || value.includes("in_app")) return "InApp";
  if (value.includes("digital") || value.includes("web")) return "Web";
  return null;
}

/** Map a live GET /communication-channels row (or code/name) to an AI copy profile. */
export function mapCommunicationChannelToCreativeChannel(
  channel?: string | CommunicationChannelLike | null,
): CreativeChannel {
  if (!channel) return "SMS";
  if (typeof channel === "string") {
    return profileFromToken(token(channel)) || "SMS";
  }
  const candidates = [channel.code, channel.value, channel.name, channel.label];
  for (const candidate of candidates) {
    const profile = profileFromToken(token(candidate));
    if (profile) return profile;
  }
  return "SMS";
}

export function creativeChannelFromCatalogId(
  channelId: number | undefined,
  channels: CommunicationChannelLike[] | undefined,
): CreativeChannel {
  if (!channelId || !channels?.length) return "SMS";
  const match = channels.find((item) => item.id === channelId);
  return mapCommunicationChannelToCreativeChannel(match || undefined);
}
