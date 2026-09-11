import type {
  AiCreativePromptForm,
  AiCreativeSession,
  GeneratedCreativeVariant,
} from "../types/aiCreativeGeneration";

export interface AiPromptPreviewRow {
  key: string;
  label: string;
  value: string;
  empty: boolean;
}

interface PromptPreviewCopy {
  tone: string;
  length: string;
  objective: string;
  callToAction: string;
  audience: string;
  keyFacts: string;
  mustInclude: string;
  mustAvoid: string;
  sourceBody: string;
  notSpecified: string;
  objectiveFallback: string;
  tones: Record<string, string>;
  lengths: Record<string, string>;
}

/**
 * Human-readable brief the marketer can review. This mirrors the fields sent
 * to the model; it is not the raw system prompt (which stays server-side).
 */
export function buildAiPromptPreviewRows(
  form: AiCreativePromptForm,
  sourceBody: string,
  copy: PromptPreviewCopy,
): AiPromptPreviewRow[] {
  const objectiveValue = form.objective.trim();
  return [
    {
      key: "tone",
      label: copy.tone,
      value: copy.tones[form.tone] || form.tone,
      empty: false,
    },
    {
      key: "length",
      label: copy.length,
      value: copy.lengths[form.length] || form.length,
      empty: false,
    },
    {
      key: "objective",
      label: copy.objective,
      value: objectiveValue || copy.objectiveFallback,
      empty: !objectiveValue,
    },
    {
      key: "callToAction",
      label: copy.callToAction,
      value: form.callToAction.trim() || copy.notSpecified,
      empty: !form.callToAction.trim(),
    },
    {
      key: "audience",
      label: copy.audience,
      value: form.audience.trim() || copy.notSpecified,
      empty: !form.audience.trim(),
    },
    {
      key: "keyFacts",
      label: copy.keyFacts,
      value: form.keyFacts.trim() || copy.notSpecified,
      empty: !form.keyFacts.trim(),
    },
    {
      key: "mustInclude",
      label: copy.mustInclude,
      value: form.mustInclude.trim() || copy.notSpecified,
      empty: !form.mustInclude.trim(),
    },
    {
      key: "mustAvoid",
      label: copy.mustAvoid,
      value: form.mustAvoid.trim() || copy.notSpecified,
      empty: !form.mustAvoid.trim(),
    },
    {
      key: "sourceBody",
      label: copy.sourceBody,
      value: sourceBody.trim() || copy.notSpecified,
      empty: !sourceBody.trim(),
    },
  ];
}

export function snapshotAiSession(input: {
  prompt: AiCreativePromptForm;
  sourceBody: string;
  generatedBody: string;
  variants: GeneratedCreativeVariant[];
  selectedIndex: number;
  warnings: string[];
}): AiCreativeSession {
  return {
    prompt: { ...input.prompt },
    sourceBody: input.sourceBody,
    generatedBody: input.generatedBody,
    variants: input.variants.map((variant) => ({ ...variant })),
    selectedIndex: input.selectedIndex,
    warnings: [...input.warnings],
  };
}
