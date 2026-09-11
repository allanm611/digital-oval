import { useEffect, useMemo, useState } from "react";
import RegularModal from "../../../shared/components/ui/RegularModal";
import ModalFooter from "../../../shared/components/ui/ModalFooter";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Input from "../../../shared/components/ui/Input";
import Textarea from "../../../shared/components/ui/Textarea";
import { color, tw, zIndex } from "../../../shared/utils/utils";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useToast } from "../../../contexts/ToastContext";
import { aiCreativeGenerationService } from "../services/aiCreativeGenerationService";
import {
  AI_LENGTHS,
  AI_TONES,
  type AiLengthPreset,
  type AiTone,
  type GeneratedCreativeVariant,
} from "../types/aiCreativeGeneration";
import {
  countMessageWords,
  extractTemplateVariables,
  getChannelMessageLimits,
} from "../utils/aiCreativeConstraints";
import type { CreativeChannel } from "../types/offerCreative";
import AiGeneratedMessageResultModal from "./AiGeneratedMessageResultModal";

const MIN_BODY_WORDS = 3;

interface AiGenerateMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: CreativeChannel | string;
  communicationChannelId?: number;
  locale?: string;
  brandName?: string;
  existingTitle?: string;
  existingBody?: string;
  availableVariables?: string[];
  onApply: (result: { title?: string; body: string }) => void;
}

const emptyForm = {
  tone: "professional" as AiTone,
  objective: "",
  callToAction: "",
  keyFacts: "",
  audience: "",
  length: "channel_optimized" as AiLengthPreset,
  mustInclude: "",
  mustAvoid: "",
};

