import type { CreativeChannel } from "./offerCreative";

export const AI_TONES = [
  "professional",
  "friendly",
  "urgent",
  "promotional",
  "empathetic",
  "formal",
  "playful",
  "concise",
] as const;

export type AiTone = (typeof AI_TONES)[number];

export const AI_LENGTHS = ["channel_optimized", "short", "medium"] as const;

export type AiLengthPreset = (typeof AI_LENGTHS)[number];

export const AI_DRAFT_ACTIONS = ["generate_new", "improve_existing"] as const;

export type AiDraftAction = (typeof AI_DRAFT_ACTIONS)[number];

export interface GenerateCreativeRequest {
  channel: CreativeChannel | string;
  locale?: string;
  brandName?: string;
  tone: AiTone;
  objective: string;
  callToAction?: string;
  keyFacts?: string;
  audience?: string;
  length?: AiLengthPreset;
  draftAction?: AiDraftAction;
  mustInclude?: string;
  mustAvoid?: string;
  existingTitle?: string;
  existingBody?: string;
  availableVariables?: string[];
  variantCount?: number;
}

export interface GeneratedCreativeVariant {
  body: string;
  rationale?: string;
}

export interface GenerateCreativeResponse {
  title?: string;
  variants: GeneratedCreativeVariant[];
  model?: string;
  channelLimit?: number;
  warnings?: string[];
}

export interface GenerateCreativeErrorBody {
  success: false;
  error: string;
  code?: string;
}
