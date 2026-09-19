import { Loader2, Sparkles, ChevronDown } from "lucide-react";
import Textarea from "../../../shared/components/ui/Textarea";
import { color, tw } from "../../../shared/utils/utils";
import { useLanguage } from "../../../contexts/LanguageContext";
import type { GeneratedCreativeVariant } from "../types/aiCreativeGeneration";
import { getSmsCharacterInfo } from "../utils/aiCreativeConstraints";
import type { ReactNode } from "react";

interface AiGeneratedMessageResultPanelProps {
  isGenerating: boolean;
  error: string;
  generatedBody: string;
  onGeneratedBodyChange: (value: string) => void;
  variants: GeneratedCreativeVariant[];
  selectedIndex: number;
  onSelectVariant: (index: number) => void;
  warnings: string[];
  isSms: boolean;
  promptSlot?: ReactNode;
}

/**
 * Generated copy + variants, shown inside the same AI modal as the prompt
 * so the brief never disappears after Generate.
 */
export default function AiGeneratedMessageResultModal({
  isGenerating,
  error,
  generatedBody,
  onGeneratedBodyChange,
  variants,
  selectedIndex,
  onSelectVariant,
  warnings,
  isSms,
  promptSlot,
}: AiGeneratedMessageResultPanelProps) {
  const { t } = useLanguage();
  const copy = t.offers.aiGenerate;
  const smsInfo = generatedBody ? getSmsCharacterInfo(generatedBody) : null;

  return (
    <div className="space-y-4">
      {promptSlot}

      {isGenerating && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
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
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">
                {copy.variantsTitle}
              </p>
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
  );
}

interface AiPromptAccordionProps {
  title: string;
  hint: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function AiPromptAccordion({
  title,
  hint,
  defaultOpen = true,
  children,
}: AiPromptAccordionProps) {
  return (
    <details
      defaultOpen={defaultOpen}
      className={`group border border-gray-200 ${tw.rounded} bg-gray-50/80`}
    >
      <summary className="cursor-pointer list-none flex items-start justify-between gap-3 px-3 py-2.5 [&::-webkit-details-marker]:hidden">
        <div>
          <p className={`text-sm font-medium ${tw.textPrimary}`}>{title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{hint}</p>
        </div>
        <ChevronDown className="w-4 h-4 mt-1 text-gray-400 flex-shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <div className="px-3 pb-3 pt-1 space-y-3 border-t border-gray-100">
        {children}
      </div>
    </details>
  );
}
