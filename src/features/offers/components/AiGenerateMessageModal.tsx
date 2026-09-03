import { useEffect, useMemo, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import RegularModal from "../../../shared/components/ui/RegularModal";
import ModalFooter from "../../../shared/components/ui/ModalFooter";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Input from "../../../shared/components/ui/Input";
import Textarea from "../../../shared/components/ui/Textarea";
import Checkbox from "../../../shared/components/ui/Checkbox";
import { color, tw, zIndex } from "../../../shared/utils/utils";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useToast } from "../../../contexts/ToastContext";
import { aiCreativeGenerationService } from "../services/aiCreativeGenerationService";
import {
  AI_DRAFT_ACTIONS,
  AI_LENGTHS,
  AI_TONES,
  type AiDraftAction,
  type AiLengthPreset,
  type AiTone,
  type GeneratedCreativeVariant,
} from "../types/aiCreativeGeneration";
import {
  extractTemplateVariables,
  getChannelMessageLimits,
  getSmsCharacterInfo,
} from "../utils/aiCreativeConstraints";
import type { CreativeChannel } from "../types/offerCreative";

interface AiGenerateMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: CreativeChannel | string;
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
  draftAction: "generate_new" as AiDraftAction,
  mustInclude: "",
  mustAvoid: "",
};

