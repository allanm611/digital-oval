import { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, AlertCircle } from "lucide-react";
import { color, tw, zIndex } from "../../../shared/utils/utils";
import { UploadType } from "../types/quicklist";
import QuickListForm, {
  QuickListFormData,
  createExcelFileFromManualInput,
} from "../../../shared/components/QuickListForm";

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
  const [formData, setFormData] = useState<QuickListFormData | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormChange = useCallback((data: QuickListFormData) => {
    setFormData(data);
    setError(""); // Clear error when form changes
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData) {
      setError("Please fill in the form");
      return;
    }

    // Validation based on input mode
    if (formData.inputMode === "file") {
      if (!formData.file) {
        setError("Please select a file");
        return;
      }
    } else {
      // Manual mode validation
      if (formData.validCount === 0) {
        setError("Please enter at least one valid email or phone number");
        return;
      }
    }

    if (!formData.uploadType) {
      setError("Please select an upload type");
      return;
    }

    if (!formData.name.trim()) {
      setError("Please enter a name");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      // Create file from manual input if in manual mode
      const fileToSubmit =
        formData.inputMode === "manual"
          ? createExcelFileFromManualInput(
              formData.manualInput,
              uploadTypes,
              formData.uploadType
            )
          : formData.file!;

      await onSubmit({
        file: fileToSubmit,
        upload_type: formData.uploadType,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        created_by: null,
        isManualEntry: formData.inputMode === "manual",
      });
      handleClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create QuickList"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData(null);
    setError("");
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleClose();
          }
        }}
        style={{ zIndex: zIndex.overlay }}
      />
      <div
        className="fixed inset-0 flex items-center justify-center p-4"
        style={{ zIndex: zIndex.modal, pointerEvents: "none" }}
      >
        <div
          style={{ pointerEvents: "auto" }}
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
              Upload QuickList
            </h2>
            <p className={`text-sm ${tw.textSecondary} mt-1`}>
              Upload an Excel file to create a new customer list
            </p>
          </div>
          <button
            onClick={handleClose}
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
          onSubmit={handleSubmit}
          className="p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <QuickListForm
            uploadTypes={uploadTypes}
            onChange={handleFormChange}
            disabled={isSubmitting}
            showDescription={true}
          />

          {/* Error Message */}
          {error && (
            <div
              className={`mt-6 p-3 ${tw.rounded} flex items-start space-x-2`}
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
              onClick={handleClose}
              className={`px-4 py-2 ${tw.rounded} transition-colors text-sm font-medium`}
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
              disabled={
                isSubmitting ||
                !formData?.uploadType ||
                !formData?.name.trim() ||
                (formData?.inputMode === "file" && !formData?.file) ||
                (formData?.inputMode === "manual" && formData?.validCount === 0)
              }
              className={`px-4 py-2 text-white ${tw.rounded} transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed`}
              style={{ backgroundColor: color.primary.action }}
            >
              {isSubmitting
                ? formData?.inputMode === "file"
                  ? "Uploading..."
                  : "Creating..."
                : formData?.inputMode === "file"
                ? "Upload QuickList"
                : "Create QuickList"}
            </button>
          </div>
        </form>
      </div>
        </div>
      </div>
    </>,
    document.body
  );
}
