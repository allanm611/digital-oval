import { createPortal } from "react-dom";
import { Loader2, Sparkles, X } from "lucide-react";
import Textarea from "../../../shared/components/ui/Textarea";
import { color, tw, zIndex } from "../../../shared/utils/utils";
import { useLanguage } from "../../../contexts/LanguageContext";
import type { GeneratedCreativeVariant } from "../types/aiCreativeGeneration";
import { getSmsCharacterInfo } from "../utils/aiCreativeConstraints";

interface AiGeneratedMessageResultModalProps {
  isOpen: boolean;
  isGenerating: boolean;
  error: string;
  generatedBody: string;
  onGeneratedBodyChange: (value: string) => void;
  variants: GeneratedCreativeVariant[];
  selectedIndex: number;
  onSelectVariant: (index: number) => void;
  warnings: string[];
  isSms: boolean;
  onClose: () => void;
  onInsert: () => void;
  onRegenerate: () => void;
}

/**
 * Result overlay opened immediately when Generate is clicked, matching the
 * Select Products pattern: portal card, header, body, footer actions.
 */
export default function AiGeneratedMessageResultModal({
  isOpen,
  isGenerating,
  error,
  generatedBody,
  onGeneratedBodyChange,
  variants,
  selectedIndex,
  onSelectVariant,
  warnings,
  isSms,
  onClose,
  onInsert,
  onRegenerate,
}: AiGeneratedMessageResultModalProps) {
  const { t } = useLanguage();
  const copy = t.offers.aiGenerate;
  const smsInfo = generatedBody ? getSmsCharacterInfo(generatedBody) : null;
  const canInsert = Boolean(generatedBody.trim()) && !isGenerating && !error;

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        zIndex: zIndex.confirm + 80,
      }}
      onClick={isGenerating ? undefined : onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-generated-message-title"
        className={`bg-white ${tw.rounded} shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2
              id="ai-generated-message-title"
              className="text-xl font-semibold text-gray-900"
            >
              {copy.resultTitle}
            </h2>
            <p className="text-sm text-gray-500 mt-1">{copy.resultSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={t.common.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-[280px]">
          {isGenerating && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="relative w-16 h-16 mb-4" aria-hidden="true">
                <div
                  className="absolute inset-0 rounded-full border-4 animate-spin"
                  style={{
                    borderColor: `${color.primary.accent}33`,
                    borderTopColor: color.primary.accent,
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles
                    className="w-6 h-6"
                    style={{ color: color.primary.accent }}
                  />
                </div>
              </div>
              <p className="text-sm font-medium text-gray-800">
                {copy.waitingForServer}
              </p>
              <p className="text-xs text-gray-500 mt-1 max-w-sm">
                {copy.waitingHint}
              </p>
              <span className="sr-only">
                <Loader2 className="w-4 h-4 animate-spin" />
                {copy.generating}
              </span>
            </div>
          )}

          {!isGenerating && error && (
            <div className={`border border-red-200 bg-red-50 ${tw.rounded} p-4`}>
              <p className="text-sm font-medium text-red-800">
                {copy.errors.generateFailed}
              </p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          )}

          {!isGenerating && !error && (
            <>
              {variants.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {variants.map((variant, index) => (
                    <button
                      key={`${index}-${variant.body.slice(0, 16)}`}
                      type="button"
                      onClick={() => onSelectVariant(index)}
                      className="px-3 py-1.5 text-xs rounded-md border"
                      style={{
                        borderColor:
                          index === selectedIndex
                            ? color.primary.accent
                            : color.border.default,
                        backgroundColor:
                          index === selectedIndex
                            ? `${color.primary.accent}10`
                            : "white",
                        color:
                          index === selectedIndex
                            ? color.primary.accent
                            : color.text.secondary,
                      }}
                    >
                      {copy.variantLabel.replace("{number}", String(index + 1))}
                    </button>
                  ))}
                </div>
              )}

              <Textarea
                label={copy.generatedMessageLabel}
                value={generatedBody}
                onChange={onGeneratedBodyChange}
                rows={8}
                placeholder={copy.waitingHint}
              />
              {smsInfo && (
                <p className="text-xs text-gray-500 -mt-2">
                  {smsInfo.charCount} {copy.characters}
                  {isSms ? ` · ${smsInfo.segments} ${copy.smsSegments}` : ""}
                </p>
              )}
              {isSms && smsInfo?.overRecommended && (
                <p className="text-xs text-amber-700">{copy.smsOverLimit}</p>
              )}
              {variants[selectedIndex]?.rationale && (
                <p className="text-xs text-gray-500">
                  {variants[selectedIndex].rationale}
                </p>
              )}
              {warnings.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-amber-800">
                    {copy.reviewWarnings}
                  </p>
                  {warnings.map((warning) => (
                    <p key={warning} className="text-xs text-amber-700">
                      {warning}
                    </p>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500">{copy.hints.overwrite}</p>
            </>
          )}
        </div>

        <div className="flex items-center justify-between p-6 border-t border-gray-200 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 border border-gray-300 text-gray-700 ${tw.rounded} text-sm font-medium hover:bg-gray-50 transition-colors`}
          >
            {copy.closeResult}
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onRegenerate}
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
              onClick={onInsert}
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
      </div>
    </div>,
    document.body,
  );
}
