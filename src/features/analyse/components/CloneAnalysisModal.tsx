import { useEffect, useState } from "react";
import { X } from "lucide-react";
import ModalFooter from "../../../shared/components/ui/ModalFooter";
import Input from "../../../shared/components/ui/Input";
import Textarea from "../../../shared/components/ui/Textarea";
import { button, color, tw, zIndex } from "../../../shared/utils/utils";
import type { AnalysisRecord } from "../types/analysis";
import AnalysisOptionsFields from "./AnalysisOptionsFields";

interface CloneAnalysisModalProps {
  analysis: AnalysisRecord | null;
  isSaving: boolean;
  onClose: () => void;
  onConfirm: (input: {
    name: string;
    description: string;
    isFavourite: boolean;
    countIndividualAsRecipient: boolean;
    uniqueIdentifier: string | null;
  }) => void;
}

export default function CloneAnalysisModal({
  analysis,
  isSaving,
  onClose,
  onConfirm,
}: CloneAnalysisModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isFavourite, setIsFavourite] = useState(false);
  const [countIndividual, setCountIndividual] = useState(false);
  const [uniqueIdentifier, setUniqueIdentifier] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!analysis) return;
    setName(`${analysis.name} copy`);
    setDescription(analysis.description);
    setIsFavourite(analysis.isFavourite);
    setCountIndividual(analysis.countIndividualAsRecipient);
    setUniqueIdentifier(analysis.uniqueIdentifier);
    setError(null);
  }, [analysis]);

  if (!analysis) return null;

  const submit = () => {
    if (!name.trim()) {
      setError("Enter a name for the copied analysis.");
      return;
    }
    if (countIndividual && !uniqueIdentifier) {
      setError("Select the identity field used to count one person.");
      return;
    }
    setError(null);
    onConfirm({
      name: name.trim(),
      description: description.trim(),
      isFavourite,
      countIndividualAsRecipient: countIndividual,
      uniqueIdentifier,
    });
  };

  return (
    <div className="fixed inset-0 overflow-y-auto" style={{ zIndex: zIndex.modal }}>
      <div className="fixed inset-0 bg-black/50" onClick={isSaving ? undefined : onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={`relative w-full max-w-lg ${tw.rounded} shadow-2xl`}
          style={{ backgroundColor: "var(--c-surface-background)" }}
        >
          <div
            className="flex items-center justify-between border-b px-6 py-4"
            style={{ borderColor: "var(--c-border-default)" }}
          >
            <h2 className={`text-lg font-semibold ${tw.textPrimary}`}>Clone Analysis</h2>
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className={`rounded p-1 ${tw.textSecondary}`}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4 px-6 py-5">
            <Input
              label="Analysis name"
              value={name}
              onChange={(value) => setName(String(value))}
              labelBgColor="var(--c-surface-background)"
            />
            <Textarea
              label="Description"
              value={description}
              onChange={setDescription}
              rows={3}
              labelBgColor="var(--c-surface-background)"
            />
            <AnalysisOptionsFields
              showFavourite
              isFavourite={isFavourite}
              onFavouriteChange={setIsFavourite}
              countIndividualAsRecipient={countIndividual}
              uniqueIdentifier={uniqueIdentifier}
              onCountIndividualChange={setCountIndividual}
              onUniqueIdentifierChange={setUniqueIdentifier}
            />
            {error && <p className={`text-sm ${tw.textDanger}`}>{error}</p>}
          </div>

          <div className="border-t px-6 py-4" style={{ borderColor: "var(--c-border-default)" }}>
            <ModalFooter
              onCancel={onClose}
              onConfirm={submit}
              confirmText={isSaving ? "Cloning..." : "Clone"}
              isLoading={isSaving}
              confirmStyle={{
                backgroundColor: color.primary.action,
                color: "#ffffff",
                border: "1px solid #000000",
                padding: `${button.action.paddingY} ${button.action.paddingX}`,
                borderRadius: button.action.borderRadius,
                fontSize: button.action.fontSize,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
