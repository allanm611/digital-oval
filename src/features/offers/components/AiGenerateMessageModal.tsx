import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
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
  EMPTY_AI_PROMPT_FORM,
  type AiCreativePromptForm,
  type AiCreativeSession,
  type AiGenerateModalView,
  type AiLengthPreset,
  type AiTone,
  type GeneratedCreativeVariant,
} from "../types/aiCreativeGeneration";
import {
  countMessageWords,
  extractTemplateVariables,
  getChannelMessageLimits,
} from "../utils/aiCreativeConstraints";
import {
  buildAiPromptPreviewRows,
  snapshotAiSession,
} from "../utils/aiPromptPreview";
import type { CreativeChannel } from "../types/offerCreative";
import { aiModelConfigurationService } from "../../administration/services/aiModelConfigurationService";
import type { AiModelGenerateOption } from "../../administration/types/aiModelConfiguration";
import AiGeneratedMessageResultModal, {
  AiPromptAccordion,
} from "./AiGeneratedMessageResultModal";
import { PreviewPromptButton } from "./AiPromptPreviewPanel";
import AiPromptPreviewModal from "./AiPromptPreviewModal";

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
  initialSession?: AiCreativeSession | null;
  initialView?: AiGenerateModalView;
  onApply: (result: { title?: string; body: string; session: AiCreativeSession }) => void;
}

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
  initialSession = null,
  initialView = "compose",
  onApply,
}: AiGenerateMessageModalProps) {
  const { t } = useLanguage();
  const copy = t.offers.aiGenerate;
  const { success } = useToast();
  const [form, setForm] = useState<AiCreativePromptForm>(EMPTY_AI_PROMPT_FORM);
  const [messageBody, setMessageBody] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [formError, setFormError] = useState("");
  const [resultError, setResultError] = useState("");
  const [variants, setVariants] = useState<GeneratedCreativeVariant[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [generatedBody, setGeneratedBody] = useState("");
  const [view, setView] = useState<"compose" | "result">("compose");
  const [showPromptPreview, setShowPromptPreview] = useState(false);
  const [aiModels, setAiModels] = useState<AiModelGenerateOption[]>([]);
  const [selectedAiModelId, setSelectedAiModelId] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const wasOpenRef = useRef(false);

  const limits = getChannelMessageLimits(channel);
  const wordCount = countMessageWords(messageBody);
  const bodyTooShort = wordCount < MIN_BODY_WORDS;
  const isSms = String(channel).toUpperCase().includes("SMS");
  const canInsert = Boolean(generatedBody.trim()) && !isGenerating && !resultError;

  const mergedVariables = useMemo(() => {
    const fromDraft = extractTemplateVariables(`${existingTitle}\n${messageBody}`);
    return Array.from(new Set([...availableVariables, ...fromDraft]));
  }, [availableVariables, existingTitle, messageBody]);

  const promptPreviewRows = useMemo(
    () =>
      buildAiPromptPreviewRows(form, messageBody, {
        tone: copy.tone.label,
        length: copy.length.label,
        objective: copy.objective.label,
        callToAction: copy.callToAction.label,
        audience: copy.audience.label,
        keyFacts: copy.keyFacts.label,
        mustInclude: copy.mustInclude.label,
        mustAvoid: copy.mustAvoid.label,
        sourceBody: copy.sourceBody.label,
        notSpecified: copy.notSpecified,
        objectiveFallback: copy.objectiveFallback,
        tones: copy.tones,
        lengths: copy.lengths,
      }),
    [form, messageBody, copy],
  );

  useEffect(() => {
    if (!isOpen) {
      abortRef.current?.abort("cancelled");
      abortRef.current = null;
      setIsGenerating(false);
      wasOpenRef.current = false;
      setShowPromptPreview(false);
      return;
    }

    if (wasOpenRef.current) return;
    wasOpenRef.current = true;

    const session = initialSession;
    if (session) {
      setForm(session.prompt);
      setVariants(session.variants);
      setWarnings(session.warnings);
      setSelectedIndex(session.selectedIndex);
      setGeneratedBody(session.generatedBody);
      const canShowResult =
        initialView === "result" &&
        (session.variants.length > 0 || Boolean(session.generatedBody.trim()));
      if (canShowResult) {
        setMessageBody(session.sourceBody || existingBody || "");
        setView("result");
      } else {
        setMessageBody(existingBody || session.sourceBody || "");
        setView("compose");
      }
    } else {
      setForm(EMPTY_AI_PROMPT_FORM);
      setMessageBody(existingBody || "");
      setVariants([]);
      setWarnings([]);
      setSelectedIndex(0);
      setGeneratedBody("");
      setView("compose");
    }
    setShowPromptPreview(initialView === "preview");
    setFormError("");
    setResultError("");
  }, [isOpen, existingBody, initialSession, initialView]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    aiModelConfigurationService
      .listForGenerate()
      .then((items) => {
        if (cancelled) return;
        setAiModels(items);
        setSelectedAiModelId((prev) => {
          if (prev && items.some((item) => item.id === prev)) return prev;
          return items.find((item) => item.is_default)?.id || items[0]?.id || "";
        });
      })
      .catch(() => {
        if (!cancelled) setAiModels([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    return () => abortRef.current?.abort("cancelled");
  }, []);

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
      setView("compose");
      return;
    }
    if (bodyTooShort) {
      setFormError(copy.errors.messageBodyMinWords);
      setView("compose");
      return;
    }
    if (aiModels.length > 0 && !selectedAiModelId) {
      setFormError(copy.errors.modelRequired);
      setView("compose");
      return;
    }

    abortRef.current?.abort("cancelled");
    const controller = new AbortController();
    abortRef.current = controller;
    setFormError("");
    setResultError("");
    setGeneratedBody("");
    setVariants([]);
    setWarnings([]);
    setSelectedIndex(0);
    setShowPromptPreview(false);
    setView("result");
    setIsGenerating(true);

    try {
      const selectedModel = aiModels.find((item) => item.id === selectedAiModelId);
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
          aiModelConfigurationId: selectedModel?.id,
          provider: selectedModel?.provider_id,
          model: selectedModel?.model,
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
    onApply({
      body,
      session: snapshotAiSession({
        prompt: form,
        sourceBody: messageBody,
        generatedBody: body,
        variants,
        selectedIndex,
        warnings,
      }),
    });
    success(copy.appliedTitle, copy.appliedMessage);
    onClose();
  };

  const handleClose = () => {
    abortRef.current?.abort("cancelled");
    abortRef.current = null;
    setIsGenerating(false);
    setShowPromptPreview(false);
    onClose();
  };

  const handlePromptPreviewGenerate = () => {
    void handleGenerate();
  };

  const confirmStyle = {
    backgroundColor: color.primary.accent,
    color: "white",
    padding: "8px 16px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
  };

  const modalTitle = view === "result" ? copy.resultTitle : copy.modalTitle;

  const aiModelOptions = aiModels.map((item) => ({
    value: item.id,
    label: `${item.name} · ${item.model}${item.is_default ? " (default)" : ""}`,
  }));

  const promptFields = (
    <>
      {aiModels.length > 0 ? (
        <div>
          <HeadlessSelect
            label={copy.aiModel.label}
            value={selectedAiModelId}
            onChange={(value) => {
              setSelectedAiModelId(String(value));
              if (formError === copy.errors.modelRequired) setFormError("");
            }}
            options={aiModelOptions}
            placeholder={copy.aiModel.placeholder}
            zIndex={zIndex.popover}
          />
          <p className="text-xs text-gray-500 mt-1">{copy.aiModel.hint}</p>
        </div>
      ) : (
        <p className="text-xs text-gray-500">{copy.aiModel.noneConfigured}</p>
      )}
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
    </>
  );

  return (
    <>
    <RegularModal
      isOpen={isOpen}
      onClose={handleClose}
      title={modalTitle}
      size="xl"
      closeOnOverlayClick={!isGenerating && !showPromptPreview}
      zIndexValue={zIndex.confirm}
    >
      <div className="space-y-4">
        {view === "compose" && (
          <>
            <p className={`text-sm ${tw.textMuted}`}>
              {copy.modalSubtitle
                .replace("{channel}", String(channel))
                .replace("{locale}", locale || "en")}
            </p>
            {promptFields}
            <p className="text-xs text-gray-500">
              {copy.hints.channelLimit.replace("{limit}", String(limits.preferredBody))} {limits.hint}
            </p>
            {mergedVariables.length > 0 && (
              <p className="text-xs text-gray-500">
                {copy.hints.variables}: {mergedVariables.join(", ")}
              </p>
            )}
            {formError && <div className="text-sm text-red-700">{formError}</div>}
          </>
        )}

        {view === "result" && (
          <AiGeneratedMessageResultModal
            isGenerating={isGenerating}
            error={resultError}
            generatedBody={generatedBody}
            onGeneratedBodyChange={setGeneratedBody}
            variants={variants}
            selectedIndex={selectedIndex}
            onSelectVariant={handleSelectVariant}
            warnings={warnings}
            isSms={isSms}
            promptSlot={
              <AiPromptAccordion title={copy.promptUsedTitle} hint={copy.promptUsedHint}>
                {promptFields}
              </AiPromptAccordion>
            }
          />
        )}
      </div>

      <div className="mt-6">
        {view === "result" ? (
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <PreviewPromptButton
              label={copy.previewPrompt}
              ariaLabel={copy.previewPromptAria}
              onClick={() => setShowPromptPreview(true)}
              disabled={isGenerating}
              active={showPromptPreview}
            />
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setView("compose")}
                disabled={isGenerating}
                className={`px-4 py-2 border border-gray-300 text-gray-700 ${tw.rounded} text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {copy.closeResult}
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className={`inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 ${tw.rounded} text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {copy.regenerate}
              </button>
              <button
                type="button"
                onClick={handleInsert}
                disabled={!canInsert}
                className={`px-5 py-2 ${tw.rounded} text-sm font-medium ${
                  canInsert ? "" : "cursor-not-allowed"
                }`}
                style={{
                  backgroundColor: canInsert
                    ? color.primary.action
                    : color.interactive.disabled,
                  color: canInsert ? "white" : color.text.muted,
                }}
              >
                {copy.insert}
              </button>
            </div>
          </div>
        ) : (
          <ModalFooter
            onCancel={handleClose}
            onConfirm={handleGenerate}
            cancelText={t.common.cancel}
            confirmText={isGenerating ? copy.generating : copy.generate}
            disabled={isGenerating}
            confirmStyle={confirmStyle}
            leftContent={
              <PreviewPromptButton
                label={copy.previewPrompt}
                ariaLabel={copy.previewPromptAria}
                onClick={() => setShowPromptPreview(true)}
                disabled={isGenerating}
                active={showPromptPreview}
              />
            }
          />
        )}
      </div>
    </RegularModal>

    <AiPromptPreviewModal
      isOpen={isOpen && showPromptPreview}
      onClose={() => setShowPromptPreview(false)}
      onGenerate={handlePromptPreviewGenerate}
      channel={String(channel)}
      locale={locale || "en"}
      rows={promptPreviewRows}
      formContent={
        <>
          {promptFields}
          {formError && <div className="text-sm text-red-700">{formError}</div>}
        </>
      }
      isGenerating={isGenerating}
      generateLabel={
        isGenerating
          ? copy.generating
          : view === "result"
            ? copy.regenerate
            : copy.generate
      }
      startInForm={Boolean(formError)}
    />
    </>
  );
}
