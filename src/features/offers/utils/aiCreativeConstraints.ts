import type { CreativeChannel } from "../types/offerCreative";
import type { AiLengthPreset } from "../types/aiCreativeGeneration";

export interface ChannelMessageLimits {
  title: number;
  body: number;
  preferredBody: number;
  hint: string;
}

const DEFAULT_LIMITS: ChannelMessageLimits = {
  title: 80,
  body: 500,
  preferredBody: 280,
  hint: "Keep copy concise and easy to scan.",
};

export const CHANNEL_MESSAGE_LIMITS: Record<string, ChannelMessageLimits> = {
  SMS: {
    title: 60,
    body: 320,
    preferredBody: 160,
    hint: "One GSM SMS segment is 160 characters (70 if Unicode). Two segments max is recommended.",
  },
  Email: {
    title: 80,
    body: 4000,
    preferredBody: 900,
    hint: "Write a clear subject and a scannable body. Avoid scripts or unsafe HTML.",
  },
  WhatsApp: {
    title: 100,
    body: 1024,
    preferredBody: 400,
    hint: "Keep WhatsApp messages short, personal, and action-oriented.",
  },
  Push: {
    title: 65,
    body: 150,
    preferredBody: 120,
    hint: "Push titles and bodies are tightly limited. Lead with the benefit.",
  },
  USSD: {
    title: 50,
    body: 160,
    preferredBody: 120,
    hint: "USSD copy must be very short and instructional.",
  },
  InApp: {
    title: 80,
    body: 500,
    preferredBody: 240,
    hint: "Keep in-app copy focused on one action.",
  },
  Web: {
    title: 80,
    body: 500,
    preferredBody: 240,
    hint: "Keep web creative focused on one offer and one CTA.",
  },
  IVR: {
    title: 50,
    body: 300,
    preferredBody: 180,
    hint: "Write spoken, pause-friendly language without visual formatting.",
  },
};

export function getChannelMessageLimits(
  channel: CreativeChannel | string,
): ChannelMessageLimits {
  const key = String(channel || "")
    .replace(/\s+/g, "")
    .replace(/Normal$/i, "");
  const match =
    CHANNEL_MESSAGE_LIMITS[channel] ||
    Object.entries(CHANNEL_MESSAGE_LIMITS).find(([name]) =>
      key.toUpperCase().includes(name.toUpperCase()),
    )?.[1];
  return match || DEFAULT_LIMITS;
}

export function resolveTargetBodyLength(
  channel: CreativeChannel | string,
  length: AiLengthPreset = "channel_optimized",
): number {
  const limits = getChannelMessageLimits(channel);
  if (length === "short") {
    return Math.min(limits.preferredBody, 160);
  }
  if (length === "medium") {
    return limits.body;
  }
  return limits.preferredBody;
}

export function getSmsCharacterInfo(text: string) {
  const charCount = text.length;
  const isUnicode = /[^\x00-\x7F]/.test(text);
  const singleSegmentLimit = isUnicode ? 70 : 160;
  const multiSegmentLimit = isUnicode ? 67 : 153;
  let segments = 1;
  if (charCount > singleSegmentLimit) {
    segments = Math.ceil(charCount / multiSegmentLimit);
  }
  const remainingInSegment = charCount % multiSegmentLimit;
  const remaining =
    segments === 1
      ? singleSegmentLimit - charCount
      : multiSegmentLimit - remainingInSegment;
  return {
    charCount,
    segments,
    isUnicode,
    remaining: Math.max(0, remaining),
    overRecommended: segments > 2,
  };
}

export function extractTemplateVariables(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/\{\{[^{}]+\}\}/g) || [];
  return Array.from(new Set(matches));
}
