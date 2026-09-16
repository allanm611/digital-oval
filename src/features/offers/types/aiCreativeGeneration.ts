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
  communicationChannelId?: number;
  locale?: string;
  brandName?: string;
  tone: AiTone;
  objective?: string;
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
  /** Server looks up credentials by this id. Never send api_key from the browser. */
  aiModelConfigurationId?: string;
  provider?: string;
  model?: string;
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

/** Prompt fields the marketer fills before (and after) generation. */
export interface AiCreativePromptForm {
  tone: AiTone;
  objective: string;
  callToAction: string;
  keyFacts: string;
  audience: string;
  length: AiLengthPreset;
  mustInclude: string;
  mustAvoid: string;
}

export const EMPTY_AI_PROMPT_FORM: AiCreativePromptForm = {
  tone: "professional",
  objective: "",
  callToAction: "",
  keyFacts: "",
  audience: "",
  length: "channel_optimized",
  mustInclude: "",
  mustAvoid: "",
};

/**
 * In-session AI generation state. Kept on the client so Insert can restore
 * variants and the prompt without requiring backend creative metadata.
 */
export interface AiCreativeSession {
  prompt: AiCreativePromptForm;
  sourceBody: string;
  generatedBody: string;
  variants: GeneratedCreativeVariant[];
  selectedIndex: number;
  warnings: string[];
}

export type AiGenerateModalView = "compose" | "preview" | "result";