export default function AiGenerateMessageModal({
  isOpen,
  onClose,
  channel,
  locale = "en",
  brandName,
  existingTitle = "",
  existingBody = "",
  availableVariables = [],
  onApply,
}: AiGenerateMessageModalProps) {
  const { t } = useLanguage();
  const copy = t.offers.aiGenerate;
  const { error: showError, success } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [variants, setVariants] = useState<GeneratedCreativeVariant[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [applyTitleToo, setApplyTitleToo] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const limits = getChannelMessageLimits(channel);
  const canApplyTitle =
    String(channel).toUpperCase().includes("EMAIL") ||
    String(channel).toUpperCase().includes("PUSH") ||
    String(channel).toUpperCase().includes("WHATSAPP");
  const hasExistingBody = Boolean(existingBody?.trim());

  const mergedVariables = useMemo(() => {
    const fromDraft = extractTemplateVariables(`${existingTitle}\n${existingBody}`);
    return Array.from(new Set([...availableVariables, ...fromDraft]));
  }, [availableVariables, existingBody, existingTitle]);

  useEffect(() => {
    if (!isOpen) {
      abortController?.abort("cancelled");
      return;
    }
    setForm({
      ...emptyForm,
      draftAction: hasExistingBody ? "improve_existing" : "generate_new",
    });
    setError("");
    setTitle("");
    setVariants([]);
    setWarnings([]);
    setSelectedIndex(0);
    setApplyTitleToo(canApplyTitle && !existingTitle?.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, channel, locale]);

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
  const draftOptions = AI_DRAFT_ACTIONS.map((action) => ({
    value: action,
    label: copy.draftActions[action],
  }));

  const selectedVariant = variants[selectedIndex];
  const smsInfo = selectedVariant ? getSmsCharacterInfo(selectedVariant.body) : null;
  const isSms = String(channel).toUpperCase().includes("SMS");

  const handleGenerate = async () => {
    const objective = form.objective.trim();
    if (!form.tone) {
      setError(copy.errors.toneRequired);
      return;
    }
    if (objective.length < 8) {
      setError(copy.errors.objectiveRequired);
      return;
    }

    abortController?.abort("cancelled");
    const controller = new AbortController();
    setAbortController(controller);
    setIsGenerating(true);
    setError("");

    try {
      const result = await aiCreativeGenerationService.generate(
        {
          channel,
          locale,
          brandName,
          tone: form.tone,
          objective,
          callToAction: form.callToAction.trim() || undefined,
          keyFacts: form.keyFacts.trim() || undefined,
          audience: form.audience.trim() || undefined,
          length: form.length,
          draftAction: form.draftAction,
          mustInclude: form.mustInclude.trim() || undefined,
          mustAvoid: form.mustAvoid.trim() || undefined,
          existingTitle: existingTitle || undefined,
          existingBody: existingBody || undefined,
          availableVariables: mergedVariables,
          variantCount: 3,
        },
        { signal: controller.signal },
      );
      setTitle(result.title || "");
      setVariants(result.variants);
      setWarnings(result.warnings || []);
      setSelectedIndex(0);
    } catch (err) {
      const message = err instanceof Error ? err.message : copy.errors.generateFailed;
      setError(message);
      showError(copy.errors.generateFailed, message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (!selectedVariant?.body) return;
    onApply({
      title: applyTitleToo && title ? title : undefined,
      body: selectedVariant.body,
    });
    success(copy.appliedTitle, copy.appliedMessage);
    onClose();
  };

  const handleClose = () => {
    abortController?.abort("cancelled");
    onClose();
  };

  return (
    <RegularModal
      isOpen={isOpen}
      onClose={handleClose}
      title={copy.modalTitle}
      size="lg"
      closeOnOverlayClick={!isGenerating}
      zIndexValue={zIndex.confirm}
    >
      <div className="space-y-4">
        <p className={`text-sm ${tw.textMuted}`}>
          {copy.modalSubtitle
            .replace("{channel}", String(channel))
            .replace("{locale}", locale || "en")}
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
          rows={3}
          hasError={Boolean(error && form.objective.trim().length < 8)}
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

        <HeadlessSelect
          label={copy.draftAction.label}
          value={form.draftAction}
          onChange={(value) =>
            setForm((prev) => ({ ...prev, draftAction: String(value) as AiDraftAction }))
          }
          options={draftOptions.map((option) => ({
            ...option,
            disabled: option.value === "improve_existing" && !hasExistingBody,
          }))}
          zIndex={zIndex.popover}
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

        {error && <div className="text-sm text-red-700">{error}</div>}

        {variants.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className={`text-sm font-medium ${tw.textPrimary}`}>{copy.variantsTitle}</h3>
              {title && canApplyTitle && (
                <label className="flex items-center gap-2 text-xs text-gray-600">
                  <Checkbox
                    checked={applyTitleToo}
                    onChange={(e) => setApplyTitleToo(e.target.checked)}
                  />
                  {copy.applyTitleToo}
                </label>
              )}
            </div>
            {title && canApplyTitle && (
              <p className="text-xs text-gray-600">
                <span className="font-medium">{copy.generatedTitle}: </span>
                {title}
              </p>
            )}
            {variants.map((variant, index) => {
              const info = getSmsCharacterInfo(variant.body);
              const selected = index === selectedIndex;
              return (
                <button
                  key={`${index}-${variant.body.slice(0, 24)}`}
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  className={`w-full text-left p-3 border rounded-md transition-colors ${
                    selected ? "ring-1" : ""
                  }`}
                  style={{
                    borderColor: selected ? color.primary.accent : color.border.default,
                    backgroundColor: selected ? `${color.primary.accent}08` : "white",
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700">
                      {copy.variantLabel.replace("{number}", String(index + 1))}
                    </span>
                    <span className="text-xs text-gray-500">
                      {info.charCount} {copy.characters}
                      {isSms ? ` · ${info.segments} ${copy.smsSegments}` : ""}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{variant.body}</p>
                  {variant.rationale && (
                    <p className="mt-2 text-xs text-gray-500">{variant.rationale}</p>
                  )}
                </button>
              );
            })}
            {isSms && smsInfo?.overRecommended && (
              <p className="text-xs text-amber-700">{copy.smsOverLimit}</p>
            )}
            {warnings.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-amber-800">{copy.reviewWarnings}</p>
                {warnings.map((warning) => (
                  <p key={warning} className="text-xs text-amber-700">
                    {warning}
                  </p>
                ))}
              </div>
            )}
            {hasExistingBody && (
              <p className="text-xs text-gray-500">{copy.hints.overwrite}</p>
            )}
          </div>
        )}
      </div>

      <div className="mt-6">
        <ModalFooter
          onCancel={handleClose}
          onConfirm={variants.length > 0 ? handleApply : handleGenerate}
          cancelText={t.common.cancel}
          confirmText={
            isGenerating
              ? copy.generating
              : variants.length > 0
                ? hasExistingBody
                  ? copy.applyAndReplace
                  : copy.apply
                : copy.generate
          }
          isLoading={isGenerating}
          disabled={isGenerating || (variants.length > 0 && !selectedVariant)}
          confirmStyle={{
            backgroundColor: color.primary.accent,
            color: "white",
            padding: "8px 16px",
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
          }}
          leftContent={
            variants.length > 0 ? (
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-md border disabled:opacity-50"
                style={{
                  borderColor: color.border.default,
                  color: color.text.secondary,
                  backgroundColor: "white",
                }}
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {copy.regenerate}
              </button>
            ) : undefined
          }
        />
      </div>
    </RegularModal>
  );
}
