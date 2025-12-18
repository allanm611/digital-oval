import { useState } from "react";
import { createPortal } from "react-dom";
import { X, AlertCircle } from "lucide-react";
import { color, tw, zIndex } from "../../../shared/utils/utils";
import { UploadType } from "../types/quicklist";
import AudienceCreator, {
  AudienceCreatorData,
} from "../../../shared/components/AudienceCreator";

interface CreateQuickListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: {
    file: File;
    upload_type: string;
    name: string;
    description?: string | null;
    created_by?: string | null;
    isManualEntry?: boolean;
  }) => Promise<void>;
  uploadTypes: UploadType[];
}

export default function CreateQuickListModal({
  isOpen,
  onClose,
  onSubmit,
  uploadTypes,
}: CreateQuickListModalProps) {
  const [audienceData, setAudienceData] = useState<
    Partial<AudienceCreatorData>
  >({});
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  if (!isOpen) return null;

  const resetAndClose = () => {
    setAudienceData({});
    setIsFormValid(false);
    setError("");
    setIsSubmitting(false);
    onClose();
  };

  const handleSubmit = async () => {
    if (
      !isFormValid ||
      !audienceData.file ||
      !audienceData.uploadType ||
      !audienceData.name
    ) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      await onSubmit({
        file: audienceData.file,
        upload_type: audienceData.uploadType,
        name: audienceData.name,
        description: audienceData.description || null,
        created_by: null,
        isManualEntry: audienceData.inputMethod === "manual",
      });

      // Reset form on success
      resetAndClose();
    } catch (err) {
      console.error("Failed to create QuickList:", err);
      setError("Failed to create QuickList. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: zIndex.modal }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          resetAndClose();
        }
      }}
    >
      <div
        className={`bg-white ${tw.rounded} shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10"
          style={{ borderColor: color.border.default }}
        >
          <div>
            <h2 className={`text-lg font-medium ${tw.textPrimary}`}>
              {/* Create Broadcast List */}
              Create Quicklist 
            </h2>
            <p className={`text-sm ${tw.textSecondary} mt-1`}>
              Upload an Excel file to create a new broadcast recipient list
            </p>
          </div>
          <button
            onClick={resetAndClose}
            className={`p-2 ${tw.rounded} transition-colors`}
            style={{ color: color.text.secondary }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = color.interactive.hover)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <AudienceCreator
            mode="quicklist"
            data={audienceData}
            onUpdate={setAudienceData}
            uploadTypes={uploadTypes}
            disabled={isSubmitting}
            onValidationChange={setIsFormValid}
          />

          {/* Error Message */}
          {error && (
            <div
              className={`mt-6 p-3 rounded-md flex items-start space-x-2`}
              style={{
                backgroundColor: `${color.status.danger}10`,
                border: `1px solid ${color.status.danger}30`,
              }}
            >
              <AlertCircle
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                style={{ color: color.status.danger }}
              />
              <p className="text-sm" style={{ color: color.status.danger }}>
                {error}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={resetAndClose}
              className={`px-4 py-2 rounded-md transition-colors text-sm font-medium`}
              style={{
                backgroundColor: color.surface.cards,
                border: `1px solid ${color.border.default}`,
                color: color.text.primary,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor =
                  color.interactive.hover)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = color.surface.cards)
              }
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isFormValid}
              className={`px-4 py-2 rounded-md transition-colors text-sm font-medium text-white`}
              style={{
                backgroundColor:
                  isSubmitting || !isFormValid
                    ? color.text.muted
                    : color.primary.action,
                cursor:
                  isSubmitting || !isFormValid ? "not-allowed" : "pointer",
              }}
            >
              {isSubmitting ? "Creating..." : "Create Quicklist"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