export default function AiGenerateMessageModal({
  isOpen,
  onClose,
  channel,
  communicationChannelId,
  locale = "en",
  brandName,
  existingTitle = "",
  existingBody = "",
  availableVariables = [],
  onApply,
}: AiGenerateMessageModalProps) {
  const { t } = useLanguage();
  const copy = t.offers.aiGenerate;
  const { success } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [messageBody, setMessageBody] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [formError, setFormError] = useState("");
  const [resultError, setResultError] = useState("");
  const [variants, setVariants] = useState<GeneratedCreativeVariant[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [generatedBody, setGeneratedBody] = useState("");
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const limits = getChannelMessageLimits(channel);
  const wordCount = countMessageWords(messageBody);
  const bodyTooShort = wordCount < MIN_BODY_WORDS;
  const isSms = String(channel).toUpperCase().includes("SMS");

  const mergedVariables = useMemo(() => {
    const fromDraft = extractTemplateVariables(`${existingTitle}\n${messageBody}`);
    return Array.from(new Set([...availableVariables, ...fromDraft]));
  }, [availableVariables, existingTitle, messageBody]);

  useEffect(() => {
    if (!isOpen) {
      abortController?.abort("cancelled");
      setIsResultOpen(false);
      return;
    }
    setForm(emptyForm);
    setMessageBody(existingBody || "");
    setFormError("");
    setResultError("");
    setVariants([]);
    setWarnings([]);
    setSelectedIndex(0);
    setGeneratedBody("");
    setIsResultOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, channel, locale, existingBody]);

  useEffect(() => {
    return () => abortController?.abort("cancelled");
  }, [abortController]);

  const toneOptions = AI_TONES.map((tone) => ({
    value: tone,
    label: copy.tones[tone],
  }));
  const lengthOptions = AI_LENGTHS.map((length) => ({
    value: length,
    label: copy.lengths[length],
  }));

  const handleGenerate = async () => {
    if (!form.tone) {
      setFormError(copy.errors.toneRequired);
      return;
    }
    if (bodyTooShort) {
      setFormError(copy.errors.messageBodyMinWords);
      return;
    }

    abortController?.abort("cancelled");
    const controller = new AbortController();
    setAbortController(controller);
    setFormError("");
    setResultError("");
    setGeneratedBody("");
    setVariants([]);
    setWarnings([]);
    setSelectedIndex(0);
    setIsResultOpen(true);
    setIsGenerating(true);

    try {
      const result = await aiCreativeGenerationService.generate(
        {
          channel,
          communicationChannelId,
          locale,
          brandName,
          tone: form.tone,
          objective: form.objective.trim() || undefined,
          callToAction: form.callToAction.trim() || undefined,
          keyFacts: form.keyFacts.trim() || undefined,
          audience: form.audience.trim() || undefined,
          length: form.length,
          draftAction: wordCount >= 8 ? "improve_existing" : "generate_new",
          mustInclude: form.mustInclude.trim() || undefined,
          mustAvoid: form.mustAvoid.trim() || undefined,
          existingTitle: existingTitle || undefined,
          existingBody: messageBody.trim(),
          availableVariables: mergedVariables,
          variantCount: 3,
        },
        { signal: controller.signal },
      );
      if (controller.signal.aborted) return;
      const firstBody = result.variants[0]?.body || "";
      setVariants(result.variants);
      setWarnings(result.warnings || []);
      setSelectedIndex(0);
      setGeneratedBody(firstBody);
    } catch (err) {
      if (controller.signal.aborted) return;
      const message = err instanceof Error ? err.message : copy.errors.generateFailed;
      setResultError(message);
    } finally {
      if (!controller.signal.aborted) {
        setIsGenerating(false);
      }
    }
  };

  const handleSelectVariant = (index: number) => {
    const variant = variants[index];
    if (!variant) return;
    setSelectedIndex(index);
    setGeneratedBody(variant.body);
  };

  const handleInsert = () => {
    const body = generatedBody.trim();
    if (!body) return;
    onApply({ body });
    success(copy.appliedTitle, copy.appliedMessage);
    setIsResultOpen(false);
    onClose();
  };

  const handleCloseResult = () => {
    abortController?.abort("cancelled");
    setIsGenerating(false);
    setIsResultOpen(false);
  };

  const handleClose = () => {
    abortController?.abort("cancelled");
    setIsResultOpen(false);
    onClose();
  };

  const confirmStyle = {
    backgroundColor: color.primary.accent,
    color: "white",
    padding: "8px 16px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
  };

  return (
    <>
      <RegularModal
        isOpen={isOpen}
        onClose={handleClose}
        title={copy.modalTitle}
        size="lg"
        closeOnOverlayClick={!isGenerating && !isResultOpen}
        zIndexValue={zIndex.confirm}
      >
        <div className="space-y-4">
          <p className={`text-sm ${tw.textMuted}`}>
            {copy.modalSubtitle
              .replace("{channel}", String(channel))
              .replace("{locale}", locale || "en")}
          </p>

          <Textarea
            label={copy.sourceBody.label}
            value={messageBody}
            onChange={(value) => {
              setMessageBody(value);
              if (formError === copy.errors.messageBodyMinWords) setFormError("");
            }}
            placeholder={copy.sourceBody.placeholder}
            rows={5}
            hasError={Boolean(formError && bodyTooShort)}
          />
          <p className={`text-xs -mt-2 ${bodyTooShort ? "text-red-600" : "text-gray-500"}`}>
            {copy.sourceBody.hint} ({wordCount} {copy.words}; min {MIN_BODY_WORDS})
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <HeadlessSelect
              label={copy.tone.label}
              value={form.tone}
              onChange={(value) => setForm((prev) => ({ ...prev, tone: String(value) as AiTone }))}
              options={toneOptions}
              zIndex={zIndex.popover}
            />
            <HeadlessSelect
              label={copy.length.label}
              value={form.length}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, length: String(value) as AiLengthPreset }))
              }
              options={lengthOptions}
              zIndex={zIndex.popover}
            />
          </div>

          <Textarea
            label={copy.objective.label}
            value={form.objective}
            onChange={(value) => setForm((prev) => ({ ...prev, objective: value }))}
            placeholder={copy.objective.placeholder}
            rows={2}
          />
          <p className="text-xs text-gray-500 -mt-2">{copy.objective.hint}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label={copy.callToAction.label}
              value={form.callToAction}
              onChange={(value) => setForm((prev) => ({ ...prev, callToAction: String(value) }))}
              placeholder={copy.callToAction.placeholder}
            />
            <Input
              label={copy.audience.label}
              value={form.audience}
              onChange={(value) => setForm((prev) => ({ ...prev, audience: String(value) }))}
              placeholder={copy.audience.placeholder}
            />
          </div>

          <Textarea
            label={copy.keyFacts.label}
            value={form.keyFacts}
            onChange={(value) => setForm((prev) => ({ ...prev, keyFacts: value }))}
            placeholder={copy.keyFacts.placeholder}
            rows={3}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label={copy.mustInclude.label}
              value={form.mustInclude}
              onChange={(value) => setForm((prev) => ({ ...prev, mustInclude: String(value) }))}
              placeholder={copy.mustInclude.placeholder}
            />
            <Input
              label={copy.mustAvoid.label}
              value={form.mustAvoid}
              onChange={(value) => setForm((prev) => ({ ...prev, mustAvoid: String(value) }))}
              placeholder={copy.mustAvoid.placeholder}
            />
          </div>

          <p className="text-xs text-gray-500">
            {copy.hints.channelLimit.replace("{limit}", String(limits.preferredBody))} {limits.hint}
          </p>
          {mergedVariables.length > 0 && (
            <p className="text-xs text-gray-500">
              {copy.hints.variables}: {mergedVariables.join(", ")}
            </p>
          )}

          {formError && <div className="text-sm text-red-700">{formError}</div>}
        </div>

        <div className="mt-6">
          <ModalFooter
            onCancel={handleClose}
            onConfirm={handleGenerate}
            cancelText={t.common.cancel}
            confirmText={copy.generate}
            disabled={isGenerating || isResultOpen}
            confirmStyle={confirmStyle}
          />
        </div>
      </RegularModal>

      <AiGeneratedMessageResultModal
        isOpen={isOpen && isResultOpen}
        isGenerating={isGenerating}
        error={resultError}
        generatedBody={generatedBody}
        onGeneratedBodyChange={setGeneratedBody}
        variants={variants}
        selectedIndex={selectedIndex}
        onSelectVariant={handleSelectVariant}
        warnings={warnings}
        isSms={isSms}
        onClose={handleCloseResult}
        onInsert={handleInsert}
        onRegenerate={handleGenerate}
      />
    </>
  );
}
