import { useEffect, useState, type ReactNode } from "react";
import RegularModal from "../../../shared/components/ui/RegularModal";
import ModalFooter from "../../../shared/components/ui/ModalFooter";
import { color, tw, zIndex } from "../../../shared/utils/utils";
import { useLanguage } from "../../../contexts/LanguageContext";
import type { AiPromptPreviewRow } from "../utils/aiPromptPreview";
import AiPromptPreviewPanel, { PreviewPromptButton } from "./AiPromptPreviewPanel";

interface AiPromptPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: () => void;
  channel: string;
  locale: string;
  rows: AiPromptPreviewRow[];
  formContent: ReactNode;
  isGenerating: boolean;
  generateLabel: string;
  startInForm?: boolean;
}

/**
 * Stacked prompt preview, matching Preview Creative: a popup card above the
 * generate modal. Card mode is the brief; form mode lets the marketer edit
 * and then generate/regenerate without losing the parent AI session.
 */
export default function AiPromptPreviewModal({
  isOpen,
  onClose,
  onGenerate,
  channel,
  locale,
  rows,
  formContent,
  isGenerating,
  generateLabel,
  startInForm = false,
}: AiPromptPreviewModalProps) {
  const { t } = useLanguage();
  const copy = t.offers.aiGenerate;
  const [mode, setMode] = useState<"card" | "form">(startInForm ? "form" : "card");

  useEffect(() => {
    if (!isOpen) return;
    setMode(startInForm ? "form" : "card");
  }, [isOpen, startInForm]);

  const confirmStyle = {
    backgroundColor: color.primary.accent,
    color: "white",
    padding: "8px 16px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer" as const,
  };

  return (
    <RegularModal
      isOpen={isOpen}
      onClose={onClose}
      title={copy.promptPreviewTitle}
      size="xl"
      closeOnOverlayClick={!isGenerating}
      zIndexValue={zIndex.confirm + 80}
    >
      <div className="space-y-4">
        <p className={`text-sm ${tw.textMuted}`}>
          {copy.promptPreviewMeta
            .replace("{channel}", channel || "")
            .replace("{locale}", locale || "en")}
        </p>

        {mode === "card" ? (
          <div className={`bg-gray-50 border border-gray-200 ${tw.rounded} p-4 sm:p-6`}>
            <p className="text-xs font-medium text-gray-500 mb-3">
              {copy.promptPreviewCardLabel}
            </p>
            <div className={`bg-white border border-gray-200 ${tw.rounded} shadow-sm p-5`}>
              <AiPromptPreviewPanel
                title={copy.promptPreviewTitle}
                subtitle={copy.promptPreviewSubtitle}
                rows={rows}
                showHeader={false}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">{copy.promptPreviewFormHint}</p>
            {formContent}
          </div>
        )}
      </div>

      <div className="mt-6">
        <ModalFooter
          onCancel={onClose}
          onConfirm={onGenerate}
          cancelText={t.common.close}
          confirmText={generateLabel}
          disabled={isGenerating}
          isLoading={isGenerating}
          confirmStyle={confirmStyle}
          leftContent={
            mode === "card" ? (
              <button
                type="button"
                onClick={() => setMode("form")}
                disabled={isGenerating}
                className={`px-4 py-2 border border-gray-300 text-gray-700 ${tw.rounded} text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {copy.editPrompt}
              </button>
            ) : (
              <PreviewPromptButton
                label={copy.previewPrompt}
                ariaLabel={copy.previewPromptAria}
                onClick={() => setMode("card")}
                disabled={isGenerating}
              />
            )
          }
        />
      </div>
    </RegularModal>
  );
}
